-- Agregar campo tipo a la tabla notificaciones
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS destinatario_parte_id UUID REFERENCES partes(id);

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_notificaciones_destinatario ON notificaciones(destinatario_parte_id);
