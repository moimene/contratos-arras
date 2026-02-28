-- =====================================================
-- MIGRACIÓN 023: Estado Macro/Micro
-- Blueprint v1.0 - Separación de estados governance/operativo
-- =====================================================

-- 1. Añadir columnas macro/micro
ALTER TABLE contratos_arras
  ADD COLUMN IF NOT EXISTS estado_macro VARCHAR(30),
  ADD COLUMN IF NOT EXISTS estado_micro VARCHAR(50);

-- 2. Migrar datos existentes (mapeo DB legacy → macro)
UPDATE contratos_arras
SET 
  estado_macro = CASE
    WHEN estado IN ('BORRADOR','EN_NEGOCIACION','TERMINOS_ESENCIALES_ACEPTADOS','BORRADOR_GENERADO') THEN 'BORRADOR'
    WHEN estado = 'FIRMADO' THEN 'FIRMADO'
    WHEN estado = 'CERRADO' THEN 'TERMINADO'
    ELSE 'INICIADO'
  END,
  estado_micro = estado
WHERE estado_macro IS NULL;

-- 3. Añadir CHECK constraint para macro
-- Estados macro permitidos: INICIADO, BORRADOR, EN_FIRMA, FIRMADO, NOTARIA, TERMINADO, LITIGIO, CERRADO
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_estado_macro'
  ) THEN
    ALTER TABLE contratos_arras
      ADD CONSTRAINT chk_estado_macro
      CHECK (estado_macro IN (
        'INICIADO',
        'BORRADOR',
        'EN_FIRMA',
        'FIRMADO',
        'NOTARIA',
        'TERMINADO',
        'LITIGIO',
        'CERRADO'
      ));
  END IF;
END $$;

-- 4. Índice para consultas por estado macro
CREATE INDEX IF NOT EXISTS idx_contratos_estado_macro 
ON contratos_arras(estado_macro);

-- 5. Comentarios de documentación
COMMENT ON COLUMN contratos_arras.estado_macro IS 'Estado governance (controla permisos y freezing): INICIADO, BORRADOR, EN_FIRMA, FIRMADO, NOTARIA, TERMINADO, LITIGIO, CERRADO';
COMMENT ON COLUMN contratos_arras.estado_micro IS 'Estado operativo/detalle (hitos UI): TERMINOS_ESENCIALES_ACEPTADOS, BORRADOR_GENERADO, NO_COMPARECENCIA, etc.';
