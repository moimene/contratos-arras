/**
 * ParticipantesPanel - Panel de gestión de miembros e invitaciones
 * 
 * Tabs:
 * 1. Personas - Lista de miembros con sus mandatos
 * 2. Invitaciones - Lista de invitaciones pendientes/aceptadas
 */

import { useState, useEffect, useCallback } from 'react';
import './ParticipantesPanel.css';

interface Mandato {
    id: string;
    tipo_mandato: string;
    puede_subir_documentos: boolean;
    puede_invitar: boolean;
    puede_validar_documentos: boolean;
    puede_firmar: boolean;
    estado_mandato: string;
}

interface Miembro {
    id: string;
    usuario_id: string | null;
    tipo_rol_usuario: string;
    estado_acceso: string;
    created_at: string;
    usuario_email?: string;
    usuario_nombre?: string;
    mandatos: Mandato[];
}

interface Invitacion {
    id: string;
    email_destino?: string;
    rol_invitado: string;
    tipo_mandato?: string;
    estado: string;
    token: string;
    created_at: string;
    creador?: {
        email: string;
        nombre_completo: string;
    };
}

interface ParticipantesPanelProps {
    contratoId: string;
    rolActual?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const ROL_ICONS: Record<string, string> = {
    ADMIN: '👑',
    VENDEDOR: '🏠',
    COMPRADOR: '🔑',
    TERCERO: '🧭',
    NOTARIO: '⚖️',
    OBSERVADOR: '👁️'
};

const MANDATO_LABELS: Record<string, string> = {
    PARTE_COMPRADORA: 'Asesor comprador',
    PARTE_VENDEDORA: 'Asesor vendedor',
    AMBAS_PARTES: 'Agencia dual',
    NOTARIA: 'Asistente notarial',
    OBSERVADOR_TECNICO: 'Observador técnico'
};

const ESTADO_COLORS: Record<string, string> = {
    ACTIVO: 'var(--color-success)',
    PENDIENTE_INVITACION: 'var(--color-warning)',
    REVOCADO: 'var(--color-error)',
    CREADA: 'var(--color-info)',
    ENVIADA: 'var(--color-info)',
    VISTA: 'var(--color-warning)',
    ACEPTADA: 'var(--color-success)',
    EXPIRADA: 'var(--color-muted)',
    REVOCADA: 'var(--color-error)'
};

export default function ParticipantesPanel({ contratoId, rolActual }: ParticipantesPanelProps) {
    const [activeTab, setActiveTab] = useState<'personas' | 'invitaciones'>('personas');
    const [miembros, setMiembros] = useState<Miembro[]>([]);
    const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const fetchMiembros = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/contratos/${contratoId}/miembros`);
            const data = await response.json();
            if (data.success) {
                setMiembros(data.data);
            }
        } catch (err) {
            console.error('Error fetching miembros:', err);
        }
    }, [contratoId]);

    const fetchInvitaciones = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/contratos/${contratoId}/invitaciones`);
            const data = await response.json();
            if (data.success) {
                setInvitaciones(data.data);
            }
        } catch (err) {
            console.error('Error fetching invitaciones:', err);
        }
    }, [contratoId]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                await Promise.all([fetchMiembros(), fetchInvitaciones()]);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [fetchMiembros, fetchInvitaciones]);

    const handleRevocarAcceso = async (miembroId: string) => {
        if (!confirm('¿Estás seguro de revocar el acceso a este miembro?')) return;

        try {
            const response = await fetch(
                `${API_URL}/api/contratos/${contratoId}/miembros/${miembroId}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estadoAcceso: 'REVOCADO' })
                }
            );
            if (response.ok) {
                fetchMiembros();
            }
        } catch (err) {
            console.error('Error revocando acceso:', err);
        }
    };

    const handleRevocarInvitacion = async (invitacionId: string) => {
        if (!confirm('¿Estás seguro de revocar esta invitación?')) return;

        try {
            const response = await fetch(
                `${API_URL}/api/invitaciones/${invitacionId}/revocar`,
                { method: 'PATCH' }
            );
            if (response.ok) {
                fetchInvitaciones();
            }
        } catch (err) {
            console.error('Error revocando invitación:', err);
        }
    };

    const copyInviteLink = (token: string) => {
        const url = `${window.location.origin}/invitacion/${token}`;
        navigator.clipboard.writeText(url);
        alert('Enlace de invitación copiado al portapapeles');
    };

    if (loading) {
        return (
            <div className="participantes-panel loading">
                <div className="loading-spinner small"></div>
                <span>Cargando participantes...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="participantes-panel error">
                <span>⚠️ Error: {error}</span>
            </div>
        );
    }

    return (
        <div className="participantes-panel">
            {/* Tabs */}
            <div className="panel-tabs">
                <button
                    className={`tab ${activeTab === 'personas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('personas')}
                >
                    👥 Personas ({miembros.length})
                </button>
                <button
                    className={`tab ${activeTab === 'invitaciones' ? 'active' : ''}`}
                    onClick={() => setActiveTab('invitaciones')}
                >
                    ✉️ Invitaciones ({invitaciones.filter(i =>
                        ['CREADA', 'ENVIADA', 'VISTA'].includes(i.estado)
                    ).length})
                </button>
                {rolActual && ['ADMIN', 'VENDEDOR', 'COMPRADOR', 'TERCERO'].includes(rolActual) && (
                    <button
                        className="btn-invite"
                        onClick={() => setShowInviteModal(true)}
                    >
                        + Invitar
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="panel-content">
                {activeTab === 'personas' && (
                    <div className="miembros-grid">
                        {miembros.length === 0 ? (
                            <p className="empty-state">No hay miembros en este expediente</p>
                        ) : (
                            miembros.map(miembro => (
                                <div key={miembro.id} className="miembro-card">
                                    <div className="miembro-header">
                                        <span className="rol-icon">
                                            {ROL_ICONS[miembro.tipo_rol_usuario] || '👤'}
                                        </span>
                                        <div className="miembro-info">
                                            <strong>
                                                {miembro.usuario_nombre || miembro.usuario_email || 'Sin usuario'}
                                            </strong>
                                            <span className="rol-label">{miembro.tipo_rol_usuario}</span>
                                        </div>
                                        <span
                                            className="estado-badge"
                                            style={{ backgroundColor: ESTADO_COLORS[miembro.estado_acceso] }}
                                        >
                                            {miembro.estado_acceso}
                                        </span>
                                    </div>

                                    {/* Mandatos */}
                                    {miembro.mandatos.length > 0 && (
                                        <div className="mandatos-list">
                                            {miembro.mandatos.map(mandato => (
                                                <div key={mandato.id} className="mandato-chip">
                                                    <span>{MANDATO_LABELS[mandato.tipo_mandato] || mandato.tipo_mandato}</span>
                                                    <div className="permisos-icons">
                                                        {mandato.puede_subir_documentos && <span title="Puede subir docs">📄</span>}
                                                        {mandato.puede_invitar && <span title="Puede invitar">✉️</span>}
                                                        {mandato.puede_validar_documentos && <span title="Puede validar">✅</span>}
                                                        {mandato.puede_firmar && <span title="Puede firmar">✍️</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {miembro.estado_acceso === 'ACTIVO' && rolActual === 'ADMIN' && (
                                        <div className="miembro-actions">
                                            <button
                                                className="btn-small btn-danger"
                                                onClick={() => handleRevocarAcceso(miembro.id)}
                                            >
                                                Revocar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'invitaciones' && (
                    <div className="invitaciones-list">
                        {invitaciones.length === 0 ? (
                            <p className="empty-state">No hay invitaciones</p>
                        ) : (
                            invitaciones.map(inv => (
                                <div key={inv.id} className="invitacion-card">
                                    <div className="invitacion-header">
                                        <span className="rol-icon">
                                            {ROL_ICONS[inv.rol_invitado] || '👤'}
                                        </span>
                                        <div className="invitacion-info">
                                            <strong>{inv.email_destino || 'Enlace abierto'}</strong>
                                            <span className="rol-label">
                                                {inv.rol_invitado}
                                                {inv.tipo_mandato && ` • ${MANDATO_LABELS[inv.tipo_mandato]}`}
                                            </span>
                                        </div>
                                        <span
                                            className="estado-badge"
                                            style={{ backgroundColor: ESTADO_COLORS[inv.estado] }}
                                        >
                                            {inv.estado}
                                        </span>
                                    </div>

                                    <div className="invitacion-meta">
                                        <span>Creada: {new Date(inv.created_at).toLocaleDateString('es-ES')}</span>
                                    </div>

                                    {/* Actions for pending invitations */}
                                    {['CREADA', 'ENVIADA', 'VISTA'].includes(inv.estado) && (
                                        <div className="invitacion-actions">
                                            <button
                                                className="btn-small"
                                                onClick={() => copyInviteLink(inv.token)}
                                            >
                                                📋 Copiar enlace
                                            </button>
                                            <button
                                                className="btn-small btn-danger"
                                                onClick={() => handleRevocarInvitacion(inv.id)}
                                            >
                                                Revocar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Invite Modal (placeholder) */}
            {showInviteModal && (
                <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Invitar a alguien</h3>
                        <p>Modal de invitación - Por implementar</p>
                        <button onClick={() => setShowInviteModal(false)}>Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
}
