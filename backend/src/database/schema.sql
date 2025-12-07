-- =====================================================
-- ESQUEMA POSTGRESQL PARA SUPABASE
-- Sistema de Gestión de Contratos de Arras
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: inmuebles
-- =====================================================
CREATE TABLE IF NOT EXISTS inmuebles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direccion_completa TEXT NOT NULL,
  codigo_postal VARCHAR(10),
  ciudad VARCHAR(100) NOT NULL,
  provincia VARCHAR(100) NOT NULL,
  identificador_catastral VARCHAR(50),
  referencia_catastral VARCHAR(50),
  datos_registrales TEXT,
  titulo_adquisicion_vendedor TEXT,
  nota_simple_csv TEXT,
  nota_simple_fecha DATE,
  url_anuncio TEXT,
  datos_descripcion TEXT,
  m2 DECIMAL(10,2),
  habitaciones INTEGER,
  banos INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: partes
-- =====================================================
CREATE TABLE IF NOT EXISTS partes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('COMPRADOR','VENDEDOR','INTERMEDIARIO','OTRO')),
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(200) NOT NULL,
  estado_civil VARCHAR(50),
  tipo_documento VARCHAR(20) NOT NULL,
  numero_documento VARCHAR(50) NOT NULL,
  email VARCHAR(200) NOT NULL,
  telefono VARCHAR(20),
  domicilio TEXT,
  es_representante BOOLEAN NOT NULL DEFAULT FALSE,
  representa_a UUID REFERENCES partes(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: contratos_arras
-- =====================================================
CREATE TABLE IF NOT EXISTS contratos_arras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inmueble_id UUID NOT NULL REFERENCES inmuebles(id),
  estado VARCHAR(50) NOT NULL CHECK (estado IN (
    'BORRADOR','EN_NEGOCIACION','TERMINOS_ESENCIALES_ACEPTADOS',
    'BORRADOR_GENERADO','FIRMADO','CERRADO'
  )),
  tipo_arras VARCHAR(20) NOT NULL CHECK (tipo_arras IN ('CONFIRMATORIAS','PENITENCIALES','PENALES','OTRO')),
  precio_total DECIMAL(15,2) NOT NULL,
  importe_arras DECIMAL(15,2) NOT NULL,
  porcentaje_arras_calculado DECIMAL(5,2) NOT NULL,
  moneda VARCHAR(3) NOT NULL DEFAULT 'EUR',
  fecha_limite_firma_escritura TIMESTAMPTZ NOT NULL,
  
  -- Portada: forma y calendario de pago
  forma_pago_arras VARCHAR(20) NOT NULL CHECK (forma_pago_arras IN ('AL_FIRMAR','POSTERIOR')),
  plazo_pago_arras_dias INTEGER,
  fecha_limite_pago_arras TIMESTAMPTZ,
  iban_vendedor VARCHAR(34),
  banco_vendedor VARCHAR(100),
  
  -- Notario y términos
  notario_designado_nombre VARCHAR(200),
  notario_designado_direccion TEXT,
  gastos_quien VARCHAR(20) CHECK (gastos_quien IN ('LEY','COMPRADOR')) DEFAULT 'LEY',
  via_resolucion VARCHAR(30) CHECK (via_resolucion IN ('JUZGADOS','ARBITRAJE_NOTARIAL')) DEFAULT 'JUZGADOS',
  firma_preferida VARCHAR(20) CHECK (firma_preferida IN ('ELECTRONICA','MANUSCRITA')) DEFAULT 'ELECTRONICA',
  
  -- Textos adicionales
  condicion_suspensiva_texto TEXT,
  observaciones TEXT,
  cambios_terminos_estandar TEXT,
  
  -- Control de versión
  version_hash VARCHAR(64) NOT NULL,
  version_numero INTEGER NOT NULL DEFAULT 1,
  identificador_unico UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- Pagos y cierre
  arras_acreditadas_at TIMESTAMPTZ,
  motivo_cierre VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: contratos_partes (relación)
-- =====================================================
CREATE TABLE IF NOT EXISTS contratos_partes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
  parte_id UUID NOT NULL REFERENCES partes(id),
  rol_en_contrato VARCHAR(50) NOT NULL,
  obligado_aceptar BOOLEAN NOT NULL DEFAULT TRUE,
  obligado_firmar BOOLEAN NOT NULL DEFAULT TRUE,
  porcentaje_propiedad DECIMAL(5,2),
  UNIQUE(contrato_id, parte_id)
);

-- =====================================================
-- TABLA: aceptaciones_terminos_esenciales
-- =====================================================
CREATE TABLE IF NOT EXISTS aceptaciones_terminos_esenciales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
  parte_id UUID NOT NULL REFERENCES partes(id),
  version_contrato VARCHAR(64) NOT NULL,
  fecha_hora_aceptacion TIMESTAMPTZ NOT NULL,
  direccion_ip VARCHAR(45) NOT NULL,
  user_agent TEXT,
  valida BOOLEAN NOT NULL DEFAULT TRUE
);

-- =====================================================
-- TABLA: firmas_contrato
-- =====================================================
CREATE TABLE IF NOT EXISTS firmas_contrato (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
  parte_id UUID NOT NULL REFERENCES partes(id),
  version_contrato VARCHAR(64) NOT NULL,
  fecha_hora_firma TIMESTAMPTZ NOT NULL,
  direccion_ip VARCHAR(45) NOT NULL,
  user_agent TEXT,
  valida BOOLEAN NOT NULL DEFAULT TRUE
);

-- =====================================================
-- TABLA: archivos
-- =====================================================
CREATE TABLE IF NOT EXISTS archivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
  parte_id UUID REFERENCES partes(id),
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('JUSTIFICANTE_ARRAS','ACTA_NO_COMPARECENCIA','OTRO')),
  nombre_original TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  ruta TEXT NOT NULL,
  tamano INTEGER NOT NULL,
  fecha_hora_subida TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: pagos
-- =====================================================
CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
  emisor_parte_id UUID NOT NULL REFERENCES partes(id),
  receptor_parte_id UUID NOT NULL REFERENCES partes(id),
  importe DECIMAL(15,2) NOT NULL,
  moneda VARCHAR(3) NOT NULL DEFAULT 'EUR',
  metodo VARCHAR(30) NOT NULL CHECK (metodo IN ('TRANSFERENCIA','DEPOSITO_NOTARIA')),
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('DECLARADO','ACREDITADO','RECHAZADO')) DEFAULT 'DECLARADO',
  fecha_declarada TIMESTAMPTZ NOT NULL,
  fecha_acreditada TIMESTAMPTZ,
  archivo_id UUID REFERENCES archivos(id)
);

-- =====================================================
-- TABLA: sellos_tiempo
-- =====================================================
CREATE TABLE IF NOT EXISTS sellos_tiempo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor VARCHAR(50) NOT NULL,
  marca VARCHAR(50) NOT NULL,
  hash_sha256 VARCHAR(64) NOT NULL,
  rfc3161_tst_base64 TEXT,
  fecha_sello TIMESTAMPTZ NOT NULL,
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('EMITIDO','ERROR')) DEFAULT 'EMITIDO',
  metadata_json JSONB
);

-- =====================================================
-- TABLA: eventos
-- =====================================================
CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  actor_parte_id UUID REFERENCES partes(id),
  payload_json JSONB NOT NULL,
  hash_sha256 VARCHAR(64) NOT NULL,
  prev_hash_sha256 VARCHAR(64),
  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sello_id UUID REFERENCES sellos_tiempo(id)
);

-- =====================================================
-- TABLA: actas_no_comparecencia
-- =====================================================
CREATE TABLE IF NOT EXISTS actas_no_comparecencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
  compareciente_parte_id UUID NOT NULL REFERENCES partes(id),
  incompareciente_parte_id UUID NOT NULL REFERENCES partes(id),
  fecha_hora_cita TIMESTAMPTZ NOT NULL,
  notaria_nombre VARCHAR(200) NOT NULL,
  notaria_direccion TEXT NOT NULL,
  resumen_hechos TEXT,
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('BORRADOR','GENERADA')) DEFAULT 'BORRADOR',
  archivo_id UUID REFERENCES archivos(id),
  respuesta_tipo VARCHAR(20) CHECK (respuesta_tipo IN ('CONFORMIDAD','SOMETIMIENTO','ALEGACIONES')),
  respuesta_texto TEXT,
  fecha_hora_respuesta TIMESTAMPTZ,
  respuesta_valida BOOLEAN NOT NULL DEFAULT FALSE,
  ventana_cierre_iso TIMESTAMPTZ,
  fecha_hora_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: certificados
-- =====================================================
CREATE TABLE IF NOT EXISTS certificados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('HISTORICO','FINAL')),
  contenido_html TEXT NOT NULL,
  eventos_incluidos_json JSONB NOT NULL,
  fecha_hora_generacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sello_id UUID REFERENCES sellos_tiempo(id),
  pdf_archivo_id UUID REFERENCES archivos(id)
);

-- =====================================================
-- TABLA: notificaciones
-- =====================================================
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
  emisor_parte_id UUID NOT NULL REFERENCES partes(id),
  asunto VARCHAR(200) NOT NULL,
  mensaje TEXT NOT NULL,
  fecha_hora_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLA: citas_notaria
-- =====================================================
CREATE TABLE IF NOT EXISTS citas_notaria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
  nombre_notaria VARCHAR(200) NOT NULL,
  direccion_notaria TEXT NOT NULL,
  fecha_hora_propuesta TIMESTAMPTZ NOT NULL,
  notas TEXT,
  lista_documentacion_texto TEXT,
  fecha_hora_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inmuebles_updated_at
  BEFORE UPDATE ON inmuebles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partes_updated_at
  BEFORE UPDATE ON partes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contratos_arras_updated_at
  BEFORE UPDATE ON contratos_arras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================
CREATE INDEX idx_contratos_estado ON contratos_arras(estado);
CREATE INDEX idx_contratos_inmueble ON contratos_arras(inmueble_id);
CREATE INDEX idx_contratos_partes_contrato ON contratos_partes(contrato_id);
CREATE INDEX idx_eventos_contrato ON eventos(contrato_id);
CREATE INDEX idx_eventos_tipo ON eventos(tipo);
CREATE INDEX idx_pagos_contrato ON pagos(contrato_id);
CREATE INDEX idx_actas_contrato ON actas_no_comparecencia(contrato_id);

-- =====================================================
-- CONFIGURACIÓN DE STORAGE BUCKETS
-- (Ejecutar en Supabase Dashboard → Storage)
-- =====================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES 
--   ('contratos-pdf', 'contratos-pdf', false),
--   ('justificantes', 'justificantes', false),
--   ('actas', 'actas', false);

-- =====================================================
-- POLÍTICAS RLS BÁSICAS (OPCIONAL - configurar según necesidad)
-- =====================================================
-- ALTER TABLE contratos_arras ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inmuebles ENABLE ROW LEVEL SECURITY;
-- etc.

COMMENT ON SCHEMA public IS 'Schema principal para sistema de contratos de arras';
