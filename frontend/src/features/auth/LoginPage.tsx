/**
 * LoginPage - Custom Login Form (React 19 compatible)
 * 
 * Uses Supabase Auth directly instead of @supabase/auth-ui-react
 * to avoid version conflicts.
 */

import { useState } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function LoginPage() {
    const { session, loading } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (session && !loading) {
            navigate('/expedientes');
        }
    }, [session, loading, navigate]);

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setMessage({ type: 'error', text: 'Por favor, introduce tu email' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
                emailRedirectTo: `${window.location.origin}/expedientes`
            }
        });

        setIsLoading(false);

        if (error) {
            console.error('[Login] Magic link error:', error);
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({
                type: 'success',
                text: '✅ Enlace enviado! Revisa tu correo electrónico.'
            });
            setEmail('');
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setMessage(null);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/expedientes`
            }
        });

        if (error) {
            console.error('[Login] Google login error:', error);
            setMessage({ type: 'error', text: error.message });
            setIsLoading(false);
        }
        // If successful, user is redirected to Google
    };

    if (loading) {
        return (
            <div className="auth-loading">
                <div className="spinner"></div>
                <p>Cargando...</p>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <h1>🔐 Chrono-Flare</h1>
                    <p className="auth-subtitle">Plataforma de Gestión de Contratos de Arras</p>
                </div>

                <div className="auth-form-container">
                    {/* Google Login Button */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="auth-google-button"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                        </svg>
                        Continuar con Google
                    </button>

                    <div className="auth-divider">
                        <span>o</span>
                    </div>

                    {/* Magic Link Form */}
                    <form onSubmit={handleMagicLink} className="auth-form">
                        <label htmlFor="email" className="auth-label">
                            Correo electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            className="auth-input"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            className="auth-submit-button"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Enviando...' : '✉️ Enviar enlace mágico'}
                        </button>
                    </form>

                    {/* Message Display */}
                    {message && (
                        <div className={`auth-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}
                </div>

                <div className="auth-footer">
                    <p className="auth-disclaimer">
                        Al continuar, aceptas nuestros{' '}
                        <a href="/terminos" target="_blank">Términos de Servicio</a>
                        {' '}y{' '}
                        <a href="/privacidad" target="_blank">Política de Privacidad</a>.
                    </p>
                </div>
            </div>
        </div>
    );
}
