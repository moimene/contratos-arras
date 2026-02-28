/**
 * Seed Test Users Script
 * 
 * Crea usuarios de prueba en Supabase Auth y los asocia a expedientes.
 * Cada usuario tiene un rol específico para testing.
 * 
 * Uso:
 *   npx ts-node scripts/seed_test_users.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Configuración
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridos');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Usuarios de prueba
const TEST_USERS = [
    {
        email: 'super@test.chronoflare.com',
        password: 'Test1234!',
        role: 'ADMIN',
        displayName: 'Superusuario Test'
    },
    {
        email: 'vendedor@test.chronoflare.com',
        password: 'Test1234!',
        role: 'VENDEDOR',
        displayName: 'Vendedor Test'
    },
    {
        email: 'comprador@test.chronoflare.com',
        password: 'Test1234!',
        role: 'COMPRADOR',
        displayName: 'Comprador Test'
    },
    {
        email: 'notario@test.chronoflare.com',
        password: 'Test1234!',
        role: 'NOTARIO',
        displayName: 'Notario Test'
    },
    {
        email: 'tercero@test.chronoflare.com',
        password: 'Test1234!',
        role: 'TERCERO',
        displayName: 'Tercero Test'
    },
    {
        email: 'observador@test.chronoflare.com',
        password: 'Test1234!',
        role: 'OBSERVADOR',
        displayName: 'Observador Test'
    }
];

async function main() {
    console.log('🚀 Iniciando seed de usuarios de prueba...\n');

    // 1. Obtener el primer contrato disponible para asociar usuarios
    const { data: contratos, error: contratosError } = await supabase
        .from('contratos_arras')
        .select('id, numero_expediente')
        .limit(1);

    if (contratosError || !contratos?.length) {
        console.error('❌ No hay contratos disponibles:', contratosError?.message);
        console.log('💡 Ejecuta primero: npm run seed');
        process.exit(1);
    }

    const contratoId = contratos[0].id;
    console.log(`📁 Usando expediente: ${contratos[0].numero_expediente} (${contratoId})\n`);

    // 2. Crear/actualizar usuarios
    for (const testUser of TEST_USERS) {
        console.log(`👤 Procesando: ${testUser.email} (${testUser.role})`);

        try {
            // Intentar crear usuario en Auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: testUser.email,
                password: testUser.password,
                email_confirm: true,
                user_metadata: {
                    display_name: testUser.displayName,
                    role: testUser.role
                }
            });

            let userId: string;

            if (authError) {
                if (authError.message.includes('already exists') || authError.message.includes('already been registered')) {
                    // Usuario ya existe, obtener su ID
                    const { data: existingUsers } = await supabase.auth.admin.listUsers();
                    const existing = existingUsers?.users?.find(u => u.email === testUser.email);
                    if (existing) {
                        userId = existing.id;
                        console.log(`   ↳ Usuario ya existe: ${userId}`);
                    } else {
                        console.error(`   ❌ No se pudo encontrar usuario existente`);
                        continue;
                    }
                } else {
                    console.error(`   ❌ Error creando usuario: ${authError.message}`);
                    continue;
                }
            } else {
                userId = authData.user!.id;
                console.log(`   ✅ Usuario creado: ${userId}`);
            }

            // 3. Verificar si ya tiene membresía en este expediente
            const { data: existingMember } = await supabase
                .from('miembros_expediente')
                .select('id')
                .eq('contrato_id', contratoId)
                .eq('usuario_id', userId)
                .maybeSingle();

            if (existingMember) {
                console.log(`   ↳ Ya es miembro del expediente`);
                continue;
            }

            // 4. Crear membresía en expediente
            const { error: memberError } = await supabase
                .from('miembros_expediente')
                .insert({
                    contrato_id: contratoId,
                    usuario_id: userId,
                    email_contacto: testUser.email,
                    tipo_rol_usuario: testUser.role,
                    estado_acceso: 'ACTIVO',
                    fecha_incorporacion: new Date().toISOString()
                });

            if (memberError) {
                console.error(`   ❌ Error creando membresía: ${memberError.message}`);
            } else {
                console.log(`   ✅ Asociado al expediente como ${testUser.role}`);
            }

        } catch (e: any) {
            console.error(`   ❌ Error: ${e.message}`);
        }
    }

    // 5. Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📋 RESUMEN DE USUARIOS DE PRUEBA');
    console.log('='.repeat(60));
    console.log(`\n🔗 Expediente de prueba: ${contratos[0].numero_expediente}\n`);
    console.log('Credenciales (contraseña: Test1234! para todos):\n');

    for (const user of TEST_USERS) {
        console.log(`  ${user.role.padEnd(12)} → ${user.email}`);
    }

    console.log('\n💡 Superusuarios (acceso total a todos los expedientes):');
    console.log('  - admin@chronoflare.com');
    console.log('  - moisesmenendez@garrigues.com');
    console.log('  - super@test.chronoflare.com');

    console.log('\n✅ Seed completado!\n');
}

main().catch(console.error);
