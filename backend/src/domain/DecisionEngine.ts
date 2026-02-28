/**
 * Decision Engine - Computa ArrasDecision desde ArrasFacts
 * 
 * Blueprint v1.0 - Shadow/Advisory/Authority
 * 
 * FASE ACTUAL: Shadow (persiste sin gobernar)
 * 
 * Responsabilidades:
 * 1. Construir ArrasFacts desde DB
 * 2. Computar ArrasDecision (estado, blockers, allowed_commands, windows)
 * 3. Persistir snapshot en contratos_arras.decision_snapshot_json
 * 4. Generar advisory_warnings para la UI
 */

import { supabase } from '../config/supabase.js';
import type { ArrasFacts, ArrasParte, ArrasInmueble } from './ArrasFacts.js';
import type { ArrasDecision, EstadoMacro, OpenWindow } from './ArrasDecision.js';
import { createInitialDecision } from './ArrasDecision.js';
import {
    getAllowedCommands,
    getBlockedCommands,
    isBlockingState,
    isTerminalState,
    getNextValidStates
} from '../services/stateMachine.js';

// ============================================
// PHASE FLAG
// ============================================

/**
 * Controla el nivel de enforcement del kernel:
 * - 'shadow':    Persiste decisión pero no bloquea nada
 * - 'advisory':  Muestra warnings en UI pero permite continuar
 * - 'authority': Kernel vinculante, bloquea comandos no permitidos
 */
export type KernelPhase = 'shadow' | 'advisory' | 'authority';

const CURRENT_PHASE: KernelPhase = 'shadow';

// ============================================
// BUILD ArrasFacts FROM DB
// ============================================

/**
 * Reconstruye ArrasFacts desde la base de datos
 */
export async function buildFactsFromDB(contratoId: string): Promise<ArrasFacts> {
    // 1. Obtener contrato + inmueble
    const { data: contrato, error: cErr } = await supabase
        .from('contratos_arras')
        .select(`
      *,
      inmueble:inmuebles(*)
    `)
        .eq('id', contratoId)
        .single();

    if (cErr || !contrato) {
        throw new Error(`Contrato ${contratoId} no encontrado: ${cErr?.message}`);
    }

    // 2. Obtener partes vinculadas
    const { data: partes, error: pErr } = await supabase
        .from('contratos_partes')
        .select(`
      *,
      parte:partes(*)
    `)
        .eq('contrato_id', contratoId);

    if (pErr) {
        throw new Error(`Error obteniendo partes: ${pErr.message}`);
    }

    // 3. Construir ArrasFacts
    const inmueble: ArrasInmueble = {
        id: contrato.inmueble?.id ?? '',
        direccion_completa: contrato.inmueble?.direccion_completa ?? '',
        ciudad: contrato.inmueble?.ciudad ?? '',
        provincia: contrato.inmueble?.provincia ?? '',
        codigo_postal: contrato.inmueble?.codigo_postal,
        referencia_catastral: contrato.inmueble?.referencia_catastral,
        datos_registrales: contrato.inmueble?.datos_registrales,
    };

    const partesArr: ArrasParte[] = (partes || []).map((cp: any) => ({
        parte_id: cp.parte_id,
        rol_en_contrato: cp.rol_en_contrato,
        nombre_completo: `${cp.parte?.nombre ?? ''} ${cp.parte?.apellidos ?? ''}`.trim(),
        tipo_documento: cp.parte?.tipo_documento ?? 'DNI',
        numero_documento: cp.parte?.numero_documento ?? '',
        email: cp.parte?.email ?? '',
        obligado_aceptar: cp.obligado_aceptar ?? true,
        obligado_firmar: cp.obligado_firmar ?? true,
        porcentaje_propiedad: cp.porcentaje_propiedad,
    }));

    return {
        contrato_id: contrato.id,
        version_numero: contrato.version_numero ?? 1,
        version_hash: contrato.version_hash ?? '',
        created_at: contrato.created_at,
        inmueble,
        partes: partesArr,
        tipo_arras: contrato.tipo_arras ?? 'PENITENCIALES',
        precio_total: Number(contrato.precio_total) || 0,
        importe_arras: Number(contrato.importe_arras) || 0,
        fecha_limite_firma_escritura: contrato.fecha_limite_firma_escritura ?? '',
        forma_pago_arras: contrato.forma_pago_arras ?? 'AL_FIRMAR',
        via_resolucion: contrato.via_resolucion ?? 'JUZGADOS',
        firma_preferida: contrato.firma_preferida ?? 'ELECTRONICA',
        objeto: contrato.objeto,
        sinHipoteca: contrato.sin_hipoteca,
        sinArrendatarios: contrato.sin_arrendatarios,
        derecho: contrato.derecho_aplicable,
    };
}

// ============================================
// COMPUTE DECISION
// ============================================

/**
 * Computa ArrasDecision desde ArrasFacts + estado actual
 */
export async function computeDecision(
    facts: ArrasFacts,
    estadoMacro: EstadoMacro
): Promise<ArrasDecision> {
    const decision = createInitialDecision(estadoMacro, facts.version_hash);

    // 1. Blockers (¿por qué no puede avanzar?)
    const blockers: string[] = [];

    if (!facts.inmueble.direccion_completa) {
        blockers.push('Falta dirección del inmueble');
    }
    if (facts.partes.length === 0) {
        blockers.push('No hay partes vinculadas');
    }
    if (!facts.partes.some(p => p.rol_en_contrato === 'COMPRADOR')) {
        blockers.push('Falta al menos un comprador');
    }
    if (!facts.partes.some(p => p.rol_en_contrato === 'VENDEDOR')) {
        blockers.push('Falta al menos un vendedor');
    }
    if (facts.precio_total <= 0) {
        blockers.push('Precio total debe ser mayor que 0');
    }
    if (facts.importe_arras <= 0) {
        blockers.push('Importe de arras debe ser mayor que 0');
    }
    if (facts.importe_arras > facts.precio_total) {
        blockers.push('Importe de arras no puede superar el precio total');
    }
    if (!facts.fecha_limite_firma_escritura) {
        blockers.push('Falta fecha límite para firma de escritura');
    }

    decision.blockers = blockers;

    // 2. Allowed commands (según estado macro)
    decision.allowed_commands = getAllowedCommands(estadoMacro);
    decision.litigation_blocked_commands = getBlockedCommands(estadoMacro);

    // 3. Required evidence
    if (estadoMacro === 'BORRADOR') {
        const aceptacionesPendientes = facts.partes
            .filter(p => p.obligado_aceptar)
            .map(p => ({
                tipo: 'ACEPTACION_TERMINOS',
                descripcion: `Aceptación de ${p.nombre_completo}`,
                responsable_rol: p.rol_en_contrato,
                estado: 'PENDIENTE' as const,
            }));
        decision.required_evidence = aceptacionesPendientes;
    }

    // 4. Open windows (consultar actas con ventana abierta)
    if (estadoMacro === 'NOTARIA' || estadoMacro === 'LITIGIO') {
        const { data: actasAbiertas } = await supabase
            .from('actas_no_comparecencia')
            .select('id, window_opens_at, window_closes_at, window_status')
            .eq('contrato_id', facts.contrato_id)
            .eq('window_status', 'OPEN');

        if (actasAbiertas?.length) {
            decision.open_windows = actasAbiertas.map((a: any): OpenWindow => ({
                type: 'ALEGACIONES_48H',
                opens_at: a.window_opens_at,
                closes_at: a.window_closes_at,
                status: a.window_status,
                acta_id: a.id,
            }));
        }
    }

    return decision;
}

// ============================================
// PERSIST SHADOW SNAPSHOT
// ============================================

/**
 * Persiste la decisión como snapshot en la DB (Shadow phase)
 */
export async function persistDecisionSnapshot(
    contratoId: string,
    decision: ArrasDecision
): Promise<void> {
    const { error } = await supabase
        .from('contratos_arras')
        .update({
            decision_snapshot_json: decision,
            decision_computed_at: decision.computed_at,
            advisory_warnings: decision.blockers.length > 0 ? decision.blockers : [],
        })
        .eq('id', contratoId);

    if (error) {
        console.error(`[DecisionEngine] Error persisting snapshot for ${contratoId}:`, error);
    }
}

// ============================================
// ADVISORY WARNINGS
// ============================================

/**
 * Genera advisory warnings basados en la decisión
 * (Advisory phase: muestra en UI pero no bloquea)
 */
export function generateAdvisoryWarnings(decision: ArrasDecision): string[] {
    const warnings: string[] = [];

    if (decision.blockers.length > 0) {
        warnings.push(...decision.blockers.map(b => `⚠️ ${b}`));
    }

    if (isBlockingState(decision.state_macro)) {
        warnings.push('🚫 Contrato en LITIGIO: operaciones de modificación bloqueadas');
    }

    if (decision.open_windows.length > 0) {
        for (const w of decision.open_windows) {
            const closes = new Date(w.closes_at);
            const now = new Date();
            const horasRestantes = Math.max(0, (closes.getTime() - now.getTime()) / (1000 * 60 * 60));
            warnings.push(`⏰ Ventana de alegaciones: ${horasRestantes.toFixed(1)}h restantes`);
        }
    }

    if (isTerminalState(decision.state_macro)) {
        warnings.push('✅ Contrato en estado terminal: no se permiten más operaciones');
    }

    return warnings;
}

// ============================================
// MAIN ENTRY POINT
// ============================================

/**
 * Evalúa el kernel completo para un contrato:
 * 1. Construye ArrasFacts desde DB
 * 2. Computa ArrasDecision
 * 3. Persiste snapshot (Shadow)
 * 4. Devuelve decisión + warnings (Advisory)
 */
export async function evaluateContract(contratoId: string): Promise<{
    facts: ArrasFacts;
    decision: ArrasDecision;
    warnings: string[];
    phase: KernelPhase;
}> {
    // 1. Build facts
    const facts = await buildFactsFromDB(contratoId);

    // 2. Determinar estado macro actual
    const { data: contrato } = await supabase
        .from('contratos_arras')
        .select('estado, estado_macro')
        .eq('id', contratoId)
        .single();

    const estadoMacro = (contrato?.estado_macro ?? contrato?.estado ?? 'INICIADO') as EstadoMacro;

    // 3. Compute decision
    const decision = await computeDecision(facts, estadoMacro);

    // 4. Generate warnings
    const warnings = generateAdvisoryWarnings(decision);

    // 5. Persist snapshot (Shadow phase - no bloquea)
    await persistDecisionSnapshot(contratoId, decision);

    return {
        facts,
        decision,
        warnings,
        phase: CURRENT_PHASE,
    };
}

// ============================================
// AUTHORITY GATE (para Authority phase)
// ============================================

/**
 * Verifica si un comando está permitido por el kernel
 * 
 * - Shadow: siempre permite (log only)
 * - Advisory: permite pero devuelve warnings
 * - Authority: bloquea si no está permitido
 */
export function gateCommand(
    decision: ArrasDecision,
    command: string,
    phase: KernelPhase = CURRENT_PHASE
): { allowed: boolean; reason?: string; warnings: string[] } {
    const warnings = generateAdvisoryWarnings(decision);
    const isAllowed = decision.allowed_commands.includes(command as any);
    const isBlocked = decision.litigation_blocked_commands.includes(command as any);

    switch (phase) {
        case 'shadow':
            // Log pero no bloquear
            if (!isAllowed || isBlocked) {
                console.warn(`[Shadow] Command ${command} would be blocked in Authority phase`);
            }
            return { allowed: true, warnings };

        case 'advisory':
            // Permitir pero advertir
            if (!isAllowed) {
                warnings.push(`⚠️ Comando '${command}' no recomendado en estado ${decision.state_macro}`);
            }
            if (isBlocked) {
                warnings.push(`🚫 Comando '${command}' será bloqueado en producción (LITIGIO)`);
            }
            return { allowed: true, warnings };

        case 'authority':
            // Bloquear si no permitido
            if (isBlocked) {
                return {
                    allowed: false,
                    reason: `Comando '${command}' bloqueado en estado LITIGIO`,
                    warnings,
                };
            }
            if (!isAllowed) {
                return {
                    allowed: false,
                    reason: `Comando '${command}' no permitido en estado ${decision.state_macro}`,
                    warnings,
                };
            }
            return { allowed: true, warnings };
    }
}

export { CURRENT_PHASE };
