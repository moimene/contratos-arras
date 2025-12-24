# seed_all.ts — Chrono‑Flare TEST Reset + Seed (15 Expedientes)

Script de reset y seed completo para entornos de desarrollo/test.

---

## Instalación

```bash
pnpm add -D ts-node typescript
pnpm add @supabase/supabase-js pg unzipper uuid
```

---

## Variables de Entorno

```bash
export NODE_ENV=development
export SUPABASE_URL="https://<project-ref>.supabase.co"
export SUPABASE_SERVICE_KEY="<service_role_key>"
export DATABASE_URL="postgresql://<user>:<pass>@<host>:5432/<db>"
```

> ⚠️ **CRÍTICO**: El script rechaza ejecutarse si `NODE_ENV=production`

---

## Colocar Bundles

```bash
mkdir -p seeds
cp chrono_flare_testdocs_bundle.zip seeds/
cp chrono_flare_comms_bundle.zip seeds/
cp chrono_flare_qtsp_bundle.zip seeds/
cp chrono_flare_chat_bundle.zip seeds/
```

---

## Ejecución

### Todo de una vez

```bash
pnpm ts-node scripts/seed_all.ts --all
```

### Por fases

```bash
# Fase 1: Reset y core
pnpm ts-node scripts/seed_all.ts --reset-db --wipe-storage --seed-core

# Fase 2: Documentos
pnpm ts-node scripts/seed_all.ts --upload-docs --seed-archivos

# Fase 3: Comunicaciones, QTSP, Chat y verificación
pnpm ts-node scripts/seed_all.ts --seed-comms --seed-qtsp --seed-chat --verify
```

---

## Flags Disponibles

| Flag | Descripción |
|------|-------------|
| `--all` | Ejecuta todas las fases |
| `--reset-db` | TRUNCATE de todas las tablas |
| `--wipe-storage` | Elimina archivos en Storage (buckets: documentos, contratos-pdf, justificantes) |
| `--seed-core` | Inserta inmuebles, partes, contratos_arras, contratos_partes |
| `--upload-docs` | Sube documentos del bundle a Supabase Storage |
| `--seed-archivos` | Inserta registros en tabla archivos desde manifest |
| `--seed-comms` | Inserta comunicaciones desde bundle |
| `--seed-qtsp` | Inserta sellos_tiempo, eventos, evidencias_qtsp, certificados |
| `--seed-chat` | Inserta mensajes del chat |
| `--verify` | Ejecuta queries de verificación QA |

---

## IDs Determinísticos

Este script crea contratos con IDs determinísticos usando UUIDv5:

```typescript
contrato_id = uuidv5("chrono-flare:expXX", uuidv5.URL)
```

Esto permite que los bundles ZIP pre-generados contengan referencias correctas a los IDs.

### Mapeo de Expedientes

| Expediente | Estado | contrato_id (determinístico) |
|------------|--------|------------------------------|
| exp01 | INICIADO | `uuidv5("chrono-flare:exp01", URL)` |
| exp02 | BORRADOR | `uuidv5("chrono-flare:exp02", URL)` |
| exp03 | BORRADOR | `uuidv5("chrono-flare:exp03", URL)` |
| exp04-06 | FIRMADO | ... |
| exp07-09 | NOTARIA | ... |
| exp10-11 | TERMINADO | ... |
| exp12-14 | LITIGIO | ... |
| exp15 | TERMINADO | ... |

---

## Estructura de Bundles

### `chrono_flare_testdocs_bundle.zip`

```
├── manifest_documentos.json
├── documentos/
│   └── exp01/
│       └── NOTA_SIMPLE.pdf
├── contratos-pdf/
│   └── exp01/
│       └── contrato_arras.pdf
└── justificantes/
    └── exp01/
        └── justificante_pago.pdf
```

### `chrono_flare_comms_bundle.zip`

```
├── seed_comunicaciones.json
└── storage/
    └── documentos/
        └── (adjuntos de comunicaciones)
```

### `chrono_flare_qtsp_bundle.zip`

```
├── seed_qtsp.json
└── storage/
    └── documentos/
        └── exp01/
            └── certificado_eventos.pdf
```

### `chrono_flare_chat_bundle.zip`

```
└── seed_chat.json
```

---

## Verificación QA

El flag `--verify` ejecuta las siguientes queries:

| Check | Descripción |
|-------|-------------|
| `counts` | Conteo de registros por tabla |
| `missing_inmueble` | Contratos sin inmueble |
| `missing_contrato_archivos` | Archivos sin contrato válido |
| `eventos_sello_missing` | Eventos con sello_id pero sin sello |
| `mensajes_relevantes_sample` | Muestra de mensajes relevantes |
| `certificados_sin_pdf` | Certificados sin PDF asociado |

---

## Datos Generados

### Por Expediente (x15)

| Entidad | Cantidad |
|---------|----------|
| Inmueble | 1 |
| Partes | 2 (vendedor + comprador) |
| Contrato | 1 |
| Contratos_Partes | 2 |

### Totales (15 expedientes)

| Tabla | Registros |
|-------|-----------|
| inmuebles | 15 |
| partes | 30 |
| contratos_arras | 15 |
| contratos_partes | 30 |
| archivos | ~150+ (según bundle) |
| comunicaciones | ~45+ |
| mensajes | ~75+ |
| eventos | ~200+ |
| sellos_tiempo | ~100+ |
| evidencias_qtsp | ~50+ |
| certificados | ~15 |

---

## Troubleshooting

### Error: "NODE_ENV=production. Refusing to run."

El script protege contra ejecución en producción.

```bash
export NODE_ENV=development
```

### Error: "Docs zip not found"

Verificar que los bundles están en `./seeds/`:

```bash
ls -la seeds/
```

### Error: "Missing manifest_documentos.json"

El bundle de documentos debe contener el manifest en la raíz del ZIP.

---

## Limpieza de Archivos Temporales

El script crea directorios temporales `.seedtmp-*`. Limpiar manualmente:

```bash
rm -rf .seedtmp-*
```
