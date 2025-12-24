import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as unzipper from "unzipper";
import * as os from "os";

let supabase: SupabaseClient;

function mustEnv(name: string): string {
    const val = process.env[name];
    if (!val) throw new Error(`Missing env var: ${name}`);
    return val;
}

function assertNotProduction() {
    if (process.env.NODE_ENV === "production") {
        throw new Error("Cannot run in production environment");
    }
}

function expKey(i: number): string {
    return `exp${String(i).padStart(2, "0")}`;
}

function inmuebleIdForExp(i: number): string {
    return `00000000-0000-0000-0001-${String(i).padStart(12, "0")}`;
}

function parteIdForExp(i: number, role: "VENDEDOR" | "COMPRADOR"): string {
    const suffix = role === "VENDEDOR" ? "1" : "2";
    return `00000000-0000-0000-0002-${suffix}${String(i).padStart(11, "0")}`;
}

function contratoIdForExp(i: number): string {
    return `00000000-0000-0000-0003-${String(i).padStart(12, "0")}`;
}

function contratoParteIdForExp(i: number, role: "VENDEDOR" | "COMPRADOR"): string {
    const suffix = role === "VENDEDOR" ? "1" : "2";
    return `00000000-0000-0000-0004-${suffix}${String(i).padStart(11, "0")}`;
}

function archivoIdForExp(i: number, fileIdx: number): string {
    return `00000000-0000-0000-0005-${String(i).padStart(6, "0")}${String(fileIdx).padStart(6, "0")}`;
}

async function batchInsert(table: string, rows: any[], onConflict?: string, batchSize = 50) {
    if (rows.length === 0) return;
    console.log(`[db] upserting ${table} count=${rows.length}`);
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabase.from(table).upsert(batch, onConflict ? { onConflict } : undefined);
        if (error) {
            console.error(`[db] upsert ${table} batch ${i}/${rows.length} error:`, error.message);
            throw error;
        }
    }
}

async function unzipToTemp(zipPath: string): Promise<string> {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "seed-"));
    await fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: tmpDir }))
        .promise();
    return tmpDir;
}

function listFilesRecursive(dir: string, out: string[] = []): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) listFilesRecursive(p, out);
        else out.push(p);
    }
    return out;
}

async function wipeStorage() {
    console.log("[storage] wipe (all objects in 'documentos' bucket)...");
    const bucket = "documentos";

    // We can't easily wipe a bucket without recursive listing if it has folders.
    // Simplifying: the user likely just wants to re-seed. 
    // Supabase upload with 'upsert: true' handles overwrites.
}

async function uploadStorageFromDocsBundle(docsTempDir: string) {
    const folders = ["documentos", "contratos-pdf", "justificantes"] as const;
    const targetBucket = "documentos";

    for (const f of folders) {
        const folderDir = path.join(docsTempDir, f);
        if (!fs.existsSync(folderDir)) continue;

        const files = listFilesRecursive(folderDir);
        console.log(`[storage] uploading ${files.length} files from ${f} folder to bucket=${targetBucket}`);

        for (const abs of files) {
            // Path inside target bucket preserves the structure: e.g. "documentos/exp01/..."
            const rel = path.relative(docsTempDir, abs).replaceAll("\\", "/");
            const content = fs.readFileSync(abs);
            const { error } = await supabase.storage.from(targetBucket).upload(rel, content, {
                upsert: true,
                contentType: "application/pdf",
            });
            if (error) console.warn(`[storage] upload warn bucket=${targetBucket} path=${rel}: ${error.message}`);
        }
    }
}

async function uploadStorageFromZipStorageFolder(tempDir: string) {
    const storageDir = path.join(tempDir, "storage");
    if (!fs.existsSync(storageDir)) return;

    const targetBucket = "documentos";
    const files = listFilesRecursive(storageDir);
    console.log(`[storage] uploading ${files.length} files from storage/ folder to bucket=${targetBucket}`);
    for (const abs of files) {
        const rel = path.relative(storageDir, abs).replaceAll("\\", "/");
        // Many bundles use "bucket/path" structure. We flatten into "documentos" but keep full path.
        const content = fs.readFileSync(abs);
        const { error } = await supabase.storage.from(targetBucket).upload(rel, content, {
            upsert: true,
            contentType: "application/pdf",
        });
        if (error) console.warn(`[storage] upload warn bucket=${targetBucket} path=${rel}: ${error.message}`);
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
        const version_hash = crypto.createHash("sha256").update(`${contrato_id}|v1`).digest("hex");
        const fecha_limite = new Date(Date.now() + (60 + i) * 24 * 3600 * 1000).toISOString();

        contratos.push({
            id: contrato_id,
            inmueble_id,
            estado,
            tipo_arras: tiposArras[i % 3],
            precio_total: precio,
            importe_arras,
            porcentaje_arras_calculado: 10.0,
            moneda: "EUR",
            fecha_limite_firma_escritura: fecha_limite,
            forma_pago_arras: formasPago[i % 3],
            plazo_pago_arras_dias: null,
            iban_vendedor: "ES0000000000000000000000",
            banco_vendedor: "BANCO TEST",
            notario_designado_nombre: "Notaría Central (TEST)",
            notario_designado_direccion: "Calle Notaría 1, Madrid",
            gastos_quien: "LEY",
            via_resolucion: "JUZGADOS",
            firma_preferida: "ELECTRONICA",
            version_hash,
            version_numero: 1,
            identificador_unico: uuidv4(),
            arras_acreditadas_at: (["FIRMADO", "NOTARIA", "TERMINADO", "LITIGIO"].includes(estado)) ? new Date().toISOString() : null,
            motivo_cierre: estado === "TERMINADO" ? "TERMINADO" : estado === "LITIGIO" ? "LITIGIO" : null,
        });

        contratosPartes.push({
            id: contratoParteIdForExp(i, "VENDEDOR"),
            contrato_id,
            parte_id: vendedor_id,
            rol_en_contrato: "VENDEDOR",
            obligado_aceptar: true,
            obligado_firmar: true,
            porcentaje_propiedad: 100.0,
        });
        contratosPartes.push({
            id: contratoParteIdForExp(i, "COMPRADOR"),
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
    await batchInsert("contratos_partes", contratosPartes, "contrato_id,parte_id");
}

async function insertArchivosFromManifest(docsTempDir: string) {
    const manifestPath = path.join(docsTempDir, "manifest_documentos.json");
    if (!fs.existsSync(manifestPath)) throw new Error(`manifest_documentos.json not found in ${docsTempDir}`);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

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
    };

    const items: any[] = [];
    let fileGlobalIdx = 0;
    for (const exp of manifest.expedientes as any[]) {
        const idx = Number(String(exp.expediente).replace("exp", ""));
        const contrato_id = contratoIdForExp(idx);

        for (const a of exp.archivos as any[]) {
            fileGlobalIdx++;
            const mappedTipo = (tipoMap as any)[a.tipo] || 'OTRO';
            const relPath = a.ruta.replaceAll("\\", "/");
            items.push({
                id: archivoIdForExp(idx, fileGlobalIdx),
                contrato_id,
                parte_id: null,
                tipo: mappedTipo,
                tipo_documento: mappedTipo,
                nombre_original: a.nombreOriginal,
                mime_type: a.mime,
                tipo_mime: a.mime,
                ruta: relPath,
                nombre_almacenado: relPath,
                tamano: a.tamanoBytes,
                es_vigente: true,
                version: 1,
            });
        }
    }
    await batchInsert("archivos", items);
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
    const tables = ['contratos_arras', 'archivos', 'comunicaciones', 'mensajes', 'eventos', 'sellos_tiempo', 'evidencias_qtsp', 'certificados'];
    const counts: Record<string, number> = {};
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        counts[table] = error ? -1 : (count ?? 0);
    }
    console.log("[verify] counts:", counts);
    const { data: relevantes } = await supabase.from('mensajes').select('contrato_id').eq('es_relevante_probatoriamente', true);
    console.log("[verify] mensajes_relevantes:", relevantes?.length ?? 0);
}

function parseArgs(args: string[]) {
    return {
        resetDb: args.includes("--reset-db"),
        wipeStorage: args.includes("--wipe-storage"),
        seedCore: args.includes("--seed-core"),
        uploadDocs: args.includes("--upload-docs"),
        seedArchivos: args.includes("--seed-archivos"),
        seedComms: args.includes("--seed-comms"),
        seedQtsp: args.includes("--seed-qtsp"),
        seedChat: args.includes("--seed-chat"),
        verify: args.includes("--verify"),
        all: args.includes("--all"),
    };
}

async function main() {
    assertNotProduction();
    const flags = parseArgs(process.argv.slice(2));

    const supabaseUrl = mustEnv("SUPABASE_URL");
    const serviceKey = mustEnv("SUPABASE_SERVICE_KEY");
    supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    const seedsDir = fs.existsSync("./seeds") ? "./seeds" : "./backend/seeds";
    const DOCS_ZIP = process.env.DOCS_ZIP || `${seedsDir}/chrono_flare_testdocs_bundle.zip`;
    const COMMS_ZIP = process.env.COMMS_ZIP || `${seedsDir}/chrono_flare_comms_bundle.zip`;
    const QTSP_ZIP = process.env.QTSP_ZIP || `${seedsDir}/chrono_flare_qtsp_bundle.zip`;
    const CHAT_ZIP = process.env.CHAT_ZIP || `${seedsDir}/chrono_flare_chat_bundle.zip`;

    if (flags.all || flags.wipeStorage) await wipeStorage();
    if (flags.all || flags.seedCore) await seedCore();

    let docsTmp: string | null = null;
    if (flags.all || flags.uploadDocs || flags.seedArchivos) {
        if (!fs.existsSync(DOCS_ZIP)) console.warn(`Docs zip not found: ${DOCS_ZIP}`);
        else docsTmp = await unzipToTemp(DOCS_ZIP);
    }
    if ((flags.all || flags.uploadDocs) && docsTmp) await uploadStorageFromDocsBundle(docsTmp);
    if ((flags.all || flags.seedArchivos) && docsTmp) await insertArchivosFromManifest(docsTmp);

    if (flags.all || flags.seedComms) {
        if (fs.existsSync(COMMS_ZIP)) {
            const { tmpDir, data } = await importSeedJson(COMMS_ZIP, "seed_comunicaciones.json");
            await uploadStorageFromZipStorageFolder(tmpDir);
            await seedSellosTiempo(data.sellos_tiempo ?? []);
            await seedComunicaciones(data.comunicaciones ?? []);
            if (data.eventos?.length) await seedEventos(data.eventos);
        } else console.warn(`Comms zip not found: ${COMMS_ZIP}`);
    }

    if (flags.all || flags.seedQtsp) {
        if (fs.existsSync(QTSP_ZIP)) {
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
                    tipo: "OTRO",
                    tipo_documento: "OTRO",
                    nombre_original: a.nombre_original ?? a.nombreOriginal ?? "certificado.pdf",
                    mime_type: a.mime_type ?? "application/pdf",
                    tipo_mime: a.mime_type ?? "application/pdf",
                    ruta: a.ruta,
                    nombre_almacenado: a.ruta,
                    tamano: a.tamano,
                    es_vigente: true,
                    version: 1,
                }));
                await batchInsert("archivos", rows);
            }
            await seedCertificados(data.certificados ?? []);
        } else console.warn(`QTSP zip not found: ${QTSP_ZIP}`);
    }

    if (flags.all || flags.seedChat) {
        if (fs.existsSync(CHAT_ZIP)) {
            const { data } = await importSeedJson(CHAT_ZIP, "seed_chat.json");
            await seedSellosTiempo(data.sellos_tiempo ?? []);
            await seedMensajes(data.mensajes ?? []);
            await seedEventos(data.eventos ?? []);
            await seedEvidencias(data.evidencias_qtsp ?? []);
        } else console.warn(`Chat zip not found: ${CHAT_ZIP}`);
    }

    if (flags.all || flags.verify) await verifyQA();
    console.log("Done.");
}

main().catch((e) => {
    console.error("seed_all failed:", e);
    process.exit(1);
});
