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

const app = express();

// Middleware
app.use(cors());
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
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/api/health',
            contratos: '/api/contratos',
            partes: '/api/partes',
            aceptaciones: '/api/aceptaciones',
            firmas: '/api/firmas',
            pdf: '/api/pdf',
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

// Error handling middleware
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
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Backend de Contratos de Arras`);
    console.log(`📡 Servidor escuchando en puerto ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}/api/health`);
    console.log('='.repeat(50));
});

export default app;
