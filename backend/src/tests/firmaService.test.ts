
import { firmaService, DocumentoFirmadoData } from '../services/firmaService';
import { supabase } from '../config/supabase';
import { guardarArchivo } from '../services/storageService';
import { qtspService } from '../services/qtspService';

// Mocks
jest.mock('../config/supabase.js', () => ({
    supabase: {
        from: jest.fn(),
        storage: {
            from: jest.fn()
        }
    }
}));

jest.mock('../services/storageService.js', () => ({
    guardarArchivo: jest.fn(),
    calcularHashArchivo: jest.fn()
}));

jest.mock('../services/qtspService.js', () => ({
    qtspService: {
        obtenerSelloTiempo: jest.fn()
    },
    calcularHash: jest.fn().mockReturnValue('mock-hash')
}));

describe('FirmaService - registrarDocumentoFirmado', () => {
    const mockContratoId = 'contrato-123';
    const mockArchivoPdf = Buffer.from('test pdf content');
    const mockDocumentoFirmadoData: DocumentoFirmadoData = {
        contratoId: mockContratoId,
        archivoPdf: mockArchivoPdf,
        tipoFirma: 'MANUSCRITA',
        fechaFirma: new Date(),
        firmantes: [{ parteId: 'parte-1', nombre: 'Juan' }]
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should upload file and register signed document', async () => {
        // Setup mocks
        (qtspService.obtenerSelloTiempo as jest.Mock).mockResolvedValue({
            token: 'tst-token',
            fecha: new Date(),
            proveedor: 'test-provider'
        });

        (guardarArchivo as jest.Mock).mockResolvedValue({
            path: 'path/to/file.pdf',
            publicUrl: 'http://example.com/file.pdf',
            hash: 'file-hash',
            size: 100
        });

        // Mock Supabase builder pattern
        const mockPostgrestBuilder = {
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null }),
            then: function(resolve: any) {
                // If awaited directly (without select/single), return null error
                 resolve({ error: null, data: null });
            }
        };

        // Ensure insert returns the builder which is also thenable
        const mockInsert = jest.fn().mockReturnValue(mockPostgrestBuilder);

        const mockUpdate = jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
        });

        (supabase.from as jest.Mock).mockImplementation((table) => {
            if (table === 'archivos') return { insert: mockInsert };
            if (table === 'documentos_firmados') return { insert: mockInsert };
            if (table === 'eventos') return { insert: jest.fn().mockResolvedValue({ error: null }) };
            if (table === 'contratos_arras') return { update: mockUpdate };
            return { select: jest.fn() };
        });

        // Execute
        const result = await firmaService.registrarDocumentoFirmado(mockDocumentoFirmadoData);

        // Verify
        expect(guardarArchivo).toHaveBeenCalledWith(
            expect.anything(),
            expect.stringMatching(/^firmado_.*\.pdf$/),
            mockContratoId,
            'documentos_firmados'
        );

        // Verify archivos insertion
        expect(supabase.from).toHaveBeenCalledWith('archivos');

        // Verify documentos_firmados insertion
        expect(supabase.from).toHaveBeenCalledWith('documentos_firmados');

        expect(result).toEqual({ documentoId: 'new-id' });
    });
});
