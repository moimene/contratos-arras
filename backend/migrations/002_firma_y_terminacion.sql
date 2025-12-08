-- ================================================
-- MIGRATION 002: Firma y Terminación (MINIMAL)
-- ================================================
-- Versión simplificada sin índices complejos

BEGIN;

-- ================================================
-- 1. ACTUALIZAR ESTADOS PERMITIDOS
-- ================================================

ALTER TABLE contratos_arras DROP CONSTRAINT IF EXISTS contratos_arras_estado_check;

ALTER TABLE contratos_arras ADD CONSTRAINT contratos_arras_estado_check CHECK (estado IN (
    'BORRADOR', 'EN_NEGOCIACION', 'TERMINOS_ESENCIALES_ACEPTADOS', 'BORRADOR_GENERADO', 
    'FIRMADO', 'CERRADO', 'DECLARADO_PAGO', 'ARRAS_ACREDITADAS', 'INTERIM', 
    'CONVOCATORIA_ESCRITURA', 'ESCRITURA_OTORGADA', 'RESUELTO',
    'EN_FIRMA', 'CONVOCATORIA_NOTARIAL', 'NO_COMPARECENCIA'
));

-- ================================================
-- 2. NUEVAS TABLAS (SIN ÍNDICES COMPLEJOS)
-- ================================================

CREATE TABLE IF NOT EXISTS firmas_electronicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
  parte_id UUID NOT NULL REFERENCES partes(id),
  version_hash VARCHAR(64) NOT NULL,
  documento_hash VARCHAR(64) NOT NULL,
  timestamp_utc TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  tst_token TEXT,
  tst_fecha TIMESTAMP,
  tst_proveedor VARCHAR(50),
  valida BOOLEAN DEFAULT TRUE,
  motivo_invalidacion TEXT,
  invalidada_en TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documentos_firmados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
  archivo_id UUID REFERENCES archivos(id),
  hash_pdf VARCHAR(64) NOT NULL,
  tipo_firma VARCHAR(20) NOT NULL,
  fecha_firma TIMESTAMP NOT NULL,
  firmantes JSONB,
  tst_token TEXT,
  tst_fecha TIMESTAMP,
  tst_proveedor VARCHAR(50),
  verificado BOOLEAN DEFAULT FALSE,
  verificado_por UUID REFERENCES partes(id),
  verificado_en TIMESTAMP,
  notas_verificacion TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS citas_notariales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
  notaria_nombre VARCHAR(255) NOT NULL,
  notaria_direccion TEXT NOT NULL,
  notaria_telefono VARCHAR(50),
  fecha_hora_propuesta TIMESTAMP NOT NULL,
  fecha_hora_confirmada TIMESTAMP,
  estado VARCHAR(20) NOT NULL DEFAULT 'PROPUESTA',
  mensaje_convocatoria TEXT,
  destinatarios JSONB,
  notificacion_enviada BOOLEAN DEFAULT FALSE,
  notificacion_enviada_en TIMESTAMP,
  notas TEXT,
  creado_por UUID REFERENCES partes(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
  cita_notarial_id UUID REFERENCES citas_notariales(id),
  descripcion TEXT NOT NULL,
  categoria VARCHAR(50),
  obligatorio BOOLEAN DEFAULT TRUE,
  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  archivo_id UUID REFERENCES archivos(id),
  hash_archivo VARCHAR(64),
  fecha_subida TIMESTAMP,
  verificado_por UUID REFERENCES partes(id),
  fecha_verificacion TIMESTAMP,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS actas_no_comparecencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
  cita_notarial_id UUID REFERENCES citas_notariales(id),
  parte_compareciente_id UUID REFERENCES partes(id),
  parte_no_compareciente_id UUID NOT NULL REFERENCES partes(id),
  fecha_hora_cita TIMESTAMP NOT NULL,
  notaria VARCHAR(255),
  resumen_hechos TEXT NOT NULL,
  consecuencias_declaradas TEXT,
  archivo_acta_id UUID REFERENCES archivos(id),
  hash_acta VARCHAR(64),
  tst_token TEXT,
  tst_fecha TIMESTAMP,
  tst_proveedor VARCHAR(50),
  notificacion_enviada BOOLEAN DEFAULT FALSE,
  notificacion_enviada_en TIMESTAMP,
  notificacion_hash VARCHAR(64),
  notificacion_tst TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alegaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acta_id UUID NOT NULL REFERENCES actas_no_comparecencia(id) ON DELETE CASCADE,
  parte_id UUID NOT NULL REFERENCES partes(id),
  tipo_respuesta VARCHAR(20) NOT NULL,
  texto_alegaciones TEXT,
  fecha_hora_respuesta TIMESTAMP NOT NULL DEFAULT NOW(),
  dentro_de_plazo BOOLEAN NOT NULL,
  ventana_cierre TIMESTAMP NOT NULL,
  hash_respuesta VARCHAR(64),
  tst_token TEXT,
  tst_fecha TIMESTAMP,
  tst_proveedor VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certificados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL,
  numero_expediente VARCHAR(50),
  fecha_emision TIMESTAMP NOT NULL DEFAULT NOW(),
  eventos_incluidos JSONB NOT NULL,
  narrativa_html TEXT,
  detalle_tecnico_html TEXT,
  archivo_pdf_id UUID REFERENCES archivos(id),
  hash_certificado VARCHAR(64),
  tst_token TEXT,
  tst_fecha TIMESTAMP,
  tst_proveedor VARCHAR(50),
  firma_qtsp TEXT,
  valido BOOLEAN DEFAULT TRUE,
  motivo_invalidacion TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- 3. EXTENSIONES A contratos_arras
-- ================================================

ALTER TABLE contratos_arras
  ADD COLUMN IF NOT EXISTS firmado_plataforma_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS firmado_documento_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS convocatoria_notaria_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS escritura_otorgada_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS acta_no_comparecencia_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS cerrado_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS motivo_cierre VARCHAR(50);

-- ================================================
-- 4. FUNCIONES HELPER
-- ================================================

CREATE OR REPLACE FUNCTION validar_plazo_alegaciones(
  p_fecha_acta TIMESTAMP,
  p_fecha_respuesta TIMESTAMP
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_fecha_respuesta <= (p_fecha_acta + INTERVAL '48 hours');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 5. TRIGGERS
-- ================================================

DROP TRIGGER IF EXISTS update_citas_notariales_updated_at ON citas_notariales;
CREATE TRIGGER update_citas_notariales_updated_at
  BEFORE UPDATE ON citas_notariales
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_checklist_documentos_updated_at ON checklist_documentos;
CREATE TRIGGER update_checklist_documentos_updated_at
  BEFORE UPDATE ON checklist_documentos
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

COMMIT;

-- Verificación
SELECT '✅ Migración 002 completada - 7 nuevas tablas creadas' AS resultado;
