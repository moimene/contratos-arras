-- ============================================
-- MIGRATION 009: Seed Inventario Adicional
-- ============================================
-- Completa los contratos faltantes con datos de inventario
-- Contratos: 3-5 (INICIADO), 8-10 (BORRADOR), 13-16 (FIRMADO), 18 (NOTARIA), 20 (TERMINADO)

BEGIN;

-- ============================================
-- CONTRATOS 3-5 (INICIADO): Items preliminares
-- ============================================

-- Contrato 3 - INICIADO
INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio) VALUES
('c0000003-0000-0000-0000-000000000003', 'NOTA_SIMPLE', 'Nota Simple vigente', 'Nota simple del Registro', 'INMUEBLE', 'VENDEDOR', true),
('c0000003-0000-0000-0000-000000000003', 'DNI_VENDEDOR', 'DNI/NIE Vendedor', 'Documento identidad vendedor', 'PARTES', 'VENDEDOR', true),
('c0000003-0000-0000-0000-000000000003', 'DNI_COMPRADOR', 'DNI/NIE Comprador', 'Documento identidad comprador', 'PARTES', 'COMPRADOR', true);

-- Contrato 4 - INICIADO
INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio) VALUES
('c0000004-0000-0000-0000-000000000004', 'NOTA_SIMPLE', 'Nota Simple vigente', 'Nota simple del Registro', 'INMUEBLE', 'VENDEDOR', true),
('c0000004-0000-0000-0000-000000000004', 'DNI_VENDEDOR', 'DNI/NIE Vendedor', 'Documento identidad vendedor', 'PARTES', 'VENDEDOR', true),
('c0000004-0000-0000-0000-000000000004', 'DNI_COMPRADOR', 'DNI/NIE Comprador', 'Documento identidad comprador', 'PARTES', 'COMPRADOR', true);

-- Contrato 5 - INICIADO
INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio) VALUES
('c0000005-0000-0000-0000-000000000005', 'NOTA_SIMPLE', 'Nota Simple vigente', 'Nota simple del Registro', 'INMUEBLE', 'VENDEDOR', true),
('c0000005-0000-0000-0000-000000000005', 'DNI_VENDEDOR', 'DNI/NIE Vendedor', 'Documento identidad vendedor', 'PARTES', 'VENDEDOR', true),
('c0000005-0000-0000-0000-000000000005', 'DNI_COMPRADOR', 'DNI/NIE Comprador', 'Documento identidad comprador', 'PARTES', 'COMPRADOR', true);

-- ============================================
-- CONTRATOS 8-10 (BORRADOR): + Bloque C parcial
-- ============================================

-- Contrato 8 - BORRADOR
INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio, estado) VALUES
('c0000008-0000-0000-0000-000000000008', 'NOTA_SIMPLE', 'Nota Simple vigente', 'Nota simple', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000008-0000-0000-0000-000000000008', 'DNI_VENDEDOR', 'DNI/NIE Vendedor', 'Documento identidad', 'PARTES', 'VENDEDOR', true, 'VALIDADO'),
('c0000008-0000-0000-0000-000000000008', 'DNI_COMPRADOR', 'DNI/NIE Comprador', 'Documento identidad', 'PARTES', 'COMPRADOR', true, 'VALIDADO'),
('c0000008-0000-0000-0000-000000000008', 'CONTRATO_ARRAS_BORRADOR', 'Borrador contrato arras', 'PDF generado', 'ARRAS', 'PLATAFORMA', true, 'VALIDADO');

-- Contrato 9 - BORRADOR
INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio, estado) VALUES
('c0000009-0000-0000-0000-000000000009', 'NOTA_SIMPLE', 'Nota Simple vigente', 'Nota simple', 'INMUEBLE', 'VENDEDOR', true, 'SUBIDO'),
('c0000009-0000-0000-0000-000000000009', 'DNI_VENDEDOR', 'DNI/NIE Vendedor', 'Documento identidad', 'PARTES', 'VENDEDOR', true, 'VALIDADO'),
('c0000009-0000-0000-0000-000000000009', 'DNI_COMPRADOR', 'DNI/NIE Comprador', 'Documento identidad', 'PARTES', 'COMPRADOR', true, 'SUBIDO'),
('c0000009-0000-0000-0000-000000000009', 'CONTRATO_ARRAS_BORRADOR', 'Borrador contrato arras', 'PDF generado', 'ARRAS', 'PLATAFORMA', true, 'VALIDADO');

-- Contrato 10 - BORRADOR
INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio, estado) VALUES
('c0000010-0000-0000-0000-000000000010', 'NOTA_SIMPLE', 'Nota Simple vigente', 'Nota simple', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000010-0000-0000-0000-000000000010', 'IBI', 'Último recibo IBI', 'Recibo IBI', 'INMUEBLE', 'VENDEDOR', true, 'SUBIDO'),
('c0000010-0000-0000-0000-000000000010', 'DNI_VENDEDOR', 'DNI/NIE Vendedor', 'Documento identidad', 'PARTES', 'VENDEDOR', true, 'VALIDADO'),
('c0000010-0000-0000-0000-000000000010', 'DNI_COMPRADOR', 'DNI/NIE Comprador', 'Documento identidad', 'PARTES', 'COMPRADOR', true, 'VALIDADO'),
('c0000010-0000-0000-0000-000000000010', 'CONTRATO_ARRAS_BORRADOR', 'Borrador contrato arras', 'PDF generado', 'ARRAS', 'PLATAFORMA', true, 'VALIDADO');

-- ============================================
-- CONTRATOS 13-16 (FIRMADO): Bloque C completo
-- ============================================

-- Contrato 13 - FIRMADO
INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio, estado) VALUES
('c0000013-0000-0000-0000-000000000013', 'NOTA_SIMPLE', 'Nota Simple vigente', 'Nota simple', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000013-0000-0000-0000-000000000013', 'IBI', 'Último recibo IBI', 'Recibo IBI', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000013-0000-0000-0000-000000000013', 'DNI_VENDEDOR', 'DNI Vendedor', 'Documento identidad', 'PARTES', 'VENDEDOR', true, 'VALIDADO'),
('c0000013-0000-0000-0000-000000000013', 'DNI_COMPRADOR', 'DNI Comprador', 'Documento identidad', 'PARTES', 'COMPRADOR', true, 'VALIDADO'),
('c0000013-0000-0000-0000-000000000013', 'CONTRATO_ARRAS_FIRMADO', 'Contrato arras firmado', 'PDF firmado', 'ARRAS', 'PLATAFORMA', true, 'VALIDADO'),
('c0000013-0000-0000-0000-000000000013', 'JUSTIFICANTE_PAGO_ARRAS', 'Justificante pago arras', 'Pendiente', 'ARRAS', 'COMPRADOR', true, 'SUBIDO');

-- Contrato 14 - FIRMADO
INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio, estado) VALUES
('c0000014-0000-0000-0000-000000000014', 'NOTA_SIMPLE', 'Nota Simple', 'Nota simple', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000014-0000-0000-0000-000000000014', 'DNI_VENDEDOR', 'DNI Vendedor', 'Documento identidad', 'PARTES', 'VENDEDOR', true, 'VALIDADO'),
('c0000014-0000-0000-0000-000000000014', 'DNI_COMPRADOR', 'DNI Comprador', 'Documento identidad', 'PARTES', 'COMPRADOR', true, 'VALIDADO'),
('c0000014-0000-0000-0000-000000000014', 'CONTRATO_ARRAS_FIRMADO', 'Contrato arras firmado', 'PDF firmado', 'ARRAS', 'PLATAFORMA', true, 'VALIDADO'),
('c0000014-0000-0000-0000-000000000014', 'JUSTIFICANTE_PAGO_ARRAS', 'Justificante pago arras', 'Pendiente subir', 'ARRAS', 'COMPRADOR', true, 'PENDIENTE');

-- Contrato 15 - FIRMADO
INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio, estado) VALUES
('c0000015-0000-0000-0000-000000000015', 'NOTA_SIMPLE', 'Nota Simple', 'Nota simple', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000015-0000-0000-0000-000000000015', 'CEE', 'Certificado Eficiencia Energética', 'CEE vigente', 'INMUEBLE', 'VENDEDOR', true, 'SUBIDO'),
('c0000015-0000-0000-0000-000000000015', 'DNI_VENDEDOR', 'DNI Vendedor', 'Documento identidad', 'PARTES', 'VENDEDOR', true, 'VALIDADO'),
('c0000015-0000-0000-0000-000000000015', 'DNI_COMPRADOR', 'DNI Comprador', 'Documento identidad', 'PARTES', 'COMPRADOR', true, 'VALIDADO'),
('c0000015-0000-0000-0000-000000000015', 'CONTRATO_ARRAS_FIRMADO', 'Contrato arras firmado', 'PDF firmado', 'ARRAS', 'PLATAFORMA', true, 'VALIDADO'),
('c0000015-0000-0000-0000-000000000015', 'JUSTIFICANTE_PAGO_ARRAS', 'Justificante pago arras', 'Confirmado', 'ARRAS', 'COMPRADOR', true, 'VALIDADO');

-- Contrato 16 - FIRMADO
INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio, estado) VALUES
('c0000016-0000-0000-0000-000000000016', 'NOTA_SIMPLE', 'Nota Simple', 'Nota simple', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000016-0000-0000-0000-000000000016', 'IBI', 'Recibo IBI', 'Recibo IBI', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000016-0000-0000-0000-000000000016', 'DNI_VENDEDOR', 'DNI Vendedor', 'Documento identidad', 'PARTES', 'VENDEDOR', true, 'VALIDADO'),
('c0000016-0000-0000-0000-000000000016', 'DNI_COMPRADOR', 'DNI Comprador', 'Documento identidad', 'PARTES', 'COMPRADOR', true, 'VALIDADO'),
('c0000016-0000-0000-0000-000000000016', 'CONTRATO_ARRAS_FIRMADO', 'Contrato arras firmado', 'PDF firmado', 'ARRAS', 'PLATAFORMA', true, 'VALIDADO'),
('c0000016-0000-0000-0000-000000000016', 'JUSTIFICANTE_PAGO_ARRAS', 'Justificante pago arras', 'Pendiente', 'ARRAS', 'COMPRADOR', true, 'PENDIENTE');

-- ============================================
-- CONTRATO 18 (NOTARIA)
-- ============================================

INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio, estado) VALUES
('c0000018-0000-0000-0000-000000000018', 'NOTA_SIMPLE', 'Nota Simple vigente', 'Nota simple', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000018-0000-0000-0000-000000000018', 'ESCRITURA_ANTERIOR', 'Escritura propiedad', 'Escritura actual', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000018-0000-0000-0000-000000000018', 'IBI', 'Recibo IBI', 'Último recibo', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000018-0000-0000-0000-000000000018', 'CEE', 'Certificado Eficiencia Energética', 'CEE vigente', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000018-0000-0000-0000-000000000018', 'DNI_VENDEDOR', 'DNI Vendedor', 'Documento identidad', 'PARTES', 'VENDEDOR', true, 'VALIDADO'),
('c0000018-0000-0000-0000-000000000018', 'DNI_COMPRADOR', 'DNI Comprador', 'Documento identidad', 'PARTES', 'COMPRADOR', true, 'VALIDADO'),
('c0000018-0000-0000-0000-000000000018', 'CONTRATO_ARRAS_FIRMADO', 'Contrato arras firmado', 'PDF firmado', 'ARRAS', 'PLATAFORMA', true, 'VALIDADO'),
('c0000018-0000-0000-0000-000000000018', 'JUSTIFICANTE_PAGO_ARRAS', 'Justificante pago arras', 'Transferencia confirmada', 'ARRAS', 'COMPRADOR', true, 'VALIDADO'),
('c0000018-0000-0000-0000-000000000018', 'CONVOCATORIA_NOTARIA', 'Convocatoria a notaría', 'Cita programada', 'NOTARIA', 'PLATAFORMA', true, 'VALIDADO'),
('c0000018-0000-0000-0000-000000000018', 'MINUTA_ESCRITURA', 'Minuta de escritura', 'Pendiente revisión', 'NOTARIA', 'NOTARIO', true, 'PENDIENTE'),
('c0000018-0000-0000-0000-000000000018', 'ESCRITURA_COMPRAVENTA', 'Escritura de compraventa', 'Pendiente firma en notaría', 'NOTARIA', 'NOTARIO', true, 'PENDIENTE');

-- ============================================
-- CONTRATO 20 (TERMINADO): Bloque E completo
-- ============================================

INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio, estado) VALUES
('c0000020-0000-0000-0000-000000000020', 'NOTA_SIMPLE', 'Nota Simple', 'Nota simple', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000020-0000-0000-0000-000000000020', 'ESCRITURA_ANTERIOR', 'Escritura propiedad', 'Escritura antigua', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000020-0000-0000-0000-000000000020', 'IBI', 'Recibo IBI', 'Recibo IBI', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000020-0000-0000-0000-000000000020', 'COMUNIDAD', 'Certificado deudas comunidad', 'Sin deudas', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000020-0000-0000-0000-000000000020', 'CEE', 'CEE', 'Certificado energético', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000020-0000-0000-0000-000000000020', 'DNI_VENDEDOR', 'DNI Vendedor', 'DNI', 'PARTES', 'VENDEDOR', true, 'VALIDADO'),
('c0000020-0000-0000-0000-000000000020', 'DNI_COMPRADOR', 'DNI Comprador', 'DNI', 'PARTES', 'COMPRADOR', true, 'VALIDADO'),
('c0000020-0000-0000-0000-000000000020', 'CONTRATO_ARRAS_FIRMADO', 'Contrato arras', 'Firmado', 'ARRAS', 'PLATAFORMA', true, 'VALIDADO'),
('c0000020-0000-0000-0000-000000000020', 'JUSTIFICANTE_PAGO_ARRAS', 'Justificante arras', 'Pagado', 'ARRAS', 'COMPRADOR', true, 'VALIDADO'),
('c0000020-0000-0000-0000-000000000020', 'CONVOCATORIA_NOTARIA', 'Convocatoria a notaría', 'Realizada', 'NOTARIA', 'PLATAFORMA', true, 'VALIDADO'),
('c0000020-0000-0000-0000-000000000020', 'MINUTA_ESCRITURA', 'Minuta escritura', 'Aprobada', 'NOTARIA', 'NOTARIO', true, 'VALIDADO'),
('c0000020-0000-0000-0000-000000000020', 'ESCRITURA_COMPRAVENTA', 'Escritura compraventa', 'Firmada en notaría el 01/12/2025', 'NOTARIA', 'NOTARIO', true, 'VALIDADO'),
('c0000020-0000-0000-0000-000000000020', 'CERTIFICADO_EVENTOS', 'Certificado cronológico', 'PDF con timeline completo y sellos QTSP', 'CIERRE', 'PLATAFORMA', true, 'VALIDADO');

COMMIT;

-- Verificar todos los contratos
SELECT contrato_id, COUNT(*) as items, 
       SUM(CASE WHEN estado = 'VALIDADO' THEN 1 ELSE 0 END) as validados,
       SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
       SUM(CASE WHEN estado = 'SUBIDO' THEN 1 ELSE 0 END) as subidos
FROM inventario_expediente 
GROUP BY contrato_id
ORDER BY contrato_id;
