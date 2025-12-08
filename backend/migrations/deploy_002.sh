#!/bin/bash

# ================================================
# Script de Deployment: Migration 002
# ================================================
# Ejecuta la migración 002 en Supabase
# Fecha: 2025-12-08

set -e  # Exit on error

echo "================================================"
echo "🚀 Deployment: Migration 002 - Firma y Terminación"
echo "================================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que existe el archivo de migración
if [ ! -f "002_firma_y_terminacion.sql" ]; then
  echo -e "${RED}❌ Error: No se encuentra el archivo 002_firma_y_terminacion.sql${NC}"
  echo "Ejecuta este script desde el directorio backend/migrations/"
  exit 1
fi

echo -e "${YELLOW}📋 Archivo de migración encontrado${NC}"
echo ""

# Opción 1: Deployment con Supabase CLI
echo "================================================"
echo "Opción 1: Supabase CLI (Recomendado)"
echo "================================================"
echo ""
echo "Si tienes Supabase CLI instalado, ejecuta:"
echo ""
echo -e "${GREEN}  supabase db push${NC}"
echo ""
echo "O aplica directamente este archivo:"
echo ""
echo -e "${GREEN}  supabase db execute -f 002_firma_y_terminacion.sql${NC}"
echo ""

# Opción 2: Manual via Dashboard
echo "================================================"
echo "Opción 2: Supabase Dashboard (Manual)"
echo "================================================"
echo ""
echo "1. Abre https://supabase.com/dashboard"
echo "2. Ve a tu proyecto > SQL Editor"
echo "3. Crea una nueva query"
echo "4. Copia y pega el contenido de 002_firma_y_terminacion.sql"
echo "5. Ejecuta (Run)"
echo ""

# Opción 3: Via psql
echo "================================================"
echo "Opción 3: PostgreSQL CLI (psql)"
echo "================================================"
echo ""
echo "Si tienes acceso directo a la BD:"
echo ""
echo -e "${GREEN}  psql \$DATABASE_URL -f 002_firma_y_terminacion.sql${NC}"
echo ""

# Verificación
echo "================================================"
echo "📊 Queries de Verificación"
echo "================================================"
echo ""
echo "Después de ejecutar la migración, verifica con:"
echo ""
echo "-- Ver nuevas tablas"
echo "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%firma%' OR tablename LIKE '%cita%' OR tablename LIKE '%acta%';"
echo ""
echo "-- Ver nuevos estados"
echo "SELECT unnest(enum_range(NULL::estado_contrato));"
echo ""
echo "-- Ver nuevos tipos de evento"
echo "SELECT unnest(enum_range(NULL::tipo_evento));"
echo ""
echo "-- Contar registros en nuevas tablas"
echo "SELECT 'firmas_electronicas' as tabla, COUNT(*) FROM firmas_electronicas"
echo "UNION ALL SELECT 'citas_notariales', COUNT(*) FROM citas_notariales"
echo "UNION ALL SELECT 'checklist_documentos', COUNT(*) FROM checklist_documentos"
echo "UNION ALL SELECT 'actas_no_comparecencia', COUNT(*) FROM actas_no_comparecencia"
echo "UNION ALL SELECT 'alegaciones', COUNT(*) FROM alegaciones"
echo "UNION ALL SELECT 'certificados', COUNT(*) FROM certificados;"
echo ""

echo "================================================"
echo -e "${GREEN}✅ Instrucciones de deployment preparadas${NC}"
echo "================================================"
echo ""
echo "Elige la opción que mejor se adapte a tu entorno."
echo ""
