
import { generateActaNoComparecenciaPDF } from '../services/pdfService';
import { ConsecuenciasArras } from '../types/acta';
import { describe, it, expect } from '@jest/globals';

describe('Acta PDF Generation', () => {
    it('should generate a PDF buffer', async () => {
        const mockData = {
            contrato: {
                numero_expediente: 'EXP-12345',
                created_at: new Date().toISOString(),
                precio_total: 250000,
                moneda: 'EUR',
                importe_arras: 25000,
                tipo_arras: 'PENITENCIALES',
                inmueble: {
                    direccion_completa: 'Calle Test 123',
                    ciudad: 'Madrid'
                }
            },
            parteNoCompareciente: {
                rol_en_contrato: 'COMPRADOR',
                parte: {
                    nombre: 'Juan',
                    apellidos: 'Pérez',
                    tipo_documento: 'DNI',
                    numero_documento: '12345678X'
                }
            },
            fechaHoraCita: new Date(),
            notaria: 'Notaría de Prueba',
            resumenHechos: 'La parte no compareció a la hora citada.',
            consecuencias: {
                tipoArras: 'PENITENCIALES',
                importeArras: 25000,
                precioTotal: 250000,
                parteIncumplidora: 'COMPRADOR',
                consecuencia: 'El comprador pierde las arras.',
                derechoResolucion: true
            } as ConsecuenciasArras,
            hashActa: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
            tst: {
                fecha: new Date(),
                proveedor: 'TEST_PROVIDER'
            }
        };

        const buffer = await generateActaNoComparecenciaPDF(mockData);
        expect(Buffer.isBuffer(buffer)).toBe(true);
        expect(buffer.length).toBeGreaterThan(0);
        const header = buffer.subarray(0, 5).toString();
        expect(header).toBe('%PDF-');
    });
});
