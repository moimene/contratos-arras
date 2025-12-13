import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import contratosRoutes from './routes/contratos.js';
import partesRoutes from './routes/partes.js';
import aceptacionesRoutes from './routes/aceptaciones.js';
import firmasRoutes from './routes/firmas.js';
import pdfRoutes from './routes/pdf.js';
import pagosRoutes from './routes/pagos.js';
import actasRoutes from './routes/actas.js';
import notariaRoutes from './routes/notaria.js';
import contractsRoutes from './routes/contracts.js';
import storageRoutes from './routes/storage.js';
import claimRoutes from './routes/claim.js';
import inventarioRoutes from './routes/inventario.js';
import uploadRoutes from './routes/upload.js';
import chatRoutes from './routes/chat.js';
import transitionRoutes from './routes/transition.js';
import documentManagerRoutes from './routes/documentManager.js';
import communicationsRoutes from './routes/communications.js';
import certificateRoutes from './routes/certificate.js';
import notificationRoutes from './routes/notification.js';
import inboundRoutes from './routes/inbound.js';
import profileRoutes from './routes/profile.js';
import organizationRoutes from './routes/organization.js';

const app = express();

// Middleware - CORS configuration
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://just-reverence-production.up.railway.app',
        /\.railway\.app$/  // Allow all railway.app subdomains
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Welcome page
app.get('/', (_req: Request, res: Response) => {
    res.json({
        service: 'Sistema de Gestión de Contratos de Arras',
        version: '2.0.0',
        status: 'running',
        endpoints: {
            health: '/api/health',
            contratos: '/api/contratos',
            partes: '/api/partes',
            aceptaciones: '/api/aceptaciones',
            firmas: '/api/firmas',
            pdf: '/api/pdf',
            contracts: '/api/contracts',
            storage: '/api/storage',
            '🆕 claim': '/api/claim',
            '📋 inventario': '/api/contratos/:id/inventario',
        },
        documentation: 'Ver /docs/API.md',
    });
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'arras-backend',
    });
});

// API Routes
app.use('/api/contratos', contratosRoutes);
app.use('/api/partes', partesRoutes);
app.use('/api/aceptaciones', aceptacionesRoutes);
app.use('/api/firmas', firmasRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/actas', actasRoutes);
app.use('/api/notaria', notariaRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/claim', claimRoutes);
app.use('/api/contratos', inventarioRoutes);  // Monta rutas de inventario bajo /api/contratos/:id/inventario
app.use('/api/upload', uploadRoutes);  // Subida de archivos
app.use('/api/contratos', chatRoutes);  // Chat del expediente
app.use('/api/contratos', transitionRoutes);  // Transiciones de estado
app.use('/api', documentManagerRoutes);  // Gestor Documental completo
app.use('/api/contratos', communicationsRoutes);  // Gestor de Comunicaciones
app.use('/api/contratos', certificateRoutes);  // Certificado de Eventos
app.use('/api/notifications', notificationRoutes);  // Webhooks n8n salientes
app.use('/api/inbound', inboundRoutes);  // Recepción de comunicaciones (emails, webhooks)
app.use('/api/profile', profileRoutes);  // Perfil de usuario
app.use('/api/organization', organizationRoutes);  // Gestión de organización

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: err.message || 'Error interno del servidor',
    });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Start server
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(Number(PORT), HOST, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Backend de Contratos de Arras`);
    console.log(`📡 Servidor escuchando en ${HOST}:${PORT}`);
    console.log(`🌐 Health check: /api/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(50));
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
    console.log('📛 SIGTERM recibido, cerrando servidor gracefully...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
        console.error('⏰ Forzando cierre después de 10s');
        process.exit(1);
    }, 10000);
});

process.on('SIGINT', () => {
    console.log('📛 SIGINT recibido, cerrando servidor gracefully...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

export default app;
