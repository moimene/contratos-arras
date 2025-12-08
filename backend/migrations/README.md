# Migración a Plataforma LegalOps - Guía de Deployment

## 📋 Resumen

Esta migración transforma Chrono-Flare de un generador de PDFs a una **Plataforma de Operaciones Legales** completa, preservando el 100% del código existente del Wizard.

## 🎯 Cambios Principales

### Base de Datos
- ✅ 12 estados de ciclo de vida (vs 6 originales)
- ✅ Columna `datos_wizard` JSONB (preserva estado del Wizard)
- ✅ Tabla `mensajes_chat` con relevancia probatoria
- ✅ Eventos con hash chain (blockchain-like)
- ✅ Links compartibles por expediente

### Backend (Nuevos Servicios)
- ✅ `contractService.ts` - Creación y gestión de expedientes
- ✅ `storageService.ts` - Gestión de documentos (local/S3-ready)

### API (Nuevos Endpoints)
- ✅ `POST /api/contracts/init` - Crear expediente desde Wizard
- ✅ `GET /api/contracts/:id` - Obtener expediente completo
- ✅ `GET /api/contracts/link/:link` - Acceso por link compartible
- ✅ `POST /api/storage/upload` - Subir PDFs y documentos
- ✅ `GET /api/storage/:subdir/:filename` - Servir archivos

## 🚀 Instrucciones de Deployment

### Paso 1: Backup de Base de Datos

**IMPORTANTE**: Haz un backup de tu base de datos actual antes de proceder.

```bash
# En Supabase Dashboard:
# Settings → Database → Backups → Create Backup
```

### Paso 2: Ejecutar Migración SQL

#### Opción A: Usando Supabase Dashboard (Recomendado)

1. Ve a tu Supabase Dashboard
2. Navega a **SQL Editor**
3. Abre el archivo `backend/migrations/001_lifecycle_evolution.sql`
4. Copia todo el contenido
5. Pégalo en el editor SQL
6. Haz clic en **Run**
7. Verifica que no haya errores

#### Opción B: Usando el Script de Deployment

```bash
cd backend
./migrations/deploy.sh
```

Sigue las instrucciones en pantalla.

### Paso 3: Verificar Migración

Ejecuta estas queries en el SQL Editor de Supabase:

```sql
-- 1. Verificar nuevas columnas en contratos_arras
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contratos_arras' 
  AND column_name IN (
    'datos_wizard', 
    'numero_expediente', 
    'link_compartible',
    'borrador_pdf_path'
  );

-- 2. Verificar tabla de chat
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'mensajes_chat'
) AS tabla_chat_existe;

-- 3. Probar función de generación de expediente
SELECT generar_numero_expediente();

-- 4. Ver vista de resumen
SELECT * FROM vista_contratos_resumen LIMIT 1;
```

Deberías ver:
- ✅ 4 columnas nuevas en `contratos_arras`
- ✅ `tabla_chat_existe = true`
- ✅ Un número de expediente tipo `CFA-2025-000001`
- ✅ La vista funciona (puede estar vacía si no hay datos)

### Paso 4: Reiniciar Backend

```bash
cd backend

# El backend se reiniciará automáticamente si usas tsx watch
# Si no, reinicia manualmente:
npm run dev
```

Verifica la consola:

```
✓ Supabase client initialized
✓ Storage service initialized: ./files
🚀 Backend de Contratos de Arras
📡 Servidor escuchando en puerto 4000
```

### Paso 5: Probar Endpoints

```bash
# 1. Health check
curl http://localhost:4000/api/health

# 2. Ver nuevos endpoints en welcome page
curl http://localhost:4000/

# Deberías ver:
# "🆕 contracts": "/api/contracts"
# "🆕 storage": "/api/storage"
```

## 🧪 Testing del Flujo Completo

### Test 1: Crear Expediente (Sin PDF)

```bash
curl -X POST http://localhost:4000/api/contracts/init \
  -H "Content-Type: application/json" \
  -d '{
    "datosWizard": {
      "inmueble": {
        "calle": "Gran Vía",
        "numero": "123",
        "piso": "4ºA",
        "ciudad": "Madrid",
        "provincia": "Madrid",
        "codigoPostal": "28013",
        "referenciaCatastral": "1234567890",
        "finalidad": "vivienda",
        "tieneHipoteca": false,
        "tieneArrendatarios": false
      },
      "contrato": {
        "precioTotal": 250000,
        "cantidadArras": 25000,
        "porcentajeArras": 10,
        "naturalezaArras": "penitenciales",
        "fechaLimite": "2025-03-15T00:00:00Z",
        "opcionesPortanda": "escritura_publica",
        "modoEstandarObservatorio": true
      },
      "compradores": [{
        "id": "c1",
        "nombre": "Juan Pérez García",
        "dni": "12345678X",
        "email": "juan@example.com",
        "telefono": "600123456",
        "direccion": "Calle Test 1",
        "ciudad": "Madrid",
        "provincia": "Madrid",
        "codigoPostal": "28001"
      }],
      "vendedores": [{
        "id": "v1",
        "nombre": "María López Sánchez",
        "dni": "87654321Y",
        "email": "maria@example.com",
        "telefono": "600654321",
        "direccion": "Calle Vendedor 2",
        "ciudad": "Madrid",
        "provincia": "Madrid",
        "codigoPostal": "28002"
      }]
    }
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "contratoId": "uuid-del-contrato",
  "numeroExpediente": "CFA-2025-000001",
  "linkCompartible": "uuid-del-link",
  "dashboardUrl": "/dashboard/contrato/uuid-del-contrato",
  "pdfUrl": null
}
```

### Test 2: Obtener Expediente

```bash
# Usa el contratoId de la respuesta anterior
curl http://localhost:4000/api/contracts/{contratoId}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "numero_expediente": "CFA-2025-000001",
    "estado": "BORRADOR",
    "datos_wizard": { ... },
    "partes": [ ... ],
    "eventos": [
      {
        "tipo": "CREACION",
        "hash_sha256": "...",
        "prev_hash_sha256": null
      }
    ],
    "documentos": [],
    "mensajes": []
  }
}
```

### Test 3: Subir PDF

```bash
# Primero crea un PDF de prueba
echo "Test PDF" > test.pdf

curl -X POST http://localhost:4000/api/storage/upload \
  -F "file=@test.pdf" \
  -F "type=pdf"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "path": "pdfs/uuid.pdf",
  "url": "http://localhost:4000/storage/pdfs/uuid.pdf",
  "filename": "test.pdf",
  "mimeType": "application/pdf",
  "size": 8
}
```

## 🔍 Troubleshooting

### Error: "SUPABASE_ANON_KEY no está configurada"

**Solución**: Verifica que tu archivo `.env` tenga las variables correctas:

```bash
cd backend
cat .env
# Debería mostrar SUPABASE_URL y SUPABASE_ANON_KEY
```

### Error: "relation 'mensajes_chat' does not exist"

**Solución**: La migración no se ejecutó correctamente. Vuelve al Paso 2.

### Error: "Function generar_numero_expediente() does not exist"

**Solución**: Ejecuta solo esa parte de la migración:

```sql
CREATE OR REPLACE FUNCTION generar_numero_expediente()
RETURNS TEXT AS $$
-- (copiar función del archivo de migración)
$$ LANGUAGE plpgsql;
```

### El backend no inicia

**Solución**: Verifica errores de TypeScript:

```bash
cd backend
npm run build

# Si hay errores, revisa los imports
```

## 📊 Verificación de Datos

Verifica en Supabase Dashboard → Table Editor:

1. **contratos_arras**: Debería tener el contrato creado con:
   - `numero_expediente`: CFA-2025-000001
   - `datos_wizard`: JSON completo
   - `estado`: BORRADOR

2. **inmuebles**: Inmueble creado con dirección completa

3. **partes**: 2 partes (1 vendedor + 1 comprador)

4. **contratos_partes**: 2 relaciones

5. **eventos**: 1 evento de tipo CREACION

## ✅ Checklist Post-Deployment

- [ ] Migración SQL ejecutada sin errores
- [ ] Backend reiniciado correctamente
- [ ] Endpoint `/api/contracts/init` responde
- [ ] Endpoint `/api/storage/upload` funciona
- [ ] Se creó un expediente de prueba
- [ ] Se puede obtener el expediente por ID
- [ ] Archivo PDF se sube correctamente
- [ ] Storage local creado en `./files`

## 🎉 Próximos Pasos

Una vez completado el deployment:

1. **Phase 2**: Implementar componentes de Dashboard en Frontend
2. **Phase 3**: Integrar Wizard con creación de expedientes
3. **Phase 4**: Testing end-to-end completo

## 📞 Soporte

Si encuentras problemas, revisa los logs del backend:

```bash
cd backend
# Los logs se muestran en la consola donde corre npm run dev
```

Para problemas con Supabase, verifica:
- Dashboard → Logs
- Dashboard → API → Auto-generated API Docs
