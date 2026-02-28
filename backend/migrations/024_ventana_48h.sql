-- =====================================================
-- MIGRACIÓN 024: Ventana 48h para Alegaciones
-- Blueprint v1.0 - Campos sellados para ventana determinista
-- =====================================================

-- 1. Añadir campos de ventana a actas_no_comparecencia
ALTER TABLE actas_no_comparecencia
  ADD COLUMN IF NOT EXISTS window_opens_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS window_closes_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS window_status VARCHAR(20) DEFAULT 'OPEN';

-- 2. CHECK constraint para window_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_window_status'
  ) THEN
    ALTER TABLE actas_no_comparecencia
      ADD CONSTRAINT chk_window_status
      CHECK (window_status IN ('OPEN', 'CLOSED_EXPIRED', 'CLOSED_RESPONSE'));
  END IF;
END $$;

-- 3. Migrar datos existentes (si hay ventana_cierre_iso, calcular opens/closes)
UPDATE actas_no_comparecencia
SET 
  window_opens_at = COALESCE(
    fecha_hora_creacion,
    NOW()
  ),
  window_closes_at = COALESCE(
    ventana_cierre_iso,
    fecha_hora_creacion + INTERVAL '48 hours'
  ),
  window_status = CASE
    WHEN respuesta_tipo IS NOT NULL THEN 'CLOSED_RESPONSE'
    WHEN ventana_cierre_iso < NOW() THEN 'CLOSED_EXPIRED'
    ELSE 'OPEN'
  END
WHERE window_opens_at IS NULL;

-- 4. Índice para scheduler que busca ventanas abiertas próximas a expirar
CREATE INDEX IF NOT EXISTS idx_actas_window_open
ON actas_no_comparecencia (window_status, window_closes_at)
WHERE window_status = 'OPEN';

-- 5. Comentarios
COMMENT ON COLUMN actas_no_comparecencia.window_opens_at IS 'Timestamp sellado de apertura de ventana 48h (evento NOTIFICACION_NO_COMPARECENCIA_ENVIADA)';
COMMENT ON COLUMN actas_no_comparecencia.window_closes_at IS 'Timestamp de cierre = opens_at + 48h';
COMMENT ON COLUMN actas_no_comparecencia.window_status IS 'OPEN | CLOSED_EXPIRED | CLOSED_RESPONSE';
