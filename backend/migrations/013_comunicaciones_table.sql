-- ============================================
-- MIGRATION 013: Tabla de comunicaciones estructuradas
-- ============================================
-- Gestiona comunicaciones formales del expediente:
-- - Internas (reclamaciones, solicitudes, notificaciones)
-- - Externas importadas (emails, burofaxes, WhatsApp)

BEGIN;

-- Tipos de comunicación
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_comunicacion') THEN
        CREATE TYPE tipo_comunicacion AS ENUM (
            -- Internas
            'RECLAMACION',
            'SOLICITUD_DOCUMENTACION',
            'SOLICITUD_MODIFICACION_TERMINOS',
            'NOTIFICACION_GENERAL',
            'CONVOCATORIA_NOTARIA',
            'NOTIFICACION_NO_COMPARECENCIA',
            'ALEGACION',
            'RESPUESTA',
            -- Externas
            'COMUNICACION_EXTERNA_IMPORTADA'
        );
    END IF;
END $$;

-- Canales de comunicación
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'canal_comunicacion') THEN
        CREATE TYPE canal_comunicacion AS ENUM (
            'PLATAFORMA',
            'EMAIL',
            'BUROFAX',
            'CARTA_CERTIFICADA',
            'CARTA_SIMPLE',
            'WHATSAPP',
            'TELEFONO',
            'OTRO'
        );
    END IF;
END $$;

-- Estados de comunicación
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_comunicacion') THEN
        CREATE TYPE estado_comunicacion AS ENUM (
            'BORRADOR',
            'ENVIADA',
            'ENTREGADA',
            'LEIDA',
            'RESPONDIDA'
        );
    END IF;
END $$;

-- Tabla principal de comunicaciones
CREATE TABLE IF NOT EXISTS comunicaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
    
    -- Clasificación
    tipo_comunicacion VARCHAR(50) NOT NULL,
    tipo_funcion VARCHAR(100), -- Clasificación adicional interna
    canal VARCHAR(30) NOT NULL DEFAULT 'PLATAFORMA',
    
    -- Remitente
    remitente_rol VARCHAR(50),
    remitente_usuario_id UUID,
    remitente_externo VARCHAR(255), -- Para comunicaciones externas
    
    -- Destinatarios
    destinatarios_roles JSONB DEFAULT '[]', -- Array de roles internos
    destinatarios_externos TEXT, -- Para comunicaciones externas (texto libre)
    
    -- Contenido
    asunto VARCHAR(500),
    contenido TEXT,
    contenido_html TEXT,
    resumen_externo TEXT, -- Resumen para comms externas importadas
    
    -- Fechas
    fecha_comunicacion TIMESTAMPTZ, -- Fecha real de la comunicación (puede ser pasada para externas)
    fecha_registro TIMESTAMPTZ DEFAULT NOW(), -- Cuando se registró en el sistema
    fecha_envio TIMESTAMPTZ, -- Cuando se envió (para internas)
    fecha_entrega TIMESTAMPTZ,
    fecha_lectura TIMESTAMPTZ,
    
    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
    
    -- Comunicaciones externas
    es_externa BOOLEAN DEFAULT false,
    
    -- Vínculos
    comunicacion_padre_id UUID REFERENCES comunicaciones(id), -- Para respuestas
    acta_id UUID, -- Vínculo a actas si aplica
    cita_notaria_id UUID, -- Vínculo a cita notarial si aplica
    
    -- Adjuntos (array de IDs de archivos)
    adjuntos_archivo_ids JSONB DEFAULT '[]',
    
    -- Evidencia y trazabilidad
    hash_contenido VARCHAR(64), -- SHA-256 del contenido
    sello_qtsp_id UUID, -- FK a sellos_tiempo cuando se selle
    
    -- Metadatos adicionales según tipo
    metadatos JSONB DEFAULT '{}',
    
    -- Control de quién registró
    registrado_por_rol VARCHAR(50),
    registrado_por_usuario_id UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_comunicaciones_contrato ON comunicaciones(contrato_id);
CREATE INDEX IF NOT EXISTS idx_comunicaciones_tipo ON comunicaciones(tipo_comunicacion);
CREATE INDEX IF NOT EXISTS idx_comunicaciones_estado ON comunicaciones(estado);
CREATE INDEX IF NOT EXISTS idx_comunicaciones_fecha ON comunicaciones(fecha_comunicacion);
CREATE INDEX IF NOT EXISTS idx_comunicaciones_externa ON comunicaciones(es_externa) WHERE es_externa = true;
CREATE INDEX IF NOT EXISTS idx_comunicaciones_padre ON comunicaciones(comunicacion_padre_id);
CREATE INDEX IF NOT EXISTS idx_comunicaciones_remitente ON comunicaciones(remitente_rol);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_comunicaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_comunicaciones_updated_at ON comunicaciones;
CREATE TRIGGER trigger_comunicaciones_updated_at
    BEFORE UPDATE ON comunicaciones
    FOR EACH ROW
    EXECUTE FUNCTION update_comunicaciones_updated_at();

COMMIT;

-- Comentarios
COMMENT ON TABLE comunicaciones IS 'Comunicaciones formales del expediente (internas y externas importadas)';
COMMENT ON COLUMN comunicaciones.tipo_comunicacion IS 'Tipo de comunicación: RECLAMACION, SOLICITUD_*, NOTIFICACION_*, ALEGACION, COMUNICACION_EXTERNA_IMPORTADA';
COMMENT ON COLUMN comunicaciones.canal IS 'Canal de comunicación: PLATAFORMA, EMAIL, BUROFAX, CARTA_*, WHATSAPP, TELEFONO, OTRO';
COMMENT ON COLUMN comunicaciones.es_externa IS 'True si la comunicación fue importada desde fuera de la plataforma';
COMMENT ON COLUMN comunicaciones.fecha_comunicacion IS 'Fecha real de la comunicación (puede ser anterior a fecha_registro para externas)';
COMMENT ON COLUMN comunicaciones.hash_contenido IS 'Hash SHA-256 del contenido para verificación de integridad';
COMMENT ON COLUMN comunicaciones.metadatos IS 'Datos adicionales según tipo: plazo_dias, importe, documentos_solicitados, etc.';

-- Verificar estructura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'comunicaciones'
ORDER BY ordinal_position;
