
import { jest } from '@jest/globals';
import { firmaService } from '../services/firmaService';
import { supabase } from '../config/supabase';

// Mock dependencies
jest.mock('../config/supabase', () => {
    return {
        supabase: {
            from: jest.fn(),
        },
    };
});

jest.mock('../services/qtspService', () => ({
    qtspService: {
        obtenerSelloTiempo: jest.fn(),
    },
    calcularHash: jest.fn(),
}));

describe('FirmaService', () => {
    describe('obtenerEstadoFirmas', () => {
        let fromSpy: any;

        beforeEach(() => {
            // Spy on supabase.from to intercept calls since the module mock might be bypassed in some environments
            fromSpy = jest.spyOn(supabase, 'from');
        });

        afterEach(() => {
            fromSpy.mockRestore();
        });

        it('should return the correct count of signed documents', async () => {
            const contratoId = 'contract-123';

            const mockSelect = jest.fn();

            fromSpy.mockReturnValue({
                select: mockSelect,
            } as any);

            // 1. Mock contratos_partes query (partesObligadas)
            mockSelect.mockReturnValueOnce({
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue(Promise.resolve({
                        data: [
                            {
                                parte_id: 'p1',
                                obligado_firmar: true,
                                partes: { nombre: 'John', apellidos: 'Doe' }
                            }
                        ]
                    }))
                } as any)
            } as any);

            // 2. Mock firmas_electronicas query
            mockSelect.mockReturnValueOnce({
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue(Promise.resolve({
                        data: []
                    }))
                } as any)
            } as any);

            // 3. Mock documentos_firmados count query
            mockSelect.mockReturnValueOnce({
                eq: jest.fn().mockReturnValue(Promise.resolve({
                    count: 5,
                    data: null,
                    error: null
                }))
            } as any);

            const result = await firmaService.obtenerEstadoFirmas(contratoId);

            // Assertions
            expect(result.contratoId).toBe(contratoId);
            expect(result.documentosFirmados).toBe(5);
        });
    });
});
