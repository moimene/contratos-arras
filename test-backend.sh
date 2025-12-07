#!/bin/bash

echo "==================================================="
echo "🧪 Testing Backend - Sistema de Contratos de Arras"
echo "==================================================="
echo ""

echo "1️⃣  Testing Root Endpoint..."
curl -s http://localhost:4000/ | jq '.'
echo ""

echo "2️⃣  Testing Health Check..."
curl -s http://localhost:4000/api/health | jq '.'
echo ""

echo "3️⃣  Testing GET /api/contratos (should be empty)..."
curl -s http://localhost:4000/api/contratos | jq '.'
echo ""

echo "4️⃣  Testing GET /api/partes (should be empty)..."
curl -s http://localhost:4000/api/partes | jq '.'
echo ""

echo "5️⃣  Creating a test contract..."
RESPONSE=$(curl -s -X POST http://localhost:4000/api/contratos \
  -H "Content-Type: application/json" \
  -d '{
    "inmueble": {
      "direccion_completa": "Calle Mayor 123, 4º A",
      "codigo_postal": "28001",
      "ciudad": "Madrid",
      "provincia": "Madrid",
      "referencia_catastral": "1234567890ABCD",
      "datos_registrales": "Registro de la Propiedad nº 1 de Madrid"
    },
    "contrato": {
      "tipo_arras": "PENITENCIALES",
      "precio_total": 250000,
      "importe_arras": 25000,
      "moneda": "EUR",
      "fecha_limite_firma_escritura": "2025-06-30T00:00:00Z",
      "forma_pago_arras": "AL_FIRMAR",
      "gastos_quien": "LEY",
      "via_resolucion": "JUZGADOS",
      "firma_preferida": "ELECTRONICA"
    }
  }')

echo "$RESPONSE" | jq '.'
CONTRATO_ID=$(echo "$RESPONSE" | jq -r '.id')
echo ""
echo "✅ Contrato creado con ID: $CONTRATO_ID"
echo ""

if [ "$CONTRATO_ID" != "null" ] && [ ! -z "$CONTRATO_ID" ]; then
  echo "6️⃣  Getting the created contract..."
  curl -s "http://localhost:4000/api/contratos/$CONTRATO_ID" | jq '.'
  echo ""
  
  echo "7️⃣  Creating a buyer (parte)..."
  BUYER_RESPONSE=$(curl -s -X POST http://localhost:4000/api/partes \
    -H "Content-Type: application/json" \
    -d '{
      "rol": "COMPRADOR",
      "nombre": "María",
      "apellidos": "González López",
      "estado_civil": "Soltera",
      "tipo_documento": "DNI",
      "numero_documento": "12345678A",
      "email": "maria@example.com",
      "telefono": "+34 600 123 456",
      "domicilio": "Calle Ejemplo 45, Madrid",
      "es_representante": false
    }')
  
  echo "$BUYER_RESPONSE" | jq '.'
  BUYER_ID=$(echo "$BUYER_RESPONSE" | jq -r '.id')
  echo ""
  echo "✅ Comprador creado con ID: $BUYER_ID"
  echo ""
  
  if [ "$BUYER_ID" != "null" ] && [ ! -z "$BUYER_ID" ]; then
    echo "8️⃣  Linking buyer to contract..."
    curl -s -X POST "http://localhost:4000/api/contratos/$CONTRATO_ID/partes" \
      -H "Content-Type: application/json" \
      -d "{
        \"parteId\": \"$BUYER_ID\",
        \"rolEnContrato\": \"COMPRADOR\",
        \"obligadoAceptar\": true,
        \"obligadoFirmar\": true,
        \"porcentajePropiedad\": 100
      }" | jq '.'
    echo ""
  fi
fi

echo "==================================================="
echo "✅ All tests completed!"
echo "==================================================="
