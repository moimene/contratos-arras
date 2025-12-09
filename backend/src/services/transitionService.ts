/**
 * Transition Service
 * 
 * Servicio para verificar elegibilidad de transiciones de estado.
 * Verifica requisitos de documentos antes de permitir avances.
 */

import { supabase } from '../config/supabase.js';
import type { EstadoContrato } from '../types/models.js';

export interface TransitionEligibility {
    canAdvance: boolean;
    targetState: EstadoContrato;
    blockingReasons: string[];
    pendingDocuments: {
        id: string;
        titulo: string;
        tipo: string;
        responsable_rol: string;
    }[];
}

/**
 * Reglas de documentos requeridos por transición de estado
 */
const REQUIRED_DOCS_BY_TRANSITION: Record<string, {
    targetState: EstadoContrato;
    requiredGroups?: string[];
    requiredTypes?: string[];
    minValidated?: number;
}[]> = {
    'INICIADO': [
        {
            targetState: 'BORRADOR',
            requiredGroups: ['INMUEBLE', 'PARTES'],
            minValidated: 0 // No requiere documentos validados para generar borrador
        }
    ],
    'BORRADOR': [
        {
            targetState: 'FIRMADO',
            requiredGroups: ['INMUEBLE', 'PARTES'],
            requiredTypes: ['NOTA_SIMPLE', 'DNI_VENDEDOR', 'DNI_COMPRADOR'],
            minValidated: 3 // Al menos 3 documentos clave validados
        }
    ],
    'FIRMADO': [
        {
            targetState: 'NOTARIA',
            requiredGroups: ['INMUEBLE', 'PARTES', 'ARRAS'],
            requiredTypes: ['CONTRATO_ARRAS_FIRMADO', 'JUSTIFICANTE_PAGO_ARRAS'],
            minValidated: 5
        }
    ],
    'NOTARIA': [
        {
            targetState: 'TERMINADO',
            requiredGroups: ['INMUEBLE', 'PARTES', 'ARRAS', 'NOTARIA'],
            requiredTypes: ['ESCRITURA_COMPRAVENTA'],
            minValidated: 8
        }
    ]
};

/**
 * Verifica si un contrato puede avanzar al siguiente estado
 */
export async function checkTransitionEligibility(
    contratoId: string,
    currentState: EstadoContrato,
    targetState?: EstadoContrato
): Promise<TransitionEligibility> {
    // Obtener inventario del contrato
    const { data: inventario, error } = await supabase
        .from('inventario_expediente')
        .select('id, tipo, titulo, estado, grupo, responsable_rol, obligatorio')
        .eq('contrato_id', contratoId);

    if (error) {
        throw new Error(`Error obteniendo inventario: ${error.message}`);
    }

    const rules = REQUIRED_DOCS_BY_TRANSITION[currentState];
    if (!rules || rules.length === 0) {
        return {
            canAdvance: currentState === 'TERMINADO' ? false : true, // Estado final no avanza
            targetState: 'TERMINADO',
            blockingReasons: currentState === 'TERMINADO' ? ['Estado final alcanzado'] : [],
            pendingDocuments: []
        };
    }

    // Si se especifica targetState, buscar esa regla
    const rule = targetState
        ? rules.find(r => r.targetState === targetState)
        : rules[0];

    if (!rule) {
        return {
            canAdvance: false,
            targetState: targetState || rules[0].targetState,
            blockingReasons: [`Transición de ${currentState} a ${targetState} no permitida`],
            pendingDocuments: []
        };
    }

    const blockingReasons: string[] = [];
    const pendingDocuments: TransitionEligibility['pendingDocuments'] = [];

    // Verificar documentos por grupo requerido
    if (rule.requiredGroups) {
        for (const grupo of rule.requiredGroups) {
            const groupDocs = inventario?.filter(d => d.grupo === grupo && d.obligatorio) || [];
            const pendingInGroup = groupDocs.filter(d => d.estado !== 'VALIDADO');

            if (pendingInGroup.length > 0) {
                blockingReasons.push(`Documentos pendientes en ${grupo}`);
                pendingDocuments.push(...pendingInGroup.map(d => ({
                    id: d.id,
                    titulo: d.titulo,
                    tipo: d.tipo,
                    responsable_rol: d.responsable_rol
                })));
            }
        }
    }

    // Verificar tipos de documento específicos
    if (rule.requiredTypes) {
        for (const tipo of rule.requiredTypes) {
            const doc = inventario?.find(d => d.tipo === tipo);
            if (!doc) {
                blockingReasons.push(`Falta documento: ${tipo}`);
            } else if (doc.estado !== 'VALIDADO') {
                if (!pendingDocuments.find(p => p.id === doc.id)) {
                    pendingDocuments.push({
                        id: doc.id,
                        titulo: doc.titulo,
                        tipo: doc.tipo,
                        responsable_rol: doc.responsable_rol
                    });
                }
            }
        }
    }

    // Verificar mínimo de documentos validados
    if (rule.minValidated !== undefined) {
        const validatedCount = inventario?.filter(d => d.estado === 'VALIDADO').length || 0;
        if (validatedCount < rule.minValidated) {
            blockingReasons.push(
                `Necesitas al menos ${rule.minValidated} documentos validados (tienes ${validatedCount})`
            );
        }
    }

    return {
        canAdvance: blockingReasons.length === 0,
        targetState: rule.targetState,
        blockingReasons,
        pendingDocuments
    };
}

/**
 * Obtiene un resumen de elegibilidad para todas las transiciones posibles
 */
export async function getTransitionSummary(
    contratoId: string,
    currentState: EstadoContrato
): Promise<{
    currentState: EstadoContrato;
    nextStates: TransitionEligibility[];
}> {
    const rules = REQUIRED_DOCS_BY_TRANSITION[currentState] || [];
    const nextStates: TransitionEligibility[] = [];

    for (const rule of rules) {
        const eligibility = await checkTransitionEligibility(contratoId, currentState, rule.targetState);
        nextStates.push(eligibility);
    }

    return {
        currentState,
        nextStates
    };
}
