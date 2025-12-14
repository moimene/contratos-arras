// Tipos base del sistema
export type EstadoContrato =
    | 'INICIADO'      // Alta inicial: inmueble, partes, términos (antes de aceptación)
    | 'BORRADOR'      // Términos aceptados, pendiente firma (no vinculante)
    | 'FIRMADO'       // Documento firmado en plataforma
    | 'NOTARIA'       // Con cita en notaría para escritura
    | 'TERMINADO'     // Compraventa completada o cerrado sin litigio
    | 'LITIGIO';      // En disputa por incumplimiento

export type TipoArras =
    | 'CONFIRMATORIAS'
    | 'PENITENCIALES'
    | 'PENALES'
    | 'OTRO';

export type FormaPagoArras =
    | 'AL_FIRMAR'
    | 'POSTERIOR'
    | 'ESCROW';

export type ViaResolucion =
    | 'JUZGADOS'
    | 'ARBITRAJE_NOTARIAL';

export type RolParte =
    | 'COMPRADOR'
    | 'VENDEDOR'
    | 'INTERMEDIARIO'
    | 'OTRO';

// =====================================================
// SISTEMA DE ROLES, MANDATOS E INVITACIONES
// =====================================================

/** Rol de sistema del usuario (capacidades globales) */
export type TipoRolUsuario =
    | 'ADMIN'
    | 'COMPRADOR'
    | 'VENDEDOR'
    | 'TERCERO'
    | 'NOTARIO'
    | 'OBSERVADOR';

/** Tipo de mandato: en nombre de quién actúa */
export type TipoMandato =
    | 'PARTE_COMPRADORA'
    | 'PARTE_VENDEDORA'
    | 'AMBAS_PARTES'
    | 'NOTARIA'
    | 'OBSERVADOR_TECNICO';

/** Estado del acceso al expediente */
export type EstadoAcceso =
    | 'PENDIENTE_INVITACION'
    | 'ACTIVO'
    | 'REVOCADO';

/** Estado del mandato */
export type EstadoMandato =
    | 'ACTIVO'
    | 'REVOCADO';

/** Estado de la invitación */
export type EstadoInvitacion =
    | 'CREADA'
    | 'ENVIADA'
    | 'VISTA'
    | 'ACEPTADA'
    | 'EXPIRADA'
    | 'REVOCADA';

export type MetodoPago =
    | 'TRANSFERENCIA'
    | 'DEPOSITO_NOTARIA';

export type EstadoPago =
    | 'DECLARADO'
    | 'ACREDITADO'
    | 'RECHAZADO';

// Tipo de documento - extendido según especificación legal
export type TipoDocumento =
    // Inmueble y situación
    | 'NOTA_SIMPLE'
    | 'ESCRITURA_ANTERIOR'
    | 'RECIBO_IBI'
    | 'CERTIFICADO_COMUNIDAD'
    | 'CERTIFICADO_EFICIENCIA_ENERGETICA'
    | 'OTROS_DOC_INMUEBLE'
    // Partes y representación
    | 'DNI_NIE_COMPRADOR'
    | 'DNI_NIE_VENDEDOR'
    | 'PODER_COMPRADOR'
    | 'PODER_VENDEDOR'
    | 'DOCUMENTACION_REGIMEN_MATRIMONIAL'
    | 'DATOS_ASESOR'
    // Contractuales y arras
    | 'CONTRATO_ARRAS_BORRADOR'
    | 'CONTRATO_ARRAS_FIRMADO'
    | 'JUSTIFICANTE_PAGO_ARRAS'
    | 'OTROS_ACUERDOS_ADICIONALES'
    // Notaría y escritura
    | 'CONVOCATORIA_NOTARIA'
    | 'MINUTA_ESCRITURA'
    | 'DOC_IDENTIDAD_NOTARIA'
    | 'ESCRITURA_COMPRAVENTA_FIRMADA'
    | 'DOC_CANCELACION_HIPOTECA'
    | 'ACUERDOS_SUBROGACION'
    // Incidencias y cierre
    | 'ACTA_NO_COMPARECENCIA'
    | 'NOTIFICACIONES_NO_COMPARECENCIA'
    | 'ALEGACIONES_NO_COMPARECIENTE'
    | 'CERTIFICADO_EVENTOS'
    | 'DOC_LITIGIO_ARBITRAJE'
    // Categorías adicionales (ad-hoc)
    | 'URBANISTICO'
    | 'ADMINISTRATIVO'
    | 'LEGAL'
    | 'TECNICO'
    | 'FISCAL'
    | 'OTRO';

// Alias para compatibilidad
export type TipoArchivo = TipoDocumento;

export type TipoEvento =
    | 'CONTRATO_CREADO'
    | 'ACEPTACION_TERMINOS'
    | 'BORRADOR_GENERADO'
    | 'TERMINOS_ACEPTADOS'
    | 'FIRMA_REGISTRADA'
    | 'FIRMA_ELECTRONICA'
    | 'ARRAS_DECLARADAS'
    | 'ARRAS_ACREDITADAS'
    | 'PAGO_ARRAS_CONFIRMADO'
    | 'JUSTIFICANTE_SUBIDO'
    | 'CONVOCATORIA_NOTARIAL'
    | 'MINUTA_GENERADA'
    | 'ACTA_NO_COMPARECENCIA'
    | 'RESPUESTA_NO_COMPARECIENTE'
    | 'RETENCION_COMUNICADA'
    | 'ALEGACION_PRESENTADA'
    | 'VENTANA_ALEGACIONES_CERRADA'
    | 'ESCRITURA_OTORGADA'
    | 'CONTRATO_RESUELTO'
    | 'RESUELTO_POR_INCUMPLIMIENTO_COMPRA'
    | 'RESUELTO_POR_INCUMPLIMIENTO_VENTA'
    | 'CONTRATO_CERRADO'
    | 'CONTRATO_RECLAMADO'
    | 'ARBITRAJE_SOLICITADO'
    | 'ARBITRAJE_RESUELTO'
    | 'COMUNICACION_ENVIADA'
    | 'COMUNICACION_ENTREGADA'
    | 'COMUNICACION_LEIDA'
    | 'INVENTARIO_ITEM_CREADO'
    | 'INVENTARIO_ACTUALIZADO'
    | 'DOCUMENTO_SUBIDO'
    | 'DOCUMENTO_VALIDADO'
    | 'DOCUMENTO_RECHAZADO'
    | 'DOCUMENTO_ACCEDIDO'
    | 'DOCUMENTO_ELIMINADO'
    | 'INVENTARIO_ITEM_ELIMINADO'
    | 'CONTRATO_FIRMADO'
    | 'MENSAJE_ENVIADO'
    | 'MENSAJE_MARCADO_RELEVANTE'
    | 'COMUNICACION_EXTERNA_IMPORTADA'
    | 'COMUNICACION_RESPONDIDA'
    | 'CERTIFICADO_GENERADO'
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

    // ============================================
    // CAMPOS PARA CLÁUSULAS MODULARES
    // ============================================
    /** Tipo de objeto: VIVIENDA, LOCAL, OFICINA, GARAJE, SOLAR, OTRO */
    objeto?: 'VIVIENDA' | 'LOCAL' | 'OFICINA' | 'GARAJE' | 'SOLAR' | 'OTRO';
    /** True si no hay hipoteca pendiente (default true) */
    sinHipoteca?: boolean;
    /** True si no hay arrendatarios/ocupantes (default true) */
    sinArrendatarios?: boolean;
    /** Derecho aplicable: COMUN, FORAL_NAVARRA, FORAL_EUSKADI, FORAL_ARAGON */
    derecho?: 'COMUN' | 'FORAL_NAVARRA' | 'FORAL_EUSKADI' | 'FORAL_ARAGON';
    /** Configuración de cuenta escrow si se usa */
    escrow?: {
        activo: boolean;
        depositario?: string;
        condiciones?: string;
    };
    /** Configuración de retenciones sobre precio */
    retenciones?: {
        activa: boolean;
        importe?: number;
        concepto?: string;
    };
    /** True si incluye mobiliario/equipamiento */
    mobiliarioEquipamiento?: boolean;
    /** True si hay subrogación de arrendamiento existente */
    subrogacionArrendamiento?: boolean;
    /** True si usa el modelo estándar Observatorio Legaltech */
    modoEstandarObservatorio?: boolean;

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

export interface Comunicacion {
    id: string;
    contrato_id: string;
    tipo_comunicacion: string;
    tipo_funcion?: string;
    canal: string;
    remitente_rol?: string;
    remitente_usuario_id?: string;
    remitente_externo?: string;
    destinatarios_roles?: string[];
    destinatarios_externos?: string;
    asunto?: string;
    contenido?: string;
    contenido_html?: string;
    resumen_externo?: string;
    fecha_comunicacion?: string;
    fecha_registro: string;
    fecha_envio?: string;
    fecha_entrega?: string;
    fecha_lectura?: string;
    estado: string;
    es_externa: boolean;
    comunicacion_padre_id?: string;
    adjuntos_archivo_ids?: string[];
    hash_contenido?: string;
    sello_qtsp_id?: string;
    metadatos?: Record<string, any>;
    registrado_por_rol?: string;
    created_at: string;
    updated_at: string;
}

// Contrato completo con relaciones (para PDF generation, etc.)
// Matches the actual structure returned by getContratoFull in contratos.repo.ts
export interface ContratoFull {
    contrato: ContratoArras & { inmueble?: Inmueble };
    inmueble?: Inmueble;
    partes: Array<{
        id: string;
        contrato_id: string;
        parte_id: string;
        rol_en_contrato: string;
        obligado_aceptar: boolean;
        obligado_firmar: boolean;
        porcentaje_propiedad?: number;
        parte: Parte;
    }>;
    obligadosAceptar: string[];
    aceptacionesValidas: Aceptacion[];
    firmasValidas: Firma[];
}

// Legacy type for backwards compatibility
export interface ContratoFullLegacy extends ContratoArras {
    inmueble?: Inmueble;
    partes?: Array<Parte & { rol_en_contrato?: string }>;
    compradores?: Parte[];
    vendedores?: Parte[];
    aceptaciones?: Aceptacion[];
    firmas?: Firma[];
    eventos?: Evento[];
    pagos?: Pago[];
}

// =====================================================
// ENTIDADES: MIEMBROS, MANDATOS E INVITACIONES
// =====================================================

/** Miembro de expediente: vínculo usuario ↔ expediente */
export interface MiembroExpediente {
    id: string;
    usuario_id: string | null;
    contrato_id: string;
    tipo_rol_usuario: TipoRolUsuario;
    estado_acceso: EstadoAcceso;
    creado_por_usuario_id?: string;
    created_at: string;
    updated_at: string;
    // Campos enriquecidos (de joins)
    usuario_email?: string;
    usuario_nombre?: string;
    mandatos?: MandatoExpediente[];
}

/** Mandato: en nombre de quién actúa el miembro */
export interface MandatoExpediente {
    id: string;
    miembro_expediente_id: string;
    tipo_mandato: TipoMandato;
    puede_subir_documentos: boolean;
    puede_invitar: boolean;
    puede_validar_documentos: boolean;
    puede_firmar: boolean;
    puede_enviar_comunicaciones: boolean;
    estado_mandato: EstadoMandato;
    creado_por_usuario_id?: string;
    revocado_por_usuario_id?: string;
    fecha_revocacion?: string;
    motivo_revocacion?: string;
    created_at: string;
    updated_at: string;
}

/** Invitación para unirse a un expediente */
export interface InvitacionExpediente {
    id: string;
    contrato_id: string;
    email_destino?: string;
    rol_invitado: TipoRolUsuario;
    tipo_mandato?: TipoMandato;
    permisos_mandato?: Record<string, boolean>;
    token: string;
    fecha_caducidad?: string;
    estado: EstadoInvitacion;
    mensaje_opcional?: string;
    creado_por_usuario_id?: string;
    aceptado_por_usuario_id?: string;
    fecha_aceptacion?: string;
    created_at: string;
    updated_at: string;
}

/** Permisos efectivos calculados (rol + mandato + estado) */
export interface PermisosEfectivos {
    canView: boolean;
    canCreateContract: boolean;
    canInviteUsers: boolean;
    canUploadDocs: boolean;
    canValidateDocs: boolean;
    canRejectDocs: boolean;
    canDeleteDocs: boolean;
    canSendCommunications: boolean;
    canGenerateCertificate: boolean;
    canCreateNotaryAppointment: boolean;
    canSign: boolean;
}

/** Labels para mostrar mandatos en UI */
export const MANDATO_LABELS: Record<TipoMandato, string> = {
    PARTE_COMPRADORA: 'Asesor de la parte compradora',
    PARTE_VENDEDORA: 'Asesor de la parte vendedora',
    AMBAS_PARTES: 'Agencia (ambas partes)',
    NOTARIA: 'Asistente notarial',
    OBSERVADOR_TECNICO: 'Observador técnico'
};
