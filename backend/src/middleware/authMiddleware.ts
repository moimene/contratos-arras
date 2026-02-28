/**
 * Global Authentication Middleware
 * 
 * Aplica autenticación básica a todas las rutas /api/*
 * - Rutas públicas: sin autenticación
 * - Superusuarios: acceso total
 * - Usuarios normales: requieren headers x-user-id o x-user-email
 */

import { Request, Response, NextFunction } from 'express';

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
    '/api/health',
    '/api/claim/validate',
    '/api/claim/claim',
    '/health'
];

// Patrones de rutas públicas (regex)
const PUBLIC_PATTERNS = [
    /^\/api\/contracts\/[^\/]+\/public/,  // Rutas públicas de contratos
    /^\/health/
];

// Superusuarios configurables por variable de entorno
const SUPERUSER_EMAILS = (process.env.SUPERUSER_EMAILS || 'admin@chronoflare.com,moisesmenendez@garrigues.com,super@test.chronoflare.com')
    .split(',')
    .map(e => e.trim().toLowerCase());

// Modo desarrollo (permite bypass con query params)
const DEV_MODE = process.env.DEV_MODE === 'true' || process.env.NODE_ENV !== 'production';

export interface AuthenticatedRequest extends Request {
    userId?: string;
    userEmail?: string;
    isSuperuser?: boolean;
    devModeRole?: string;
}

/**
 * Middleware de autenticación global
 */
export function globalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const path = req.path;

    // 1. Permitir rutas públicas
    if (PUBLIC_ROUTES.some(route => path.startsWith(route))) {
        return next();
    }

    // 2. Permitir patrones públicos
    if (PUBLIC_PATTERNS.some(pattern => pattern.test(path))) {
        return next();
    }

    // 3. Extraer identificación del usuario
    const userId = req.headers['x-user-id'] as string | undefined;
    const userEmail = req.headers['x-user-email'] as string | undefined;

    // 4. En modo desarrollo, permitir query param ?rol= sin autenticación estricta
    if (DEV_MODE) {
        const devRole = req.query.rol as string | undefined;
        if (devRole) {
            req.devModeRole = devRole.toUpperCase();
            req.userId = userId || 'dev-user';
            req.userEmail = userEmail || 'dev@test.chronoflare.com';
            req.isSuperuser = false;
            console.log(`[Auth] DEV MODE: Using role ${req.devModeRole} for ${path}`);
            return next();
        }
    }

    // 5. Requerir alguna forma de identificación
    if (!userId && !userEmail) {
        // En modo desarrollo, permitir acceso anónimo con advertencia
        if (DEV_MODE) {
            console.warn(`[Auth] DEV MODE: Anonymous access to ${path}`);
            req.userId = undefined;
            req.userEmail = undefined;
            req.isSuperuser = false;
            return next();
        }

        res.status(401).json({
            success: false,
            error: 'Autenticación requerida',
            message: 'Debes enviar headers x-user-id o x-user-email'
        });
        return;
    }

    // 6. Marcar superusuario
    req.userId = userId;
    req.userEmail = userEmail;
    req.isSuperuser = userEmail ? SUPERUSER_EMAILS.includes(userEmail.toLowerCase()) : false;

    if (req.isSuperuser) {
        console.log(`[Auth] Superuser access: ${userEmail} to ${path}`);
    }

    next();
}

/**
 * Middleware para requerir autenticación estricta (sin bypass de DEV_MODE)
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const userId = req.headers['x-user-id'] as string | undefined;
    const userEmail = req.headers['x-user-email'] as string | undefined;

    if (!userId && !userEmail) {
        res.status(401).json({
            success: false,
            error: 'Autenticación requerida'
        });
        return;
    }

    req.userId = userId;
    req.userEmail = userEmail;
    req.isSuperuser = userEmail ? SUPERUSER_EMAILS.includes(userEmail.toLowerCase()) : false;

    next();
}

/**
 * Helper para verificar si un email es superusuario
 */
export function isSuperuserEmail(email: string | undefined): boolean {
    return email ? SUPERUSER_EMAILS.includes(email.toLowerCase()) : false;
}

export { SUPERUSER_EMAILS, DEV_MODE };
