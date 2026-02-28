-- =====================================================
-- MIGRACIÓN 025: ESCROW como forma de pago
-- Blueprint v1.0 - Añadir ESCROW al CHECK constraint
-- =====================================================

-- 1. Eliminar constraint existente
ALTER TABLE contratos_arras
  DROP CONSTRAINT IF EXISTS contratos_arras_forma_pago_arras_check;

-- 2. Añadir constraint con ESCROW incluido
ALTER TABLE contratos_arras
  ADD CONSTRAINT contratos_arras_forma_pago_arras_check
  CHECK (forma_pago_arras IN ('AL_FIRMAR', 'POSTERIOR', 'ESCROW'));

-- 3. Comentario actualizado
COMMENT ON COLUMN contratos_arras.forma_pago_arras IS 'Forma de pago: AL_FIRMAR (inmediato), POSTERIOR (plazo), ESCROW (depósito en cuenta controlada)';
