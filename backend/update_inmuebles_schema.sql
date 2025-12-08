-- Actualizar tabla inmuebles con estructura profesional

-- Campos de ubicación detallada
ALTER TABLE inmuebles ADD COLUMN IF NOT EXISTS portal TEXT;
ALTER TABLE inmuebles ADD COLUMN IF NOT EXISTS piso TEXT;
ALTER TABLE inmuebles ADD COLUMN IF NOT EXISTS puerta TEXT;

-- Datos catastrales estructurados
ALTER TABLE inmuebles ADD COLUMN IF NOT EXISTS uso_catastral TEXT; -- VIVIENDA, LOCAL, OTROS
ALTER TABLE inmuebles ADD COLUMN IF NOT EXISTS superficie_construida_catastro NUMERIC;
ALTER TABLE inmuebles ADD COLUMN IF NOT EXISTS anio_construccion_catastro INTEGER;

-- Datos registrales estructurados
ALTER TABLE inmuebles ADD COLUMN IF NOT EXISTS rp_numero TEXT;
ALTER TABLE inmuebles ADD COLUMN IF NOT EXISTS rp_localidad TEXT;
ALTER TABLE inmuebles ADD COLUMN IF NOT EXISTS finca_numero TEXT;
ALTER TABLE inmuebles ADD COLUMN IF NOT EXISTS cru_idufir TEXT;
ALTER TABLE inmuebles ADD COLUMN IF NOT EXISTS tomo TEXT;
ALTER TABLE inmuebles ADD COLUMN IF NOT EXISTS libro TEXT;
ALTER TABLE inmuebles ADD COLUMN IF NOT EXISTS folio TEXT;
ALTER TABLE inmuebles ADD COLUMN IF NOT EXISTS seccion TEXT;

-- Características ampliadas
ALTER TABLE inmuebles ADD COLUMN IF NOT EXISTS m2_utiles NUMERIC;
ALTER TABLE inmuebles ADD COLUMN IF NOT EXISTS ascensor BOOLEAN DEFAULT FALSE;
ALTER TABLE inmuebles ADD COLUMN IF NOT EXISTS planta TEXT;
ALTER TABLE inmuebles ADD COLUMN IF NOT EXISTS descripcion_libre TEXT;

-- Crear tabla de anexos (garaje, trastero, etc.)
CREATE TABLE IF NOT EXISTS anexos_inmuebles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inmueble_id UUID NOT NULL REFERENCES inmuebles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- PLAZA_GARAJE, TRASTERO, OTRA_VIVIENDA
  ubicacion TEXT,
  superficie NUMERIC,
  referencia_catastral TEXT,
  rp_numero TEXT,
  finca_numero TEXT,
  cru_idufir TEXT,
  vinculacion TEXT, -- OB_REM, INDEPENDIENTE
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anexos_inmueble ON anexos_inmuebles(inmueble_id);

COMMENT ON TABLE anexos_inmuebles IS 'Anexos vinculados al inmueble principal (garajes, trasteros, etc.)';
