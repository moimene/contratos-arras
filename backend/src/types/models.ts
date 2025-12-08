// Tipos base del sistema
export type EstadoContrato =
    | 'BORRADOR'
    | 'EN_NEGOCIACION'
    | 'TERMINOS_ESENCIALES_ACEPTADOS'
    | 'BORRADOR_GENERADO'
    | 'FIRMADO'
    | 'CERRADO';

export type TipoArras =
    | 'CONFIRMATORIAS'
    | 'PENITENCIALES'
    | 'PENALES'
    | 'OTRO';

export type FormaPagoArras =
    | 'AL_FIRMAR'
    | 'POSTERIOR';

export type ViaResolucion =
    | 'JUZGADOS'
    | 'ARBITRAJE_NOTARIAL';

export type RolParte =
    | 'COMPRADOR'
    | 'VENDEDOR'
    | 'INTERMEDIARIO'
    | 'OTRO';

export type MetodoPago =
    | 'TRANSFERENCIA'
    | 'DEPOSITO_NOTARIA';

export type EstadoPago =
    | 'DECLARADO'
    | 'ACREDITADO'
    | 'RECHAZADO';

export type TipoArchivo =
    | 'JUSTIFICANTE_ARRAS'
    | 'ACTA_NO_COMPARECENCIA'
    | 'OTRO';

export type TipoEvento =
    | 'CONTRATO_CREADO'
    | 'ACEPTACION_TERMINOS'
    | 'BORRADOR_GENERADO'
    | 'TERMINOS_ACEPTADOS'
    | 'FIRMA_REGISTRADA'
    | 'ARRAS_DECLARADAS'
    | 'ARRAS_ACREDITADAS'
    | 'CONVOCATORIA_NOTARIAL'
    | 'ACTA_NO_COMPARECENCIA'
    | 'ALEGACION_PRESENTADA'
    | 'VENTANA_ALEGACIONES_CERRADA'
    | 'ESCRITURA_OTORGADA'
    | 'RESUELTO_POR_INCUMPLIMIENTO_COMPRA'
    | 'RESUELTO_POR_INCUMPLIMIENTO_VENTA'
    | 'CONTRATO_CERRADO'
    | 'ARBITRAJE_SOLICITADO'
    | 'ARBITRAJE_RESUELTO'
    | 'EVENTO_CUSTOM';

export type RespuestaTipo =
    | 'CONFORMIDAD'
    | 'SOMETIMIENTO'
    | 'ALEGACIONES';

// Interfaces de entidades
export interface Inmueble {
    id: string;
    direccion_completa: string;
    codigo_postal?: string;
    ciudad: string;
    provincia: string;
    identificador_catastral?: string;
    referencia_catastral?: string;
    datos_registrales?: string;
    titulo_adquisicion_vendedor?: string;
    nota_simple_csv?: string;
    nota_simple_fecha?: string;
    url_anuncio?: string;
    datos_descripcion?: string;
    m2?: number;
    habitaciones?: number;
    banos?: number;
    created_at: string;
    updated_at: string;
}

export interface Parte {
    id: string;
    rol: RolParte;
    nombre: string;
    apellidos: string;
    estado_civil?: string;
    tipo_documento: string;
    numero_documento: string;
    email: string;
    telefono?: string;
    domicilio?: string;
    es_representante: boolean;
    representa_a?: string;
    created_at: string;
    updated_at: string;
}

export interface ContratoArras {
    id: string;
    inmueble_id: string;
    estado: EstadoContrato;
    tipo_arras: TipoArras;
    precio_total: number;
    importe_arras: number;
    porcentaje_arras_calculado: number;
    moneda: string;
    fecha_limite_firma_escritura: string;
    forma_pago_arras: FormaPagoArras;
    plazo_pago_arras_dias?: number;
    fecha_limite_pago_arras?: string;
    iban_vendedor?: string;
    banco_vendedor?: string;
    notario_designado_nombre?: string;
    notario_designado_direccion?: string;
    gastos_quien?: 'LEY' | 'COMPRADOR';
    via_resolucion?: ViaResolucion;
    firma_preferida?: 'ELECTRONICA' | 'MANUSCRITA';
    condicion_suspensiva_texto?: string;
    observaciones?: string;
    cambios_terminos_estandar?: string;
    version_hash: string;
    version_numero: number;
    identificador_unico: string;
    arras_acreditadas_at?: string;
    motivo_cierre?: string;
    created_at: string;
    updated_at: string;
}

export interface ContratoParte {
    id: string;
    contrato_id: string;
    parte_id: string;
    rol_en_contrato: string;
    obligado_aceptar: boolean;
    obligado_firmar: boolean;
    porcentaje_propiedad?: number;
}

export interface Aceptacion {
    id: string;
    contrato_id: string;
    parte_id: string;
    version_contrato: string;
    fecha_hora_aceptacion: string;
    direccion_ip: string;
    user_agent?: string;
    valida: boolean;
}

export interface Firma {
    id: string;
    contrato_id: string;
    parte_id: string;
    version_contrato: string;
    fecha_hora_firma: string;
    direccion_ip: string;
    user_agent?: string;
    valida: boolean;
}

export interface Pago {
    id: string;
    contrato_id: string;
    emisor_parte_id: string;
    receptor_parte_id: string;
    importe: number;
    moneda: string;
    metodo: MetodoPago;
    estado: EstadoPago;
    fecha_declarada: string;
    fecha_acreditada?: string;
    archivo_id?: string;
}

export interface Archivo {
    id: string;
    contrato_id: string;
    parte_id?: string;
    tipo: TipoArchivo;
    nombre_original: string;
    mime_type: string;
    ruta: string;
    tamano: number;
    fecha_hora_subida: string;
}

export interface Evento {
    id: string;
    contrato_id: string;
    tipo: TipoEvento;
    actor_parte_id?: string;
    payload_json: string;
    hash_sha256: string;
    prev_hash_sha256?: string;
    fecha_hora: string;
    sello_id?: string;
}

export interface SelloTiempo {
    id: string;
    proveedor: string;
    marca: string;
    hash_sha256: string;
    rfc3161_tst_base64?: string;
    fecha_sello: string;
    estado: 'EMITIDO' | 'ERROR';
    metadata_json?: string;
}

export interface ActaNoComparecencia {
    id: string;
    contrato_id: string;
    compareciente_parte_id: string;
    incompareciente_parte_id: string;
    fecha_hora_cita: string;
    notaria_nombre: string;
    notaria_direccion: string;
    resumen_hechos?: string;
    estado: 'BORRADOR' | 'GENERADA';
    archivo_id?: string;
    respuesta_tipo?: RespuestaTipo;
    respuesta_texto?: string;
    fecha_hora_respuesta?: string;
    respuesta_valida: boolean;
    ventana_cierre_iso?: string;
    fecha_hora_creacion: string;
}

export interface Certificado {
    id: string;
    contrato_id: string;
    tipo: 'HISTORICO' | 'FINAL';
    contenido_html: string;
    eventos_incluidos_json: string;
    fecha_hora_generacion: string;
    sello_id?: string;
    pdf_archivo_id?: string;
}

export interface Notificacion {
    id: string;
    contrato_id: string;
    emisor_parte_id: string;
    asunto: string;
    mensaje: string;
    fecha_hora_creacion: string;
}

export interface CitaNotaria {
    id: string;
    contrato_id: string;
    nombre_notaria: string;
    direccion_notaria: string;
    fecha_hora_propuesta: string;
    notas?: string;
    lista_documentacion_texto?: string;
    fecha_hora_creacion: string;
}
