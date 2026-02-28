import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

async function cleanup() {
    console.log("Cleaning up DEMO data (IDs starting with 00000000-)...");

    // 1. Mensajes
    await deleteFromTable("mensajes", "contrato_id");

    // 2. Comunicaciones
    await deleteFromTable("comunicaciones", "contrato_id");

    // 3. Eventos
    await deleteFromTable("eventos", "contrato_id");

    // 4. Certificados
    await deleteFromTable("certificados", "contrato_id");

    // 5. Inventario
    await deleteFromTable("inventario_expediente", "contrato_id");

    // 6. Archivos
    await deleteFromTable("archivos", "contrato_id");

    // 7. Contratos Partes
    await deleteFromTable("contratos_partes", "contrato_id");

    // 8. Contratos Arras
    await deleteFromTable("contratos_arras", "id");

    // 9. Partes (Tables that might use the ID pattern directly)
    await deleteFromTable("partes", "id");

    // 10. Inmuebles
    await deleteFromTable("inmuebles", "id");

    // 11. Sellos y Evidencias (These definitely have the ID pattern)
    await deleteFromTable("sellos_tiempo", "id");
    await deleteFromTable("evidencias_qtsp", "id");

    console.log("Cleanup complete.");
}

async function deleteFromTable(table: string, column: string) {
    console.log(`Deleting from ${table} where ${column} starts with 00000000-...`);
    // Delete in batches if too many? For 15 contracts it's fine.
    // Supabase JS library allows filter "like"
    const { error, count } = await supabase
        .from(table)
        .delete({ count: 'exact' })
        .like(column, '00000000-%');

    if (error) {
        console.error(`Error deleting from ${table}:`, error.message);
    } else {
        console.log(`Deleted ${count} rows from ${table}`);
    }
}

cleanup().catch(console.error);
