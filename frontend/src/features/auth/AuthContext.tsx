/**
 * Auth Context - Supabase Authentication State
 * 
 * Provides global auth state and methods for login/logout.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../../config/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        console.log('[AuthContext] Initializing...');

        supabase.auth.getSession()
            .then(({ data: { session }, error }) => {
                if (error) {
                    console.error('[AuthContext] getSession error:', error);
                }
                console.log('[AuthContext] Session loaded:', session ? 'yes' : 'no');
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            })
            .catch((err) => {
                console.error('[AuthContext] getSession exception:', err);
                setLoading(false);
            });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event: AuthChangeEvent, session: Session | null) => {
                console.log('[AuthContext] Auth state changed:', _event);
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);

                // Check for claim token after login
                if (_event === 'SIGNED_IN' && session) {
                    handlePostSignIn(session);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    /**
     * Handle post-sign-in actions (claim token processing)
     */
    const handlePostSignIn = async (session: Session) => {
        const claimToken = localStorage.getItem('chrono_claim_token');
        const contratoId = localStorage.getItem('chrono_claim_contrato_id');

        if (claimToken && contratoId) {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/claim/claim`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': session.user.id
                    },
                    body: JSON.stringify({
                        contratoId,
                        claimToken,
                        userId: session.user.id
                    })
                });

                const result = await response.json();

                if (result.success) {
                    console.log('[Auth] Contract claimed successfully:', contratoId);
                    // Clear tokens
                    localStorage.removeItem('chrono_claim_token');
                    localStorage.removeItem('chrono_claim_contrato_id');
                    // Redirect to dashboard
                    window.location.href = `/dashboard/${contratoId}`;
                } else {
                    console.error('[Auth] Failed to claim contract:', result.error);
                }
            } catch (error) {
                console.error('[Auth] Claim error:', error);
            }
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
    };

    const refreshSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, signOut, refreshSession }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
