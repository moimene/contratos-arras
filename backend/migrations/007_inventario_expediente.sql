-- ============================================
-- MIGRATION 007: Inventario Dinámico de Documentos
-- ============================================
-- Crea tabla inventario_expediente según Directiva #003

BEGIN;

-- 1. Crear tabla inventario_expediente
CREATE TABLE IF NOT EXISTS inventario_expediente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,

  -- Definición del requisito
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  grupo VARCHAR(50) NOT NULL DEFAULT 'GENERAL' CHECK (grupo IN (
    'INMUEBLE',    -- Bloque A: Nota simple, escritura, IBI, CEE
    'PARTES',      -- Bloque B: DNIs, poderes
    'ARRAS',       -- Bloque C: Contrato, justificantes pago
    'NOTARIA',     -- Bloque D: Minuta, escritura compraventa
    'CIERRE'       -- Bloque E: Actas, certificados
  )),

  -- Rol responsable de aportar el doc
  responsable_rol VARCHAR(50) NOT NULL CHECK (responsable_rol IN (
    'COMPRADOR', 
    'VENDEDOR', 
    'ASESOR_COMPRADOR', 
    'ASESOR_VENDEDOR', 
    'NOTARIO', 
    'PLATAFORMA', 
    'OTRO'
  )),

  -- Metadatos configurables por expediente
  metadatos_extra JSONB DEFAULT '{}'::jsonb,
  obligatorio BOOLEAN DEFAULT true,

  -- Estado del ítem
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN (
    'PENDIENTE',   -- Sin archivo
    'SUBIDO',      -- Archivo subido, pendiente validación
    'VALIDADO',    -- Aprobado
    'RECHAZADO'    -- Rechazado con motivo
  )),

  -- Archivo asociado
  archivo_id UUID REFERENCES archivos(id),
  
  -- Trazabilidad de subida
  subido_por_rol VARCHAR(50),
  subido_por_usuario UUID,
  fecha_subida TIMESTAMPTZ,
  
  -- Trazabilidad de validación
  validado_por_rol VARCHAR(50),
  validado_por_usuario UUID,
  fecha_validacion TIMESTAMPTZ,
  motivo_rechazo TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_inventario_contrato ON inventario_expediente(contrato_id);
CREATE INDEX IF NOT EXISTS idx_inventario_estado ON inventario_expediente(estado);
CREATE INDEX IF NOT EXISTS idx_inventario_responsable ON inventario_expediente(responsable_rol);
CREATE INDEX IF NOT EXISTS idx_inventario_grupo ON inventario_expediente(grupo);

-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_inventario_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_inventario_timestamp ON inventario_expediente;
CREATE TRIGGER trigger_update_inventario_timestamp
  BEFORE UPDATE ON inventario_expediente
  FOR EACH ROW
  EXECUTE FUNCTION update_inventario_timestamp();

COMMIT;

-- Verificar tabla creada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'inventario_expediente'
ORDER BY ordinal_position;
