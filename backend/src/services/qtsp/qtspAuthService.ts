
// import axios from 'axios'; // Eliminamos axios para reducir dependencias

// Interfaces
interface TokenResponse {
    token_type: string;
    expires_in: number;
    access_token: string;
    scope: string;
}

// Configuración
const QTSP_CONFIG = {
    ISSUER: process.env.QTSP_OKTA_ISSUER || 'https://legalappfactory.okta.com/oauth2/aus653dgdgTFL2mhw417',
    CLIENT_ID: process.env.QTSP_CLIENT_ID || '',
    CLIENT_SECRET: process.env.QTSP_CLIENT_SECRET || '',
    API_BASE_URL: process.env.QTSP_API_BASE_URL || 'https://api.pre.gcloudfactory.com',
    TENANT: process.env.QTSP_TENANT || 'foundation29'
};

class QtspAuthService {
    private accessToken: string | null = null;
    private tokenExpiry: Date | null = null;
    private fetchPromise: Promise<string> | null = null;

    /**
     * Obtiene un token de acceso válido (caché o nuevo)
     */
    async getAccessToken(): Promise<string> {
        // Verificar caché
        if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
            return this.accessToken;
        }

        // Si ya hay una solicitud en vuelo, devolver esa promesa (deduplicación)
        if (this.fetchPromise) {
            return this.fetchPromise;
        }

        // Iniciar nueva solicitud
        this.fetchPromise = this.fetchNewToken();

        try {
            const token = await this.fetchPromise;
            this.fetchPromise = null;
            return token;
        } catch (error) {
            this.fetchPromise = null;
            throw error;
        }
    }

    /**
     * Solicita un nuevo token a Okta usando fetch
     */
    private async fetchNewToken(): Promise<string> {
        try {
            if (!QTSP_CONFIG.CLIENT_ID || !QTSP_CONFIG.CLIENT_SECRET) {
                console.warn('[QTSP] Credenciales no configuradas. Integración deshabilitada.');
                return '';
            }

            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_id', QTSP_CONFIG.CLIENT_ID);
            params.append('client_secret', QTSP_CONFIG.CLIENT_SECRET);
            params.append('scope', 'token');

            const response = await fetch(`${QTSP_CONFIG.ISSUER}/v1/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: params
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error Okta (${response.status}): ${errorText}`);
            }

            const data = await response.json() as TokenResponse;
            const { access_token, expires_in } = data;

            this.accessToken = access_token;
            // Expirar 5 minutos antes para seguridad
            this.tokenExpiry = new Date(Date.now() + (expires_in - 300) * 1000);

            console.log('[QTSP] Nuevo token obtenido. Expira en:', this.tokenExpiry.toISOString());

            return access_token;
        } catch (error: any) {
            console.error('[QTSP] Error obteniendo token:', error.message);
            throw new Error(`Failed to authenticate with QTSP: ${error.message}`);
        }
    }

    /**
     * Obtiene la URL base de la API
     */
    getApiBaseUrl(): string {
        return QTSP_CONFIG.API_BASE_URL;
    }
}

export const qtspAuthService = new QtspAuthService();
