import { NextFunction, Request, Response } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware para validar el body, query o params de una request contra un esquema Zod
 */
export const validate = (schema: ZodSchema<any>) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Error de validación',
                    details: error.errors.map((e: any) => ({
                        field: e.path.join('.'),
                        message: e.message
                    }))
                });
            }
            return res.status(500).json({ success: false, error: 'Error interno de validación' });
        }
    };
