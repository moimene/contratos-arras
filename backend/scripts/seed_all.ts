/**
 * seed_all.ts — Chrono‑Flare TEST reset + full seed (15 expedientes)
 * Uses Supabase REST API (no direct PostgreSQL connection required)
 * See seed_all_README.md for usage.
 */
import fs from "fs";
import path from "path";
import process from "process";
import crypto from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import unzipper from "unzipper";
import { v5 as uuidv5, v4 as uuidv4 } from "uuid";

type Flags = {
    resetDb: boolean;
    wipeStorage: boolean;
    seedCore: boolean;
    uploadDocs: boolean;
    seedArchivos: boolean;
    seedComms: boolean;
    seedQtsp: boolean;
    seedChat: boolean;
    verify: boolean;
};

const UUID_NAMESPACE = uuidv5("chrono-flare", uuidv5.URL);

// Global supabase client
let supabase: SupabaseClient;

function expKey(i: number) {
    return `exp${String(i).padStart(2, "0")}`;
}
function contratoIdForExp(i: number) {
    return uuidv5(`chrono-flare:${expKey(i)}`, uuidv5.URL);
}
function inmuebleIdForExp(i: number) {
    return uuidv5(`chrono-flare:${expKey(i)}:inmueble`, UUID_NAMESPACE);
}
function parteIdForExp(i: number, role: "COMPRADOR" | "VENDEDOR") {
    return uuidv5(`chrono-flare:${expKey(i)}:parte:${role}`, UUID_NAMESPACE);
}

function parseArgs(argv: string[]): Flags {
    const has = (k: string) => argv.includes(k);
    const all = has("--all");
    const f: Flags = {
        resetDb: all || has("--reset-db"),
        wipeStorage: all || has("--wipe-storage"),
        seedCore: all || has("--seed-core"),
        uploadDocs: all || has("--upload-docs"),
        seedArchivos: all || has("--seed-archivos"),
        seedComms: all || has("--seed-comms"),
        seedQtsp: all || has("--seed-qtsp"),
        seedChat: all || has("--seed-chat"),
        verify: all || has("--verify"),
    };
    if (!Object.values(f).some(Boolean)) {
        console.error(
            "No flags provided. Use --all or one of: --reset-db --wipe-storage --seed-core --upload-docs --seed-archivos --seed-comms --seed-qtsp --seed-chat --verify"
        );
        process.exit(2);
    }
    return f;
}

function mustEnv(name: string): string {
    const v = process.env[name];
    if (!v) {
        console.error(`Missing required env ${name}`);
        process.exit(2);
    }
    return v;
}

function assertNotProduction() {
    const env = (process.env.NODE_ENV || "").toLowerCase();
    if (env === "production") throw new Error("NODE_ENV=production. Refusing to run.");
}

// ============================================
// SUPABASE-BASED DATABASE OPERATIONS
// ============================================

async function deleteAll(table: string) {
    // Delete all rows (use neq for a condition that matches everything)
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error && !error.message.includes('no rows')) {
        console.warn(`[db] delete ${table} warning:`, error.message);
    }
}

async function resetDb() {
    console.log("[db] resetting tables via Supabase API...");

    // Delete in reverse dependency order
    const tables = [
        'evidencias_qtsp',
        'certificados',
        'comunicaciones',
        'mensajes',
        'firmas_contrato',
        'aceptaciones_terminos_esenciales',
        'citas_notaria',
        'pagos',
        'archivos',
        'eventos',
        'contratos_partes',
        'contratos_arras',
        'partes',
        'inmuebles',
        'sellos_tiempo',
    ];

    for (const table of tables) {
        console.log(`[db] clearing ${table}...`);
        await deleteAll(table);
    }
}

async function batchInsert(table: string, rows: any[], batchSize = 50) {
    if (rows.length === 0) return;

    console.log(`[db] upserting ${table} count=${rows.length}`);

    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabase.from(table).upsert(batch);
        if (error) {
            console.error(`[db] upsert ${table} batch ${i}/${rows.length} error:`, error.message);
            throw error;
        }
    }
}

async function unzipToTemp(zipPath: string): Promise<string> {
    const tempDir = fs.mkdtempSync(path.join(process.cwd(), ".seedtmp-"));
    await fs.createReadStream(zipPath).pipe(unzipper.Extract({ path: tempDir })).promise();
    return tempDir;
}

function listFilesRecursive(dir: string): string[] {
    const out: string[] = [];
    const stack = [dir];
    while (stack.length) {
        const d = stack.pop()!;
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const e of entries) {
            const p = path.join(d, e.name);
            if (e.isDirectory()) stack.push(p);
            else out.push(p);
        }
    }
    return out;
}

async function storageWipe() {
    const buckets = ["documentos", "contratos-pdf", "justificantes"] as const;
    const prefixes = Array.from({ length: 15 }, (_, i) => expKey(i + 1));

    for (const bucket of buckets) {
        console.log(`[storage] wiping bucket=${bucket}`);
        for (const prefix of prefixes) {
            let offset = 0;
            const limit = 100;
            while (true) {
                const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit, offset });
                if (error) {
                    console.warn(`[storage] list ${bucket}/${prefix} warning:`, error.message);
                    break;
                }
                if (!data || data.length === 0) break;
                const paths = data.map((o: any) => `${prefix}/${o.name}`);
                const { error: delErr } = await supabase.storage.from(bucket).remove(paths);
                if (delErr) console.warn(`[storage] delete warning:`, delErr.message);
                offset += data.length;
            }
        }
    }
}

async function uploadStorageFromDocsBundle(docsTempDir: string) {
    const buckets = ["documentos", "contratos-pdf", "justificantes"] as const;

    for (const bucket of buckets) {
        const bucketDir = path.join(docsTempDir, bucket);
        if (!fs.existsSync(bucketDir)) continue;
        const files = listFilesRecursive(bucketDir);
        console.log(`[storage] uploading ${files.length} files to bucket=${bucket}`);
        for (const abs of files) {
            const rel = path.relative(bucketDir, abs).replaceAll("\\", "/");
            const content = fs.readFileSync(abs);
            const { error } = await supabase.storage.from(bucket).upload(rel, content, {
                upsert: true,
                contentType: "application/pdf",
            });
            if (error) console.warn(`[storage] upload warn bucket=${bucket} path=${rel}: ${error.message}`);
        }
    }
}

async function uploadStorageFromZipStorageFolder(tempDir: string) {
    const storageDir = path.join(tempDir, "storage");
    if (!fs.existsSync(storageDir)) return;

    const files = listFilesRecursive(storageDir);
    console.log(`[storage] uploading ${files.length} files from storage/ folder`);
    for (const abs of files) {
        const rel = path.relative(storageDir, abs).replaceAll("\\", "/");
        const parts = rel.split("/");
        const bucket = parts.shift();
        if (!bucket) continue;
        const objPath = parts.join("/");
        const content = fs.readFileSync(abs);
        const { error } = await supabase.storage.from(bucket).upload(objPath, content, {
            upsert: true,
            contentType: "application/pdf",
        });
        if (error) console.warn(`[storage] upload warn bucket=${bucket} path=${objPath}: ${error.message}`);
    }
}

function buildCoreRows() {
    const inmuebles: any[] = [];
    const partes: any[] = [];
    const contratos: any[] = [];
    const contratosPartes: any[] = [];

    const estados = ["INICIADO", "BORRADOR", "BORRADOR", "FIRMADO", "FIRMADO", "FIRMADO", "NOTARIA", "NOTARIA", "NOTARIA", "TERMINADO", "TERMINADO", "LITIGIO", "LITIGIO", "LITIGIO", "TERMINADO"] as const;
    const tiposArras = ["PENITENCIALES", "CONFIRMATORIAS", "PENALES"] as const;
    const formasPago = ["AL_FIRMAR", "AL_FIRMAR", "AL_FIRMAR"] as const;

    for (let i = 1; i <= 15; i++) {
        const exp = expKey(i);
        const inmueble_id = inmuebleIdForExp(i);
        inmuebles.push({
            id: inmueble_id,
            direccion_completa: `Calle Ficticia ${i}, ${i}ºA`,
            codigo_postal: `28${String(10 + i).padStart(3, "0")}`,
            ciudad: i % 2 === 0 ? "Madrid" : "Barcelona",
            provincia: i % 2 === 0 ? "Madrid" : "Barcelona",
            referencia_catastral: `TEST-${exp.toUpperCase()}-${String(100000 + i)}`,
            m2: 80 + i,
            habitaciones: (i % 4) + 1,
            banos: (i % 2) + 1,
        });

        const vendedor_id = parteIdForExp(i, "VENDEDOR");
        const comprador_id = parteIdForExp(i, "COMPRADOR");

        partes.push({
            id: vendedor_id,
            rol: "VENDEDOR",
            nombre: "Ana",
            apellidos: `García ${exp.toUpperCase()}`,
            estado_civil: "Casada",
            tipo_documento: "DNI",
            numero_documento: `V-${String(10000000 + i)}A`,
            email: `vendedor_${exp}@test.local`,
            telefono: `+34600000${String(i).padStart(2, "0")}`,
            domicilio: `Domicilio vendedor ${exp}`,
            es_representante: false,
            representa_a: null,
        });

        partes.push({
            id: comprador_id,
            rol: "COMPRADOR",
            nombre: "Juan",
            apellidos: `Pérez ${exp.toUpperCase()}`,
            estado_civil: "Soltero",
            tipo_documento: "DNI",
            numero_documento: `C-${String(20000000 + i)}B`,
            email: `comprador_${exp}@test.local`,
            telefono: `+34610000${String(i).padStart(2, "0")}`,
            domicilio: `Domicilio comprador ${exp}`,
            es_representante: false,
            representa_a: null,
        });

        const contrato_id = contratoIdForExp(i);
        const precio = 250000 + i * 15000;
        const importe_arras = Math.round(precio * 0.1 * 100) / 100;
        const estado = estados[i - 1];
        const tipo_arras = tiposArras[i % 3];
        const forma_pago_arras = formasPago[i % 3];
        const version_hash = crypto.createHash("sha256").update(`${contrato_id}|v1`).digest("hex");
        const fecha_limite = new Date(Date.now() + (60 + i) * 24 * 3600 * 1000).toISOString();

        contratos.push({
            id: contrato_id,
            inmueble_id,
            estado,
            tipo_arras,
            precio_total: precio,
            importe_arras,
            porcentaje_arras_calculado: 10.0,
            moneda: "EUR",
            fecha_limite_firma_escritura: fecha_limite,
            forma_pago_arras,
            plazo_pago_arras_dias: null, // Always null since we only use AL_FIRMAR
            iban_vendedor: "ES0000000000000000000000",
            banco_vendedor: "BANCO TEST",
            notario_designado_nombre: "Notaría Central (TEST)",
            notario_designado_direccion: "Calle Notaría 1, Madrid",
            gastos_quien: "LEY",
            via_resolucion: "JUZGADOS",
            firma_preferida: "ELECTRONICA",
            condicion_suspensiva_texto: estado === "FIRMADO" && i % 2 === 0 ? "Sujeto a obtención de financiación (TEST)" : null,
            observaciones: `Seed ${exp} (TEST)`,
            version_hash,
            version_numero: 1,
            identificador_unico: uuidv4(),
            arras_acreditadas_at:
                estado === "FIRMADO" || estado === "NOTARIA" || estado === "TERMINADO" || estado === "LITIGIO"
                    ? new Date().toISOString()
                    : null,
            motivo_cierre: estado === "TERMINADO" ? "TERMINADO" : estado === "LITIGIO" ? "LITIGIO" : null,
        });

        contratosPartes.push({
            id: uuidv4(),
            contrato_id,
            parte_id: vendedor_id,
            rol_en_contrato: "VENDEDOR",
            obligado_aceptar: true,
            obligado_firmar: true,
            porcentaje_propiedad: 100.0,
        });
        contratosPartes.push({
            id: uuidv4(),
            contrato_id,
            parte_id: comprador_id,
            rol_en_contrato: "COMPRADOR",
            obligado_aceptar: true,
            obligado_firmar: true,
            porcentaje_propiedad: 100.0,
        });
    }

    return { inmuebles, partes, contratos, contratosPartes };
}

async function seedCore() {
    const { inmuebles, partes, contratos, contratosPartes } = buildCoreRows();
    await batchInsert("inmuebles", inmuebles);
    await batchInsert("partes", partes);
    await batchInsert("contratos_arras", contratos);
    await batchInsert("contratos_partes", contratosPartes);
}

async function insertArchivosFromManifest(docsTempDir: string) {
    const manifestPath = path.join(docsTempDir, "manifest_documentos.json");
    if (!fs.existsSync(manifestPath)) throw new Error(`manifest_documentos.json not found in ${docsTempDir}`);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    // Map manifest tipos to valid DB constraint values
    const tipoMap: Record<string, string> = {
        'NOTA_SIMPLE': 'NOTA_SIMPLE',
        'CONTRATO_ARRAS_BORRADOR': 'BORRADOR_PDF',
        'CONTRATO_ARRAS_FINAL': 'BORRADOR_PDF',
        'JUSTIFICANTE_ARRAS': 'JUSTIFICANTE_ARRAS',
        'JUSTIFICANTE_PAGO': 'JUSTIFICANTE_PAGO',
        'CEE': 'CERTIFICADO_ENERGETICO',
        'CERTIFICADO_ENERGETICO': 'CERTIFICADO_ENERGETICO',
        'TASACION': 'TASACION',
        'ESCRITURA': 'ESCRITURA',
        'MINUTA_ESCRITURA': 'ESCRITURA',
        'ACTA_INCIDENCIA': 'ACTA_INCIDENCIA',
        'ACTA_NO_COMPARECENCIA': 'ACTA_NO_COMPARECENCIA',
        'RECIBO_IBI': 'OTRO',
        'CERTIFICADO_COMUNIDAD': 'OTRO',
        'CONVOCATORIA_NOTARIA': 'OTRO',
    };

    const rows: any[] = [];
    for (const exp of manifest.expedientes as any[]) {
        const idx = Number(String(exp.expediente).replace("exp", ""));
        const contrato_id = contratoIdForExp(idx);

        for (const a of exp.archivos as any[]) {
            // Map tipo to valid DB value, default to OTRO
            const mappedTipo = tipoMap[a.tipo] || 'OTRO';

            rows.push({
                id: uuidv4(),
                contrato_id,
                parte_id: null,
                tipo: mappedTipo,
                nombre_original: a.nombreOriginal,
                mime_type: a.mime,
                ruta: a.ruta.replaceAll("\\", "/"),
                tamano: a.tamanoBytes,
            });
        }
    }
    await batchInsert("archivos", rows);
}

async function importSeedJson(bundleZipPath: string, jsonFileName: string): Promise<{ tmpDir: string; data: any }> {
    const tmpDir = await unzipToTemp(bundleZipPath);
    const p = path.join(tmpDir, jsonFileName);
    if (!fs.existsSync(p)) throw new Error(`Missing ${jsonFileName} in ${bundleZipPath}`);
    const data = JSON.parse(fs.readFileSync(p, "utf-8"));
    return { tmpDir, data };
}

async function seedSellosTiempo(rows: any[]) {
    if (!rows?.length) return;
    const mapped = rows.map((s: any) => ({
        id: s.id,
        proveedor: s.proveedor,
        marca: s.marca,
        hash_sha256: s.hash_sha256,
        rfc3161_tst_base64: s.rfc3161_tst_base64,
        fecha_sello: s.fecha_sello,
        estado: s.estado,
        metadata_json: s.metadata_json ?? s.metadata ?? {},
    }));
    await batchInsert("sellos_tiempo", mapped);
}

async function seedEventos(rows: any[]) {
    if (!rows?.length) return;
    const mapped = rows.map((e: any) => ({
        id: e.id,
        contrato_id: e.contrato_id,
        tipo: e.tipo,
        actor_parte_id: e.actor_parte_id ?? null,
        payload_json: e.payload_json ?? e.payload ?? {},
        hash_sha256: e.hash_sha256,
        prev_hash_sha256: e.prev_hash_sha256 ?? null,
        fecha_hora: e.fecha_hora,
        sello_id: e.sello_id ?? null,
    }));
    await batchInsert("eventos", mapped);
}

async function seedEvidencias(rows: any[]) {
    if (!rows?.length) return;
    const mapped = rows.map((ev: any) => ({
        id: ev.id,
        evento_id: ev.evento_id,
        algoritmo_hash: ev.algoritmo_hash ?? "SHA-256",
        hash_calculado: ev.hash_calculado,
        tst_raw: ev.tst_raw ?? null,
        tst_base64: ev.tst_base64,
        tst_serial_number: ev.tst_serial_number ?? null,
        authority_key_id: ev.authority_key_id ?? null,
        authority_name: ev.authority_name ?? null,
        policy_oid: ev.policy_oid ?? null,
        fecha_sello: ev.fecha_sello,
        estado: ev.estado ?? "SELLADO",
    }));
    await batchInsert("evidencias_qtsp", mapped);
}

async function seedComunicaciones(rows: any[]) {
    if (!rows?.length) return;
    const mapped = rows.map((c: any) => ({
        id: c.id,
        contrato_id: c.contrato_id,
        tipo_comunicacion: c.tipo_comunicacion,
        tipo_funcion: c.tipo_funcion ?? null,
        canal: c.canal,
        remitente_rol: c.remitente_rol ?? null,
        remitente_externo: c.remitente_externo ?? null,
        destinatarios_roles: c.destinatarios_roles ?? [],
        destinatarios_externos: c.destinatarios_externos ?? null,
        asunto: c.asunto ?? null,
        contenido: c.contenido ?? null,
        contenido_html: c.contenido_html ?? null,
        resumen_externo: c.resumen_externo ?? null,
        fecha_comunicacion: c.fecha_comunicacion,
        fecha_registro: c.fecha_registro ?? new Date().toISOString(),
        fecha_envio: c.fecha_envio ?? null,
        fecha_entrega: c.fecha_entrega ?? null,
        fecha_lectura: c.fecha_lectura ?? null,
        estado: c.estado,
        es_externa: !!c.es_externa,
        comunicacion_padre_id: c.comunicacion_padre_id ?? null,
        adjuntos_archivo_ids: c.adjuntos_archivo_ids ?? [],
        hash_contenido: c.hash_contenido ?? null,
        sello_qtsp_id: c.sello_qtsp_id ?? null,
        metadatos: c.metadatos ?? {},
    }));
    await batchInsert("comunicaciones", mapped);
}

async function seedMensajes(rows: any[]) {
    if (!rows?.length) return;
    const mapped = rows.map((m: any) => ({
        id: m.id,
        contrato_id: m.contrato_id,
        mensaje: m.mensaje,
        remitente_id: m.remitente_id ?? null,
        remitente_nombre: m.remitente_nombre,
        es_sistema: !!m.es_sistema,
        metadatos: m.metadatos ?? {},
        es_relevante_probatoriamente: !!m.es_relevante_probatoriamente,
        fecha_marcado_relevante: m.fecha_marcado_relevante ?? null,
        motivo_relevancia: m.motivo_relevancia ?? null,
        created_at: m.created_at,
        updated_at: m.updated_at ?? m.created_at,
    }));
    await batchInsert("mensajes", mapped);
}

async function seedCertificados(rows: any[]) {
    if (!rows?.length) return;
    const mapped = rows.map((c: any) => ({
        id: c.id,
        contrato_id: c.contrato_id,
        tipo: c.tipo,
        contenido_html: c.contenido_html,
        eventos_incluidos_json: c.eventos_incluidos_json,
        sello_id: c.sello_id ?? null,
        pdf_archivo_id: c.pdf_archivo_id ?? null,
    }));
    await batchInsert("certificados", mapped);
}

async function verifyQA() {
    console.log("[verify] Running QA checks via Supabase API...");

    // Count tables
    const tables = ['contratos_arras', 'archivos', 'comunicaciones', 'mensajes', 'eventos', 'sellos_tiempo', 'evidencias_qtsp', 'certificados'];
    const counts: Record<string, number> = {};

    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        counts[table] = error ? -1 : (count ?? 0);
    }

    console.log("[verify] counts:", counts);

    // Check mensajes relevantes
    const { data: relevantes } = await supabase
        .from('mensajes')
        .select('contrato_id')
        .eq('es_relevante_probatoriamente', true);

    console.log("[verify] mensajes_relevantes:", relevantes?.length ?? 0);
}

async function main() {
    assertNotProduction();
    const flags = parseArgs(process.argv.slice(2));

    const supabaseUrl = mustEnv("SUPABASE_URL");
    const serviceKey = mustEnv("SUPABASE_SERVICE_KEY");
    supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    // Default paths
    const seedsDir = fs.existsSync("./seeds") ? "./seeds" : "./backend/seeds";
    const DOCS_ZIP = process.env.DOCS_ZIP || `${seedsDir}/chrono_flare_testdocs_bundle.zip`;
    const COMMS_ZIP = process.env.COMMS_ZIP || `${seedsDir}/chrono_flare_comms_bundle.zip`;
    const QTSP_ZIP = process.env.QTSP_ZIP || `${seedsDir}/chrono_flare_qtsp_bundle.zip`;
    const CHAT_ZIP = process.env.CHAT_ZIP || `${seedsDir}/chrono_flare_chat_bundle.zip`;

    if (flags.resetDb) {
        await resetDb();
    }

    if (flags.wipeStorage) {
        console.log("[storage] wipe...");
        await storageWipe();
    }

    if (flags.seedCore) {
        console.log("[db] seed core...");
        await seedCore();
    }

    let docsTmp: string | null = null;
    if (flags.uploadDocs || flags.seedArchivos) {
        if (!fs.existsSync(DOCS_ZIP)) throw new Error(`Docs zip not found: ${DOCS_ZIP}`);
        docsTmp = await unzipToTemp(DOCS_ZIP);
    }
    if (flags.uploadDocs && docsTmp) await uploadStorageFromDocsBundle(docsTmp);
    if (flags.seedArchivos && docsTmp) await insertArchivosFromManifest(docsTmp);

    if (flags.seedComms) {
        if (!fs.existsSync(COMMS_ZIP)) throw new Error(`Comms zip not found: ${COMMS_ZIP}`);
        const { tmpDir, data } = await importSeedJson(COMMS_ZIP, "seed_comunicaciones.json");
        await uploadStorageFromZipStorageFolder(tmpDir);
        await seedSellosTiempo(data.sellos_tiempo ?? []);
        await seedComunicaciones(data.comunicaciones ?? []);
        if (data.eventos?.length) await seedEventos(data.eventos);
    }

    if (flags.seedQtsp) {
        if (!fs.existsSync(QTSP_ZIP)) throw new Error(`QTSP zip not found: ${QTSP_ZIP}`);
        const { tmpDir, data } = await importSeedJson(QTSP_ZIP, "seed_qtsp.json");
        await uploadStorageFromZipStorageFolder(tmpDir);
        await seedSellosTiempo(data.sellos_tiempo ?? []);
        await seedEventos(data.eventos ?? []);
        await seedEvidencias(data.evidencias_qtsp ?? []);

        if (data.archivos?.length) {
            const rows = data.archivos.map((a: any) => ({
                id: a.id,
                contrato_id: a.contrato_id,
                parte_id: null,
                tipo: "OTRO", // CERTIFICADO_EVENTOS_PDF not in constraint
                nombre_original: a.nombre_original ?? a.nombreOriginal ?? "certificado.pdf",
                mime_type: a.mime_type ?? "application/pdf",
                ruta: a.ruta,
                tamano: a.tamano,
            }));
            await batchInsert("archivos", rows);
        }

        await seedCertificados(data.certificados ?? []);
    }

    if (flags.seedChat) {
        if (!fs.existsSync(CHAT_ZIP)) throw new Error(`Chat zip not found: ${CHAT_ZIP}`);
        const { data } = await importSeedJson(CHAT_ZIP, "seed_chat.json");
        await seedSellosTiempo(data.sellos_tiempo ?? []);
        await seedMensajes(data.mensajes ?? []);
        await seedEventos(data.eventos ?? []);
        await seedEvidencias(data.evidencias_qtsp ?? []);
    }

    if (flags.verify) await verifyQA();

    console.log("Done.");
}

main().catch((e) => {
    console.error("seed_all failed:", e);
    process.exit(1);
});
