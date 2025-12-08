import { Router, Request, Response } from 'express';
import multer from 'multer';
import { crearContratoExpediente, obtenerContratoCompleto, DatosWizard } from '../services/contractService.js';
import { guardarArchivo, obtenerUrlPublica } from '../services/storageService.js';

const router = Router();

// Configurar multer para subida de archivos en memoria
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
});

/**
 * POST /api/contracts/init
 * Crea un expediente persistente a partir del estado del Wizard
 * 
 * Body:
 * {
 *   datosWizard: DatosWizard,
 *   pdfBlob?: File (opcional - si se sube con multipart/form-data)
 * }
 */
router.post('/init', upload.single('pdf'), async (req: Request, res: Response) => {
    try {
        let datosWizard: DatosWizard;
        let borradorPdfPath: string | undefined;

        // Si viene con multipart/form-data (con archivo)
        if (req.file) {
            // Los datos del wizard vienen en req.body.datosWizard como string JSON
            try {
                datosWizard = JSON.parse(req.body.datosWizard);
            } catch (parseError) {
                return res.status(400).json({
                    success: false,
                    error: 'datosWizard debe ser un JSON válido',
                });
            }

            // Guardar PDF en storage
            borradorPdfPath = await guardarArchivo(
                req.file.buffer,
                req.file.originalname || 'contrato_borrador.pdf',
                'pdf'
            );
        } else {
            // Si viene como JSON puro
            datosWizard = req.body.datosWizard;

            if (req.body.borradorPdfPath) {
                borradorPdfPath = req.body.borradorPdfPath;
            }
        }

        // Validaciones básicas
        if (!datosWizard || typeof datosWizard !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'datosWizard es requerido y debe ser un objeto',
            });
        }

        if (!datosWizard.inmueble || !datosWizard.contrato) {
            return res.status(400).json({
                success: false,
                error: 'datosWizard.inmueble y datosWizard.contrato son requeridos',
            });
        }

        if (!datosWizard.compradores || datosWizard.compradores.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Debe haber al menos un comprador',
            });
        }

        if (!datosWizard.vendedores || datosWizard.vendedores.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Debe haber al menos un vendedor',
            });
        }

        // Crear expediente
        const resultado = await crearContratoExpediente(datosWizard, borradorPdfPath);

        // URL del dashboard
        const dashboardUrl = `/dashboard/contrato/${resultado.contratoId}`;

        res.status(201).json({
            success: true,
            contratoId: resultado.contratoId,
            numeroExpediente: resultado.numeroExpediente,
            linkCompartible: resultado.linkCompartible,
            dashboardUrl,
            pdfUrl: borradorPdfPath ? obtenerUrlPublica(borradorPdfPath) : null,
        });

    } catch (error: any) {
        console.error('Error al inicializar contrato:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al crear expediente',
        });
    }
});

/**
 * GET /api/contracts/:id
 * Obtiene un contrato completo por ID con todas sus relaciones
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'ID del contrato es requerido',
            });
        }

        const contrato = await obtenerContratoCompleto(id);

        res.json({
            success: true,
            data: contrato,
        });

    } catch (error: any) {
        console.error('Error al obtener contrato:', error);

        if (error.message.includes('no encontrado')) {
            return res.status(404).json({
                success: false,
                error: 'Contrato no encontrado',
            });
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Error al obtener contrato',
        });
    }
});

/**
 * GET /api/contracts/link/:linkCompartible
 * Obtiene un contrato por su link compartible (sin autenticación)
 */
router.get('/link/:linkCompartible', async (req: Request, res: Response) => {
    try {
        const { linkCompartible } = req.params;

        // Buscar contrato por link
        const { data: contrato, error } = await (await import('../config/supabase.js')).supabase
            .from('contratos_arras')
            .select('*, inmueble:inmuebles(*)')
            .eq('link_compartible', linkCompartible)
            .single();

        if (error || !contrato) {
            return res.status(404).json({
                success: false,
                error: 'Link no válido o expirado',
            });
        }

        // Verificar si el link ha expirado
        if (contrato.link_expira_at && new Date(contrato.link_expira_at) < new Date()) {
            return res.status(410).json({
                success: false,
                error: 'El link ha expirado',
            });
        }

        // Obtener datos completos
        const contratoCompleto = await obtenerContratoCompleto(contrato.id);

        res.json({
            success: true,
            data: contratoCompleto,
        });

    } catch (error: any) {
        console.error('Error al obtener contrato por link:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener contrato',
        });
    }
});

/**
 * POST /api/contracts/:id/transition
 * Realiza una transición de estado del contrato
 * (Para implementar en futuras fases)
 */
router.post('/:id/transition', async (req: Request, res: Response) => {
    res.status(501).json({
        success: false,
        error: 'Transiciones de estado no implementadas aún. Disponible en Phase 6.',
    });
});

/**
 * GET /api/contracts/:id/firmas
 * Obtiene el estado de las firmas de un contrato
 */
router.get('/:id/firmas', async (req: Request, res: Response) => {
    try {
        const { data: firmas, error: firmasError } = await import('../routes/firmas.js').then(m =>
            import('../config/supabase.js').then(s =>
                s.supabase
                    .from('firmas_electronicas')
                    .select('*')
                    .eq('contrato_id', req.params.id)
            )
        );

        if (firmasError) throw firmasError;

        const contratoCompleto = await obtenerContratoCompleto(req.params.id);
        const partesObligadas = contratoCompleto.partes.filter((p: any) => p.obligado_firmar);

        const firmasRealizadas = firmas?.filter((f: any) => f.timestamp_utc) || [];

        res.json({
            success: true,
            data: {
                firmasCompletadas: firmasRealizadas.length,
                firmasRequeridas: partesObligadas.length,
                todasFirmasCompletas: firmasRealizadas.length >= partesObligadas.length,
                detalles: partesObligadas.map((parte: any) => {
                    const firma = firmasRealizadas.find((f: any) => f.parte_id === parte.parte_id);
                    return {
                        parteId: parte.parte_id,
                        firmado: !!firma,
                        fechaFirma: firma?.fecha_hora_firma,
                    };
                }),
            },
        });
    } catch (error: any) {
        console.error('Error obteniendo firmas:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al obtener firmas',
        });
    }
});

/**
 * POST /api/contracts/:id/firmar
 * Registra una firma electrónica
 */
router.post('/:id/firmar', async (req: Request, res: Response) => {
    try {
        const { parteId, versionHash, documentoHash } = req.body;

        // Import supabase and register firma
        const { supabase } = await import('../config/supabase.js');
        const { v4: uuid } = await import('uuid');
        const { nowIso } = await import('../utils/time.js');

        const firmaId = uuid();
        const now = nowIso();

        const { error: firmaError } = await supabase
            .from('firmas_electronicas')
            .insert({
                id: firmaId,
                contrato_id: req.params.id,
                parte_id: parteId,
                timestamp_utc: now,
                version_hash: versionHash,
                documento_hash: documentoHash,
                ip_address: req.ip,
                user_agent: req.get('user-agent'),
            });

        if (firmaError) throw firmaError;

        // Registrar evento
        const { registerEvent } = await import('../services/eventService.js');
        await registerEvent({
            contratoId: req.params.id,
            tipo: 'FIRMA_REGISTRADA',
            payload: { parteId, firmaId },
            actorParteId: parteId
        });

        res.json({
            success: true,
            firmaId,
            mensaje: 'Firma registrada correctamente',
        });
    } catch (error: any) {
        console.error('Error al firmar:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al registrar firma',
        });
    }
});

export default router;

/**
 * GET /api/contracts
 * Lista todos los contratos con información básica
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { supabase } = await import('../config/supabase.js');
        
        // Query parameters para paginación y filtros
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const estado = req.query.estado as string;
        
        let query = supabase
            .from('contratos_arras')
            .select(`
                id,
                numero_expediente,
                estado,
                tipo_arras,
                precio_total,
                importe_arras,
                created_at,
                inmueble:inmuebles(direccion_completa, ciudad)
            `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (estado) {
            query = query.eq('estado', estado);
        }
        
        const { data: contratos, error } = await query;
        
        if (error) throw error;
        
        // Enriquecer con count de firmas
        const contratosEnriquecidos = await Promise.all(
            (contratos || []).map(async (contrato) => {
                const { data: firmas } = await supabase
                    .from('firmas_electronicas')
                    .select('id', { count: 'exact' })
                    .eq('contrato_id', contrato.id);
                
                return {
                    ...contrato,
                    num_firmas: firmas?.length || 0
                };
            })
        );
        
        res.json({
            success: true,
            data: contratosEnriquecidos,
            pagination: {
                limit,
                offset,
                count: contratosEnriquecidos.length
            }
        });
        
    } catch (error: any) {
        console.error('Error al listar contratos:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al listar contratos'
        });
    }
});

