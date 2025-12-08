-- =====================================================
-- MIGRACIÓN: Evolución a Plataforma LegalOps
-- Fecha: 2025-12-08
-- Descripción: Extiende esquema existente sin romper datos
--              Añade ciclo de vida completo con 12 estados
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ACTUALIZAR ESTADOS PERMITIDOS EN contratos_arras
-- =====================================================

-- Primero, eliminar el constraint existente
ALTER TABLE contratos_arras DROP CONSTRAINT IF EXISTS contratos_arras_estado_check;

-- Crear nuevo constraint con los 12 estados del ciclo de vida
ALTER TABLE contratos_arras ADD CONSTRAINT contratos_arras_estado_check CHECK (estado IN (
    -- Estados originales (mantener compatibilidad)
    'BORRADOR',
    'EN_NEGOCIACION',
    'TERMINOS_ESENCIALES_ACEPTADOS',
    'BORRADOR_GENERADO',
    'FIRMADO',
    'CERRADO',
    -- Nuevos estados del ciclo de vida
    'DECLARADO_PAGO',
    'ARRAS_ACREDITADAS',
    'INTERIM',
    'CONVOCATORIA_ESCRITURA',
    'ESCRITURA_OTORGADA',
    'RESUELTO'
));

-- =====================================================
-- 2. AÑADIR COLUMNAS DE SOPORTE AL CICLO DE VIDA
-- =====================================================

-- Persistencia del wizard completo (estrategia JSONB)
ALTER TABLE contratos_arras
    ADD COLUMN IF NOT EXISTS datos_wizard JSONB;

-- Paths de documentos críticos
ALTER TABLE contratos_arras
    ADD COLUMN IF NOT EXISTS borrador_pdf_path TEXT,
    ADD COLUMN IF NOT EXISTS contrato_firmado_path TEXT,
    ADD COLUMN IF NOT EXISTS escritura_path TEXT,
    ADD COLUMN IF NOT EXISTS acta_incidencia_path TEXT;

-- Timestamps de fases del ciclo de vida
ALTER TABLE contratos_arras
    ADD COLUMN IF NOT EXISTS firmado_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS interim_inicio_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS convocatoria_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cerrado_at TIMESTAMPTZ;

-- Gestión de links compartibles
ALTER TABLE contratos_arras
    ADD COLUMN IF NOT EXISTS link_compartible UUID UNIQUE DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS link_expira_at TIMESTAMPTZ;

-- Modo ICADE (preservar funcionalidad existente)
ALTER TABLE contratos_arras
    ADD COLUMN IF NOT EXISTS modo_estandar_icade BOOLEAN DEFAULT FALSE;

-- Número de expediente único
ALTER TABLE contratos_arras
    ADD COLUMN IF NOT EXISTS numero_expediente TEXT UNIQUE;

-- Crear índice para numero_expediente
CREATE INDEX IF NOT EXISTS idx_contratos_numero_expediente ON contratos_arras(numero_expediente);

-- =====================================================
-- 3. EXTENDER TABLA partes CON LINKS DE ACCESO
-- =====================================================

-- Link de acceso único para dashboard sin registro
ALTER TABLE partes
    ADD COLUMN IF NOT EXISTS link_acceso UUID UNIQUE DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS ultimo_acceso_at TIMESTAMPTZ;

-- Índice para búsquedas rápidas por link
CREATE INDEX IF NOT EXISTS idx_partes_link_acceso ON partes(link_acceso);

-- =====================================================
-- 4. ACTUALIZAR TABLA eventos PARA BLOCKCHAIN-LIKE
-- =====================================================

-- Añadir prev_hash si no existe (ya existe prev_hash_sha256)
-- La tabla eventos ya tiene la columna prev_hash_sha256, no es necesario añadirla

-- Añadir actor_tipo si no existe
ALTER TABLE eventos
    ADD COLUMN IF NOT EXISTS actor_tipo TEXT CHECK (actor_tipo IN ('SISTEMA', 'VENDEDOR', 'COMPRADOR', 'NOTARIO', 'ADMIN'));

-- Índice para created_at (para ordenación rápida)
CREATE INDEX IF NOT EXISTS idx_eventos_created ON eventos(fecha_hora);

-- =====================================================
-- 5. CREAR TABLA DE CHAT CERTIFICABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS mensajes_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
    
    -- Emisor
    emisor_parte_id UUID REFERENCES partes(id), -- NULL si es SISTEMA
    es_sistema BOOLEAN DEFAULT FALSE,
    
    -- Contenido
    mensaje TEXT NOT NULL,
    adjuntos JSONB, -- [{ filename, path, mime_type }]
    
    -- Relevancia Legal ⚡ FEATURE KILLER
    es_relevante_probatoriamente BOOLEAN DEFAULT FALSE,
    motivo_relevancia TEXT, -- "Acuerdo precio final", "Declaración conformidad", etc.
    
    -- Vinculación a Eventos
    evento_id UUID REFERENCES eventos(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_contrato ON mensajes_chat(contrato_id);
CREATE INDEX IF NOT EXISTS idx_chat_relevante ON mensajes_chat(es_relevante_probatoriamente) 
    WHERE es_relevante_probatoriamente = TRUE;

-- =====================================================
-- 6. RENOMBRAR/EXTENDER TABLA archivos → documentos
-- =====================================================
-- La tabla archivos ya existe, vamos a extenderla

-- Añadir nuevos tipos de documentos
ALTER TABLE archivos DROP CONSTRAINT IF EXISTS archivos_tipo_check;
ALTER TABLE archivos ADD CONSTRAINT archivos_tipo_check CHECK (tipo IN (
    'JUSTIFICANTE_ARRAS',
    'ACTA_NO_COMPARECENCIA',
    'OTRO',
    -- Nuevos tipos
    'JUSTIFICANTE_PAGO',
    'NOTA_SIMPLE',
    'CERTIFICADO_ENERGETICO',
    'TASACION',
    'ESCRITURA',
    'ACTA_INCIDENCIA',
    'BORRADOR_PDF'
));

-- Añadir columnas de validación
ALTER TABLE archivos
    ADD COLUMN IF NOT EXISTS validado BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS validado_por_parte_id UUID REFERENCES partes(id),
    ADD COLUMN IF NOT EXISTS notas_validacion TEXT;

-- =====================================================
-- 7. CREAR VISTAS ÚTILES PARA DASHBOARD
-- =====================================================

-- Vista: Resumen del estado de cada contrato
CREATE OR REPLACE VIEW vista_contratos_resumen AS
SELECT 
    c.id,
    c.numero_expediente,
    c.estado,
    c.precio_total,
    c.importe_arras,
    c.fecha_limite_firma_escritura,
    c.modo_estandar_icade,
    c.created_at,
    c.firmado_at,
    c.arras_acreditadas_at,
    i.direccion_completa AS inmueble_direccion,
    i.ciudad AS inmueble_ciudad,
    i.provincia AS inmueble_provincia,
    COUNT(DISTINCT cp_v.parte_id) AS num_vendedores,
    COUNT(DISTINCT cp_c.parte_id) AS num_compradores,
    COUNT(DISTINCT e.id) AS num_eventos,
    COUNT(DISTINCT m.id) AS num_mensajes
FROM contratos_arras c
LEFT JOIN inmuebles i ON c.inmueble_id = i.id
LEFT JOIN contratos_partes cp_v ON c.id = cp_v.contrato_id AND cp_v.rol_en_contrato LIKE '%VENDEDOR%'
LEFT JOIN contratos_partes cp_c ON c.id = cp_c.contrato_id AND cp_c.rol_en_contrato LIKE '%COMPRADOR%'
LEFT JOIN eventos e ON c.id = e.contrato_id
LEFT JOIN mensajes_chat m ON c.id = m.contrato_id
GROUP BY c.id, i.direccion_completa, i.ciudad, i.provincia;

-- =====================================================
-- 8. FUNCIÓN DE AYUDA: Generar número de expediente
-- =====================================================

CREATE OR REPLACE FUNCTION generar_numero_expediente()
RETURNS TEXT AS $$
DECLARE
    year TEXT;
    secuencia INTEGER;
    numero TEXT;
BEGIN
    year := TO_CHAR(NOW(), 'YYYY');
    
    -- Obtener el siguiente número de secuencia para este año
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(numero_expediente FROM 'CFA-' || year || '-([0-9]+)')
            AS INTEGER
        )
    ), 0) + 1
    INTO secuencia
    FROM contratos_arras
    WHERE numero_expediente LIKE 'CFA-' || year || '-%';
    
    -- Formatear con padding de 6 dígitos
    numero := 'CFA-' || year || '-' || LPAD(secuencia::TEXT, 6, '0');
    
    RETURN numero;
END;
$$ LANGUAGE plpgsql;

-- Generar números de expediente para contratos sin número usando CTE
WITH numbered_contracts AS (
    SELECT 
        id,
        'CFA-2025-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 6, '0') AS nuevo_numero
    FROM contratos_arras
    WHERE numero_expediente IS NULL
)
UPDATE contratos_arras c
SET numero_expediente = nc.nuevo_numero
FROM numbered_contracts nc
WHERE c.id = nc.id;

-- Marcar contratos existentes como NO modo ICADE por defecto
UPDATE contratos_arras
SET modo_estandar_icade = FALSE
WHERE modo_estandar_icade IS NULL;

-- =====================================================
-- 10. COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON COLUMN contratos_arras.datos_wizard IS 'JSON completo del estado del Wizard (preserva ContractContext)';
COMMENT ON COLUMN contratos_arras.numero_expediente IS 'Identificador único legible: CFA-YYYY-NNNNNN';
COMMENT ON COLUMN contratos_arras.link_compartible IS 'UUID para compartir expediente sin autenticación';
COMMENT ON TABLE mensajes_chat IS 'Chat certificable con relevancia probatoria para evidencias';
COMMENT ON COLUMN mensajes_chat.es_relevante_probatoriamente IS 'Marca mensajes con valor legal (acuerdos, declaraciones)';

COMMIT;

-- =====================================================
-- ✅ VERIFICACIÓN POST-MIGRACIÓN
-- =====================================================
-- Ejecutar estas queries tras aplicar la migración:

-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'contratos_arras' 
-- ORDER BY ordinal_position;

-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name LIKE '%chat%';
