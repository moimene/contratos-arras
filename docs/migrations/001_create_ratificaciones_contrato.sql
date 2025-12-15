-- Migration: Create ratificaciones_contrato table
-- Purpose: Store ratifications of externally signed contract documents
-- Part of Delivery C: External Upload + Ratification

-- Create ratificaciones_contrato table
CREATE TABLE IF NOT EXISTS ratificaciones_contrato (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
    documento_id UUID NOT NULL REFERENCES archivos(id) ON DELETE RESTRICT,
    documento_sha256 TEXT NOT NULL,
    rol_parte TEXT NOT NULL CHECK (rol_parte IN ('COMPRADOR', 'VENDEDOR')),
    usuario_id UUID NOT NULL REFERENCES perfiles(id),
    text_id TEXT NOT NULL,
    text_version TEXT NOT NULL,
    sello_id UUID REFERENCES sellos_tiempo(id),
    fecha_ratificacion TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Each role can only ratify once per contract
    UNIQUE(contrato_id, rol_parte)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ratificaciones_contrato_id ON ratificaciones_contrato(contrato_id);
CREATE INDEX IF NOT EXISTS idx_ratificaciones_usuario_id ON ratificaciones_contrato(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ratificaciones_documento_id ON ratificaciones_contrato(documento_id);

-- Add column to archivos to track origin (IN_PLATFORM vs EXTERNO)
ALTER TABLE archivos 
ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT 'IN_PLATFORM' CHECK (origen IN ('IN_PLATFORM', 'EXTERNO'));

-- Comment for documentation
COMMENT ON TABLE ratificaciones_contrato IS 'Stores ratifications (aceptaciones formales) of externally signed contract documents. Each role (COMPRADOR/VENDEDOR) must ratify to finalize an externally signed contract.';
COMMENT ON COLUMN ratificaciones_contrato.documento_sha256 IS 'SHA-256 hash of the document at the time of ratification - fail-closed verification';
COMMENT ON COLUMN ratificaciones_contrato.sello_id IS 'Reference to QTSP timestamp seal applied when ratification was registered';
COMMENT ON COLUMN ratificaciones_contrato.text_id IS 'ID of legal text shown to user at time of ratification';
COMMENT ON COLUMN ratificaciones_contrato.text_version IS 'Version of the legal text at time of ratification';
