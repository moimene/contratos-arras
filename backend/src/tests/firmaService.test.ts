// @ts-nocheck
import { jest } from '@jest/globals';

let firmaService: any;
let supabaseMock: any;
let guardarArchivoMock: jest.Mock;
let obtenerSelloMock: jest.Mock;

beforeAll(async () => {
    // Mock supabase client (ESM-friendly)
    await jest.unstable_mockModule('../config/supabase.js', () => {
        supabaseMock = {
            from: jest.fn(),
            storage: {
                from: jest.fn(),
            },
        };
        return { supabase: supabaseMock };
    });

    // Mock storageService
    await jest.unstable_mockModule('../services/storageService.js', () => {
        guardarArchivoMock = jest.fn();
        return {
            __esModule: true,
            guardarArchivo: guardarArchivoMock,
            calcularHashArchivo: jest.fn().mockReturnValue('file-hash'),
        };
    });

    // Mock qtspService
    await jest.unstable_mockModule('../services/qtspService.js', () => {
        obtenerSelloMock = jest.fn();
        return {
            __esModule: true,
            qtspService: { obtenerSelloTiempo: obtenerSelloMock },
            calcularHash: jest.fn().mockReturnValue('mock-hash'),
        };
    });

    // Import target module after mocks
    const module = await import('../services/firmaService.js');
    firmaService = module.firmaService;
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('FirmaService - registrarDocumentoFirmado', () => {
    test('should upload file and register signed document', async () => {
        const mockContratoId = 'contrato-123';
        const mockArchivoPdf = Buffer.from('test pdf content');

        obtenerSelloMock.mockResolvedValue({
            token: 'tst-token',
            fecha: new Date(),
            proveedor: 'test-provider',
        });

        guardarArchivoMock.mockResolvedValue({
            path: 'path/to/file.pdf',
            publicUrl: 'http://example.com/file.pdf',
            hash: 'file-hash',
            size: 100,
        });

        // Supabase storage stubs
        supabaseMock.storage.from.mockReturnValue({
            upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
            createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'http://example.com/file.pdf' } }),
        });

        // Supabase table builders
        const mockPostgrestBuilder = {
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null }),
            then: function (resolve: any) {
                resolve({ error: null, data: null });
            },
        };
        const mockInsert = jest.fn().mockReturnValue(mockPostgrestBuilder);
        const mockUpdate = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });

        supabaseMock.from.mockImplementation((table: string) => {
            if (table === 'archivos') return { insert: mockInsert };
            if (table === 'documentos_firmados') return { insert: mockInsert };
            if (table === 'eventos') return { insert: jest.fn().mockResolvedValue({ error: null }) };
            if (table === 'contratos_arras') return { update: mockUpdate };
            return { select: jest.fn() };
        });

        const result = await firmaService.registrarDocumentoFirmado({
            contratoId: mockContratoId,
            archivoPdf: mockArchivoPdf,
            tipoFirma: 'MANUSCRITA',
            fechaFirma: new Date(),
            firmantes: [{ parteId: 'parte-1', nombre: 'Juan' }],
        });

        expect(obtenerSelloMock).toHaveBeenCalled();
        expect(supabaseMock.storage.from).toHaveBeenCalled();
        expect(supabaseMock.from).toHaveBeenCalledWith('documentos_firmados');
        expect(result).toEqual({ documentoId: 'new-id' });
    });
});
