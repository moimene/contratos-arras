/**
 * TeamManagement - Organization Team Management Page
 * 
 * Allows viewing and managing organization team members
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import Navbar from '../../components/layout/Navbar';
import './TeamManagement.css';

interface TeamMember {
    id: string;
    email: string;
    nombre_completo: string | null;
    avatar_url: string | null;
    rol_organizacion: string;
    created_at: string;
}

export default function TeamManagement() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [myRole, setMyRole] = useState<string>('MEMBER');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Invite modal
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('MEMBER');
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchMembers();
    }, [user]);

    const fetchMembers = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

            // Get members
            const membersRes = await fetch(`${apiUrl}/api/organization/members`, {
                headers: { 'x-user-id': user!.id }
            });
            const membersData = await membersRes.json();

            // Get my role
            const orgRes = await fetch(`${apiUrl}/api/organization`, {
                headers: { 'x-user-id': user!.id }
            });
            const orgData = await orgRes.json();

            if (membersData.success) {
                setMembers(membersData.data);
            }
            if (orgData.success) {
                setMyRole(orgData.data.mi_rol);
            }
        } catch (err) {
            console.error('[TeamManagement] Error:', err);
            setError('Error al cargar el equipo');
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) {
            setError('Introduce un email');
            return;
        }

        setInviting(true);
        setError(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/organization/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user!.id
                },
                body: JSON.stringify({
                    email: inviteEmail,
                    rol: inviteRole
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(`Invitación enviada a ${inviteEmail}`);
                setShowInviteModal(false);
                setInviteEmail('');
                setInviteRole('MEMBER');
            } else {
                setError(data.error);
            }
        } catch (err) {
            console.error('[TeamManagement] Invite error:', err);
            setError('Error al enviar invitación');
        } finally {
            setInviting(false);
        }
    };

    const handleChangeRole = async (memberId: string, newRole: string) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/organization/members/${memberId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user!.id
                },
                body: JSON.stringify({ rol: newRole })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Rol actualizado');
                fetchMembers();
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Error al cambiar rol');
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('¿Estás seguro de eliminar a este miembro del equipo?')) {
            return;
        }

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/organization/members/${memberId}`, {
                method: 'DELETE',
                headers: { 'x-user-id': user!.id }
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Miembro eliminado');
                fetchMembers();
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Error al eliminar miembro');
        }
    };

    const getInitials = (member: TeamMember) => {
        if (member.nombre_completo) {
            return member.nombre_completo
                .split(' ')
                .map(n => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
        }
        return member.email[0].toUpperCase();
    };

    const canManage = myRole === 'OWNER';
    const canInvite = myRole === 'OWNER' || myRole === 'ADMIN';

    if (loading) {
        return (
            <div className="team-page">
                <Navbar />
                <div className="team-loading">
                    <div className="spinner"></div>
                    <p>Cargando equipo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="team-page">
            <Navbar />

            <div className="team-container">
                <div className="team-header">
                    <div className="header-info">
                        <h1>👥 Gestión de Equipo</h1>
                        <p>{members.length} miembro{members.length !== 1 ? 's' : ''} en la organización</p>
                    </div>
                    {canInvite && (
                        <button
                            className="btn-primary"
                            onClick={() => setShowInviteModal(true)}
                        >
                            ➕ Invitar Miembro
                        </button>
                    )}
                </div>

                {error && (
                    <div className="team-alert alert-error">
                        ⚠️ {error}
                        <button onClick={() => setError(null)}>✕</button>
                    </div>
                )}

                {success && (
                    <div className="team-alert alert-success">
                        ✅ {success}
                        <button onClick={() => setSuccess(null)}>✕</button>
                    </div>
                )}

                <div className="team-list">
                    {members.map(member => (
                        <div key={member.id} className="team-member-card">
                            <div className="member-avatar">
                                {member.avatar_url ? (
                                    <img src={member.avatar_url} alt="" />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {getInitials(member)}
                                    </div>
                                )}
                            </div>
                            <div className="member-info">
                                <span className="member-name">
                                    {member.nombre_completo || member.email.split('@')[0]}
                                </span>
                                <span className="member-email">{member.email}</span>
                            </div>
                            <div className="member-role">
                                <span className={`role-badge role-${member.rol_organizacion.toLowerCase()}`}>
                                    {member.rol_organizacion === 'OWNER' && '👑 '}
                                    {member.rol_organizacion === 'ADMIN' && '🛡️ '}
                                    {member.rol_organizacion}
                                </span>
                            </div>
                            {canManage && member.id !== user?.id && (
                                <div className="member-actions">
                                    <select
                                        value={member.rol_organizacion}
                                        onChange={(e) => handleChangeRole(member.id, e.target.value)}
                                        className="role-select"
                                    >
                                        <option value="MEMBER">MEMBER</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                    <button
                                        className="btn-danger-small"
                                        onClick={() => handleRemoveMember(member.id)}
                                        title="Eliminar del equipo"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            )}
                            {member.id === user?.id && (
                                <div className="member-you">
                                    <span className="you-badge">Tú</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="team-footer">
                    <button
                        className="btn-secondary"
                        onClick={() => navigate('/organization')}
                    >
                        ← Volver a Organización
                    </button>
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>➕ Invitar Miembro</h2>
                            <button className="modal-close" onClick={() => setShowInviteModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleInvite}>
                            <div className="form-group">
                                <label>Email del nuevo miembro</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="miembro@ejemplo.com"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Rol</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                >
                                    <option value="MEMBER">Miembro</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowInviteModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={inviting}
                                >
                                    {inviting ? 'Enviando...' : '📧 Enviar Invitación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
