/**
 * ParticipantsReadinessPanel - Panel de verificación de participantes críticos
 * 
 * Muestra el estado de COMPRADOR y VENDEDOR (roles críticos) y permite
 * invitarlos antes de avanzar al siguiente paso del wizard.
 * 
 * Estados posibles:
 * - MIEMBRO_ACTIVO: Usuario ya registrado en el expediente
 * - INVITACION_PENDIENTE: Invitación enviada pero no aceptada
 * - NO_INVITADO: No hay miembro ni invitación para este rol
 */

import { useState, useEffect, useCallback } from 'react';
import InviteModal from '../InviteModal';
import './ParticipantsReadinessPanel.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

type ParticipantState = 'MIEMBRO_ACTIVO' | 'INVITACION_PENDIENTE' | 'NO_INVITADO';

interface ParticipantStatus {
    rol: 'COMPRADOR' | 'VENDEDOR';
    estado: ParticipantState;
    nombre?: string;
    email?: string;
    invitacionId?: string;
    invitacionToken?: string;
}

interface ParticipantsReadinessPanelProps {
    contratoId?: string;
    userId?: string;
    onStatusChange?: (allReady: boolean) => void;
}

const ROL_CONFIG = {
    COMPRADOR: {
        icon: '🔑',
        label: 'Parte Compradora',
        description: 'Quien adquiere el inmueble'
    },
    VENDEDOR: {
        icon: '🏠',
        label: 'Parte Vendedora',
        description: 'Quien vende el inmueble'
    }
};

const ESTADO_CONFIG: Record<ParticipantState, { icon: string; label: string; color: string }> = {
    MIEMBRO_ACTIVO: { icon: '✅', label: 'Registrado', color: 'var(--color-success, #22c55e)' },
    INVITACION_PENDIENTE: { icon: '📤', label: 'Invitación enviada', color: 'var(--color-warning, #f59e0b)' },
    NO_INVITADO: { icon: '❌', label: 'Sin invitar', color: 'var(--color-error, #ef4444)' }
};

export default function ParticipantsReadinessPanel({
    contratoId,
    userId,
    onStatusChange
}: ParticipantsReadinessPanelProps) {
    const [participants, setParticipants] = useState<ParticipantStatus[]>([
        { rol: 'COMPRADOR', estado: 'NO_INVITADO' },
        { rol: 'VENDEDOR', estado: 'NO_INVITADO' }
    ]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteRol, setInviteRol] = useState<'COMPRADOR' | 'VENDEDOR'>('COMPRADOR');

    const fetchStatus = useCallback(async () => {
        if (!contratoId) {
            setLoading(false);
            return;
        }

        try {
            // Fetch both miembros and invitaciones in parallel
            const [miembrosRes, invitacionesRes] = await Promise.all([
                fetch(`${API_URL}/api/contratos/${contratoId}/miembros`),
                fetch(`${API_URL}/api/contratos/${contratoId}/invitaciones`)
            ]);

            const miembrosData = await miembrosRes.json();
            const invitacionesData = await invitacionesRes.json();

            const miembros = miembrosData.success ? miembrosData.data : [];
            const invitaciones = invitacionesData.success ? invitacionesData.data : [];

            // Calculate status for each critical role
            const statuses: ParticipantStatus[] = (['COMPRADOR', 'VENDEDOR'] as const).map(rol => {
                // Check for active member
                const miembroActivo = miembros.find(
                    (m: any) => m.tipo_rol_usuario === rol && m.estado_acceso === 'ACTIVO'
                );
                if (miembroActivo) {
                    return {
                        rol,
                        estado: 'MIEMBRO_ACTIVO' as const,
                        nombre: miembroActivo.usuario_nombre,
                        email: miembroActivo.usuario_email
                    };
                }

                // Check for pending invitation
                const invitacionPendiente = invitaciones.find(
                    (i: any) => i.rol_invitado === rol &&
                        ['CREADA', 'ENVIADA', 'VISTA'].includes(i.estado)
                );
                if (invitacionPendiente) {
                    return {
                        rol,
                        estado: 'INVITACION_PENDIENTE' as const,
                        email: invitacionPendiente.email_destino,
                        invitacionId: invitacionPendiente.id,
                        invitacionToken: invitacionPendiente.token
                    };
                }

                // No member or invitation
                return { rol, estado: 'NO_INVITADO' as const };
            });

            setParticipants(statuses);

            // Notify parent about readiness: OK if at least invited (not NO_INVITADO)
            const allReady = statuses.every(p => p.estado !== 'NO_INVITADO');
            onStatusChange?.(allReady);

        } catch (err: any) {
            console.error('Error fetching participant status:', err);
            setError('Error al cargar estado de participantes');
        } finally {
            setLoading(false);
        }
    }, [contratoId, onStatusChange]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const handleInvite = (rol: 'COMPRADOR' | 'VENDEDOR') => {
        setInviteRol(rol);
        setShowInviteModal(true);
    };

    const copyInviteLink = (token: string) => {
        const url = `${window.location.origin}/invitacion/${token}`;
        navigator.clipboard.writeText(url);
        alert('Enlace de invitación copiado al portapapeles');
    };

    const handleRevoke = async (invitacionId: string) => {
        if (!confirm('¿Estás seguro de revocar esta invitación?')) return;

        try {
            await fetch(`${API_URL}/api/invitaciones/${invitacionId}/revocar`, {
                method: 'PATCH'
            });
            fetchStatus();
        } catch (err) {
            console.error('Error revocando invitación:', err);
        }
    };

    if (loading) {
        return (
            <div className="participants-readiness-panel loading">
                <div className="loading-spinner"></div>
                <span>Verificando participantes...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="participants-readiness-panel error">
                ⚠️ {error}
            </div>
        );
    }

    const allReady = participants.every(p => p.estado !== 'NO_INVITADO');

    return (
        <div className="participants-readiness-panel">
            <div className="panel-header">
                <h3>👥 Participantes Críticos</h3>
                <p className="panel-description">
                    Ambas partes deben estar invitadas antes de generar el borrador del contrato.
                </p>
            </div>

            <div className="participants-grid">
                {participants.map(participant => {
                    const rolConfig = ROL_CONFIG[participant.rol];
                    const estadoConfig = ESTADO_CONFIG[participant.estado];

                    return (
                        <div
                            key={participant.rol}
                            className={`participant-card ${participant.estado.toLowerCase().replace('_', '-')}`}
                        >
                            <div className="participant-info">
                                <div className="participant-rol">
                                    <span className="rol-icon">{rolConfig.icon}</span>
                                    <div>
                                        <strong>{rolConfig.label}</strong>
                                        <small>{rolConfig.description}</small>
                                    </div>
                                </div>

                                <div
                                    className="participant-estado"
                                    style={{ backgroundColor: estadoConfig.color }}
                                >
                                    <span>{estadoConfig.icon}</span>
                                    <span>{estadoConfig.label}</span>
                                </div>
                            </div>

                            {/* Show name/email if available */}
                            {(participant.nombre || participant.email) && (
                                <div className="participant-details">
                                    {participant.nombre && <span className="name">{participant.nombre}</span>}
                                    {participant.email && <span className="email">{participant.email}</span>}
                                </div>
                            )}

                            {/* Actions based on state */}
                            <div className="participant-actions">
                                {participant.estado === 'NO_INVITADO' && (
                                    <button
                                        className="btn btn-invite"
                                        onClick={() => handleInvite(participant.rol)}
                                    >
                                        ✉️ Invitar {rolConfig.label}
                                    </button>
                                )}

                                {participant.estado === 'INVITACION_PENDIENTE' && (
                                    <>
                                        <button
                                            className="btn btn-small"
                                            onClick={() => copyInviteLink(participant.invitacionToken!)}
                                        >
                                            📋 Copiar enlace
                                        </button>
                                        <button
                                            className="btn btn-small btn-danger"
                                            onClick={() => handleRevoke(participant.invitacionId!)}
                                        >
                                            Revocar
                                        </button>
                                    </>
                                )}

                                {participant.estado === 'MIEMBRO_ACTIVO' && (
                                    <span className="ready-text">✓ Listo para firmar</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Status summary */}
            <div className={`readiness-summary ${allReady ? 'ready' : 'not-ready'}`}>
                {allReady ? (
                    <>
                        <span className="summary-icon">✅</span>
                        <span>Todas las partes críticas están invitadas. Puedes continuar.</span>
                    </>
                ) : (
                    <>
                        <span className="summary-icon">⚠️</span>
                        <span>Invita a ambas partes antes de generar el borrador del contrato.</span>
                    </>
                )}
            </div>

            {/* Invite Modal */}
            {contratoId && (
                <InviteModal
                    contratoId={contratoId}
                    userId={userId}
                    isOpen={showInviteModal}
                    onClose={() => setShowInviteModal(false)}
                    onSuccess={() => {
                        setShowInviteModal(false);
                        fetchStatus();
                    }}
                />
            )}
        </div>
    );
}
