-- Create invitaciones_organizacion table
CREATE TABLE IF NOT EXISTS invitaciones_organizacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacion_id UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'MEMBER',
    token TEXT NOT NULL UNIQUE DEFAULT uuid_generate_v4()::text,
    estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'ACEPTADA', 'EXPIRADA', 'CANCELADA')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    creado_por UUID REFERENCES perfiles(id)
);

-- Partial index to ensure only one pending invitation per email per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_invite
ON invitaciones_organizacion (organizacion_id, email)
WHERE estado = 'PENDIENTE';

-- Enable RLS
ALTER TABLE invitaciones_organizacion ENABLE ROW LEVEL SECURITY;

-- Policies
-- View: Members of the organization can view invitations
CREATE POLICY "Miembros pueden ver invitaciones de su organizacion"
    ON invitaciones_organizacion
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.organizacion_id = invitaciones_organizacion.organizacion_id
        )
    );

-- Create: Only OWNER or ADMIN can create invitations
CREATE POLICY "Admins pueden crear invitaciones"
    ON invitaciones_organizacion
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.organizacion_id = invitaciones_organizacion.organizacion_id
            AND perfiles.rol_organizacion IN ('OWNER', 'ADMIN')
        )
    );

-- Update: Only OWNER or ADMIN can update (e.g. cancel) invitations
CREATE POLICY "Admins pueden actualizar invitaciones"
    ON invitaciones_organizacion
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.organizacion_id = invitaciones_organizacion.organizacion_id
            AND perfiles.rol_organizacion IN ('OWNER', 'ADMIN')
        )
    );

-- Delete: Only OWNER or ADMIN can delete invitations
CREATE POLICY "Admins pueden eliminar invitaciones"
    ON invitaciones_organizacion
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.organizacion_id = invitaciones_organizacion.organizacion_id
            AND perfiles.rol_organizacion IN ('OWNER', 'ADMIN')
        )
    );
