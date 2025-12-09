/**
 * Run SQL Migration via Supabase REST API
 * 
 * Uses the PostgREST endpoint with service_role key to execute raw SQL.
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridos');
    process.exit(1);
}

async function executeSql(sql: string): Promise<{ success: boolean; error?: string }> {
    // Use Supabase's SQL function endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
        const text = await response.text();
        return { success: false, error: text };
    }

    return { success: true };
}

async function createTableDirectly() {
    console.log('📦 Creando tabla comunicaciones...\n');

    // Create table via direct insert into pg_catalog would not work
    // Instead, we'll use Supabase SQL Editor approach via the dashboard
    // But we can try to create the table by making queries

    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS comunicaciones (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            contrato_id UUID NOT NULL REFERENCES contratos_arras(id) ON DELETE CASCADE,
            tipo_comunicacion VARCHAR(50) NOT NULL,
            tipo_funcion VARCHAR(100),
            canal VARCHAR(30) NOT NULL DEFAULT 'PLATAFORMA',
            remitente_rol VARCHAR(50),
            remitente_usuario_id UUID,
            remitente_externo VARCHAR(255),
            destinatarios_roles JSONB DEFAULT '[]',
            destinatarios_externos TEXT,
            asunto VARCHAR(500),
            contenido TEXT,
            contenido_html TEXT,
            resumen_externo TEXT,
            fecha_comunicacion TIMESTAMPTZ,
            fecha_registro TIMESTAMPTZ DEFAULT NOW(),
            fecha_envio TIMESTAMPTZ,
            fecha_entrega TIMESTAMPTZ,
            fecha_lectura TIMESTAMPTZ,
            estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
            es_externa BOOLEAN DEFAULT false,
            comunicacion_padre_id UUID,
            acta_id UUID,
            cita_notaria_id UUID,
            adjuntos_archivo_ids JSONB DEFAULT '[]',
            hash_contenido VARCHAR(64),
            sello_qtsp_id UUID,
            metadatos JSONB DEFAULT '{}',
            registrado_por_rol VARCHAR(50),
            registrado_por_usuario_id UUID,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `;

    // Try using the Supabase Functions or direct query
    // Since we can't execute DDL via PostgREST, we'll need to use the SQL endpoint

    console.log('ℹ️  Supabase PostgREST no permite DDL (CREATE TABLE) directamente.');
    console.log('   Para ejecutar la migración, usa el SQL Editor del Dashboard.\n');
    console.log('📋 SQL a ejecutar:');
    console.log('─'.repeat(60));

    const migrationPath = path.join(__dirname, '..', '..', 'migrations', '013_comunicaciones_table.sql');
    if (fs.existsSync(migrationPath)) {
        const sql = fs.readFileSync(migrationPath, 'utf-8');
        console.log(sql.substring(0, 2000) + '\n...[truncado]');
    }

    console.log('─'.repeat(60));
    console.log('\n🔗 Abre: https://supabase.com/dashboard/project/vwoovqxurcnloqlqtupx/sql/new');
    console.log('   Pega el contenido de: migrations/013_comunicaciones_table.sql');
    console.log('   Click en "Run"\n');
}

createTableDirectly();
