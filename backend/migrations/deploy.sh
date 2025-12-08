#!/bin/bash

# =====================================================
# Script de Deployment de Migración a Supabase
# =====================================================

set -e  # Exit on error

echo "=================================================="
echo "🚀 Deployment de Migración - LegalOps Platform"
echo "=================================================="
echo ""

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✓ Variables de entorno cargadas"
else
    echo "❌ Error: Archivo .env no encontrado"
    exit 1
fi

# Verificar que tenemos SUPABASE_URL y SUPABASE_SERVICE_KEY
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "❌ Error: SUPABASE_URL o SUPABASE_SERVICE_KEY no están configuradas"
    echo "   Por favor, configura estas variables en tu archivo .env"
    exit 1
fi

echo "📡 Conectando a Supabase..."
echo "   URL: $SUPABASE_URL"
echo ""

# Extraer el project_id de la URL de Supabase
PROJECT_REF=$(echo $SUPABASE_URL | sed -n 's/.*\/\/\([^.]*\).*/\1/p')

echo "🔍 Project Reference: $PROJECT_REF"
echo ""

# Preguntar al usuario si quiere continuar
read -p "¿Deseas ejecutar la migración? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migración cancelada"
    exit 0
fi

echo ""
echo "📋 Ejecutando migración SQL..."
echo ""

# Opción 1: Si tienes Supabase CLI instalada
if command -v supabase &> /dev/null; then
    echo "✓ Usando Supabase CLI"
    supabase db push
    
# Opción 2: Usando psql directamente (si tienes acceso)
elif command -v psql &> /dev/null; then
    echo "✓ Usando psql"
    
    # Nota: Necesitarás la connection string de Supabase
    # Formato: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
    
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ Error: DATABASE_URL no está configurada"
        echo "   Obtén la connection string desde Supabase Dashboard → Settings → Database"
        exit 1
    fi
    
    psql "$DATABASE_URL" -f migrations/001_lifecycle_evolution.sql
    
# Opción 3: Manual - mostrar instrucciones
else
    echo "⚠️  No se encontró Supabase CLI ni psql"
    echo ""
    echo "📝 PASOS MANUALES:"
    echo ""
    echo "1. Ve a tu Supabase Dashboard:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_REF/editor"
    echo ""
    echo "2. Ve a la sección SQL Editor"
    echo ""
    echo "3. Copia el contenido del archivo:"
    echo "   backend/migrations/001_lifecycle_evolution.sql"
    echo ""
    echo "4. Pégalo en el editor y ejecuta"
    echo ""
    echo "5. Verifica que no haya errores"
    echo ""
    
    read -p "Presiona ENTER cuando hayas completado la migración manual..."
fi

echo ""
echo "✅ Migración completada"
echo ""

# Verificación
echo "🔍 Verificando cambios..."
echo ""
echo "Puedes ejecutar estas queries en Supabase SQL Editor para verificar:"
echo ""
echo "-- Ver columnas de contratos_arras"
echo "SELECT column_name, data_type FROM information_schema.columns"
echo "WHERE table_name = 'contratos_arras' ORDER BY ordinal_position;"
echo ""
echo "-- Ver tabla de chat"
echo "SELECT * FROM mensajes_chat LIMIT 1;"
echo ""
echo "-- Probar función de generación de expediente"
echo "SELECT generar_numero_expediente();"
echo ""
echo "=================================================="
echo "✨ Deployment completado exitosamente"
echo "=================================================="
