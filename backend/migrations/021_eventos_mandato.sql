-- ============================================
-- Migración: Añadir mandato a eventos
-- ============================================
-- Objetivo: Capturar *quién actúa* y *en nombre de quién* para trazabilidad
-- probatoria completa en el Certificado de Eventos.
--
-- NOTA: Columnas NULLABLE para no romper eventos históricos.

-- Añadir columnas de mandato a eventos
ALTER TABLE eventos
ADD COLUMN IF NOT EXISTS actor_mandato_id UUID NULL,
ADD COLUMN IF NOT EXISTS actor_mandato_tipo TEXT NULL;

-- Constraint de FK (con ON DELETE SET NULL para preservar eventos si se borra mandato)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_evento_mandato'
    ) THEN
        ALTER TABLE eventos
        ADD CONSTRAINT fk_evento_mandato
        FOREIGN KEY (actor_mandato_id)
        REFERENCES mandatos_expediente(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Índice para queries por mandato
CREATE INDEX IF NOT EXISTS idx_eventos_actor_mandato
ON eventos(actor_mandato_id);

-- Comentarios para documentación
COMMENT ON COLUMN eventos.actor_mandato_id IS 'ID del mandato bajo el cual actuó el usuario (si aplica)';
COMMENT ON COLUMN eventos.actor_mandato_tipo IS 'Tipo de mandato denormalizado para lectura probatoria sin joins';

-- ============================================
-- Actualizar vista de eventos (si existe)
-- ============================================
-- Si tienes una vista consolidada de eventos, actualizarla para incluir mandato

-- CREATE OR REPLACE VIEW eventos_con_contexto AS
-- SELECT 
--     e.*,
--     u.email as actor_email,
--     u.nombre_completo as actor_nombre,
--     COALESCE(e.actor_mandato_tipo, 
--         CASE e.actor_tipo 
--             WHEN 'SISTEMA' THEN 'SISTEMA'
--             ELSE NULL 
--         END
--     ) as mandato_display
-- FROM eventos e
-- LEFT JOIN usuarios u ON e.actor_usuario_id = u.id;
