#!/bin/bash

echo "==================================================="
echo "🏠 Creando Contrato Completo de Ejemplo"
echo "==================================================="
echo ""

# 1. Crear contrato completo
echo "1️⃣  Creando contrato con inmueble completo..."
CONTRATO=$(curl -s -X POST http://localhost:4000/api/contratos \
  -H "Content-Type: application/json" \
  -d '{
    "inmueble": {
      "direccion_completa": "Paseo de la Castellana, 123, 4º A",
      "codigo_postal": "28046",
      "ciudad": "Madrid",
      "provincia": "Madrid",
      "referencia_catastral": "1234567VK4812N0001AB",
      "datos_registrales": "Registro de la Propiedad nº 3 de Madrid, Tomo 2456, Libro 789, Folio 123, Finca 45678",
      "titulo_adquisicion_vendedor": "Compraventa mediante escritura pública de fecha 15/03/2020",
      "m2": 120,
      "habitaciones": 3,
      "banos": 2,
      "datos_descripcion": "Piso exterior con terraza de 15m², cocina equipada, calefacción central, ascensor"
    },
    "contrato": {
      "tipo_arras": "PENITENCIALES",
      "precio_total": 450000,
      "importe_arras": 45000,
      "moneda": "EUR",
      "fecha_limite_firma_escritura": "2025-07-15T00:00:00Z",
      "forma_pago_arras": "AL_FIRMAR",
      "iban_vendedor": "ES9121000418450200051332",
      "banco_vendedor": "La Caixa - Oficina Castellana",
      "notario_designado_nombre": "Dña. María José Martínez García",
      "notario_designado_direccion": "Calle de Serrano, 45, 28001 Madrid",
      "gastos_quien": "LEY",
      "via_resolucion": "JUZGADOS",
      "firma_preferida": "ELECTRONICA",
      "condicion_suspensiva_texto": "Sujeto a la concesión de hipoteca por importe de 360.000 EUR",
      "observaciones": "El comprador se compromete a respetar el contrato de alquiler vigente hasta el 31/08/2025"
    }
  }')

CONTRATO_ID=$(echo "$CONTRATO" | jq -r '.id')
echo "✅ Contrato creado: $CONTRATO_ID"
echo ""

# 2. Crear comprador
echo "2️⃣  Creando comprador..."
COMPRADOR=$(curl -s -X POST http://localhost:4000/api/partes \
  -H "Content-Type: application/json" \
  -d '{
    "rol": "COMPRADOR",
    "nombre": "Juan Carlos",
    "apellidos": "García Fernández",
    "estado_civil": "Casado en régimen de gananciales",
    "tipo_documento": "DNI",
    "numero_documento": "52345678X",
    "email": "juan.garcia@email.com",
    "telefono": "+34 655 123 456",
    "domicilio": "Calle de Alcalá, 234, 2º B, 28028 Madrid",
    "es_representante": false
  }')

COMPRADOR_ID=$(echo "$COMPRADOR" | jq -r '.id')
echo "✅ Comprador creado: Juan Carlos García Fernández"
echo ""

# 3. Crear vendedor
echo "3️⃣  Creando vendedor..."
VENDEDOR=$(curl -s -X POST http://localhost:4000/api/partes \
  -H "Content-Type: application/json" \
  -d '{
    "rol": "VENDEDOR",
    "nombre": "Ana María",
    "apellidos": "López Rodríguez",
    "estado_civil": "Divorciada",
    "tipo_documento": "DNI",
    "numero_documento": "48765432Y",
    "email": "ana.lopez@email.com",
    "telefono": "+34 622 987 654",
    "domicilio": "Avenida de América, 56, 5º C, 28002 Madrid",
    "es_representante": false
  }')

VENDEDOR_ID=$(echo "$VENDEDOR" | jq -r '.id')
echo "✅ Vendedor creado: Ana María López Rodríguez"
echo ""

# 4. Vincular comprador
echo "4️⃣  Vinculando comprador al contrato..."
curl -s -X POST "http://localhost:4000/api/contratos/$CONTRATO_ID/partes" \
  -H "Content-Type: application/json" \
  -d "{
    \"parteId\": \"$COMPRADOR_ID\",
    \"rolEnContrato\": \"COMPRADOR\",
    \"obligadoAceptar\": true,
    \"obligadoFirmar\": true,
    \"porcentajePropiedad\": 100
  }" > /dev/null
echo "✅ Comprador vinculado"
echo ""

# 5. Vincular vendedor
echo "5️⃣  Vinculando vendedor al contrato..."
curl -s -X POST "http://localhost:4000/api/contratos/$CONTRATO_ID/partes" \
  -H "Content-Type: application/json" \
  -d "{
    \"parteId\": \"$VENDEDOR_ID\",
    \"rolEnContrato\": \"VENDEDOR\",
    \"obligadoAceptar\": true,
    \"obligadoFirmar\": true,
    \"porcentajePropiedad\": 0
  }" > /dev/null
echo "✅ Vendedor vinculado"
echo ""

# 6. Ver contrato completo
echo "6️⃣  Contrato completo:"
curl -s "http://localhost:4000/api/contratos/$CONTRATO_ID" | jq '{
  contrato: .contrato | {
    id,
    estado,
    tipo_arras,
    precio_total,
    importe_arras,
    porcentaje_arras_calculado,
    notario: .notario_designado_nombre,
    condicion_suspensiva: .condicion_suspensiva_texto
  },
  inmueble: .inmueble | {
    direccion: .direccion_completa,
    m2,
    habitaciones,
    banos,
    catastro: .referencia_catastral
  },
  partes: .partes | map({
    nombre: (.parte.nombre + " " + .parte.apellidos),
    rol: .rol_en_contrato,
    dni: .parte.numero_documento,
    email: .parte.email
  })
}'
echo ""

# 7. Generar PDF borrador
echo "7️⃣  Generando PDF borrador completo..."
curl -s "http://localhost:4000/api/pdf/$CONTRATO_ID/borrador" \
  -o /Users/moisesmenendez/.gemini/antigravity/brain/78348be5-9a2e-4614-924d-576c727c2401/contrato-completo.pdf

PDF_SIZE=$(ls -lh /Users/moisesmenendez/.gemini/antigravity/brain/78348be5-9a2e-4614-924d-576c727c2401/contrato-completo.pdf | awk '{print $5}')
echo "✅ PDF generado: contrato-completo.pdf ($PDF_SIZE)"
echo ""

echo "==================================================="
echo "✅ Contrato completo creado!"
echo "==================================================="
echo ""
echo "📄 Contrato ID: $CONTRATO_ID"
echo "🏠 Inmueble: Paseo de la Castellana, 123, 4º A"
echo "💰 Precio: 450.000 EUR (45.000 EUR arras - 10%)"
echo "👤 Comprador: Juan Carlos García Fernández"
echo "👤 Vendedor: Ana María López Rodríguez"
echo "📝 PDF: contrato-completo.pdf"
echo ""
