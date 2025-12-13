import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { registerEvent } from './eventService.js';
import { guardarArchivo } from './storageService.js';

/**
 * Genera un número de expediente único con formato: CFA-YYYY-NNNNNN
 * Utiliza la función PostgreSQL si está disponible, sino genera localmente
 */
export async function generarNumeroExpediente(): Promise<string> {
    try {
        // Intentar usar la función PostgreSQL
        const { data, error } = await supabase.rpc('generar_numero_expediente');

        if (!error && data) {
            return data;
        }
    } catch (err) {
        console.warn('Función generar_numero_expediente() no disponible, generando localmente');
    }

    // Fallback: Generar localmente
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `CFA - ${year} -${random} `;
}

/**
 * Calcula el hash SHA-256 de un evento para la cadena de evidencias
 * @param payload - Datos del evento
 * @param prevHash - Hash del evento anterior (null si es el primero)
 */
export function calcularHashEvento(payload: any, prevHash: string | null): string {
    const data = JSON.stringify(payload) + (prevHash || '');
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Interfaz para los datos del wizard
 */
export interface DatosWizard {
    inmueble: {
        calle: string;
        numero: string;
        piso: string;
        ciudad: string;
        provincia: string;
        codigoPostal: string;
        referenciaCatastral: string;
        finalidad: 'vivienda' | 'segunda_residencia' | 'inversion' | '';
        tieneHipoteca: boolean;
        tieneArrendatarios: boolean;
    };
    contrato: {
        precio_total: number;  // snake_case to match frontend
        importe_arras: number;
        porcentaje_arras: number;
        tipo_arras: 'penitenciales' | 'confirmatorias' | 'penales' | 'PENITENCIALES' | 'CONFIRMATORIAS' | 'PENALES' | '';
        fecha_limite_firma_escritura: string;  // Full name to match frontend
        modoEstandarObservatorio: boolean;
        otrosCambios?: string;
    };
    compradores: Array<{
        id?: string;
        nombre: string;
        apellidos: string;
        tipo_documento: string;
        numero_documento: string;
        estado_civil?: string;
        email?: string;
        telefono?: string;
        domicilio?: string;
    }>;
    vendedores: Array<{
        id?: string;
        nombre: string;
        apellidos: string;
        tipo_documento: string;
        numero_documento: string;
        estado_civil?: string;
        email?: string;
        telefono?: string;
        domicilio?: string;
    }>;
}

/**
 * Crea un expediente de contrato persistente a partir del estado del Wizard
 * 
 * @param datosWizard - Estado completo del wizard (inmueble, contrato, partes)
 * @param borradorPdfPath - Path del PDF generado (opcional)
 * @returns ID del contrato creado, número de expediente y link compartible
 */
export async function crearContratoExpediente(
    datosWizard: DatosWizard,
    borradorPdfPath?: string
): Promise<{
    contratoId: string;
    numeroExpediente: string;
    linkCompartible: string;
}> {

    // 1. Crear inmueble
    const { data: inmuebleData, error: inmuebleError } = await supabase
        .from('inmuebles')
        .insert({
            direccion_completa: `${datosWizard.inmueble.calle} ${datosWizard.inmueble.numero}, ${datosWizard.inmueble.piso} `,
            codigo_postal: datosWizard.inmueble.codigoPostal,
            ciudad: datosWizard.inmueble.ciudad,
            provincia: datosWizard.inmueble.provincia,
            referencia_catastral: datosWizard.inmueble.referenciaCatastral || null,
        })
        .select('id')
        .single();

    if (inmuebleError || !inmuebleData) {
        throw new Error(`Error al crear inmueble: ${inmuebleError?.message} `);
    }

    const inmuebleId = inmuebleData.id;

    // 2. Generar número de expediente
    const numeroExpediente = await generarNumeroExpediente();

    // 3. Calcular version_hash (hash del contrato para integridad)
    const versionHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(datosWizard))
        .digest('hex');

    // 4. Crear contrato
    const estadoInicial = borradorPdfPath ? 'BORRADOR' : 'INICIADO';

    // Calcular porcentaje si no viene en los datos
    const porcentajeArras = datosWizard.contrato.porcentaje_arras ||
        (datosWizard.contrato.precio_total > 0
            ? (datosWizard.contrato.importe_arras / datosWizard.contrato.precio_total) * 100
            : 0);

    const { data: contratoData, error: contratoError } = await supabase
        .from('contratos_arras')
        .insert({
            inmueble_id: inmuebleId,
            numero_expediente: numeroExpediente,
            estado: estadoInicial,
            datos_wizard: datosWizard,
            borrador_pdf_path: borradorPdfPath || null,
            modo_estandar_icade: datosWizard.contrato.modoEstandarObservatorio || false,
            tipo_arras: datosWizard.contrato.tipo_arras?.toUpperCase() || 'PENITENCIALES',
            precio_total: datosWizard.contrato.precio_total,
            importe_arras: datosWizard.contrato.importe_arras,
            porcentaje_arras_calculado: porcentajeArras,
            fecha_limite_firma_escritura: datosWizard.contrato.fecha_limite_firma_escritura,
            forma_pago_arras: 'AL_FIRMAR', // Default
            version_hash: versionHash,
            version_numero: 1,
        })
        .select('id, link_compartible')
        .single();

    if (contratoError || !contratoData) {
        throw new Error(`Error al crear contrato: ${contratoError?.message} `);
    }

    const contratoId = contratoData.id;
    const linkCompartible = contratoData.link_compartible;

    // 5. Insertar vendedores como partes
    const vendedoresInsert = datosWizard.vendedores.map((vendedor) => ({
        rol: 'VENDEDOR',
        nombre: vendedor.nombre,
        apellidos: vendedor.apellidos,
        tipo_documento: vendedor.tipo_documento || 'DNI',
        numero_documento: vendedor.numero_documento,
        email: vendedor.email || null,
        telefono: vendedor.telefono || null,
        domicilio: vendedor.domicilio || null,
    }));

    const { data: vendedoresData, error: vendedoresError } = await supabase
        .from('partes')
        .insert(vendedoresInsert)
        .select('id');

    if (vendedoresError || !vendedoresData) {
        throw new Error(`Error al crear vendedores: ${vendedoresError?.message} `);
    }

    // 6. Insertar compradores como partes
    const compradoresInsert = datosWizard.compradores.map((comprador) => ({
        rol: 'COMPRADOR',
        nombre: comprador.nombre,
        apellidos: comprador.apellidos,
        tipo_documento: comprador.tipo_documento || 'DNI',
        numero_documento: comprador.numero_documento,
        email: comprador.email || null,
        telefono: comprador.telefono || null,
        domicilio: comprador.domicilio || null,
    }));

    const { data: compradoresData, error: compradoresError } = await supabase
        .from('partes')
        .insert(compradoresInsert)
        .select('id');

    if (compradoresError || !compradoresData) {
        throw new Error(`Error al crear compradores: ${compradoresError?.message} `);
    }

    // 7. Crear relaciones contratos_partes
    const relacionesVendedores = vendedoresData.map((v) => ({
        contrato_id: contratoId,
        parte_id: v.id,
        rol_en_contrato: 'VENDEDOR',
        obligado_aceptar: true,
        obligado_firmar: true,
    }));

    const relacionesCompradores = compradoresData.map((c) => ({
        contrato_id: contratoId,
        parte_id: c.id,
        rol_en_contrato: 'COMPRADOR',
        obligado_aceptar: true,
        obligado_firmar: true,
    }));

    const { error: relacionesError } = await supabase
        .from('contratos_partes')
        .insert([...relacionesVendedores, ...relacionesCompradores]);

    if (relacionesError) {
        console.error('Error al crear relaciones:', relacionesError);
        // No lanzar error, las relaciones son opcionales para esta versión
    }

    // 8. Generar inventario documental base (documentos obligatorios)
    await generarInventarioBase(contratoId, datosWizard);

    // 9. Crear cadena de eventos forenses completa
    // EVENTO 1: ACEPTACIÓN DE TÉRMINOS POR COMPRADOR (primer evento de la cadena)
    const evento1Payload = {
        tipo: 'ACEPTACION_TERMINOS',
        parte: 'COMPRADOR',
        numeroExpediente,
        modoICADE: datosWizard.contrato.modoEstandarObservatorio,
        terminosAceptados: {
            precio: datosWizard.contrato.precio_total,
            arras: datosWizard.contrato.importe_arras,
            tipo: datosWizard.contrato.tipo_arras,
            fechaLimite: datosWizard.contrato.fecha_limite_firma_escritura,
        },
    };

    const hash1 = calcularHashEvento(evento1Payload, null);

    const { data: evento1Data, error: evento1Error } = await supabase
        .from('eventos')
        .insert({
            contrato_id: contratoId,
            tipo: 'ACEPTACION_TERMINOS',
            payload_json: evento1Payload,
            hash_sha256: hash1,
            prev_hash_sha256: null, // Primer evento de la cadena
            actor_tipo: 'COMPRADOR',
        })
        .select('id, hash_sha256')
        .single();

    if (evento1Error) {
        console.error('Error al crear evento de aceptación (comprador):', evento1Error);
    }

    // EVENTO 2: ACEPTACIÓN DE TÉRMINOS POR VENDEDOR (encadenado al anterior)
    const evento2Payload = {
        tipo: 'ACEPTACION_TERMINOS',
        parte: 'VENDEDOR',
        numeroExpediente,
        modoICADE: datosWizard.contrato.modoEstandarObservatorio,
        terminosAceptados: {
            precio: datosWizard.contrato.precio_total,
            arras: datosWizard.contrato.importe_arras,
            tipo: datosWizard.contrato.tipo_arras,
            fechaLimite: datosWizard.contrato.fecha_limite_firma_escritura,
        },
    };

    const hash2 = calcularHashEvento(evento2Payload, evento1Data?.hash_sha256 || null);

    const { data: evento2Data, error: evento2Error } = await supabase
        .from('eventos')
        .insert({
            contrato_id: contratoId,
            tipo: 'ACEPTACION_TERMINOS',
            payload_json: evento2Payload,
            hash_sha256: hash2,
            prev_hash_sha256: evento1Data?.hash_sha256 || null, // Encadenado al evento 1
            actor_tipo: 'VENDEDOR',
        })
        .select('id, hash_sha256')
        .single();

    if (evento2Error) {
        console.error('Error al crear evento de aceptación (vendedor):', evento2Error);
    }

    // EVENTO 3: BORRADOR GENERADO (encadenado al anterior)
    const evento3Payload = {
        tipo: 'BORRADOR_GENERADO',
        numeroExpediente,
        estadoInicial,
        pdfPath: borradorPdfPath || null,
        modoICADE: datosWizard.contrato.modoEstandarObservatorio,
    };

    const hash3 = calcularHashEvento(evento3Payload, evento2Data?.hash_sha256 || null);

    const { error: evento3Error } = await supabase
        .from('eventos')
        .insert({
            contrato_id: contratoId,
            tipo: 'BORRADOR_GENERADO',
            payload_json: evento3Payload,
            hash_sha256: hash3,
            prev_hash_sha256: evento2Data?.hash_sha256 || null, // Encadenado al evento 2
            actor_tipo: 'SISTEMA',
        });

    if (evento3Error) {
        console.error('Error al crear evento de borrador:', evento3Error);
        // No lanzar error, continuar
    }

    return {
        contratoId,
        numeroExpediente,
        linkCompartible,
    };
}

/**
 * Genera el inventario documental base al crear el contrato.
 * Incluye todos los documentos obligatorios que deben subirse antes de la notaría.
 * 
 * @param contratoId - ID del contrato
 * @param datosWizard - Datos del wizard para determinar documentos condicionales
 */
async function generarInventarioBase(contratoId: string, datosWizard: DatosWizard): Promise<void> {
    const items: Array<{
        tipo: string;
        titulo: string;
        grupo: string;
        responsable_rol: string;
        obligatorio: boolean;
        descripcion?: string;
    }> = [
            // === GRUPO INMUEBLE ===
            { tipo: 'NOTA_SIMPLE', titulo: 'Nota simple vigente', grupo: 'INMUEBLE', responsable_rol: 'VENDEDOR', obligatorio: true, descripcion: 'Nota simple del Registro de la Propiedad (máximo 3 meses de antigüedad)' },
            { tipo: 'ESCRITURA_ANTERIOR', titulo: 'Título de propiedad del transmitente', grupo: 'INMUEBLE', responsable_rol: 'VENDEDOR', obligatorio: true, descripcion: 'Escritura de adquisición del vendedor' },
            { tipo: 'CEE', titulo: 'Certificado de eficiencia energética', grupo: 'INMUEBLE', responsable_rol: 'VENDEDOR', obligatorio: true, descripcion: 'Certificado de eficiencia energética en vigor' },
            { tipo: 'IBI', titulo: 'Recibo IBI último ejercicio', grupo: 'INMUEBLE', responsable_rol: 'VENDEDOR', obligatorio: true, descripcion: 'Último recibo del Impuesto de Bienes Inmuebles pagado' },
            { tipo: 'CERTIFICADO_COMUNIDAD', titulo: 'Certificado de comunidad', grupo: 'INMUEBLE', responsable_rol: 'VENDEDOR', obligatorio: true, descripcion: 'Certificado de estar al corriente de pago con la comunidad de propietarios' },

            // === GRUPO PARTES ===
            { tipo: 'DNI_NIE_COMPRADOR', titulo: 'DNI/NIE Parte compradora', grupo: 'PARTES', responsable_rol: 'COMPRADOR', obligatorio: true, descripcion: 'Documento de identidad de todos los compradores' },
            { tipo: 'DNI_NIE_VENDEDOR', titulo: 'DNI/NIE Parte vendedora', grupo: 'PARTES', responsable_rol: 'VENDEDOR', obligatorio: true, descripcion: 'Documento de identidad de todos los vendedores' },

            // === GRUPO ARRAS ===
            { tipo: 'CONTRATO_ARRAS_FIRMADO', titulo: 'Contrato de arras firmado', grupo: 'ARRAS', responsable_rol: 'PLATAFORMA', obligatorio: true, descripcion: 'Contrato de arras con firmas electrónicas de todas las partes' },
            { tipo: 'JUSTIFICANTE_ARRAS', titulo: 'Justificante de pago de arras', grupo: 'ARRAS', responsable_rol: 'COMPRADOR', obligatorio: true, descripcion: 'Transferencia o justificante del pago del importe de arras' },
        ];

    // Añadir documentos condicionales según datos del inmueble
    if (datosWizard.inmueble.tieneHipoteca) {
        items.push({
            tipo: 'DOC_CANCELACION_HIPOTECA',
            titulo: 'Cancelación de hipoteca / Carta de pago',
            grupo: 'INMUEBLE',
            responsable_rol: 'VENDEDOR',
            obligatorio: true,
            descripcion: 'Documentación de cancelación de hipoteca o carta de pago del banco'
        });
    }

    if (datosWizard.inmueble.tieneArrendatarios) {
        items.push({
            tipo: 'DOC_ARRENDAMIENTO',
            titulo: 'Documentación de arrendamiento',
            grupo: 'INMUEBLE',
            responsable_rol: 'VENDEDOR',
            obligatorio: true,
            descripcion: 'Contrato de arrendamiento vigente y situación de los arrendatarios'
        });
    }

    // Insertar todos los items en inventario_expediente
    let insertedCount = 0;
    for (const item of items) {
        const { error } = await supabase
            .from('inventario_expediente')
            .upsert({
                contrato_id: contratoId,
                tipo: item.tipo,
                titulo: item.titulo,
                descripcion: item.descripcion || null,
                grupo: item.grupo,
                responsable_rol: item.responsable_rol,
                obligatorio: item.obligatorio,
                estado: 'PENDIENTE',
            }, {
                onConflict: 'contrato_id,tipo',
                ignoreDuplicates: true
            });

        if (!error) insertedCount++;
    }

    console.log(`✅ Generados ${insertedCount} items de inventario BASE para contrato ${contratoId}`);
}

/**
 * Obtiene un contrato completo por ID incluyendo todas sus relaciones
 * 
 * @param contratoId - UUID del contrato
 * @returns Datos completos del contrato, partes, eventos, documentos y mensajes
 */
export async function obtenerContratoCompleto(contratoId: string) {
    // 1. Obtener contrato principal
    const { data: contrato, error: contratoError } = await supabase
        .from('contratos_arras')
        .select(`
    *,
    inmueble: inmuebles(*)
        `)
        .eq('id', contratoId)
        .single();

    if (contratoError || !contrato) {
        throw new Error(`Contrato no encontrado: ${contratoError?.message} `);
    }

    // 2. Obtener partes del contrato
    const { data: partes, error: partesError } = await supabase
        .from('contratos_partes')
        .select(`
    *,
    parte: partes(*)
        `)
        .eq('contrato_id', contratoId);

    if (partesError) {
        console.error('Error al obtener partes:', partesError);
    }

    // 3. Obtener eventos
    const { data: eventos, error: eventosError } = await supabase
        .from('eventos')
        .select('*')
        .eq('contrato_id', contratoId)
        .order('fecha_hora', { ascending: true });

    if (eventosError) {
        console.error('Error al obtener eventos:', eventosError);
    }

    // 4. Obtener documentos (archivos)
    const { data: documentos, error: documentosError } = await supabase
        .from('archivos')
        .select('*')
        .eq('contrato_id', contratoId)
        .order('fecha_hora_subida', { ascending: false });

    if (documentosError) {
        console.error('Error al obtener documentos:', documentosError);
    }

    // 5. Obtener mensajes de chat
    const { data: mensajes, error: mensajesError } = await supabase
        .from('mensajes_chat')
        .select('*')
        .eq('contrato_id', contratoId)
        .order('created_at', { ascending: true });

    if (mensajesError) {
        console.error('Error al obtener mensajes:', mensajesError);
    }

    return {
        ...contrato,
        partes: partes || [],
        eventos: eventos || [],
        documentos: documentos || [],
        mensajes: mensajes || [],
    };
}
