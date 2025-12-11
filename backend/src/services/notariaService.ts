/**
 * Servicio de Convocatoria Notarial
 * 
 * Gestiona citas notariales, checklist documental y minuta de escritura
 */

import { supabase } from '../config/supabase.js';
import { qtspService, calcularHash } from './qtspService.js';

// ================================================
// TIPOS
// ================================================

export interface CrearCitaNotarialData {
    contratoId: string;
    notariaNombre: string;
    notariaDireccion: string;
    notariaTelefono?: string;
    fechaHoraPropuesta: Date;
    mensajeConvocatoria?: string;
    destinatarios: string[];  // Array de parteIds
    notas?: string;
    creadoPor: string;  // parteId del creador
}

export interface ActualizarCitaData {
    citaId: string;
    fechaHoraConfirmada?: Date;
    estado?: 'PROPUESTA' | 'CONFIRMADA' | 'MODIFICADA' | 'ANULADA' | 'REALIZADA';
    notas?: string;
}

export interface ItemChecklistData {
    contratoId: string;
    citaNotarialId?: string;
    descripcion: string;
    categoria: 'COMPRADOR' | 'VENDEDOR' | 'COMUN' | 'OTRO';
    obligatorio: boolean;
}

export interface VerificarDocumentoData {
    itemId: string;
    archivoId: string;
    hashArchivo: string;
    verificadoPor: string;
    notas?: string;
}

// ================================================
// SERVICIO PRINCIPAL
// ================================================

class NotariaService {

    /**
     * Crea una nueva cita notarial
     */
    async crearCitaNotarial(data: CrearCitaNotarialData): Promise<{ citaId: string }> {
        const {
            contratoId,
            notariaNombre,
            notariaDireccion,
            notariaTelefono,
            fechaHoraPropuesta,
            mensajeConvocatoria,
            destinatarios,
            notas,
            creadoPor,
        } = data;

        // 1. Verificar que el contrato existe
        const { data: contrato, error: contratoError } = await supabase
            .from('contratos_arras')
            .select('id, numero_expediente, estado')
            .eq('id', contratoId)
            .single();

        if (contratoError || !contrato) {
            throw new Error('Contrato no encontrado');
        }

        // 2. Crear cita notarial
        const { data: cita, error: citaError } = await supabase
            .from('citas_notariales')
            .insert({
                contrato_id: contratoId,
                notaria_nombre: notariaNombre,
                notaria_direccion: notariaDireccion,
                notaria_telefono: notariaTelefono,
                fecha_hora_propuesta: fechaHoraPropuesta.toISOString(),
                estado: 'PROPUESTA',
                mensaje_convocatoria: mensajeConvocatoria,
                destinatarios: destinatarios,
                notas,
                creado_por: creadoPor,
            })
            .select()
            .single();

        if (citaError) {
            console.error('Error al crear cita:', citaError);
            throw new Error('Error al crear cita notarial');
        }

        // 3. Crear evento en timeline
        await this.crearEventoConvocatoria(contratoId, cita.id, fechaHoraPropuesta, notariaNombre);

        // 4. Actualizar estado del contrato
        await supabase
            .from('contratos_arras')
            .update({
                estado: 'CONVOCATORIA_NOTARIAL',
                convocatoria_notaria_at: new Date().toISOString(),
            })
            .eq('id', contratoId);

        // 5. Crear checklist documental por defecto
        await this.crearChecklistPorDefecto(contratoId, cita.id);

        return {
            citaId: cita.id,
        };
    }

    /**
     * Actualiza una cita notarial
     */
    async actualizarCita(data: ActualizarCitaData): Promise<void> {
        const { citaId, fechaHoraConfirmada, estado, notas } = data;

        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        if (fechaHoraConfirmada) {
            updateData.fecha_hora_confirmada = fechaHoraConfirmada.toISOString();
        }

        if (estado) {
            updateData.estado = estado;
        }

        if (notas !== undefined) {
            updateData.notas = notas;
        }

        const { error } = await supabase
            .from('citas_notariales')
            .update(updateData)
            .eq('id', citaId);

        if (error) {
            throw new Error('Error al actualizar cita notarial');
        }
    }

    /**
     * Obtiene una cita notarial por ID
     */
    async obtenerCita(citaId: string): Promise<any> {
        const { data, error } = await supabase
            .from('citas_notariales')
            .select('*')
            .eq('id', citaId)
            .single();

        if (error) {
            throw new Error('Cita no encontrada');
        }

        return data;
    }

    /**
     * Obtiene todas las citas de un contrato
     */
    async obtenerCitasContrato(contratoId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('citas_notariales')
            .select('*')
            .eq('contrato_id', contratoId)
            .order('fecha_hora_propuesta', { ascending: false });

        if (error) {
            throw new Error('Error al obtener citas');
        }

        return data || [];
    }

    /**
     * Crea un item en el checklist documental
     */
    async crearItemChecklist(data: ItemChecklistData): Promise<{ itemId: string }> {
        const { contratoId, citaNotarialId, descripcion, categoria, obligatorio } = data;

        const { data: item, error } = await supabase
            .from('checklist_documentos')
            .insert({
                contrato_id: contratoId,
                cita_notarial_id: citaNotarialId,
                descripcion,
                categoria,
                obligatorio,
                estado: 'PENDIENTE',
            })
            .select()
            .single();

        if (error) {
            throw new Error('Error al crear item del checklist');
        }

        return {
            itemId: item.id,
        };
    }

    /**
     * Verifica un documento del checklist
     */
    async verificarDocumento(data: VerificarDocumentoData): Promise<void> {
        const { itemId, archivoId, hashArchivo, verificadoPor, notas } = data;

        // Obtener TST del hash del archivo
        const tst = await qtspService.obtenerSelloTiempo(hashArchivo);

        const { error } = await supabase
            .from('checklist_documentos')
            .update({
                estado: 'VERIFICADO',
                archivo_id: archivoId,
                hash_archivo: hashArchivo,
                fecha_subida: new Date().toISOString(),
                verificado_por: verificadoPor,
                fecha_verificacion: new Date().toISOString(),
                notas,
                updated_at: new Date().toISOString(),
            })
            .eq('id', itemId);

        if (error) {
            throw new Error('Error al verificar documento');
        }

        // Crear evento
        await this.crearEventoChecklistVerificado(itemId, archivoId, hashArchivo, tst);
    }

    /**
     * Obtiene el checklist de un contrato
     */
    async obtenerChecklist(contratoId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('checklist_documentos')
            .select('*')
            .eq('contrato_id', contratoId)
            .order('created_at', { ascending: true });

        if (error) {
            throw new Error('Error al obtener checklist');
        }

        return data || [];
    }

    /**
     * Obtiene el estado del checklist
     */
    async obtenerEstadoChecklist(contratoId: string): Promise<any> {
        const { data, error } = await supabase
            .from('vista_checklist_estado')
            .select('*')
            .eq('contrato_id', contratoId)
            .single();

        if (error) {
            // Si no existe la vista, calcularlo manualmente
            const items = await this.obtenerChecklist(contratoId);

            const total = items.length;
            const obligatorios = items.filter((i: any) => i.obligatorio).length;
            const pendientes = items.filter((i: any) => i.estado === 'PENDIENTE').length;
            const recibidos = items.filter((i: any) => i.estado === 'RECIBIDO').length;
            const verificados = items.filter((i: any) => i.estado === 'VERIFICADO').length;
            const noAplican = items.filter((i: any) => i.estado === 'NO_APLICA').length;

            const completo = items
                .filter((i: any) => i.obligatorio)
                .every((i: any) => i.estado === 'VERIFICADO' || i.estado === 'NO_APLICA');

            return {
                contrato_id: contratoId,
                total_items: total,
                items_obligatorios: obligatorios,
                pendientes,
                recibidos,
                verificados,
                no_aplican: noAplican,
                checklist_completo: completo,
            };
        }

        return data;
    }

    // ================================================
    // MÉTODOS PRIVADOS
    // ================================================

    /**
     * Genera el inventario de documentos para fase NOTARIA
     * usando la función SQL generar_inventario_notaria()
     * 
     * @param contratoId - ID del contrato
     * @param datosContrato - Datos del contrato con condiciones modulares
     * @returns Número de items creados
     */
    async generarInventarioNotaria(contratoId: string, datosContrato?: any): Promise<number> {
        // Obtener datos del contrato si no se proporcionan
        if (!datosContrato) {
            const { data: contrato } = await supabase
                .from('contratos_arras')
                .select('*, datos_wizard')
                .eq('id', contratoId)
                .single();

            // Extraer condiciones del datos_wizard o del contrato directamente
            datosContrato = contrato?.datos_wizard?.contrato || contrato || {};
        }

        // Preparar JSON de condiciones para la función SQL
        const condiciones = {
            sinHipoteca: datosContrato.sinHipoteca ?? true,
            sinArrendatarios: datosContrato.sinArrendatarios ?? true,
            mobiliarioEquipamiento: datosContrato.mobiliarioEquipamiento ?? false,
            escrow: datosContrato.escrow ?? false,
            derecho: datosContrato.derecho ?? 'COMUN',
            retenciones: datosContrato.retenciones ?? { activa: false },
            subrogacionArrendamiento: datosContrato.subrogacionArrendamiento ?? false,
        };

        // Llamar función SQL
        const { data, error } = await supabase.rpc('generar_inventario_notaria', {
            p_contrato_id: contratoId,
            p_datos_contrato: condiciones
        });

        if (error) {
            console.error('Error generando inventario notaría:', error);
            // Fallback: crear items manualmente
            return await this.generarInventarioNotariaManual(contratoId, condiciones);
        }

        console.log(`✅ Generados ${data} items de inventario NOTARIA para contrato ${contratoId}`);
        return data || 0;
    }

    /**
     * Fallback manual si la función SQL no existe
     */
    private async generarInventarioNotariaManual(contratoId: string, condiciones: any): Promise<number> {
        const items: any[] = [
            // Documentos BASE (siempre)
            { tipo: 'MINUTA_ESCRITURA', titulo: 'Minuta de escritura', responsable_rol: 'PLATAFORMA', obligatorio: true },
            { tipo: 'CONVOCATORIA_NOTARIA', titulo: 'Convocatoria a notaría', responsable_rol: 'ASESOR_COMPRADOR', obligatorio: true },
            { tipo: 'DOC_IDENTIDAD_COMPRADOR', titulo: 'Documentación de identidad - Parte compradora', responsable_rol: 'COMPRADOR', obligatorio: true },
            { tipo: 'DOC_IDENTIDAD_VENDEDOR', titulo: 'Documentación de identidad - Parte vendedora', responsable_rol: 'VENDEDOR', obligatorio: true },
            { tipo: 'ESCRITURA_ANTERIOR', titulo: 'Título de propiedad del transmitente', responsable_rol: 'VENDEDOR', obligatorio: true },
            { tipo: 'NOTA_SIMPLE', titulo: 'Nota simple vigente', responsable_rol: 'VENDEDOR', obligatorio: true },
            { tipo: 'IBI', titulo: 'Recibo IBI último ejercicio', responsable_rol: 'VENDEDOR', obligatorio: true },
            { tipo: 'CERTIFICADO_COMUNIDAD', titulo: 'Certificado de comunidad (deudas)', responsable_rol: 'VENDEDOR', obligatorio: true },
            { tipo: 'CEE', titulo: 'Certificado de eficiencia energética', responsable_rol: 'VENDEDOR', obligatorio: true },
            { tipo: 'CONTRATO_ARRAS_FIRMADO', titulo: 'Contrato de arras firmado', responsable_rol: 'PLATAFORMA', obligatorio: true },
            { tipo: 'JUSTIFICANTE_ARRAS', titulo: 'Justificante de pago de arras', responsable_rol: 'COMPRADOR', obligatorio: true },
            { tipo: 'MEDIOS_PAGO_RESTO_PRECIO', titulo: 'Medios de pago del resto del precio', responsable_rol: 'COMPRADOR', obligatorio: true },
        ];

        // Documentos CONDICIONALES
        if (condiciones.sinHipoteca === false) {
            items.push({ tipo: 'DOC_CANCELACION_HIPOTECA', titulo: 'Cancelación de hipoteca / Carta de pago', responsable_rol: 'VENDEDOR', obligatorio: true });
        }

        if (condiciones.sinArrendatarios === false) {
            items.push({ tipo: 'DOC_ARRENDAMIENTO', titulo: 'Documentación arrendamiento', responsable_rol: 'VENDEDOR', obligatorio: true });
        }

        if (condiciones.subrogacionArrendamiento === true) {
            items.push({ tipo: 'ACUERDO_SUBROGACION', titulo: 'Acuerdo de subrogación arrendamiento', responsable_rol: 'VENDEDOR', obligatorio: true });
        }

        if (condiciones.mobiliarioEquipamiento === true) {
            items.push({ tipo: 'INVENTARIO_MOBILIARIO', titulo: 'Inventario de mobiliario/equipamiento', responsable_rol: 'VENDEDOR', obligatorio: true });
        }

        if (condiciones.retenciones?.activa === true) {
            items.push({ tipo: 'RETENCIONES_EN_PRECIO', titulo: 'Retenciones/provisiones en precio', responsable_rol: 'ASESOR_VENDEDOR', obligatorio: true });
        }

        if (condiciones.escrow === true) {
            items.push({ tipo: 'DOC_DEPOSITO_ESCROW', titulo: 'Depósito notarial / Escrow', responsable_rol: 'COMPRADOR', obligatorio: true });
        }

        if (condiciones.derecho?.startsWith('FORAL_')) {
            items.push({ tipo: 'DOC_ADECUACION_FORAL', titulo: 'Documentación territorio foral', responsable_rol: 'ASESOR_VENDEDOR', obligatorio: true });
        }

        // Insertar en inventario_expediente
        let count = 0;
        for (const item of items) {
            const { error } = await supabase
                .from('inventario_expediente')
                .upsert({
                    contrato_id: contratoId,
                    tipo: item.tipo,
                    titulo: item.titulo,
                    grupo: 'NOTARIA',
                    responsable_rol: item.responsable_rol,
                    obligatorio: item.obligatorio,
                    estado: 'PENDIENTE',
                }, {
                    onConflict: 'contrato_id,tipo',
                    ignoreDuplicates: true
                });

            if (!error) count++;
        }

        console.log(`✅ Generados ${count} items de inventario NOTARIA (fallback manual)`);
        return count;
    }

    /**
     * Obtiene el inventario de documentos del grupo NOTARIA
     */
    async obtenerInventarioNotaria(contratoId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('inventario_expediente')
            .select('*')
            .eq('contrato_id', contratoId)
            .in('grupo', ['NOTARIA', 'POST_FIRMA'])
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error obteniendo inventario notaría:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Obtiene el estado del inventario NOTARIA
     */
    async obtenerEstadoInventarioNotaria(contratoId: string): Promise<any> {
        const items = await this.obtenerInventarioNotaria(contratoId);

        const total = items.length;
        const obligatorios = items.filter(i => i.obligatorio).length;
        const pendientes = items.filter(i => i.estado === 'PENDIENTE').length;
        const subidos = items.filter(i => i.estado === 'SUBIDO').length;
        const validados = items.filter(i => i.estado === 'VALIDADO').length;
        const rechazados = items.filter(i => i.estado === 'RECHAZADO').length;

        const completo = items
            .filter(i => i.obligatorio)
            .every(i => i.estado === 'VALIDADO');

        return {
            contrato_id: contratoId,
            total,
            obligatorios,
            pendientes,
            subidos,
            validados,
            rechazados,
            completo,
            porcentaje: total > 0 ? Math.round((validados / obligatorios) * 100) : 0
        };
    }

    private async crearChecklistPorDefecto(contratoId: string, citaId: string): Promise<void> {
        // DEPRECADO: Usar generarInventarioNotaria() en su lugar
        // Mantenido por compatibilidad con código existente
        const itemsDefecto = [
            // Comprador
            { descripcion: 'DNI/NIE o Pasaporte', categoria: 'COMPRADOR', obligatorio: true },
            { descripcion: 'Poder notarial (si procede)', categoria: 'COMPRADOR', obligatorio: false },
            { descripcion: 'Justificante de ingresos', categoria: 'COMPRADOR', obligatorio: true },
            { descripcion: 'Financiación bancaria (si procede)', categoria: 'COMPRADOR', obligatorio: false },

            // Vendedor
            { descripcion: 'DNI/NIE o Pasaporte', categoria: 'VENDEDOR', obligatorio: true },
            { descripcion: 'Nota simple registral vigente', categoria: 'VENDEDOR', obligatorio: true },
            { descripcion: 'Recibo IBI actualizado', categoria: 'VENDEDOR', obligatorio: true },
            { descripcion: 'Certificado Energético (CEE)', categoria: 'VENDEDOR', obligatorio: true },
            { descripcion: 'Escritura de propiedad', categoria: 'VENDEDOR', obligatorio: true },
            { descripcion: 'Certificado comunidad de propietarios', categoria: 'VENDEDOR', obligatorio: false },
            { descripcion: 'Cancelación de cargas (si procede)', categoria: 'VENDEDOR', obligatorio: false },

            // Común
            { descripcion: 'Contrato de arras firmado', categoria: 'COMUN', obligatorio: true },
            { descripcion: 'Justificante de pago de arras', categoria: 'COMUN', obligatorio: true },
        ];

        for (const item of itemsDefecto) {
            await this.crearItemChecklist({
                contratoId,
                citaNotarialId: citaId,
                descripcion: item.descripcion,
                categoria: item.categoria as any,
                obligatorio: item.obligatorio,
            });
        }
    }

    private async crearEventoConvocatoria(
        contratoId: string,
        citaId: string,
        fechaHora: Date,
        notaria: string
    ): Promise<void> {
        const payload = {
            tipo: 'CONVOCATORIA_NOTARIA_CREADA',
            citaId,
            fechaHora: fechaHora.toISOString(),
            notaria,
        };

        const hash = calcularHash(JSON.stringify(payload));
        const tst = await qtspService.obtenerSelloTiempo(hash);

        await supabase.from('eventos').insert({
            contrato_id: contratoId,
            tipo: 'CONVOCATORIA_NOTARIA_CREADA',
            payload_json: payload,
            hash_sha256: hash,
            tst_token: tst.token,
            tst_fecha: tst.fecha.toISOString(),
            tst_proveedor: tst.proveedor,
            actor_tipo: 'SISTEMA',
        });
    }

    private async crearEventoChecklistVerificado(
        itemId: string,
        archivoId: string,
        hashArchivo: string,
        tst: any
    ): Promise<void> {
        // Obtener el item para sacar el contratoId
        const { data: item } = await supabase
            .from('checklist_documentos')
            .select('contrato_id, descripcion')
            .eq('id', itemId)
            .single();

        if (!item) return;

        const payload = {
            tipo: 'CHECKLIST_ITEM_VERIFICADO',
            itemId,
            archivoId,
            hashArchivo,
            descripcion: item.descripcion,
        };

        await supabase.from('eventos').insert({
            contrato_id: item.contrato_id,
            tipo: 'CHECKLIST_ITEM_VERIFICADO',
            payload_json: payload,
            hash_sha256: calcularHash(JSON.stringify(payload)),
            tst_token: tst.token,
            tst_fecha: tst.fecha.toISOString(),
            tst_proveedor: tst.proveedor,
            actor_tipo: 'SISTEMA',
        });
    }
}

// ================================================
// EXPORTAR INSTANCIA SINGLETON
// ================================================

export const notariaService = new NotariaService();
export { NotariaService };
