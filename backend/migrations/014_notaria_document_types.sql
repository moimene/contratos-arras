-- ============================================
-- MIGRATION 014: Notaría Document Types & Checklist
-- ============================================
-- Extiende inventario_expediente con tipos de documento 
-- del checklist funcional "Notaría y Escritura"
-- Incluye documentos base y condicionales

BEGIN;

-- ============================================
-- 1. Actualizar tipo inventario_documento (enum virtual via CHECK)
-- ============================================

-- Nota: PostgreSQL no permite ALTER ENUM fácilmente en columnas VARCHAR con CHECK
-- Los tipos se validan en la aplicación, aquí definimos los tipos estándar

-- Documentos BASE grupo NOTARIA:
-- MINUTA_ESCRITURA, CONVOCATORIA_NOTARIA, DOC_IDENTIDAD_COMPRADOR, 
-- DOC_IDENTIDAD_VENDEDOR, ESCRITURA_ANTERIOR, NOTA_SIMPLE, IBI,
-- CERTIFICADO_COMUNIDAD, CEE, CONTRATO_ARRAS_FIRMADO, JUSTIFICANTE_ARRAS,
-- MEDIOS_PAGO_RESTO_PRECIO, ESCRITURA_COMPRAVENTA_FIRMADA

-- Documentos CONDICIONALES:
-- DOC_CANCELACION_HIPOTECA, CARTA_PAGO, DOC_ARRENDAMIENTO, 
-- ACUERDO_SUBROGACION, ENTREGA_LIBRE, DOC_URBANISTICO,
-- INVENTARIO_MOBILIARIO, RETENCIONES_EN_PRECIO, DOC_DEPOSITO_ESCROW,
-- DOC_ADECUACION_FORAL

-- ============================================
-- 2. Crear tabla plantilla de documentos notaría
-- ============================================

CREATE TABLE IF NOT EXISTS plantilla_inventario_notaria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Definición del tipo de documento
  tipo VARCHAR(50) NOT NULL UNIQUE,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  
  -- Categorización
  grupo VARCHAR(50) NOT NULL DEFAULT 'NOTARIA' CHECK (grupo IN (
    'INMUEBLE', 'PARTES', 'ARRAS', 'NOTARIA', 'CIERRE', 'POST_FIRMA'
  )),
  
  -- Rol responsable por defecto
  responsable_rol VARCHAR(50) NOT NULL CHECK (responsable_rol IN (
    'COMPRADOR', 'VENDEDOR', 'ASESOR_COMPRADOR', 'ASESOR_VENDEDOR', 
    'NOTARIO', 'PLATAFORMA', 'OTRO'
  )),
  
  -- Obligatoriedad
  obligatorio BOOLEAN DEFAULT true,
  
  -- Condición de activación (JSON para lógica condicional)
  -- null = siempre activo
  -- { "campo": "valor" } = activo si contrato.campo == valor
  -- { "campo": false } = activo si contrato.campo es false
  condicion_activacion JSONB DEFAULT NULL,
  
  -- Validaciones sugeridas (JSON schema)
  validaciones JSONB DEFAULT '{}'::jsonb,
  
  -- Metadatos sugeridos
  metadatos_sugeridos JSONB DEFAULT '{}'::jsonb,
  
  -- Orden de aparición en checklist
  orden INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Poblar plantilla con documentos base
-- ============================================

INSERT INTO plantilla_inventario_notaria 
  (tipo, titulo, descripcion, grupo, responsable_rol, obligatorio, orden, metadatos_sugeridos) 
VALUES
  -- Documentos Base Notaría (13)
  ('MINUTA_ESCRITURA', 
   'Minuta de escritura', 
   'Versión vigente de la minuta de escritura de compraventa',
   'NOTARIA', 'PLATAFORMA', true, 1,
   '{"versionContratoHash": "", "fechaGeneracion": ""}'::jsonb),
  
  ('CONVOCATORIA_NOTARIA', 
   'Convocatoria a notaría', 
   'Registro de convocatoria con fecha/hora y notaría',
   'NOTARIA', 'ASESOR_COMPRADOR', true, 2,
   '{"citaNotariaId": "", "fechaPropuesta": "", "fechaConfirmada": ""}'::jsonb),
  
  ('DOC_IDENTIDAD_COMPRADOR', 
   'Documentación de identidad - Parte compradora', 
   'DNI/NIE/Pasaporte vigente; si persona jurídica, poder o cargo',
   'NOTARIA', 'COMPRADOR', true, 3,
   '{"tipoDoc": "", "caducidad": "", "sociedad": "", "representacion": ""}'::jsonb),
  
  ('DOC_IDENTIDAD_VENDEDOR', 
   'Documentación de identidad - Parte vendedora', 
   'DNI/NIE/Pasaporte vigente; si persona jurídica, poder o cargo',
   'NOTARIA', 'VENDEDOR', true, 4,
   '{"tipoDoc": "", "caducidad": "", "sociedad": "", "representacion": ""}'::jsonb),
  
  ('ESCRITURA_ANTERIOR', 
   'Título de propiedad del transmitente', 
   'Escritura anterior - coherencia con Nota Simple y datos registrales',
   'NOTARIA', 'VENDEDOR', true, 5,
   '{}'::jsonb),
  
  ('NOTA_SIMPLE', 
   'Nota simple vigente', 
   'Nota simple reciente del Registro de la Propiedad',
   'NOTARIA', 'VENDEDOR', true, 6,
   '{"fechaExpedicion": "", "csv": "", "registro": "", "finca": "", "cruIdufir": ""}'::jsonb),
  
  ('IBI', 
   'Recibo IBI último ejercicio', 
   'Recibo del Impuesto sobre Bienes Inmuebles del ejercicio correcto',
   'NOTARIA', 'VENDEDOR', true, 7,
   '{"ejercicio": "", "direccionFinca": ""}'::jsonb),
  
  ('CERTIFICADO_COMUNIDAD', 
   'Certificado de comunidad (deudas)', 
   'Emitido por administración; estado de deudas; identificación finca',
   'NOTARIA', 'VENDEDOR', true, 8,
   '{"fechaEmision": "", "estadoDeudas": "", "finca": ""}'::jsonb),
  
  ('CEE', 
   'Certificado de eficiencia energética', 
   'CEE con código registro y fecha emisión válidos',
   'NOTARIA', 'VENDEDOR', true, 9,
   '{"codigoRegistro": "", "fechaEmision": "", "validezHasta": ""}'::jsonb),
  
  ('CONTRATO_ARRAS_FIRMADO', 
   'Contrato de arras firmado', 
   'Coincide con versión aceptada; íntegro y legible',
   'NOTARIA', 'PLATAFORMA', true, 10,
   '{"versionHash": "", "fechaFirma": ""}'::jsonb),
  
  ('JUSTIFICANTE_ARRAS', 
   'Justificante de pago de arras', 
   'Datos de transferencia; importe; fecha ≤ límite pactado',
   'NOTARIA', 'COMPRADOR', true, 11,
   '{"importe": 0, "fechaPago": "", "referencia": "", "banco": "", "subtotalAcreditado": 0}'::jsonb),
  
  ('MEDIOS_PAGO_RESTO_PRECIO', 
   'Medios de pago del resto del precio', 
   'Justificantes bancarios/burofax de instrucciones; trazabilidad',
   'NOTARIA', 'COMPRADOR', true, 12,
   '{"tipo": "", "importe": 0, "entidad": ""}'::jsonb),
  
  ('ESCRITURA_COMPRAVENTA_FIRMADA', 
   'Escritura de compraventa (copia simple)', 
   'Documento íntegro tras firma en notaría',
   'POST_FIRMA', 'NOTARIO', true, 13,
   '{"fechaOtorgamiento": "", "notaria": "", "protocolo": ""}'::jsonb);

-- ============================================
-- 4. Poblar documentos CONDICIONALES
-- ============================================

INSERT INTO plantilla_inventario_notaria 
  (tipo, titulo, descripcion, grupo, responsable_rol, obligatorio, condicion_activacion, orden, metadatos_sugeridos) 
VALUES
  -- Hipoteca pendiente (si sinHipoteca = false)
  ('DOC_CANCELACION_HIPOTECA', 
   'Cancelación de hipoteca / Carta de pago', 
   'Entidad, n.º carga, saldo/cancelación; retención del precio si aplica',
   'NOTARIA', 'VENDEDOR', true,
   '{"sinHipoteca": false}'::jsonb, 20,
   '{"entidadAcreedora": "", "numeroCarga": "", "importeRetencion": 0}'::jsonb),
  
  -- Arrendamiento (si sinArrendatarios = false)
  ('DOC_ARRENDAMIENTO', 
   'Documentación arrendamiento', 
   'Contrato vigente, comunicaciones a arrendatario, renuncias/tanteos',
   'NOTARIA', 'VENDEDOR', true,
   '{"sinArrendatarios": false}'::jsonb, 21,
   '{"tipoContrato": "", "fechaVencimiento": "", "renuciaTanteo": false}'::jsonb),
  
  -- Subrogación arrendamiento
  ('ACUERDO_SUBROGACION', 
   'Acuerdo de subrogación arrendamiento', 
   'Si el comprador asume el contrato de arrendamiento existente',
   'NOTARIA', 'VENDEDOR', true,
   '{"subrogacionArrendamiento": true}'::jsonb, 22,
   '{}'::jsonb),
  
  -- Mobiliario/Equipamiento (si mobiliarioEquipamiento = true)
  ('INVENTARIO_MOBILIARIO', 
   'Inventario de mobiliario/equipamiento', 
   'Listado firmado o aceptado por ambas partes',
   'NOTARIA', 'VENDEDOR', true,
   '{"mobiliarioEquipamiento": true}'::jsonb, 23,
   '{"valorEstimado": 0, "items": []}'::jsonb),
  
  -- Retenciones en precio (si retenciones.activa = true)
  ('RETENCIONES_EN_PRECIO', 
   'Retenciones/provisiones en precio', 
   'Base y cuantía de retención; reflejo en minuta/escritura',
   'NOTARIA', 'ASESOR_VENDEDOR', true,
   '{"retenciones": {"activa": true}}'::jsonb, 24,
   '{"conceptos": [], "importeTotal": 0}'::jsonb),
  
  -- Escrow (si escrow = true)
  ('DOC_DEPOSITO_ESCROW', 
   'Depósito notarial / Escrow', 
   'Resguardo, condiciones de liberación, concordancia con contrato',
   'NOTARIA', 'COMPRADOR', true,
   '{"escrow": true}'::jsonb, 25,
   '{"entidadEscrow": "", "importe": 0, "condicionesLiberacion": ""}'::jsonb),
  
  -- Territorio foral
  ('DOC_ADECUACION_FORAL', 
   'Documentación territorio foral', 
   'Criterio local aplicable, cláusulas adaptadas (Navarra, Euskadi, Aragón)',
   'NOTARIA', 'ASESOR_VENDEDOR', true,
   '{"derecho": "FORAL_"}'::jsonb, 26,
   '{"territorioForal": "", "clausulasAdaptadas": []}'::jsonb),
  
  -- Documentos urbanísticos
  ('DOC_URBANISTICO', 
   'Documentos urbanísticos/administrativos', 
   'Licencias, certificados urbanísticos, órdenes de ejecución',
   'NOTARIA', 'VENDEDOR', false,
   NULL, 27,
   '{"tipo": "", "fechaEmision": "", "numero": ""}'::jsonb);

-- ============================================
-- 5. Índices
-- ============================================

CREATE INDEX IF NOT EXISTS idx_plantilla_notaria_tipo ON plantilla_inventario_notaria(tipo);
CREATE INDEX IF NOT EXISTS idx_plantilla_notaria_grupo ON plantilla_inventario_notaria(grupo);
CREATE INDEX IF NOT EXISTS idx_plantilla_notaria_orden ON plantilla_inventario_notaria(orden);

-- ============================================
-- 6. Función para generar inventario notaría
-- ============================================

CREATE OR REPLACE FUNCTION generar_inventario_notaria(
  p_contrato_id UUID,
  p_datos_contrato JSONB DEFAULT '{}'::jsonb
) RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_item RECORD;
  v_condicion_ok BOOLEAN;
  v_campo TEXT;
  v_valor_esperado JSONB;
  v_valor_contrato JSONB;
BEGIN
  FOR v_item IN 
    SELECT * FROM plantilla_inventario_notaria 
    WHERE grupo IN ('NOTARIA', 'POST_FIRMA')
    ORDER BY orden
  LOOP
    -- Verificar condición de activación
    v_condicion_ok := true;
    
    IF v_item.condicion_activacion IS NOT NULL THEN
      -- Iterar sobre las condiciones
      FOR v_campo, v_valor_esperado IN 
        SELECT * FROM jsonb_each(v_item.condicion_activacion)
      LOOP
        -- Obtener valor del contrato
        v_valor_contrato := p_datos_contrato -> v_campo;
        
        -- Manejar condición especial FORAL_*
        IF v_valor_esperado::text = '"FORAL_"' THEN
          IF v_valor_contrato IS NULL OR 
             NOT (v_valor_contrato::text LIKE '%FORAL_%') THEN
            v_condicion_ok := false;
          END IF;
        -- Manejar condición objeto anidado (retenciones.activa)
        ELSIF jsonb_typeof(v_valor_esperado) = 'object' THEN
          -- Comparar objeto anidado
          IF v_valor_contrato IS NULL OR 
             NOT (v_valor_contrato @> v_valor_esperado) THEN
            v_condicion_ok := false;
          END IF;
        ELSE
          -- Comparación directa
          IF v_valor_contrato IS NULL OR v_valor_contrato != v_valor_esperado THEN
            v_condicion_ok := false;
          END IF;
        END IF;
        
        EXIT WHEN NOT v_condicion_ok;
      END LOOP;
    END IF;
    
    -- Insertar si cumple condición
    IF v_condicion_ok THEN
      INSERT INTO inventario_expediente (
        contrato_id, tipo, titulo, descripcion, grupo, 
        responsable_rol, obligatorio, metadatos_extra, estado
      ) VALUES (
        p_contrato_id,
        v_item.tipo,
        v_item.titulo,
        v_item.descripcion,
        v_item.grupo,
        v_item.responsable_rol,
        v_item.obligatorio,
        v_item.metadatos_sugeridos,
        'PENDIENTE'
      )
      ON CONFLICT DO NOTHING;
      
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Actualizar grupo POST_FIRMA en CHECK
-- ============================================

-- Nota: El CHECK constraint ya incluye POST_FIRMA? Si no, añadirlo
-- ALTER TABLE inventario_expediente DROP CONSTRAINT IF EXISTS inventario_expediente_grupo_check;
-- ALTER TABLE inventario_expediente ADD CONSTRAINT inventario_expediente_grupo_check 
--   CHECK (grupo IN ('INMUEBLE', 'PARTES', 'ARRAS', 'NOTARIA', 'CIERRE', 'POST_FIRMA'));

COMMIT;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver plantilla creada
SELECT tipo, titulo, obligatorio, 
       condicion_activacion IS NOT NULL as es_condicional,
       orden
FROM plantilla_inventario_notaria 
ORDER BY orden;

-- Probar función (ejemplo con contrato ficticio sin condiciones especiales)
-- SELECT generar_inventario_notaria(
--   'c0000018-0000-0000-0000-000000000018'::uuid,
--   '{"sinHipoteca": true, "sinArrendatarios": true}'::jsonb
-- );
