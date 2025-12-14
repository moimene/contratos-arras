-- =====================================================
-- Migration 020: Roles, Mandatos e Invitaciones
-- =====================================================
-- Implements the new membership and authorization model:
-- - miembros_expediente: user ↔ contract link with system role
-- - mandatos_expediente: delegation context (who they act on behalf of)
-- - invitaciones_expediente: invitation flow with token
-- =====================================================

-- =====================================================
-- 1. TABLA: miembros_expediente
-- Vínculo entre usuario y expediente con rol de sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS miembros_expediente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuario (puede ser NULL si aún no ha aceptado invitación)
  usuario_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  
  -- Expediente al que pertenece
  contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
  
  -- Rol de sistema del usuario
  tipo_rol_usuario TEXT NOT NULL CHECK (tipo_rol_usuario IN (
    'ADMIN',
    'COMPRADOR',
    'VENDEDOR',
    'TERCERO',
    'NOTARIO',
    'OBSERVADOR'
  )),
  
  -- Estado del acceso
  estado_acceso TEXT NOT NULL DEFAULT 'PENDIENTE_INVITACION' CHECK (estado_acceso IN (
    'PENDIENTE_INVITACION',  -- Invitado pero no ha aceptado
    'ACTIVO',                -- Acceso activo
    'REVOCADO'               -- Acceso revocado
  )),
  
  -- Auditoría
  creado_por_usuario_id UUID REFERENCES perfiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Un usuario solo puede tener un registro por expediente
  UNIQUE(usuario_id, contrato_id)
);

COMMENT ON TABLE miembros_expediente IS 'Vínculo usuario-expediente con rol de sistema';
COMMENT ON COLUMN miembros_expediente.tipo_rol_usuario IS 'Rol global del usuario (ADMIN, COMPRADOR, etc.)';
COMMENT ON COLUMN miembros_expediente.estado_acceso IS 'Estado del acceso al expediente';

-- =====================================================
-- 2. TABLA: mandatos_expediente
-- Define en nombre de quién actúa un miembro (TERCERO)
-- =====================================================
CREATE TABLE IF NOT EXISTS mandatos_expediente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Miembro al que pertenece este mandato
  miembro_expediente_id UUID NOT NULL REFERENCES miembros_expediente(id) ON DELETE CASCADE,
  
  -- Tipo de mandato (en nombre de quién actúa)
  tipo_mandato TEXT NOT NULL CHECK (tipo_mandato IN (
    'PARTE_COMPRADORA',      -- Actúa en nombre del comprador
    'PARTE_VENDEDORA',       -- Actúa en nombre del vendedor
    'AMBAS_PARTES',          -- Agencia dual
    'NOTARIA',               -- Asistente notarial
    'OBSERVADOR_TECNICO'     -- Observador técnico
  )),
  
  -- Permisos explícitos del mandato
  puede_subir_documentos BOOLEAN NOT NULL DEFAULT false,
  puede_invitar BOOLEAN NOT NULL DEFAULT false,
  puede_validar_documentos BOOLEAN NOT NULL DEFAULT false,
  puede_firmar BOOLEAN NOT NULL DEFAULT false,
  puede_enviar_comunicaciones BOOLEAN NOT NULL DEFAULT true,
  
  -- Estado del mandato
  estado_mandato TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado_mandato IN (
    'ACTIVO',
    'REVOCADO'
  )),
  
  -- Auditoría
  creado_por_usuario_id UUID REFERENCES perfiles(id),
  revocado_por_usuario_id UUID REFERENCES perfiles(id),
  fecha_revocacion TIMESTAMPTZ,
  motivo_revocacion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE mandatos_expediente IS 'Mandato/delegación: en nombre de quién actúa el miembro';
COMMENT ON COLUMN mandatos_expediente.tipo_mandato IS 'PARTE_COMPRADORA = asesor comprador, PARTE_VENDEDORA = asesor vendedor, etc.';

-- =====================================================
-- 3. TABLA: invitaciones_expediente
-- Invitaciones con token para unirse a un expediente
-- =====================================================
CREATE TABLE IF NOT EXISTS invitaciones_expediente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Expediente al que se invita
  contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
  
  -- Email del invitado (puede ser NULL para enlace abierto)
  email_destino TEXT,
  
  -- Rol que tendrá el invitado
  rol_invitado TEXT NOT NULL CHECK (rol_invitado IN (
    'ADMIN',
    'COMPRADOR',
    'VENDEDOR',
    'TERCERO',
    'NOTARIO',
    'OBSERVADOR'
  )),
  
  -- Si es TERCERO, especificar mandato
  tipo_mandato TEXT CHECK (tipo_mandato IS NULL OR tipo_mandato IN (
    'PARTE_COMPRADORA',
    'PARTE_VENDEDORA',
    'AMBAS_PARTES',
    'NOTARIA',
    'OBSERVADOR_TECNICO'
  )),
  
  -- Permisos predefinidos para el mandato (si aplica)
  permisos_mandato JSONB DEFAULT '{}',
  
  -- Token único para aceptar
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  
  -- Validez
  fecha_caducidad TIMESTAMPTZ,
  
  -- Estado del flujo
  estado TEXT NOT NULL DEFAULT 'CREADA' CHECK (estado IN (
    'CREADA',     -- Recién creada
    'ENVIADA',    -- Email enviado
    'VISTA',      -- Link visitado
    'ACEPTADA',   -- Usuario aceptó
    'EXPIRADA',   -- Caducó sin aceptar
    'REVOCADA'    -- Revocada por creador
  )),
  
  -- Mensaje personalizado
  mensaje_opcional TEXT,
  
  -- Auditoría
  creado_por_usuario_id UUID REFERENCES perfiles(id),
  aceptado_por_usuario_id UUID REFERENCES perfiles(id),
  fecha_aceptacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE invitaciones_expediente IS 'Invitaciones para unirse a un expediente';
COMMENT ON COLUMN invitaciones_expediente.token IS 'Token único para aceptar la invitación';

-- =====================================================
-- 4. ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_miembros_contrato 
  ON miembros_expediente(contrato_id);

CREATE INDEX IF NOT EXISTS idx_miembros_usuario 
  ON miembros_expediente(usuario_id);

CREATE INDEX IF NOT EXISTS idx_miembros_estado 
  ON miembros_expediente(estado_acceso);

CREATE INDEX IF NOT EXISTS idx_mandatos_miembro 
  ON mandatos_expediente(miembro_expediente_id);

CREATE INDEX IF NOT EXISTS idx_mandatos_estado 
  ON mandatos_expediente(estado_mandato);

CREATE INDEX IF NOT EXISTS idx_invitaciones_contrato 
  ON invitaciones_expediente(contrato_id);

CREATE INDEX IF NOT EXISTS idx_invitaciones_token 
  ON invitaciones_expediente(token);

CREATE INDEX IF NOT EXISTS idx_invitaciones_estado 
  ON invitaciones_expediente(estado);

CREATE INDEX IF NOT EXISTS idx_invitaciones_email 
  ON invitaciones_expediente(email_destino);

-- =====================================================
-- 5. TRIGGERS para updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_miembros_updated_at
  BEFORE UPDATE ON miembros_expediente
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mandatos_updated_at
  BEFORE UPDATE ON mandatos_expediente
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitaciones_updated_at
  BEFORE UPDATE ON invitaciones_expediente
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. VISTA: miembros_con_mandatos
-- Vista útil para queries frecuentes
-- =====================================================
CREATE OR REPLACE VIEW miembros_con_mandatos AS
SELECT 
  m.id AS miembro_id,
  m.usuario_id,
  m.contrato_id,
  m.tipo_rol_usuario,
  m.estado_acceso,
  m.created_at AS miembro_created_at,
  p.email AS usuario_email,
  p.nombre_completo AS usuario_nombre,
  COALESCE(
    json_agg(
      json_build_object(
        'mandato_id', ma.id,
        'tipo_mandato', ma.tipo_mandato,
        'puede_subir_documentos', ma.puede_subir_documentos,
        'puede_invitar', ma.puede_invitar,
        'puede_validar_documentos', ma.puede_validar_documentos,
        'puede_firmar', ma.puede_firmar,
        'estado_mandato', ma.estado_mandato
      )
    ) FILTER (WHERE ma.id IS NOT NULL),
    '[]'
  ) AS mandatos
FROM miembros_expediente m
LEFT JOIN perfiles p ON m.usuario_id = p.id
LEFT JOIN mandatos_expediente ma ON m.id = ma.miembro_expediente_id
GROUP BY m.id, m.usuario_id, m.contrato_id, m.tipo_rol_usuario, 
         m.estado_acceso, m.created_at, p.email, p.nombre_completo;

COMMENT ON VIEW miembros_con_mandatos IS 'Vista de miembros con sus mandatos agregados';

-- =====================================================
-- 7. RLS Policies (básicas)
-- =====================================================
ALTER TABLE miembros_expediente ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandatos_expediente ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitaciones_expediente ENABLE ROW LEVEL SECURITY;

-- Política: usuarios pueden ver miembros de sus expedientes
CREATE POLICY "miembros_read_own" ON miembros_expediente
FOR SELECT USING (
  usuario_id = auth.uid() OR
  contrato_id IN (
    SELECT contrato_id FROM miembros_expediente 
    WHERE usuario_id = auth.uid() AND estado_acceso = 'ACTIVO'
  )
);

-- Política: service role puede hacer todo
CREATE POLICY "miembros_service_all" ON miembros_expediente
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "mandatos_service_all" ON mandatos_expediente
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "invitaciones_service_all" ON invitaciones_expediente
FOR ALL USING (auth.role() = 'service_role');
