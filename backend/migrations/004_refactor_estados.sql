-- ============================================
-- MIGRATION 004: Refactor Contract States
-- ============================================
-- Migrates old state names to new 6-state model:
-- INICIADO → BORRADOR → FIRMADO → NOTARIA → TERMINADO (+ LITIGIO)

BEGIN;

-- 1. Migrate old states to new states
UPDATE contratos_arras SET estado = 'INICIADO' WHERE estado = 'BORRADOR';
UPDATE contratos_arras SET estado = 'BORRADOR' WHERE estado IN ('BORRADOR_GENERADO', 'TERMINOS_ESENCIALES_ACEPTADOS', 'EN_NEGOCIACION');
UPDATE contratos_arras SET estado = 'NOTARIA' WHERE estado = 'CONVOCATORIA_NOTARIAL';
UPDATE contratos_arras SET estado = 'TERMINADO' WHERE estado IN ('ESCRITURA_OTORGADA', 'CERRADO', 'RESUELTO');

-- 2. Update seed data states (for demo contracts)
-- Contracts 1-5 (BORRADOR → INICIADO)
-- Contracts 6-10 (BORRADOR_GENERADO → BORRADOR)
-- Contracts 11-16 (FIRMADO stays FIRMADO)
-- Contracts 17-18 (CONVOCATORIA_NOTARIAL → NOTARIA)
-- Contracts 19-20 (ESCRITURA_OTORGADA/CERRADO → TERMINADO)

COMMIT;

-- Verify migration
SELECT estado, COUNT(*) as cantidad 
FROM contratos_arras 
GROUP BY estado 
ORDER BY cantidad DESC;
