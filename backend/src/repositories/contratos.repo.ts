import { supabase } from '../config/supabase.js';
import { v4 as uuid } from 'uuid';
import { nowIso } from '../utils/time.js';
import { hashEssential } from '../utils/hash.js';
import type { ContratoArras, ContratoParte } from '../types/models.js';
import { createInmueble } from './inmuebles.repo.js';

/**
 * Repositorio para gestión de contratos de arras
 */

interface CreateContratoInput {
    inmueble: any;
    contrato: Partial<ContratoArras>;
}

/**
 * Calcula el hash de términos esenciales para control de versión
 */
export async function computeVersionHash(contratoId: string): Promise<string> {
    // Obtener contrato
    const { data: contrato } = await supabase
        .from('contratos_arras')
        .select('*, inmueble:inmuebles(*)')
        .eq('id', contratoId)
        .single();

    if (!contrato) throw new Error('Contrato no encontrado');

    // Obtener partes obligadas
    const { data: partes } = await supabase
        .from('contratos_partes')
        .select(
            `
      rol_en_contrato,
      obligado_aceptar,
      obligado_firmar,
      parte:partes(nombre, apellidos, numero_documento)
    `
        )
        .eq('contrato_id', contratoId);

    // Payload de términos esenciales
    const payload = {
        inmueble: {
            id: contrato.inmueble_id,
            direccion_completa: contrato.inmueble?.direccion_completa,
            ciudad: contrato.inmueble?.ciudad,
            provincia: contrato.inmueble?.provincia,
        },
        tipo_arras: contrato.tipo_arras,
        precio_total: contrato.precio_total,
        importe_arras: contrato.importe_arras,
        fecha_limite_firma_escritura: contrato.fecha_limite_firma_escritura,
        pago_arras: {
            forma: contrato.forma_pago_arras,
            plazo_dias: contrato.plazo_pago_arras_dias,
            fecha_limite: contrato.fecha_limite_pago_arras,
        },
        partes: partes || [],
    };

    return hashEssential(payload);
}

/**
 * Invalida aceptaciones y firmas de un contrato
 */
export async function invalidateAcceptationsAndSignatures(
    contratoId: string
): Promise<void> {
    await supabase
        .from('aceptaciones_terminos_esenciales')
        .update({ valida: false })
        .eq('contrato_id', contratoId);

    await supabase
        .from('firmas_contrato')
        .update({ valida: false })
        .eq('contrato_id', contratoId);
}

/**
 * Recalcula versión y, si cambió, invalida aceptaciones/firmas
 */
export async function recalcAndMaybeInvalidate(
    contratoId: string
): Promise<string> {
    const { data: current } = await supabase
        .from('contratos_arras')
        .select('version_hash')
        .eq('id', contratoId)
        .single();

    const newHash = await computeVersionHash(contratoId);

    if (current?.version_hash !== newHash) {
        await invalidateAcceptationsAndSignatures(contratoId);

        await supabase
            .from('contratos_arras')
            .update({
                version_hash: newHash,
                version_numero: (current as any).version_numero + 1,
                estado: 'EN_NEGOCIACION',
                updated_at: nowIso(),
            })
            .eq('id', contratoId);
    }

    return newHash;
}

/**
 * Crea un nuevo contrato con inmueble
 */
export async function createContrato(
    input: CreateContratoInput
): Promise<any> {
    // 1. Crear inmueble
    const inmueble = await createInmueble(input.inmueble);

    // 2. Calcular porcentaje de arras
    const porcentaje =
        (input.contrato.importe_arras! / input.contrato.precio_total!) * 100;

    // 3. Crear contrato
    const id = uuid();
    const ts = nowIso();
    const identificadorUnico = uuid();

    const contrato = {
        id,
        inmueble_id: inmueble.id,
        estado: 'BORRADOR',
        tipo_arras: input.contrato.tipo_arras!,
        precio_total: input.contrato.precio_total!,
        importe_arras: input.contrato.importe_arras!,
        porcentaje_arras_calculado: Math.round(porcentaje * 100) / 100,
        moneda: input.contrato.moneda || 'EUR',
        fecha_limite_firma_escritura: input.contrato.fecha_limite_firma_escritura!,
        forma_pago_arras: input.contrato.forma_pago_arras || 'AL_FIRMAR',
        plazo_pago_arras_dias: input.contrato.plazo_pago_arras_dias || null,
        fecha_limite_pago_arras: input.contrato.fecha_limite_pago_arras || null,
        iban_vendedor: input.contrato.iban_vendedor || null,
        banco_vendedor: input.contrato.banco_vendedor || null,
        notario_designado_nombre: input.contrato.notario_designado_nombre || null,
        notario_designado_direccion:
            input.contrato.notario_designado_direccion || null,
        gastos_quien: input.contrato.gastos_quien || 'LEY',
        via_resolucion: input.contrato.via_resolucion || 'JUZGADOS',
        firma_preferida: input.contrato.firma_preferida || 'ELECTRONICA',
        condicion_suspensiva_texto:
            input.contrato.condicion_suspensiva_texto || null,
        observaciones: input.contrato.observaciones || null,
        cambios_terminos_estandar:
            input.contrato.cambios_terminos_estandar || null,
        version_hash: 'temp',
        version_numero: 1,
        identificador_unico: identificadorUnico,
        created_at: ts,
        updated_at: ts,
    };

    const { data: inserted, error } = await supabase
        .from('contratos_arras')
        .insert(contrato)
        .select()
        .single();

    if (error) throw error;

    // 4. Calcular version_hash inicial
    const versionHash = await computeVersionHash(id);
    await supabase
        .from('contratos_arras')
        .update({ version_hash: versionHash })
        .eq('id', id);

    return {
        ...inserted,
        version_hash: versionHash,
        inmueble,
    };
}

/**
 * Obtiene un contrato completo con relaciones
 */
export async function getContratoFull(contratoId: string): Promise<any> {
    const { data: contrato, error } = await supabase
        .from('contratos_arras')
        .select(
            `
      *,
      inmueble:inmuebles(*)
    `
        )
        .eq('id', contratoId)
        .single();

    if (error) throw error;

    // Obtener partes
    const { data: partes } = await supabase
        .from('contratos_partes')
        .select(
            `
      *,
      parte:partes(*)
    `
        )
        .eq('contrato_id', contratoId);

    // Obtener aceptaciones válidas
    const { data: aceptaciones } = await supabase
        .from('aceptaciones_terminos_esenciales')
        .select('*')
        .eq('contrato_id', contratoId)
        .eq('valida', true)
        .eq('version_contrato', contrato.version_hash);

    // Obtener firmas válidas
    const { data: firmas } = await supabase
        .from('firmas_contrato')
        .select('*')
        .eq('contrato_id', contratoId)
        .eq('valida', true)
        .eq('version_contrato', contrato.version_hash);

    // Obligados a aceptar
    const obligadosAceptar =
        partes
            ?.filter((p: any) => p.obligado_aceptar)
            .map((p: any) => p.parte_id) || [];

    return {
        contrato,
        inmueble: contrato.inmueble,
        partes: partes || [],
        obligadosAceptar,
        aceptacionesValidas: aceptaciones || [],
        firmasValidas: firmas || [],
    };
}

/**
 * Actualiza un contrato
 */
export async function updateContrato(
    contratoId: string,
    patch: Partial<ContratoArras>
): Promise<any> {
    const { data, error } = await supabase
        .from('contratos_arras')
        .update({
            ...patch,
            updated_at: nowIso(),
        })
        .eq('id', contratoId)
        .select()
        .single();

    if (error) throw error;

    // Recalcular versión si cambió algo esencial
    const newHash = await recalcAndMaybeInvalidate(contratoId);

    return {
        ...data,
        version_hash: newHash,
    };
}

/**
 * Vincula una parte a un contrato
 */
export async function linkParteToContrato(
    contratoId: string,
    parteId: string,
    rolEnContrato: string,
    obligadoAceptar = true,
    obligadoFirmar = true,
    porcentajePropiedad?: number
): Promise<ContratoParte> {
    const id = uuid();

    const { data, error } = await supabase
        .from('contratos_partes')
        .insert({
            id,
            contrato_id: contratoId,
            parte_id: parteId,
            rol_en_contrato: rolEnContrato,
            obligado_aceptar: obligadoAceptar,
            obligado_firmar: obligadoFirmar,
            porcentaje_propiedad: porcentajePropiedad || null,
        })
        .select()
        .single();

    if (error) throw error;

    // Recalcular versión (cambió las partes)
    await recalcAndMaybeInvalidate(contratoId);

    return data;
}

/**
 * Actualiza relación contrato-parte
 */
export async function updateContratoParte(
    contratoParteId: string,
    patch: Partial<ContratoParte>
): Promise<ContratoParte> {
    const { data, error } = await supabase
        .from('contratos_partes')
        .update(patch)
        .eq('id', contratoParteId)
        .select()
        .single();

    if (error) throw error;

    // Recalcular versión
    await recalcAndMaybeInvalidate(data.contrato_id);

    return data;
}

/**
 * Elimina relación contrato-parte
 */
export async function unlinkParteFromContrato(
    contratoParteId: string
): Promise<void> {
    // Obtener contratoId antes de borrar
    const { data: relation } = await supabase
        .from('contratos_partes')
        .select('contrato_id')
        .eq('id', contratoParteId)
        .single();

    const { error } = await supabase
        .from('contratos_partes')
        .delete()
        .eq('id', contratoParteId);

    if (error) throw error;

    // Recalcular versión
    if (relation) {
        await recalcAndMaybeInvalidate(relation.contrato_id);
    }
}

/**
 * Cambia el estado de un contrato
 */
export async function setEstado(
    contratoId: string,
    estado: string
): Promise<void> {
    await supabase
        .from('contratos_arras')
        .update({
            estado,
            updated_at: nowIso(),
        })
        .eq('id', contratoId);
}
