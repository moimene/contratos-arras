import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import {
    createParte,
    getParteById,
    updateParte,
    deleteParte,
} from '../repositories/partes.repo.js';

const router = Router();

/**
 * GET /api/partes
 * Lista todas las partes
 */
router.get('/', async (_req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('partes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error: any) {
        console.error('Error listando partes:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/partes
 * Crea una nueva parte (comprador, vendedor, etc.)
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const parte = await createParte(req.body);
        res.status(201).json(parte);
    } catch (error: any) {
        console.error('Error creando parte:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/partes/:id
 * Obtiene una parte por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const parte = await getParteById(req.params.id);
        if (!parte) {
            return res.status(404).json({ error: 'Parte no encontrada' });
        }
        res.json(parte);
    } catch (error: any) {
        console.error('Error obteniendo parte:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * PUT /api/partes/:id
 * Actualiza una parte
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const updated = await updateParte(req.params.id, req.body);
        res.json(updated);
    } catch (error: any) {
        console.error('Error actualizando parte:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * DELETE /api/partes/:id
 * Elimina una parte
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await deleteParte(req.params.id);
        res.json({ ok: true });
    } catch (error: any) {
        console.error('Error eliminando parte:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;
