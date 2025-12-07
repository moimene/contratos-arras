# Guía de Migración a Supabase

Este documento detalla los pasos necesarios para migrar y configurar la base de datos en Supabase.

## 1. Crear Proyecto en Supabase

✅ Ya completado - Proyecto creado con las siguientes credenciales:
- **URL**: `https://wmoovqurcnloqltupx.supabase.co`
- **Anon Key**: Configurada en `.env`

## 2. Ejecutar Schema SQL

### Desde el Dashboard de Supabase

1. Ir a https://supabase.com/dashboard
2. Seleccionar el proyecto `wmoovqurcnloqltupx`
3. Navegar a **SQL Editor**
4. Crear una nueva query
5. Copiar y pegar el contenido de `backend/src/database/schema.sql`
6. Ejecutar (Run)

### Verificar la Creación de Tablas

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Deberías ver las siguientes tablas:
- `actas_no_comparecencia`
- `aceptaciones_terminos_esenciales`
- `archivos`
- `certificados`
- `citas_notaria`
- `contratos_arras`
- `contratos_partes`
- `eventos`
- `firmas_contrato`
- `inmuebles`
- `notificaciones`
- `pagos`
- `partes`
- `sellos_tiempo`

## 3. Configurar Storage Buckets

### Desde el Dashboard de Supabase

1. Navegar a **Storage**
2. Crear los siguientes buckets:

| Bucket ID | Nombre | Public |
|-----------|--------|--------|
| `contratos-pdf` | Contratos PDF | ❌ No |
| `justificantes` | Justificantes de Pago | ❌ No |
| `actas` | Actas de No Comparecencia | ❌ No |

### Configurar Políticas de Acceso (RLS)

```sql
-- Política básica para subida de justificantes
CREATE POLICY "Usuarios pueden subir justificantes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'justificantes');

-- Política básica para lectura de PDFs de contratos
CREATE POLICY "Usuarios pueden leer sus PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'contratos-pdf');
```

> **Nota**: Las políticas RLS deben ajustarse según la autenticación implementada.

## 4. Configurar Row Level Security (Opcional)

Para producción, es recomendable habilitar RLS en las tablas principales:

```sql
-- Habilitar RLS
ALTER TABLE contratos_arras ENABLE ROW LEVEL SECURITY;
ALTER TABLE inmuebles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partes ENABLE ROW LEVEL SECURITY;

-- Políticas de ejemplo (ajustar según autenticación)
CREATE POLICY "Usuarios ven sus propios contratos"
ON contratos_arras FOR SELECT
USING (auth.uid() IN (
  SELECT parte_id FROM contratos_partes WHERE contrato_id = id
));
```

## 5. Service Role Key (Backend)

Para operaciones administrativas del backend, es necesario configurar el **Service Role Key**:

1. En Supabase Dashboard → **Settings** → **API**
2. Copiar `service_role` key (secret)
3. Añadir a `backend/.env`:

```env
SUPABASE_SERVICE_KEY=<service_role_key>
```

> ⚠️ **Importante**: El service_role key tiene permisos completos. Nunca exponerlo en el frontend.

## 6. Verificar Conexión

### Desde el Backend

```bash
cd backend
npm run dev
```

Deberías ver:
```
✓ Supabase client initialized: https://wmoovqurcnloqltupx.supabase.co
🚀 Backend de Contratos de Arras
📡 Servidor escuchando en puerto 4000
```

### Probar Conexión con Supabase

Crear archivo temporal `backend/test-connection.ts`:

```typescript
import { supabase } from './src/config/supabase.js';

async function testConnection() {
  const { data, error } = await supabase
    .from('inmuebles')
    .select('count');
    
  if (error) {
    console.error('❌ Error de conexión:', error);
  } else {
    console.log('✅ Conexión exitosa a Supabase');
    console.log('📊 Tablas accesibles');
  }
}

testConnection();
```

Ejecutar:
```bash
npx ts-node backend/test-connection.ts
```

## 7. Problemas Comunes

### Error: "relation does not exist"
- **Causa**: Schema no ejecutado o error en la ejecución
- **Solución**: Volver a ejecutar `schema.sql` en SQL Editor

### Error: "JWT expired"
- **Causa**: Anon key expirada
- **Solución**: Regenerar keys en Settings → API

### Error de CORS
- **Causa**: Frontend y backend en dominios diferentes sin configuración
- **Solución**: Asegurar que CORS esté habilitado en `server.ts`

## 8. Migraciones Futuras

Para cambios en el schema en desarrollo:

1. Modificar `schema.sql`
2. Crear archivo de migración incremental en `backend/src/database/migrations/`
3. Ejecutar manualmente en SQL Editor o mediante script

Ejemplo de migración:
```sql
-- migrations/002_add_campo_ejemplo.sql
ALTER TABLE contratos_arras 
ADD COLUMN ejemplo_campo TEXT;
```

## 9. Backup y Restauración

### Backup Manual
1. Dashboard → Database → Backups
2. Download backup

### Backup Automático
Supabase realiza backups diarios automáticos en el plan gratuito.

## 10. Monitoreo

### Logs de Base de Datos
Dashboard → Logs → Database Logs

### Métricas
Dashboard → Reports
- Conexiones activas
- Queries por minuto
- Tamaño de base de datos

---

## Checklist de Configuración

- [x] Proyecto Supabase creado
- [ ] Schema SQL ejecutado
- [ ] Tablas verificadas
- [ ] Storage buckets creados
- [ ] Service Role Key configurada
- [ ] Conexión backend verificada
- [ ] Políticas RLS configuradas (opcional)
- [ ] Backup inicial creado

---

**Última actualización**: 2025-12-07
