/**
 * useTaskEngine - Dashboard Task Engine Hook
 * 
 * Calculates user-specific tasks based on contract state and user role.
 * Implements (Estado Contrato + Rol Usuario) => Lista de Tareas
 * 
 * @module useTaskEngine
 */

import { useMemo } from 'react';

// =====================================================
// TYPES
// =====================================================

export type TipoRolUsuario =
    | 'ADMIN'
    | 'VENDEDOR'
    | 'COMPRADOR'
    | 'NOTARIO'
    | 'TERCERO'
    | 'OBSERVADOR';

export type TipoEstadoContrato =
    | 'BORRADOR'
    | 'EN_NEGOCIACION'
    | 'TERMINOS_ESENCIALES_ACEPTADOS'
    | 'BORRADOR_GENERADO'
    | 'FIRMADO'
    | 'CONVOCATORIA_NOTARIAL'
    | 'ESCRITURA_OTORGADA'
    | 'CERRADO';

export type TipoPrioridad = 'URGENTE' | 'ALTA' | 'NORMAL' | 'BAJA';

export interface Tarea {
    id: string;
    titulo: string;
    descripcion: string;
    prioridad: TipoPrioridad;
    accion?: {
        label: string;
        ruta: string;
    };
    vencimiento?: Date;
    esVencida?: boolean;
}

export interface Contrato {
    id: string;
    numero_expediente: string;
    estado: TipoEstadoContrato;
    fecha_limite_firma_escritura: string;
    fecha_limite_pago_arras?: string;
    arras_acreditadas_at?: string;
    // Datos calculados
    diasParaEscritura?: number;
    diasParaPagoArras?: number;
}

export interface Participante {
    rol: TipoRolUsuario;
    email: string;
}

// =====================================================
// TASK CALCULATIONS
// =====================================================

function calcularDiasRestantes(fecha: string): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const objetivo = new Date(fecha);
    objetivo.setHours(0, 0, 0, 0);
    const diff = objetivo.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function generarTareasVendedor(contrato: Contrato): Tarea[] {
    const tareas: Tarea[] = [];
    const { estado, id, diasParaEscritura } = contrato;

    switch (estado) {
        case 'BORRADOR':
            tareas.push({
                id: `${id}-completar-borrador`,
                titulo: 'Completar borrador del contrato',
                descripcion: 'Revisa y completa los datos del inmueble y las condiciones',
                prioridad: 'NORMAL',
                accion: { label: 'Editar borrador', ruta: `/wizard/${id}` }
            });
            break;

        case 'BORRADOR_GENERADO':
            tareas.push({
                id: `${id}-firmar-contrato`,
                titulo: 'Firmar contrato de arras',
                descripcion: 'El borrador está listo. Firma electrónicamente para formalizar.',
                prioridad: 'ALTA',
                accion: { label: 'Firmar ahora', ruta: `/dashboard/${id}?step=firma` }
            });
            break;

        case 'FIRMADO':
            if (!contrato.arras_acreditadas_at) {
                tareas.push({
                    id: `${id}-confirmar-arras`,
                    titulo: 'Confirmar recepción de arras',
                    descripcion: 'El comprador ha declarado el pago. Verifica y confirma.',
                    prioridad: 'ALTA',
                    accion: { label: 'Ver pagos', ruta: `/dashboard/${id}?tab=pagos` }
                });
            }
            break;

        case 'CONVOCATORIA_NOTARIAL':
            if (diasParaEscritura !== undefined && diasParaEscritura <= 7) {
                tareas.push({
                    id: `${id}-preparar-escritura`,
                    titulo: '🚨 Escritura próxima',
                    descripcion: `Faltan ${diasParaEscritura} días para la fecha límite de escritura`,
                    prioridad: diasParaEscritura <= 3 ? 'URGENTE' : 'ALTA',
                    vencimiento: new Date(contrato.fecha_limite_firma_escritura),
                    esVencida: diasParaEscritura < 0
                });
            }
            tareas.push({
                id: `${id}-revisar-documentos`,
                titulo: 'Revisar checklist documental',
                descripcion: 'Asegúrate de tener todos los documentos para la notaría',
                prioridad: 'NORMAL',
                accion: { label: 'Ver documentos', ruta: `/dashboard/${id}?tab=documentos` }
            });
            break;
    }

    return tareas;
}

function generarTareasComprador(contrato: Contrato): Tarea[] {
    const tareas: Tarea[] = [];
    const { estado, id, diasParaPagoArras } = contrato;

    switch (estado) {
        case 'BORRADOR_GENERADO':
            tareas.push({
                id: `${id}-revisar-firmar`,
                titulo: 'Revisar y firmar contrato',
                descripcion: 'El vendedor ha generado el borrador. Revísalo y firma.',
                prioridad: 'ALTA',
                accion: { label: 'Revisar contrato', ruta: `/dashboard/${id}?step=firma` }
            });
            break;

        case 'FIRMADO':
            if (!contrato.arras_acreditadas_at) {
                tareas.push({
                    id: `${id}-pagar-arras`,
                    titulo: 'Realizar pago de arras',
                    descripcion: diasParaPagoArras !== undefined && diasParaPagoArras <= 3
                        ? `🚨 ¡Urgente! Quedan ${diasParaPagoArras} días para el pago`
                        : 'Realiza la transferencia y sube el justificante',
                    prioridad: diasParaPagoArras !== undefined && diasParaPagoArras <= 3 ? 'URGENTE' : 'ALTA',
                    accion: { label: 'Subir justificante', ruta: `/dashboard/${id}?tab=pagos` }
                });
            }
            break;

        case 'CONVOCATORIA_NOTARIAL':
            tareas.push({
                id: `${id}-preparar-notaria`,
                titulo: 'Preparar documentación para notaría',
                descripcion: 'Revisa el checklist de documentos necesarios',
                prioridad: 'NORMAL',
                accion: { label: 'Ver checklist', ruta: `/dashboard/${id}?tab=documentos` }
            });
            break;
    }

    return tareas;
}

function generarTareasNotario(contrato: Contrato): Tarea[] {
    const tareas: Tarea[] = [];
    const { estado, id, diasParaEscritura } = contrato;

    if (estado === 'CONVOCATORIA_NOTARIAL') {
        // Verificar si la fecha ya pasó
        if (diasParaEscritura !== undefined && diasParaEscritura < 0) {
            tareas.push({
                id: `${id}-generar-acta`,
                titulo: '🚨 Generar Acta de No Comparecencia',
                descripcion: 'La fecha de escritura ha pasado sin otorgamiento',
                prioridad: 'URGENTE',
                accion: { label: 'Generar acta', ruta: `/dashboard/${id}?action=acta` },
                esVencida: true
            });
        } else {
            tareas.push({
                id: `${id}-verificar-documentos`,
                titulo: 'Verificar documentación',
                descripcion: 'Revisa que las partes hayan subido todos los documentos',
                prioridad: 'NORMAL',
                accion: { label: 'Ver checklist', ruta: `/dashboard/${id}?tab=documentos` }
            });
        }
    }

    if (estado === 'FIRMADO') {
        tareas.push({
            id: `${id}-programar-cita`,
            titulo: 'Programar cita notarial',
            descripcion: 'Coordina fecha y hora para el otorgamiento de escritura',
            prioridad: 'NORMAL',
            accion: { label: 'Programar', ruta: `/dashboard/${id}?action=cita` }
        });
    }

    return tareas;
}

function generarTareasAdmin(contrato: Contrato): Tarea[] {
    // Admin ve todas las tareas combinadas
    return [
        ...generarTareasVendedor(contrato),
        ...generarTareasComprador(contrato),
        ...generarTareasNotario(contrato)
    ].filter((tarea, index, self) =>
        index === self.findIndex(t => t.id === tarea.id)
    );
}

// =====================================================
// MAIN HOOK
// =====================================================

interface UseTaskEngineParams {
    contratos: Contrato[];
    rol: TipoRolUsuario;
}

interface UseTaskEngineResult {
    tareas: Tarea[];
    tareasUrgentes: Tarea[];
    tareasPendientes: Tarea[];
    totalTareas: number;
    hayUrgentes: boolean;
}

export function useTaskEngine({ contratos, rol }: UseTaskEngineParams): UseTaskEngineResult {
    const tareas = useMemo(() => {
        // Enriquecer contratos con días calculados
        const contratosEnriquecidos: Contrato[] = contratos.map(c => ({
            ...c,
            diasParaEscritura: calcularDiasRestantes(c.fecha_limite_firma_escritura),
            diasParaPagoArras: c.fecha_limite_pago_arras
                ? calcularDiasRestantes(c.fecha_limite_pago_arras)
                : undefined
        }));

        // Generar tareas según rol
        let todasLasTareas: Tarea[] = [];

        for (const contrato of contratosEnriquecidos) {
            switch (rol) {
                case 'ADMIN':
                    todasLasTareas.push(...generarTareasAdmin(contrato));
                    break;
                case 'VENDEDOR':
                    todasLasTareas.push(...generarTareasVendedor(contrato));
                    break;
                case 'COMPRADOR':
                    todasLasTareas.push(...generarTareasComprador(contrato));
                    break;
                case 'NOTARIO':
                    todasLasTareas.push(...generarTareasNotario(contrato));
                    break;
                default:
                    // TERCERO, OBSERVADOR - sin tareas específicas
                    break;
            }
        }

        // Ordenar por prioridad
        const prioridadOrden: Record<TipoPrioridad, number> = {
            URGENTE: 0,
            ALTA: 1,
            NORMAL: 2,
            BAJA: 3
        };

        return todasLasTareas.sort((a, b) =>
            prioridadOrden[a.prioridad] - prioridadOrden[b.prioridad]
        );
    }, [contratos, rol]);

    const tareasUrgentes = useMemo(() =>
        tareas.filter(t => t.prioridad === 'URGENTE'),
        [tareas]
    );

    const tareasPendientes = useMemo(() =>
        tareas.filter(t => t.prioridad !== 'URGENTE'),
        [tareas]
    );

    return {
        tareas,
        tareasUrgentes,
        tareasPendientes,
        totalTareas: tareas.length,
        hayUrgentes: tareasUrgentes.length > 0
    };
}

export default useTaskEngine;
