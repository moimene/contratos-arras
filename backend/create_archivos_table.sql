-- Tabla de archivos subidos (justificantes, actas, etc.)
CREATE TABLE IF NOT EXISTS archivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  nombre_archivo TEXT NOT NULL,
  ruta_storage TEXT NOT NULL,
  url_publica TEXT,
  tamano_bytes INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_archivos_contrato ON archivos(contrato_id);
CREATE INDEX idx_archivos_tipo ON archivos(tipo);
