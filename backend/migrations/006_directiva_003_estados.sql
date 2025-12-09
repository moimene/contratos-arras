-- ============================================
-- MIGRATION 006: Directiva #003 - Estados y Constraint
-- ============================================
-- Consolida estados a 6 valores procesales

BEGIN;

-- 1. Mapeo completo de estados antiguos → nuevos
-- (Cubre todos los micro-estados que pudieran existir)

UPDATE contratos_arras SET estado = 'INICIADO' 
WHERE estado IN ('EN_NEGOCIACION', 'TERMINOS_ESENCIALES_ACEPTADOS', 'BORRADOR_INICIAL', 'BORRADOR');

UPDATE contratos_arras SET estado = 'BORRADOR' 
WHERE estado IN ('BORRADOR_GENERADO');

UPDATE contratos_arras SET estado = 'FIRMADO' 
WHERE estado IN ('DECLARADO_PAGO', 'ARRAS_ACREDITADAS', 'INTERIM', 'EN_FIRMA');

UPDATE contratos_arras SET estado = 'NOTARIA' 
WHERE estado IN ('CONVOCATORIA_ESCRITURA', 'CITA_NOTARIA', 'MINUTA_GENERADA', 'CONVOCATORIA_NOTARIAL');

UPDATE contratos_arras SET estado = 'TERMINADO' 
WHERE estado IN ('ESCRITURA_OTORGADA', 'CERRADO', 'RESUELTO_POR_ACUERDO', 'RESUELTO');

UPDATE contratos_arras SET estado = 'LITIGIO' 
WHERE estado IN ('RESUELTO_POR_INCUMPLIMIENTO', 'RESUELTO_POR_NO_COMPARECENCIA');

-- 2. Eliminar constraint antiguo si existe
ALTER TABLE contratos_arras DROP CONSTRAINT IF EXISTS contratos_arras_estado_check;

-- 3. Añadir constraint fuerte con 6 estados
ALTER TABLE contratos_arras ADD CONSTRAINT contratos_arras_estado_check
CHECK (estado IN (
  'INICIADO',    -- Alta, datos, negociación
  'BORRADOR',    -- Términos cerrados/aceptados, borrador arras
  'FIRMADO',     -- Contrato de arras formalizado
  'NOTARIA',     -- Cita(s) notaría y minuta
  'TERMINADO',   -- Escritura otorgada / acuerdo finalizado
  'LITIGIO'      -- Disputa abierta / no comparecencia
));

COMMIT;

-- Verificar resultado
SELECT estado, COUNT(*) as cantidad 
FROM contratos_arras 
GROUP BY estado 
ORDER BY cantidad DESC;
