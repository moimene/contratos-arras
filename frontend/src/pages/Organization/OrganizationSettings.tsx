/**
 * OrganizationSettings - Organization Management Page
 * 
 * Allows organization owners/admins to view and edit organization settings
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import Navbar from '../../components/layout/Navbar';
import './OrganizationSettings.css';

interface OrganizationData {
    id: string;
    nombre: string;
    nif: string | null;
    tipo: string;
    plan: string;
    config: Record<string, any>;
    created_at: string;
    mi_rol: string;
    miembros?: Array<{
        id: string;
        email: string;
        nombre_completo: string | null;
        avatar_url: string | null;
        rol_organizacion: string;
    }>;
}

export default function OrganizationSettings() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [org, setOrg] = useState<OrganizationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [nombre, setNombre] = useState('');
    const [nif, setNif] = useState('');
    const [tipo, setTipo] = useState('PARTICULAR');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchOrganization();
    }, [user]);

    const fetchOrganization = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/profile/organization`, {
                headers: {
                    'x-user-id': user!.id
                }
            });
            const data = await response.json();

            if (data.success) {
                setOrg(data.data);
                setNombre(data.data.nombre || '');
                setNif(data.data.nif || '');
                setTipo(data.data.tipo || 'PARTICULAR');
            } else {
                setError(data.error);
            }
        } catch (err) {
            console.error('[Organization] Error:', err);
            setError('Error al cargar la organización');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!['OWNER', 'ADMIN'].includes(org?.mi_rol || '')) {
            setError('No tienes permisos para editar la organización');
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/organization`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user!.id
                },
                body: JSON.stringify({
                    nombre,
                    nif: nif || null,
                    tipo
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Organización actualizada correctamente');
                setOrg(prev => prev ? { ...prev, nombre, nif, tipo } : null);
            } else {
                setError(data.error);
            }
        } catch (err) {
            console.error('[Organization] Save error:', err);
            setError('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const canEdit = org?.mi_rol === 'OWNER' || org?.mi_rol === 'ADMIN';

    if (loading) {
        return (
            <div className="org-page">
                <Navbar />
                <div className="org-loading">
                    <div className="spinner"></div>
                    <p>Cargando organización...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="org-page">
            <Navbar />

            <div className="org-container">
                <div className="org-header">
                    <h1>🏢 Mi Organización</h1>
                    <p>Administra los datos de tu organización</p>
                </div>

                {error && (
                    <div className="org-alert alert-error">
                        ⚠️ {error}
                    </div>
                )}

                {success && (
                    <div className="org-alert alert-success">
                        ✅ {success}
                    </div>
                )}

                <div className="org-content">
                    {/* Plan Banner */}
                    <div className={`plan-banner plan-${(org?.plan || 'free').toLowerCase()}`}>
                        <div className="plan-info">
                            <span className="plan-label">Plan Actual</span>
                            <span className="plan-name">{org?.plan || 'FREE'}</span>
                        </div>
                        {org?.plan === 'FREE' && (
                            <button className="btn-upgrade">
                                🚀 Upgrade a PRO
                            </button>
                        )}
                    </div>

                    {/* Organization Form */}
                    <form onSubmit={handleSave} className="org-form">
                        <div className="form-section">
                            <h3>Datos de la Organización</h3>

                            <div className="form-group">
                                <label>Nombre de la Organización</label>
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    placeholder="Mi Despacho, S.L."
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>NIF/CIF</label>
                                    <input
                                        type="text"
                                        value={nif}
                                        onChange={(e) => setNif(e.target.value)}
                                        placeholder="B12345678"
                                        disabled={!canEdit}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Tipo de Organización</label>
                                    <select
                                        value={tipo}
                                        onChange={(e) => setTipo(e.target.value)}
                                        disabled={!canEdit}
                                    >
                                        <option value="PARTICULAR">Particular</option>
                                        <option value="DESPACHO">Despacho de Abogados</option>
                                        <option value="NOTARIA">Notaría</option>
                                        <option value="INMOBILIARIA">Inmobiliaria</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Tu Rol</h3>
                            <div className="role-badge-large">
                                {org?.mi_rol === 'OWNER' && '👑 Propietario'}
                                {org?.mi_rol === 'ADMIN' && '🛡️ Administrador'}
                                {org?.mi_rol === 'MEMBER' && '👤 Miembro'}
                            </div>
                            {!canEdit && (
                                <p className="role-hint">
                                    Solo los propietarios y administradores pueden editar la organización.
                                </p>
                            )}
                        </div>

                        {/* Team Summary */}
                        <div className="form-section">
                            <h3>Equipo</h3>
                            <div className="team-summary">
                                <div className="team-count">
                                    <span className="count">{org?.miembros?.length || 1}</span>
                                    <span className="label">miembro{(org?.miembros?.length || 1) !== 1 ? 's' : ''}</span>
                                </div>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => navigate('/organization/team')}
                                >
                                    👥 Gestionar Equipo
                                </button>
                            </div>
                        </div>

                        {canEdit && (
                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => navigate('/')}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                                </button>
                            </div>
                        )}
                    </form>

                    {/* Meta */}
                    <div className="org-meta">
                        <p>Organización creada: {org?.created_at ? new Date(org.created_at).toLocaleDateString('es-ES') : 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
