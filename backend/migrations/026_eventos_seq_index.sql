-- =====================================================
-- MIGRACIÓN 026: Secuencial y Hash-Chain para Eventos
-- Blueprint v1.0 - Robustez del event store
-- =====================================================

-- 1. Añadir columna secuencial
ALTER TABLE eventos
  ADD COLUMN IF NOT EXISTS seq BIGSERIAL;

-- 2. Índice único por contrato + secuencia (orden garantizado)
CREATE UNIQUE INDEX IF NOT EXISTS ux_eventos_contrato_seq
ON eventos (contrato_id, seq);

-- 3. Índice único por contrato + hash (integridad de cadena)
CREATE UNIQUE INDEX IF NOT EXISTS ux_eventos_contrato_hash
ON eventos (contrato_id, hash_sha256);

-- 4. Comentarios
COMMENT ON COLUMN eventos.seq IS 'Secuencia auto-incremental por contrato, garantiza orden de eventos';
