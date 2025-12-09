-- ============================================
-- SEED: EVENTOS Y CHAT PARA DEMO CONTRACTS
-- ============================================
-- Crea eventos coherentes según el estado de cada contrato
-- y mensajes de chat simulando conversaciones

BEGIN;

-- ============================================
-- EVENTOS PARA CADA CONTRATO
-- ============================================

-- Función helper para generar hashes
-- (En producción usaríamos sha256 real, aquí simulamos)

-- ============================================
-- CONTRATOS 1-5 (ESTADO: INICIADO)
-- Solo tienen evento de apertura
-- ============================================

INSERT INTO eventos (id, contrato_id, tipo, payload_json, hash_sha256, fecha_hora) VALUES
-- Contrato 1
('e1000001-0001-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'CONTRATO_CREADO', 
 '{"descripcion": "Expediente abierto", "usuario": "Sistema", "ip": "192.168.1.1"}', 
 'hash_c1_e1', NOW() - INTERVAL '7 days'),
 
-- Contrato 2
('e1000002-0001-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000002', 'CONTRATO_CREADO', 
 '{"descripcion": "Expediente abierto", "usuario": "Sistema"}', 
 'hash_c2_e1', NOW() - INTERVAL '6 days'),
 
-- Contrato 3
('e1000003-0001-0000-0000-000000000003', 'c0000003-0000-0000-0000-000000000003', 'CONTRATO_CREADO', 
 '{"descripcion": "Expediente abierto", "usuario": "Sistema"}', 
 'hash_c3_e1', NOW() - INTERVAL '5 days'),

-- Contrato 4
('e1000004-0001-0000-0000-000000000004', 'c0000004-0000-0000-0000-000000000004', 'CONTRATO_CREADO', 
 '{"descripcion": "Expediente abierto", "usuario": "Sistema"}', 
 'hash_c4_e1', NOW() - INTERVAL '4 days'),

-- Contrato 5
('e1000005-0001-0000-0000-000000000005', 'c0000005-0000-0000-0000-000000000005', 'CONTRATO_CREADO', 
 '{"descripcion": "Expediente abierto", "usuario": "Sistema"}', 
 'hash_c5_e1', NOW() - INTERVAL '3 days');


-- ============================================
-- CONTRATOS 6-10 (ESTADO: BORRADOR)
-- Tienen: apertura + aceptación términos + generación borrador
-- ============================================

INSERT INTO eventos (id, contrato_id, tipo, payload_json, hash_sha256, prev_hash_sha256, fecha_hora) VALUES
-- Contrato 6
('e1000006-0001-0000-0000-000000000006', 'c0000006-0000-0000-0000-000000000006', 'CONTRATO_CREADO', 
 '{"descripcion": "Expediente abierto"}', 'hash_c6_e1', NULL, NOW() - INTERVAL '5 days'),
('e1000006-0002-0000-0000-000000000006', 'c0000006-0000-0000-0000-000000000006', 'TERMINOS_ACEPTADOS', 
 '{"descripcion": "Términos esenciales aceptados por todas las partes", "partes_confirmadas": 2}', 
 'hash_c6_e2', 'hash_c6_e1', NOW() - INTERVAL '4 days'),
('e1000006-0003-0000-0000-000000000006', 'c0000006-0000-0000-0000-000000000006', 'BORRADOR_GENERADO', 
 '{"descripcion": "Borrador PDF generado", "version": 1}', 
 'hash_c6_e3', 'hash_c6_e2', NOW() - INTERVAL '3 days'),

-- Contrato 7
('e1000007-0001-0000-0000-000000000007', 'c0000007-0000-0000-0000-000000000007', 'CONTRATO_CREADO', 
 '{"descripcion": "Expediente abierto"}', 'hash_c7_e1', NULL, NOW() - INTERVAL '4 days'),
('e1000007-0002-0000-0000-000000000007', 'c0000007-0000-0000-0000-000000000007', 'TERMINOS_ACEPTADOS', 
 '{"descripcion": "Términos esenciales aceptados", "partes_confirmadas": 2}', 
 'hash_c7_e2', 'hash_c7_e1', NOW() - INTERVAL '3 days'),
('e1000007-0003-0000-0000-000000000007', 'c0000007-0000-0000-0000-000000000007', 'BORRADOR_GENERADO', 
 '{"descripcion": "Borrador PDF generado", "version": 1}', 
 'hash_c7_e3', 'hash_c7_e2', NOW() - INTERVAL '2 days'),

-- Contrato 8, 9, 10 (similar pattern)
('e1000008-0001-0000-0000-000000000008', 'c0000008-0000-0000-0000-000000000008', 'CONTRATO_CREADO', 
 '{"descripcion": "Expediente abierto"}', 'hash_c8_e1', NULL, NOW() - INTERVAL '3 days'),
('e1000008-0002-0000-0000-000000000008', 'c0000008-0000-0000-0000-000000000008', 'TERMINOS_ACEPTADOS', 
 '{"descripcion": "Términos aceptados"}', 'hash_c8_e2', 'hash_c8_e1', NOW() - INTERVAL '2 days'),
('e1000008-0003-0000-0000-000000000008', 'c0000008-0000-0000-0000-000000000008', 'BORRADOR_GENERADO', 
 '{"descripcion": "Borrador generado"}', 'hash_c8_e3', 'hash_c8_e2', NOW() - INTERVAL '1 day'),

('e1000009-0001-0000-0000-000000000009', 'c0000009-0000-0000-0000-000000000009', 'CONTRATO_CREADO', 
 '{"descripcion": "Expediente abierto"}', 'hash_c9_e1', NULL, NOW() - INTERVAL '2 days'),
('e1000009-0002-0000-0000-000000000009', 'c0000009-0000-0000-0000-000000000009', 'TERMINOS_ACEPTADOS', 
 '{"descripcion": "Términos aceptados"}', 'hash_c9_e2', 'hash_c9_e1', NOW() - INTERVAL '1 day'),
('e1000009-0003-0000-0000-000000000009', 'c0000009-0000-0000-0000-000000000009', 'BORRADOR_GENERADO', 
 '{"descripcion": "Borrador generado"}', 'hash_c9_e3', 'hash_c9_e2', NOW() - INTERVAL '12 hours'),

('e1000010-0001-0000-0000-000000000010', 'c0000010-0000-0000-0000-000000000010', 'CONTRATO_CREADO', 
 '{"descripcion": "Expediente abierto"}', 'hash_c10_e1', NULL, NOW() - INTERVAL '1 day'),
('e1000010-0002-0000-0000-000000000010', 'c0000010-0000-0000-0000-000000000010', 'TERMINOS_ACEPTADOS', 
 '{"descripcion": "Términos aceptados"}', 'hash_c10_e2', 'hash_c10_e1', NOW() - INTERVAL '18 hours'),
('e1000010-0003-0000-0000-000000000010', 'c0000010-0000-0000-0000-000000000010', 'BORRADOR_GENERADO', 
 '{"descripcion": "Borrador generado"}', 'hash_c10_e3', 'hash_c10_e2', NOW() - INTERVAL '6 hours');


-- ============================================
-- CONTRATOS 11-16 (ESTADO: FIRMADO)
-- Tienen: apertura + términos + borrador + firma comprador + firma vendedor
-- ============================================

INSERT INTO eventos (id, contrato_id, tipo, actor_parte_id, payload_json, hash_sha256, prev_hash_sha256, fecha_hora) VALUES
-- Contrato 11 - FIRMADO
('e1000011-0001-0000-0000-000000000011', 'c0000011-0000-0000-0000-000000000011', 'CONTRATO_CREADO', 
 NULL, '{"descripcion": "Expediente abierto"}', 'hash_c11_e1', NULL, NOW() - INTERVAL '7 days'),
('e1000011-0002-0000-0000-000000000011', 'c0000011-0000-0000-0000-000000000011', 'TERMINOS_ACEPTADOS', 
 NULL, '{"descripcion": "Términos aceptados", "partes": 2}', 'hash_c11_e2', 'hash_c11_e1', NOW() - INTERVAL '6 days'),
('e1000011-0003-0000-0000-000000000011', 'c0000011-0000-0000-0000-000000000011', 'BORRADOR_GENERADO', 
 NULL, '{"descripcion": "Borrador PDF v1 generado"}', 'hash_c11_e3', 'hash_c11_e2', NOW() - INTERVAL '5 days'),
('e1000011-0004-0000-0000-000000000011', 'c0000011-0000-0000-0000-000000000011', 'FIRMA_REGISTRADA', 
 'a0000011-c000-4000-8000-000000000011', '{"descripcion": "Comprador ha firmado", "nombre": "Javier Moreno Ortiz"}', 
 'hash_c11_e4', 'hash_c11_e3', NOW() - INTERVAL '4 days'),
('e1000011-0005-0000-0000-000000000011', 'c0000011-0000-0000-0000-000000000011', 'FIRMA_REGISTRADA', 
 'b0000011-d000-4000-8000-000000000011', '{"descripcion": "Vendedor ha firmado", "nombre": "Jorge Méndez Rivas"}', 
 'hash_c11_e5', 'hash_c11_e4', NOW() - INTERVAL '3 days'),
('e1000011-0006-0000-0000-000000000011', 'c0000011-0000-0000-0000-000000000011', 'CONTRATO_FIRMADO', 
 NULL, '{"descripcion": "Contrato firmado por todas las partes", "firmas_totales": 2}', 
 'hash_c11_e6', 'hash_c11_e5', NOW() - INTERVAL '3 days'),

-- Contrato 12 - FIRMADO
('e1000012-0001-0000-0000-000000000012', 'c0000012-0000-0000-0000-000000000012', 'CONTRATO_CREADO', 
 NULL, '{"descripcion": "Expediente abierto"}', 'hash_c12_e1', NULL, NOW() - INTERVAL '6 days'),
('e1000012-0002-0000-0000-000000000012', 'c0000012-0000-0000-0000-000000000012', 'TERMINOS_ACEPTADOS', 
 NULL, '{"descripcion": "Términos aceptados"}', 'hash_c12_e2', 'hash_c12_e1', NOW() - INTERVAL '5 days'),
('e1000012-0003-0000-0000-000000000012', 'c0000012-0000-0000-0000-000000000012', 'BORRADOR_GENERADO', 
 NULL, '{"descripcion": "Borrador generado"}', 'hash_c12_e3', 'hash_c12_e2', NOW() - INTERVAL '4 days'),
('e1000012-0004-0000-0000-000000000012', 'c0000012-0000-0000-0000-000000000012', 'FIRMA_REGISTRADA', 
 'a0000012-c000-4000-8000-000000000012', '{"descripcion": "Comprador firmó"}', 'hash_c12_e4', 'hash_c12_e3', NOW() - INTERVAL '3 days'),
('e1000012-0005-0000-0000-000000000012', 'c0000012-0000-0000-0000-000000000012', 'FIRMA_REGISTRADA', 
 'b0000012-d000-4000-8000-000000000012', '{"descripcion": "Vendedor firmó"}', 'hash_c12_e5', 'hash_c12_e4', NOW() - INTERVAL '2 days'),
('e1000012-0006-0000-0000-000000000012', 'c0000012-0000-0000-0000-000000000012', 'CONTRATO_FIRMADO', 
 NULL, '{"descripcion": "Contrato completamente firmado"}', 'hash_c12_e6', 'hash_c12_e5', NOW() - INTERVAL '2 days'),

-- Contratos 13-16 (pattern similar, abreviado)
('e1000013-0001-0000-0000-000000000013', 'c0000013-0000-0000-0000-000000000013', 'CONTRATO_CREADO', NULL, '{}', 'h13_1', NULL, NOW() - INTERVAL '5 days'),
('e1000013-0002-0000-0000-000000000013', 'c0000013-0000-0000-0000-000000000013', 'TERMINOS_ACEPTADOS', NULL, '{}', 'h13_2', 'h13_1', NOW() - INTERVAL '4 days'),
('e1000013-0003-0000-0000-000000000013', 'c0000013-0000-0000-0000-000000000013', 'BORRADOR_GENERADO', NULL, '{}', 'h13_3', 'h13_2', NOW() - INTERVAL '3 days'),
('e1000013-0004-0000-0000-000000000013', 'c0000013-0000-0000-0000-000000000013', 'CONTRATO_FIRMADO', NULL, '{"firmas": 2}', 'h13_4', 'h13_3', NOW() - INTERVAL '2 days'),

('e1000014-0001-0000-0000-000000000014', 'c0000014-0000-0000-0000-000000000014', 'CONTRATO_CREADO', NULL, '{}', 'h14_1', NULL, NOW() - INTERVAL '4 days'),
('e1000014-0002-0000-0000-000000000014', 'c0000014-0000-0000-0000-000000000014', 'TERMINOS_ACEPTADOS', NULL, '{}', 'h14_2', 'h14_1', NOW() - INTERVAL '3 days'),
('e1000014-0003-0000-0000-000000000014', 'c0000014-0000-0000-0000-000000000014', 'BORRADOR_GENERADO', NULL, '{}', 'h14_3', 'h14_2', NOW() - INTERVAL '2 days'),
('e1000014-0004-0000-0000-000000000014', 'c0000014-0000-0000-0000-000000000014', 'CONTRATO_FIRMADO', NULL, '{"firmas": 2}', 'h14_4', 'h14_3', NOW() - INTERVAL '1 day'),

('e1000015-0001-0000-0000-000000000015', 'c0000015-0000-0000-0000-000000000015', 'CONTRATO_CREADO', NULL, '{}', 'h15_1', NULL, NOW() - INTERVAL '3 days'),
('e1000015-0002-0000-0000-000000000015', 'c0000015-0000-0000-0000-000000000015', 'TERMINOS_ACEPTADOS', NULL, '{}', 'h15_2', 'h15_1', NOW() - INTERVAL '2 days'),
('e1000015-0003-0000-0000-000000000015', 'c0000015-0000-0000-0000-000000000015', 'BORRADOR_GENERADO', NULL, '{}', 'h15_3', 'h15_2', NOW() - INTERVAL '1 day'),
('e1000015-0004-0000-0000-000000000015', 'c0000015-0000-0000-0000-000000000015', 'CONTRATO_FIRMADO', NULL, '{"firmas": 2}', 'h15_4', 'h15_3', NOW() - INTERVAL '12 hours'),

('e1000016-0001-0000-0000-000000000016', 'c0000016-0000-0000-0000-000000000016', 'CONTRATO_CREADO', NULL, '{}', 'h16_1', NULL, NOW() - INTERVAL '2 days'),
('e1000016-0002-0000-0000-000000000016', 'c0000016-0000-0000-0000-000000000016', 'TERMINOS_ACEPTADOS', NULL, '{}', 'h16_2', 'h16_1', NOW() - INTERVAL '1 day'),
('e1000016-0003-0000-0000-000000000016', 'c0000016-0000-0000-0000-000000000016', 'BORRADOR_GENERADO', NULL, '{}', 'h16_3', 'h16_2', NOW() - INTERVAL '18 hours'),
('e1000016-0004-0000-0000-000000000016', 'c0000016-0000-0000-0000-000000000016', 'CONTRATO_FIRMADO', NULL, '{"firmas": 2}', 'h16_4', 'h16_3', NOW() - INTERVAL '6 hours');


-- ============================================
-- CONTRATOS 17-18 (ESTADO: NOTARIA)
-- Tienen: todo lo anterior + convocatoria notarial
-- ============================================

INSERT INTO eventos (id, contrato_id, tipo, payload_json, hash_sha256, prev_hash_sha256, fecha_hora) VALUES
-- Contrato 17 - NOTARIA
('e1000017-0001-0000-0000-000000000017', 'c0000017-0000-0000-0000-000000000017', 'CONTRATO_CREADO', '{}', 'h17_1', NULL, NOW() - INTERVAL '10 days'),
('e1000017-0002-0000-0000-000000000017', 'c0000017-0000-0000-0000-000000000017', 'TERMINOS_ACEPTADOS', '{}', 'h17_2', 'h17_1', NOW() - INTERVAL '9 days'),
('e1000017-0003-0000-0000-000000000017', 'c0000017-0000-0000-0000-000000000017', 'BORRADOR_GENERADO', '{}', 'h17_3', 'h17_2', NOW() - INTERVAL '8 days'),
('e1000017-0004-0000-0000-000000000017', 'c0000017-0000-0000-0000-000000000017', 'CONTRATO_FIRMADO', '{"firmas": 2}', 'h17_4', 'h17_3', NOW() - INTERVAL '7 days'),
('e1000017-0005-0000-0000-000000000017', 'c0000017-0000-0000-0000-000000000017', 'PAGO_ARRAS_CONFIRMADO', 
 '{"importe": 45500, "metodo": "TRANSFERENCIA", "confirmado_por": "Sistema"}', 'h17_5', 'h17_4', NOW() - INTERVAL '6 days'),
('e1000017-0006-0000-0000-000000000017', 'c0000017-0000-0000-0000-000000000017', 'CONVOCATORIA_NOTARIAL', 
 '{"notario": "Notaría García & Asociados", "fecha_cita": "2026-01-15 10:00", "direccion": "Calle Mayor 45, Madrid"}', 
 'h17_6', 'h17_5', NOW() - INTERVAL '3 days'),

-- Contrato 18 - NOTARIA
('e1000018-0001-0000-0000-000000000018', 'c0000018-0000-0000-0000-000000000018', 'CONTRATO_CREADO', '{}', 'h18_1', NULL, NOW() - INTERVAL '8 days'),
('e1000018-0002-0000-0000-000000000018', 'c0000018-0000-0000-0000-000000000018', 'TERMINOS_ACEPTADOS', '{}', 'h18_2', 'h18_1', NOW() - INTERVAL '7 days'),
('e1000018-0003-0000-0000-000000000018', 'c0000018-0000-0000-0000-000000000018', 'BORRADOR_GENERADO', '{}', 'h18_3', 'h18_2', NOW() - INTERVAL '6 days'),
('e1000018-0004-0000-0000-000000000018', 'c0000018-0000-0000-0000-000000000018', 'CONTRATO_FIRMADO', '{"firmas": 2}', 'h18_4', 'h18_3', NOW() - INTERVAL '5 days'),
('e1000018-0005-0000-0000-000000000018', 'c0000018-0000-0000-0000-000000000018', 'PAGO_ARRAS_CONFIRMADO', 
 '{"importe": 38500}', 'h18_5', 'h18_4', NOW() - INTERVAL '4 days'),
('e1000018-0006-0000-0000-000000000018', 'c0000018-0000-0000-0000-000000000018', 'CONVOCATORIA_NOTARIAL', 
 '{"notario": "Notaría López", "fecha_cita": "2026-01-20 11:30"}', 'h18_6', 'h18_5', NOW() - INTERVAL '2 days');


-- ============================================
-- CONTRATOS 19-20 (ESTADO: TERMINADO)
-- Tienen: todo hasta escritura otorgada
-- ============================================

INSERT INTO eventos (id, contrato_id, tipo, payload_json, hash_sha256, prev_hash_sha256, fecha_hora) VALUES
-- Contrato 19 - TERMINADO (escritura)
('e1000019-0001-0000-0000-000000000019', 'c0000019-0000-0000-0000-000000000019', 'CONTRATO_CREADO', '{}', 'h19_1', NULL, NOW() - INTERVAL '30 days'),
('e1000019-0002-0000-0000-000000000019', 'c0000019-0000-0000-0000-000000000019', 'TERMINOS_ACEPTADOS', '{}', 'h19_2', 'h19_1', NOW() - INTERVAL '28 days'),
('e1000019-0003-0000-0000-000000000019', 'c0000019-0000-0000-0000-000000000019', 'BORRADOR_GENERADO', '{}', 'h19_3', 'h19_2', NOW() - INTERVAL '26 days'),
('e1000019-0004-0000-0000-000000000019', 'c0000019-0000-0000-0000-000000000019', 'CONTRATO_FIRMADO', '{}', 'h19_4', 'h19_3', NOW() - INTERVAL '24 days'),
('e1000019-0005-0000-0000-000000000019', 'c0000019-0000-0000-0000-000000000019', 'PAGO_ARRAS_CONFIRMADO', '{}', 'h19_5', 'h19_4', NOW() - INTERVAL '22 days'),
('e1000019-0006-0000-0000-000000000019', 'c0000019-0000-0000-0000-000000000019', 'CONVOCATORIA_NOTARIAL', '{}', 'h19_6', 'h19_5', NOW() - INTERVAL '15 days'),
('e1000019-0007-0000-0000-000000000019', 'c0000019-0000-0000-0000-000000000019', 'ESCRITURA_OTORGADA', 
 '{"notario": "Notaría Martínez", "fecha_escritura": "2025-11-25", "numero_protocolo": "2025/4521"}', 
 'h19_7', 'h19_6', NOW() - INTERVAL '5 days'),

-- Contrato 20 - TERMINADO (escritura)
('e1000020-0001-0000-0000-000000000020', 'c0000020-0000-0000-0000-000000000020', 'CONTRATO_CREADO', '{}', 'h20_1', NULL, NOW() - INTERVAL '25 days'),
('e1000020-0002-0000-0000-000000000020', 'c0000020-0000-0000-0000-000000000020', 'TERMINOS_ACEPTADOS', '{}', 'h20_2', 'h20_1', NOW() - INTERVAL '23 days'),
('e1000020-0003-0000-0000-000000000020', 'c0000020-0000-0000-0000-000000000020', 'BORRADOR_GENERADO', '{}', 'h20_3', 'h20_2', NOW() - INTERVAL '21 days'),
('e1000020-0004-0000-0000-000000000020', 'c0000020-0000-0000-0000-000000000020', 'CONTRATO_FIRMADO', '{}', 'h20_4', 'h20_3', NOW() - INTERVAL '19 days'),
('e1000020-0005-0000-0000-000000000020', 'c0000020-0000-0000-0000-000000000020', 'PAGO_ARRAS_CONFIRMADO', '{}', 'h20_5', 'h20_4', NOW() - INTERVAL '17 days'),
('e1000020-0006-0000-0000-000000000020', 'c0000020-0000-0000-0000-000000000020', 'CONVOCATORIA_NOTARIAL', '{}', 'h20_6', 'h20_5', NOW() - INTERVAL '10 days'),
('e1000020-0007-0000-0000-000000000020', 'c0000020-0000-0000-0000-000000000020', 'ESCRITURA_OTORGADA', 
 '{"notario": "Notaría Fernández", "fecha_escritura": "2025-11-30", "numero_protocolo": "2025/4892"}', 
 'h20_7', 'h20_6', NOW() - INTERVAL '2 days');

COMMIT;

-- Verificar eventos insertados
SELECT contrato_id, COUNT(*) as num_eventos 
FROM eventos 
GROUP BY contrato_id 
ORDER BY contrato_id;
