/**
 * Navbar - Global Navigation Component
 * 
 * Provides consistent navigation across all pages with user menu
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { EidasBadge } from '../branding/TrustBadges';
import './Navbar.css';

interface UserProfile {
    id: string;
    email: string;
    nombre_completo: string | null;
    avatar_url: string | null;
    rol_organizacion: string;
    organizacion?: {
        nombre: string;
        plan: string;
    };
}

export const Navbar: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/profile`, {
                headers: {
                    'x-user-id': user!.id
                }
            });
            const data = await response.json();
            if (data.success) {
                setProfile(data.data);
            }
        } catch (error) {
            console.error('[Navbar] Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const getInitials = () => {
        if (profile?.nombre_completo) {
            return profile.nombre_completo
                .split(' ')
                .map(n => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
        }
        if (user?.email) {
            return user.email[0].toUpperCase();
        }
        return '?';
    };

    const displayName = profile?.nombre_completo || user?.email?.split('@')[0] || 'Usuario';

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo + Brand */}
                <div className="navbar-brand" onClick={() => navigate('/')}>
                    <EidasBadge size="small" />
                    <div className="brand-info">
                        <span className="brand-name">Gestor de Arras</span>
                        <span className="brand-org">{profile?.organizacion?.nombre || 'g-digital'}</span>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="navbar-links">
                    <button
                        className={`nav-link ${isActive('/') || isActive('/expedientes') ? 'active' : ''}`}
                        onClick={() => navigate('/')}
                    >
                        📋 Expedientes
                    </button>
                    <button
                        className={`nav-link ${isActive('/wizard') ? 'active' : ''}`}
                        onClick={() => navigate('/wizard/nuevo')}
                    >
                        ➕ Nuevo
                    </button>
                </div>

                {/* User Menu */}
                {user ? (
                    <div className="navbar-user">
                        <button
                            className="user-menu-trigger"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            {profile?.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={displayName}
                                    className="user-avatar"
                                />
                            ) : (
                                <div className="user-avatar-placeholder">
                                    {getInitials()}
                                </div>
                            )}
                            <span className="user-name">{displayName}</span>
                            <span className="dropdown-arrow">▼</span>
                        </button>

                        {menuOpen && (
                            <div className="user-dropdown">
                                <div className="dropdown-header">
                                    <strong>{displayName}</strong>
                                    <span className="user-email">{user.email}</span>
                                    {profile?.organizacion && (
                                        <span className="user-org">
                                            {profile.organizacion.nombre}
                                            <span className={`plan-badge plan-${profile.organizacion.plan.toLowerCase()}`}>
                                                {profile.organizacion.plan}
                                            </span>
                                        </span>
                                    )}
                                </div>
                                <div className="dropdown-divider"></div>
                                <button
                                    className="dropdown-item"
                                    onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                                >
                                    👤 Mi Perfil
                                </button>
                                <button
                                    className="dropdown-item"
                                    onClick={() => { navigate('/organization'); setMenuOpen(false); }}
                                >
                                    🏢 Mi Organización
                                </button>
                                <button
                                    className="dropdown-item"
                                    onClick={() => { navigate('/organization/team'); setMenuOpen(false); }}
                                >
                                    👥 Gestión de Equipo
                                </button>
                                <div className="dropdown-divider"></div>
                                <button
                                    className="dropdown-item dropdown-item-danger"
                                    onClick={handleLogout}
                                >
                                    🚪 Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        className="nav-link login-btn"
                        onClick={() => navigate('/login')}
                    >
                        Iniciar Sesión
                    </button>
                )}
            </div>

            {/* Click outside to close menu */}
            {menuOpen && (
                <div
                    className="menu-overlay"
                    onClick={() => setMenuOpen(false)}
                />
            )}
        </nav>
    );
};

export default Navbar;
