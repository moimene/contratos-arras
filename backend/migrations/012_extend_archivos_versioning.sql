-- ============================================
-- MIGRATION 012: Extensión de archivos para versionado y hash
-- ============================================
-- Añade soporte para versionado de documentos, hash SHA-256, 
-- sellos QTSP y categorías adicionales de inventario

BEGIN;

-- ============================================
-- 1. EXTENDER TABLA ARCHIVOS
-- ============================================

-- Añadir campos para versionado y trazabilidad
DO $$
BEGIN
    -- Hash SHA-256 del contenido del archivo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'archivos' AND column_name = 'hash_sha256') THEN
        ALTER TABLE archivos ADD COLUMN hash_sha256 VARCHAR(64);
    END IF;

    -- Número de versión del documento
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'archivos' AND column_name = 'version') THEN
        ALTER TABLE archivos ADD COLUMN version INTEGER DEFAULT 1;
    END IF;

    -- FK al archivo que lo reemplaza (para historial)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'archivos' AND column_name = 'reemplazado_por') THEN
        ALTER TABLE archivos ADD COLUMN reemplazado_por UUID REFERENCES archivos(id);
    END IF;

    -- FK al archivo original (para navegación inversa)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'archivos' AND column_name = 'version_original_id') THEN
        ALTER TABLE archivos ADD COLUMN version_original_id UUID REFERENCES archivos(id);
    END IF;

    -- FK al sello de tiempo QTSP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'archivos' AND column_name = 'sello_qtsp_id') THEN
        ALTER TABLE archivos ADD COLUMN sello_qtsp_id UUID REFERENCES sellos_tiempo(id);
    END IF;

    -- Indicador de versión vigente
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'archivos' AND column_name = 'es_vigente') THEN
        ALTER TABLE archivos ADD COLUMN es_vigente BOOLEAN DEFAULT true;
    END IF;

    -- Categoría funcional del documento
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'archivos' AND column_name = 'categoria') THEN
        ALTER TABLE archivos ADD COLUMN categoria VARCHAR(50) DEFAULT 'OTRO';
    END IF;

    -- Descripción/título del documento
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'archivos' AND column_name = 'titulo') THEN
        ALTER TABLE archivos ADD COLUMN titulo VARCHAR(200);
    END IF;

    -- Notas adicionales
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'archivos' AND column_name = 'notas') THEN
        ALTER TABLE archivos ADD COLUMN notas TEXT;
    END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_archivos_hash ON archivos(hash_sha256);
CREATE INDEX IF NOT EXISTS idx_archivos_version ON archivos(version_original_id, version);
CREATE INDEX IF NOT EXISTS idx_archivos_vigente ON archivos(es_vigente);
CREATE INDEX IF NOT EXISTS idx_archivos_categoria ON archivos(categoria);

-- ============================================
-- 2. EXTENDER INVENTARIO CON CATEGORÍAS ADICIONALES
-- ============================================

-- Primero recrear el constraint de grupo para incluir nuevas categorías
DO $$
BEGIN
    -- Eliminar constraint existente si existe
    IF EXISTS (SELECT 1 FROM information_schema.constraint_column_usage 
               WHERE table_name = 'inventario_expediente' AND column_name = 'grupo') THEN
        ALTER TABLE inventario_expediente DROP CONSTRAINT IF EXISTS inventario_expediente_grupo_check;
    END IF;
    
    -- Añadir nuevo constraint con categorías adicionales
    ALTER TABLE inventario_expediente ADD CONSTRAINT inventario_expediente_grupo_check
        CHECK (grupo IN (
            'INMUEBLE',       -- Bloque A: Nota simple, escritura, IBI, CEE
            'PARTES',         -- Bloque B: DNIs, poderes
            'ARRAS',          -- Bloque C: Contrato, justificantes pago
            'NOTARIA',        -- Bloque D: Minuta, escritura compraventa
            'CIERRE',         -- Bloque E: Actas, certificados
            'URBANISTICO',    -- Documentos urbanísticos
            'ADMINISTRATIVO', -- Documentos administrativos
            'LEGAL',          -- Documentos legales adicionales
            'TECNICO',        -- Informes técnicos
            'FISCAL',         -- Documentos fiscales
            'ADICIONAL',      -- Otros documentos ad-hoc
            'GENERAL'         -- Genérico
        ));
END $$;

-- Añadir campo para marcar ítems como críticos para transición
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventario_expediente' AND column_name = 'es_critico') THEN
        ALTER TABLE inventario_expediente ADD COLUMN es_critico BOOLEAN DEFAULT false;
    END IF;

    -- Campo para subtipo específico (ej: LICENCIA_OBRAS dentro de URBANISTICO)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventario_expediente' AND column_name = 'subtipo') THEN
        ALTER TABLE inventario_expediente ADD COLUMN subtipo VARCHAR(100);
    END IF;

    -- Campo para indicar quién creó el ítem ad-hoc
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventario_expediente' AND column_name = 'creado_por_rol') THEN
        ALTER TABLE inventario_expediente ADD COLUMN creado_por_rol VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inventario_expediente' AND column_name = 'creado_por_usuario') THEN
        ALTER TABLE inventario_expediente ADD COLUMN creado_por_usuario UUID;
    END IF;
END $$;

COMMIT;

-- ============================================
-- 3. VERIFICACIÓN
-- ============================================

SELECT '=== Columnas de archivos ===' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'archivos'
ORDER BY ordinal_position;

SELECT '=== Columnas de inventario_expediente ===' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'inventario_expediente'
ORDER BY ordinal_position;
