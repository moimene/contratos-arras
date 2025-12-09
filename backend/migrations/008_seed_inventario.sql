-- ============================================
-- MIGRATION 008: Seed Checklist por Defecto
-- ============================================
-- Crea ítems de inventario para los 20 contratos demo
-- según su estado y los bloques A-E de la Directiva #003

BEGIN;

-- ============================================
-- CONTRATOS 1-5 (INICIADO): Items preliminares
-- Bloques A y B parciales
-- ============================================

-- Contrato 1 - INICIADO
INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio) VALUES
('c0000001-0000-0000-0000-000000000001', 'NOTA_SIMPLE', 'Nota Simple vigente', 'Nota simple del Registro de la Propiedad con fecha inferior a 3 meses', 'INMUEBLE', 'VENDEDOR', true),
('c0000001-0000-0000-0000-000000000001', 'DNI_VENDEDOR', 'DNI/NIE Vendedor', 'Documento de identidad del vendedor', 'PARTES', 'VENDEDOR', true),
('c0000001-0000-0000-0000-000000000001', 'DNI_COMPRADOR', 'DNI/NIE Comprador', 'Documento de identidad del comprador', 'PARTES', 'COMPRADOR', true);

-- Contrato 2 - INICIADO
INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio) VALUES
('c0000002-0000-0000-0000-000000000002', 'NOTA_SIMPLE', 'Nota Simple vigente', 'Nota simple del Registro', 'INMUEBLE', 'VENDEDOR', true),
('c0000002-0000-0000-0000-000000000002', 'DNI_VENDEDOR', 'DNI/NIE Vendedor', 'Documento identidad vendedor', 'PARTES', 'VENDEDOR', true),
('c0000002-0000-0000-0000-000000000002', 'DNI_COMPRADOR', 'DNI/NIE Comprador', 'Documento identidad comprador', 'PARTES', 'COMPRADOR', true);

-- ============================================
-- CONTRATOS 6-10 (BORRADOR): + Bloque C parcial
-- ============================================

-- Contrato 6 - BORRADOR
INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio, estado) VALUES
('c0000006-0000-0000-0000-000000000006', 'NOTA_SIMPLE', 'Nota Simple vigente', 'Nota simple del Registro', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000006-0000-0000-0000-000000000006', 'IBI', 'Último recibo IBI', 'Recibo del Impuesto sobre Bienes Inmuebles', 'INMUEBLE', 'VENDEDOR', true, 'SUBIDO'),
('c0000006-0000-0000-0000-000000000006', 'DNI_VENDEDOR', 'DNI/NIE Vendedor', 'Documento identidad', 'PARTES', 'VENDEDOR', true, 'VALIDADO'),
('c0000006-0000-0000-0000-000000000006', 'DNI_COMPRADOR', 'DNI/NIE Comprador', 'Documento identidad', 'PARTES', 'COMPRADOR', true, 'VALIDADO'),
('c0000006-0000-0000-0000-000000000006', 'CONTRATO_ARRAS_BORRADOR', 'Borrador contrato arras', 'PDF generado por la plataforma', 'ARRAS', 'PLATAFORMA', true, 'VALIDADO');

-- Contrato 7 - BORRADOR
INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio, estado) VALUES
('c0000007-0000-0000-0000-000000000007', 'NOTA_SIMPLE', 'Nota Simple vigente', 'Nota simple', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000007-0000-0000-0000-000000000007', 'DNI_VENDEDOR', 'DNI/NIE Vendedor', 'Documento identidad', 'PARTES', 'VENDEDOR', true, 'VALIDADO'),
('c0000007-0000-0000-0000-000000000007', 'DNI_COMPRADOR', 'DNI/NIE Comprador', 'Documento identidad', 'PARTES', 'COMPRADOR', true, 'SUBIDO'),
('c0000007-0000-0000-0000-000000000007', 'CONTRATO_ARRAS_BORRADOR', 'Borrador contrato arras', 'PDF borrador', 'ARRAS', 'PLATAFORMA', true, 'VALIDADO');

-- ============================================
-- CONTRATOS 11-16 (FIRMADO): + Bloque C completo
-- ============================================

-- Contrato 11 - FIRMADO (ejemplo completo)
INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio, estado, fecha_subida, fecha_validacion) VALUES
('c0000011-0000-0000-0000-000000000011', 'NOTA_SIMPLE', 'Nota Simple vigente', 'Nota simple Registro de la Propiedad', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),
('c0000011-0000-0000-0000-000000000011', 'ESCRITURA_ANTERIOR', 'Escritura de propiedad', 'Escritura de adquisición del inmueble', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO', NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days'),
('c0000011-0000-0000-0000-000000000011', 'IBI', 'Último recibo IBI', 'Recibo IBI año en curso', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days'),
('c0000011-0000-0000-0000-000000000011', 'CEE', 'Certificado Eficiencia Energética', 'CEE vigente', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'),
('c0000011-0000-0000-0000-000000000011', 'DNI_VENDEDOR', 'DNI/NIE Vendedor', 'Documento identidad vendedor', 'PARTES', 'VENDEDOR', true, 'VALIDADO', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),
('c0000011-0000-0000-0000-000000000011', 'DNI_COMPRADOR', 'DNI/NIE Comprador', 'Documento identidad comprador', 'PARTES', 'COMPRADOR', true, 'VALIDADO', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),
('c0000011-0000-0000-0000-000000000011', 'CONTRATO_ARRAS_BORRADOR', 'Borrador contrato arras', 'PDF borrador generado', 'ARRAS', 'PLATAFORMA', true, 'VALIDADO', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days'),
('c0000011-0000-0000-0000-000000000011', 'CONTRATO_ARRAS_FIRMADO', 'Contrato arras firmado', 'PDF con firmas electrónicas', 'ARRAS', 'PLATAFORMA', true, 'VALIDADO', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('c0000011-0000-0000-0000-000000000011', 'JUSTIFICANTE_PAGO_ARRAS', 'Justificante pago arras', 'Transferencia de 36.500€', 'ARRAS', 'COMPRADOR', true, 'PENDIENTE', NULL, NULL);

-- Contrato 12 - FIRMADO
INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio, estado) VALUES
('c0000012-0000-0000-0000-000000000012', 'NOTA_SIMPLE', 'Nota Simple vigente', 'Nota simple', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000012-0000-0000-0000-000000000012', 'IBI', 'Último recibo IBI', 'Recibo IBI', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000012-0000-0000-0000-000000000012', 'DNI_VENDEDOR', 'DNI Vendedor', 'Documento identidad', 'PARTES', 'VENDEDOR', true, 'VALIDADO'),
('c0000012-0000-0000-0000-000000000012', 'DNI_COMPRADOR', 'DNI Comprador', 'Documento identidad', 'PARTES', 'COMPRADOR', true, 'VALIDADO'),
('c0000012-0000-0000-0000-000000000012', 'CONTRATO_ARRAS_FIRMADO', 'Contrato arras firmado', 'PDF firmado', 'ARRAS', 'PLATAFORMA', true, 'VALIDADO'),
('c0000012-0000-0000-0000-000000000012', 'JUSTIFICANTE_PAGO_ARRAS', 'Justificante pago arras', 'Pendiente subir', 'ARRAS', 'COMPRADOR', true, 'PENDIENTE');

-- ============================================
-- CONTRATOS 17-18 (NOTARIA): + Bloque D
-- ============================================

-- Contrato 17 - NOTARIA
INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio, estado) VALUES
('c0000017-0000-0000-0000-000000000017', 'NOTA_SIMPLE', 'Nota Simple vigente', 'Nota simple', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000017-0000-0000-0000-000000000017', 'ESCRITURA_ANTERIOR', 'Escritura propiedad', 'Escritura actual', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000017-0000-0000-0000-000000000017', 'IBI', 'Recibo IBI', 'Último recibo', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000017-0000-0000-0000-000000000017', 'COMUNIDAD', 'Certificado deudas comunidad', 'Certificado del administrador', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000017-0000-0000-0000-000000000017', 'CEE', 'Certificado Eficiencia Energética', 'CEE vigente', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000017-0000-0000-0000-000000000017', 'DNI_VENDEDOR', 'DNI Vendedor', 'Documento identidad', 'PARTES', 'VENDEDOR', true, 'VALIDADO'),
('c0000017-0000-0000-0000-000000000017', 'DNI_COMPRADOR', 'DNI Comprador', 'Documento identidad', 'PARTES', 'COMPRADOR', true, 'VALIDADO'),
('c0000017-0000-0000-0000-000000000017', 'CONTRATO_ARRAS_FIRMADO', 'Contrato arras firmado', 'PDF firmado', 'ARRAS', 'PLATAFORMA', true, 'VALIDADO'),
('c0000017-0000-0000-0000-000000000017', 'JUSTIFICANTE_PAGO_ARRAS', 'Justificante pago arras', 'Transferencia confirmada', 'ARRAS', 'COMPRADOR', true, 'VALIDADO'),
('c0000017-0000-0000-0000-000000000017', 'CONVOCATORIA_NOTARIA', 'Convocatoria a notaría', 'Cita programada 15/01/2026', 'NOTARIA', 'PLATAFORMA', true, 'VALIDADO'),
('c0000017-0000-0000-0000-000000000017', 'MINUTA_ESCRITURA', 'Minuta de escritura', 'Borrador escritura compraventa', 'NOTARIA', 'NOTARIO', true, 'SUBIDO'),
('c0000017-0000-0000-0000-000000000017', 'ESCRITURA_COMPRAVENTA', 'Escritura de compraventa', 'Pendiente firma en notaría', 'NOTARIA', 'NOTARIO', true, 'PENDIENTE');

-- ============================================
-- CONTRATOS 19-20 (TERMINADO): + Bloque E
-- ============================================

-- Contrato 19 - TERMINADO
INSERT INTO inventario_expediente (contrato_id, tipo, titulo, descripcion, grupo, responsable_rol, obligatorio, estado) VALUES
('c0000019-0000-0000-0000-000000000019', 'NOTA_SIMPLE', 'Nota Simple', 'Nota simple', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000019-0000-0000-0000-000000000019', 'ESCRITURA_ANTERIOR', 'Escritura propiedad', 'Escritura antigua', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000019-0000-0000-0000-000000000019', 'IBI', 'Recibo IBI', 'Recibo IBI', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000019-0000-0000-0000-000000000019', 'CEE', 'CEE', 'Certificado energético', 'INMUEBLE', 'VENDEDOR', true, 'VALIDADO'),
('c0000019-0000-0000-0000-000000000019', 'DNI_VENDEDOR', 'DNI Vendedor', 'DNI', 'PARTES', 'VENDEDOR', true, 'VALIDADO'),
('c0000019-0000-0000-0000-000000000019', 'DNI_COMPRADOR', 'DNI Comprador', 'DNI', 'PARTES', 'COMPRADOR', true, 'VALIDADO'),
('c0000019-0000-0000-0000-000000000019', 'CONTRATO_ARRAS_FIRMADO', 'Contrato arras', 'Firmado', 'ARRAS', 'PLATAFORMA', true, 'VALIDADO'),
('c0000019-0000-0000-0000-000000000019', 'JUSTIFICANTE_PAGO_ARRAS', 'Justificante arras', 'Pagado', 'ARRAS', 'COMPRADOR', true, 'VALIDADO'),
('c0000019-0000-0000-0000-000000000019', 'MINUTA_ESCRITURA', 'Minuta escritura', 'Aprobada', 'NOTARIA', 'NOTARIO', true, 'VALIDADO'),
('c0000019-0000-0000-0000-000000000019', 'ESCRITURA_COMPRAVENTA', 'Escritura compraventa', 'Firmada en notaría el 25/11/2025', 'NOTARIA', 'NOTARIO', true, 'VALIDADO'),
('c0000019-0000-0000-0000-000000000019', 'CERTIFICADO_EVENTOS', 'Certificado cronológico', 'PDF con timeline completo y sellos QTSP', 'CIERRE', 'PLATAFORMA', true, 'VALIDADO');

COMMIT;

-- Verificar inventario
SELECT contrato_id, COUNT(*) as items, 
       SUM(CASE WHEN estado = 'VALIDADO' THEN 1 ELSE 0 END) as validados,
       SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes
FROM inventario_expediente 
GROUP BY contrato_id
ORDER BY contrato_id;
