-- ============================================
-- MIGRATION 010: Actualizar tabla archivos
-- ============================================
-- Actualiza la tabla archivos para soportar el nuevo sistema de upload

BEGIN;

-- Verificar si la tabla existe y tiene el esquema antiguo
DO $$ 
BEGIN
    -- Añadir columnas nuevas si no existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'archivos' AND column_name = 'nombre_original') THEN
        ALTER TABLE archivos ADD COLUMN nombre_original TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'archivos' AND column_name = 'nombre_almacenado') THEN
        ALTER TABLE archivos ADD COLUMN nombre_almacenado TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'archivos' AND column_name = 'tipo_mime') THEN
        ALTER TABLE archivos ADD COLUMN tipo_mime TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'archivos' AND column_name = 'ruta_local') THEN
        ALTER TABLE archivos ADD COLUMN ruta_local TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'archivos' AND column_name = 'tipo_documento') THEN
        ALTER TABLE archivos ADD COLUMN tipo_documento TEXT DEFAULT 'OTRO';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'archivos' AND column_name = 'subido_por_rol') THEN
        ALTER TABLE archivos ADD COLUMN subido_por_rol TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'archivos' AND column_name = 'subido_por_usuario') THEN
        ALTER TABLE archivos ADD COLUMN subido_por_usuario UUID;
    END IF;
END $$;

-- Renombrar columnas antiguas para compatibilidad (solo si existen y destino no existe)
DO $$
BEGIN
    -- Renombrar nombre_archivo -> nombre_original
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'archivos' AND column_name = 'nombre_archivo')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'archivos' AND column_name = 'nombre_original') THEN
        ALTER TABLE archivos RENAME COLUMN nombre_archivo TO nombre_original;
    END IF;

    -- Renombrar ruta_storage -> ruta_local
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'archivos' AND column_name = 'ruta_storage')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'archivos' AND column_name = 'ruta_local') THEN
        ALTER TABLE archivos RENAME COLUMN ruta_storage TO ruta_local;
    END IF;

    -- Renombrar mime_type -> tipo_mime
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'archivos' AND column_name = 'mime_type')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'archivos' AND column_name = 'tipo_mime') THEN
        ALTER TABLE archivos RENAME COLUMN mime_type TO tipo_mime;
    END IF;

    -- Renombrar tipo -> tipo_documento
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'archivos' AND column_name = 'tipo')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'archivos' AND column_name = 'tipo_documento') THEN
        ALTER TABLE archivos RENAME COLUMN tipo TO tipo_documento;
    END IF;
END $$;

COMMIT;

-- Verificar columnas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'archivos';
