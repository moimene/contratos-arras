-- ============================================
-- MIGRATION 011: Tabla de mensajes del expediente
-- ============================================
-- Tabla para almacenar mensajes del chat del expediente
-- con soporte para marcado probatoriamente relevante

CREATE TABLE IF NOT EXISTS mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
    
    -- Contenido
    mensaje TEXT NOT NULL,
    remitente_id UUID,
    remitente_nombre TEXT NOT NULL DEFAULT 'Usuario',
    
    -- Metadatos
    es_sistema BOOLEAN DEFAULT false,
    metadatos JSONB DEFAULT '{}',
    
    -- Relevancia probatoria
    es_relevante_probatoriamente BOOLEAN DEFAULT false,
    fecha_marcado_relevante TIMESTAMPTZ,
    motivo_relevancia TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_mensajes_contrato ON mensajes(contrato_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_relevantes ON mensajes(contrato_id, es_relevante_probatoriamente) 
    WHERE es_relevante_probatoriamente = true;
CREATE INDEX IF NOT EXISTS idx_mensajes_created ON mensajes(created_at);

-- Comentarios
COMMENT ON TABLE mensajes IS 'Mensajes del chat del expediente';
COMMENT ON COLUMN mensajes.es_relevante_probatoriamente IS 'Si el mensaje tiene relevancia probatoria';
COMMENT ON COLUMN mensajes.motivo_relevancia IS 'Motivo por el cual se marco como relevante';
