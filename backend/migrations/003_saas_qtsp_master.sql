-- ============================================
-- MIGRATION 003: SaaS Multi-tenant + QTSP + Omnichannel
-- ============================================
-- Work Order #001 - Chrono-Flare LegalOps Platform
-- Created: 2025-12-08
-- 
-- This migration adds:
-- 1. SaaS Multi-tenancy (organizaciones, perfiles, participantes)
-- 2. QTSP Evidence Chain (evidencias_qtsp with hash chaining)
-- 3. Omnichannel Tracking (comunicaciones_track)
-- 4. RLS Policies for data isolation
-- ============================================

BEGIN;

-- =====================================================
-- 1. HABILITAR EXTENSIONES NECESARIAS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. TABLA: organizaciones (SaaS Multi-tenant)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    nif TEXT,
    tipo TEXT CHECK (tipo IN ('DESPACHO', 'NOTARIA', 'INMOBILIARIA', 'PARTICULAR')),
    plan TEXT DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PRO', 'ENTERPRISE')),
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. TABLA: perfiles (Usuarios vinculados a auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    nombre_completo TEXT,
    avatar_url TEXT,
    organizacion_id UUID REFERENCES public.organizaciones(id),
    rol_organizacion TEXT DEFAULT 'MEMBER' CHECK (rol_organizacion IN ('OWNER', 'ADMIN', 'MEMBER')),
    preferencias JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. TABLA: participantes_contrato (RBAC por expediente)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.participantes_contrato (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID REFERENCES public.contratos_arras(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.perfiles(id),
    email_invitado TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('ADMIN', 'VENDEDOR', 'COMPRADOR', 'NOTARIO', 'TERCERO', 'OBSERVADOR')),
    estado_invitacion TEXT DEFAULT 'PENDIENTE' CHECK (estado_invitacion IN ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'EXPIRADA')),
    permisos JSONB DEFAULT '{}',
    token_invitacion UUID DEFAULT gen_random_uuid(),
    fecha_invitacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_respuesta TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(contrato_id, email_invitado)
);

-- =====================================================
-- 5. MODIFICACIÓN: contratos_arras (Adopción SaaS)
-- =====================================================
ALTER TABLE public.contratos_arras
    ADD COLUMN IF NOT EXISTS organizacion_id UUID REFERENCES public.organizaciones(id),
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS claim_token UUID DEFAULT gen_random_uuid();

COMMENT ON COLUMN public.contratos_arras.organizacion_id IS 'Organización propietaria del expediente';
COMMENT ON COLUMN public.contratos_arras.created_by IS 'Usuario que creó el expediente';
COMMENT ON COLUMN public.contratos_arras.claim_token IS 'Token de adopción segura post-registro';

-- =====================================================
-- 6. MODIFICACIÓN: eventos (QTSP Hash Chain)
-- =====================================================
ALTER TABLE public.eventos
    ADD COLUMN IF NOT EXISTS prev_hash_sha256 TEXT,
    ADD COLUMN IF NOT EXISTS actor_usuario_id UUID;

COMMENT ON COLUMN public.eventos.prev_hash_sha256 IS 'Hash del evento anterior para encadenamiento';
COMMENT ON COLUMN public.eventos.actor_usuario_id IS 'Usuario autenticado que generó el evento';

-- =====================================================
-- 7. TABLA: evidencias_qtsp (RFC 3161 Timestamps)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.evidencias_qtsp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
    algoritmo_hash TEXT DEFAULT 'SHA-256',
    hash_calculado TEXT NOT NULL,
    tst_raw BYTEA,
    tst_base64 TEXT,
    tst_serial_number TEXT,
    authority_key_id TEXT,
    authority_name TEXT,
    policy_oid TEXT,
    fecha_sello TIMESTAMPTZ,
    estado TEXT DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'SELLADO', 'ERROR', 'VERIFICADO')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidencias_qtsp_evento ON public.evidencias_qtsp(evento_id);

-- =====================================================
-- 8. TABLA: comunicaciones_track (Omnichannel)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.comunicaciones_track (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID REFERENCES public.contratos_arras(id) ON DELETE CASCADE,
    mensaje_chat_id UUID,
    canal TEXT NOT NULL CHECK (canal IN ('WHATSAPP', 'EMAIL', 'SMS', 'PUSH')),
    tipo TEXT DEFAULT 'NOTIFICACION' CHECK (tipo IN ('NOTIFICACION', 'RECORDATORIO', 'ALERTA', 'CONVOCATORIA')),
    destinatario_email TEXT,
    destinatario_telefono TEXT,
    asunto TEXT,
    contenido_preview TEXT,
    estado TEXT DEFAULT 'ENVIADO' CHECK (estado IN ('PENDIENTE', 'ENVIADO', 'ENTREGADO', 'LEIDO', 'FALLIDO', 'REBOTADO')),
    evento_envio_id UUID REFERENCES public.eventos(id),
    evento_entrega_id UUID REFERENCES public.eventos(id),
    evento_lectura_id UUID REFERENCES public.eventos(id),
    external_id TEXT,
    external_status TEXT,
    metadata JSONB DEFAULT '{}',
    fecha_envio TIMESTAMPTZ DEFAULT NOW(),
    fecha_entrega TIMESTAMPTZ,
    fecha_lectura TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comunicaciones_contrato ON public.comunicaciones_track(contrato_id);
CREATE INDEX IF NOT EXISTS idx_comunicaciones_estado ON public.comunicaciones_track(estado);

-- =====================================================
-- 9. TRIGGER: Auto-onboarding de usuarios
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE 
    new_org_id UUID;
    user_name TEXT;
BEGIN
    user_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    
    INSERT INTO public.organizaciones (nombre, tipo, plan) 
    VALUES ('Org. Personal - ' || user_name, 'PARTICULAR', 'FREE') 
    RETURNING id INTO new_org_id;
    
    INSERT INTO public.perfiles (id, email, nombre_completo, avatar_url, organizacion_id, rol_organizacion)
    VALUES (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'full_name', 
        new.raw_user_meta_data->>'avatar_url', 
        new_org_id,
        'OWNER'
    );
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
    AFTER INSERT ON auth.users 
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================
-- 10. MIGRACIÓN DATOS LEGADOS: Generar claim_token
-- =====================================================
UPDATE public.contratos_arras 
SET claim_token = gen_random_uuid() 
WHERE claim_token IS NULL AND organizacion_id IS NULL;

-- =====================================================
-- 11. ROW LEVEL SECURITY (RLS) - CRÍTICO
-- =====================================================

ALTER TABLE public.organizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participantes_contrato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_arras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidencias_qtsp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicaciones_track ENABLE ROW LEVEL SECURITY;

-- Política: Organizaciones
CREATE POLICY "org_isolation" ON public.organizaciones
    FOR ALL USING (
        id IN (SELECT organizacion_id FROM public.perfiles WHERE id = auth.uid())
    );

-- Política: Perfiles
CREATE POLICY "profile_select" ON public.perfiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "profile_update" ON public.perfiles
    FOR UPDATE USING (id = auth.uid());

-- Política: Participantes
CREATE POLICY "participantes_access" ON public.participantes_contrato
    FOR ALL USING (
        usuario_id = auth.uid() OR 
        email_invitado = (SELECT email FROM public.perfiles WHERE id = auth.uid())
    );

-- Política: Contratos - Aislamiento + Participantes
CREATE POLICY "contratos_org_isolation" ON public.contratos_arras
    FOR ALL USING (
        organizacion_id IN (SELECT organizacion_id FROM public.perfiles WHERE id = auth.uid())
        OR id IN (SELECT contrato_id FROM public.participantes_contrato WHERE usuario_id = auth.uid())
        OR (organizacion_id IS NULL AND claim_token IS NOT NULL)
    );

-- Política: Evidencias QTSP
CREATE POLICY "evidencias_via_contrato" ON public.evidencias_qtsp
    FOR SELECT USING (
        evento_id IN (
            SELECT e.id FROM public.eventos e
            JOIN public.contratos_arras c ON e.contrato_id = c.id
            WHERE c.organizacion_id IN (SELECT organizacion_id FROM public.perfiles WHERE id = auth.uid())
        )
    );

-- Política: Comunicaciones
CREATE POLICY "comunicaciones_via_contrato" ON public.comunicaciones_track
    FOR ALL USING (
        contrato_id IN (
            SELECT id FROM public.contratos_arras 
            WHERE organizacion_id IN (SELECT organizacion_id FROM public.perfiles WHERE id = auth.uid())
        )
    );

-- =====================================================
-- 12. VISTAS AUXILIARES
-- =====================================================

CREATE OR REPLACE VIEW public.vista_contratos_saas AS
SELECT 
    c.*,
    o.nombre AS organizacion_nombre,
    o.plan AS organizacion_plan,
    p.nombre_completo AS creador_nombre,
    p.email AS creador_email
FROM public.contratos_arras c
LEFT JOIN public.organizaciones o ON c.organizacion_id = o.id
LEFT JOIN public.perfiles p ON c.created_by = p.id;

CREATE OR REPLACE VIEW public.vista_evidencias_completas AS
SELECT 
    e.id AS evidencia_id,
    e.evento_id,
    e.hash_calculado,
    e.authority_name,
    e.fecha_sello,
    e.estado AS estado_sello,
    ev.tipo AS evento_tipo,
    ev.contrato_id,
    ev.fecha_hora AS evento_fecha
FROM public.evidencias_qtsp e
JOIN public.eventos ev ON e.evento_id = ev.id;

COMMIT;

-- =====================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- =====================================================
SELECT '✅ Migración 003 completada' AS status;

SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('organizaciones', 'perfiles', 'participantes_contrato', 
                   'evidencias_qtsp', 'comunicaciones_track');
