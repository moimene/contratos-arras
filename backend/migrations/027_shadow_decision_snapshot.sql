-- =====================================================
-- MIGRACIÓN 027: Shadow Phase - Decision Snapshot
-- Blueprint v1.0 - Persistir ArrasDecision sin gobernar
-- =====================================================

-- 1. Añadir columna JSONB para almacenar la decisión computada
ALTER TABLE contratos_arras
  ADD COLUMN IF NOT EXISTS decision_snapshot_json JSONB;

-- 2. Timestamp de la última evaluación del kernel
ALTER TABLE contratos_arras
  ADD COLUMN IF NOT EXISTS decision_computed_at TIMESTAMPTZ;

-- 3. Columna para advisory warnings (array de strings)
ALTER TABLE contratos_arras
  ADD COLUMN IF NOT EXISTS advisory_warnings TEXT[] DEFAULT '{}';

-- 4. Índice parcial para buscar contratos con warnings activos (Advisory phase)
CREATE INDEX IF NOT EXISTS idx_contratos_advisory_active
ON contratos_arras (id)
WHERE array_length(advisory_warnings, 1) > 0;

-- 5. Comentarios
COMMENT ON COLUMN contratos_arras.decision_snapshot_json IS 'Shadow: ArrasDecision computado por el kernel. No gobierna hasta Authority phase.';
COMMENT ON COLUMN contratos_arras.decision_computed_at IS 'Timestamp de la última evaluación del kernel normativo';
COMMENT ON COLUMN contratos_arras.advisory_warnings IS 'Advisory: warnings visibles en UI pero sin bloqueo';
