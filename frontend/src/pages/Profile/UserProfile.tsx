/**
 * UserProfile - User Profile Management Page
 * 
 * Allows users to view and edit their profile information
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import Navbar from '../../components/layout/Navbar';
import './UserProfile.css';

interface UserProfileData {
    id: string;
    email: string;
    nombre_completo: string | null;
    avatar_url: string | null;
    rol_organizacion: string;
    preferencias: Record<string, any>;
    created_at: string;
    organizacion?: {
        id: string;
        nombre: string;
        plan: string;
    };
}

export default function UserProfile() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [nombreCompleto, setNombreCompleto] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    const fetchProfile = useCallback(async (signal?: AbortSignal) => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/profile`, {
                headers: {
                    'x-user-id': user.id
                },
                signal
            });
            const data = await response.json();

            if (signal?.aborted) return;

            if (data.success) {
                setProfile(data.data);
                setNombreCompleto(data.data.nombre_completo || '');
                setAvatarUrl(data.data.avatar_url || '');
            } else {
                setError(data.error);
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error('[UserProfile] Error:', err);
            setError('Error al cargar el perfil');
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        const controller = new AbortController();
        fetchProfile(controller.signal);
        return () => controller.abort();
    }, [user, fetchProfile, navigate]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user!.id
                },
                body: JSON.stringify({
                    nombre_completo: nombreCompleto,
                    avatar_url: avatarUrl || null
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Perfil actualizado correctamente');
                setProfile(prev => prev ? { ...prev, nombre_completo: nombreCompleto, avatar_url: avatarUrl } : null);
            } else {
                setError(data.error);
            }
        } catch (err) {
            console.error('[UserProfile] Save error:', err);
            setError('Error al guardar el perfil');
        } finally {
            setSaving(false);
        }
    };

    const getInitials = () => {
        if (nombreCompleto) {
            return nombreCompleto
                .split(' ')
                .map(n => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
        }
        return user?.email?.[0].toUpperCase() || '?';
    };

    if (loading) {
        return (
            <div className="profile-page">
                <Navbar />
                <div className="profile-loading">
                    <div className="spinner"></div>
                    <p>Cargando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <Navbar />

            <div className="profile-container">
                <div className="profile-header">
                    <h1>👤 Mi Perfil</h1>
                    <p>Gestiona tu información personal y preferencias</p>
                </div>

                {error && (
                    <div className="profile-alert alert-error">
                        ⚠️ {error}
                    </div>
                )}

                {success && (
                    <div className="profile-alert alert-success">
                        ✅ {success}
                    </div>
                )}

                <div className="profile-content">
                    {/* Avatar Section */}
                    <div className="profile-avatar-section">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="profile-avatar-large" />
                        ) : (
                            <div className="profile-avatar-placeholder-large">
                                {getInitials()}
                            </div>
                        )}
                        <div className="avatar-info">
                            <span className="avatar-email">{user?.email}</span>
                            <span className="avatar-role">
                                {profile?.rol_organizacion || 'MEMBER'}
                            </span>
                        </div>
                    </div>

                    {/* Profile Form */}
                    <form onSubmit={handleSave} className="profile-form">
                        <div className="form-section">
                            <h3>Información Personal</h3>

                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="input-disabled"
                                />
                                <small>El email no se puede cambiar</small>
                            </div>

                            <div className="form-group">
                                <label>Nombre Completo</label>
                                <input
                                    type="text"
                                    value={nombreCompleto}
                                    onChange={(e) => setNombreCompleto(e.target.value)}
                                    placeholder="Tu nombre completo"
                                />
                            </div>

                            <div className="form-group">
                                <label>URL del Avatar</label>
                                <input
                                    type="url"
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                    placeholder="https://example.com/avatar.jpg"
                                />
                                <small>URL de una imagen para tu avatar</small>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Organización</h3>
                            <div className="org-info-card">
                                <div className="org-name">
                                    🏢 {profile?.organizacion?.nombre || 'Sin organización'}
                                </div>
                                <div className="org-plan">
                                    Plan: <span className={`plan-badge plan-${(profile?.organizacion?.plan || 'free').toLowerCase()}`}>
                                        {profile?.organizacion?.plan || 'FREE'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => navigate('/organization')}
                                >
                                    Ver Organización →
                                </button>
                            </div>
                        </div>

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
                    </form>

                    {/* Account Info */}
                    <div className="profile-meta">
                        <p>Cuenta creada: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-ES') : 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
