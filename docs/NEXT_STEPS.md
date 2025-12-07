# Próximos Pasos de Desarrollo

Este documento guía las siguientes fases de implementación.

## ✅ Fase 1: Configuración Inicial (COMPLETADA)

- [x] Backend configurado con Node.js + Express + TypeScript
- [x] Cliente Supabase configurado
- [x] Schema PostgreSQL creado
- [x] Frontend configurado con React + Vite + TypeScript
- [x] Estructura de directorios establecida
- [x] Utilidades básicas (hash, time, canonical)
- [x] Servicio de eventos con QTSP stub

## 🎯 Fase 2: Modelo de Datos y Backend Base

### Tareas Pendientes

1. **Implementar Repositorios Supabase**
   - `repositories/contratos.repo.ts` - CRUD de contratos
   - `repositories/inmuebles.repo.ts` - Gestión de inmuebles
   - `repositories/partes.repo.ts` - Gestión de partes
   - Adaptar consultas a sintaxis Supabase

2. **Crear Endpoints Iniciales**
   - `routes/contratos.ts` - POST, GET, PUT contratos
   - `routes/partes.ts` - Gestión de participantes
   - Integrar con event service para certificación

3. **Implementar Versionado**
   - Cálculo de `version_hash` para términos esenciales
   - Invalidación de aceptaciones/firmas al cambiar versión
   - Lógica de recálculo de hash

## 📝 Comandos Útiles

### Crear el Schema en Supabase
```bash
# 1. Copiar contenido de backend/src/database/schema.sql
# 2. Ir a Supabase Dashboard → SQL Editor
# 3. Pegar y ejecutar
```

### Ejecutar Backend
```bash
cd backend
npm run dev
# http://localhost:4000/api/health
```

### Ejecutar Frontend
```bash
cd frontend
npm run dev
# http://localhost:5173
```

### Instalar Dependencias Faltantes
```bash
# Si se necesitan dependencias adicionales
cd backend && npm install <paquete>
cd frontend && npm install <paquete>
```

## 🔧 Configuración Pendiente

### 1. Service Role Key
Obtener de Supabase Dashboard:
- Settings → API → service_role key
- Añadir a `backend/.env` como `SUPABASE_SERVICE_KEY`

### 2. Storage Buckets
Crear en Supabase Dashboard → Storage:
- `contratos-pdf` (privado)
- `justificantes` (privado)
- `actas` (privado)

### 3. Variables de Entorno
Verificar que estén configuradas:
- Backend: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## 📚 Archivos de Referencia

- **Schema SQL**: `backend/src/database/schema.sql`
- **Types**: `backend/src/types/models.ts`
- **Plan Completo**: `../brain/implementation_plan.md`
- **Guía Supabase**: `docs/SUPABASE_MIGRATION.md`

## ⚡ Quick Start para Desarrolladores

```bash
# 1. Clonar el proyecto
git clone <repo-url>
cd chrono-flare

# 2. Configurar backend
cd backend
npm install
cp .env.example .env
# Editar .env con credenciales Supabase
npm run dev

# 3. En otra terminal, configurar frontend
cd frontend
npm install
cp .env.example .env
# Editar .env con credenciales Supabase
npm run dev

# 4. Ejecutar schema en Supabase Dashboard
# Ver docs/SUPABASE_MIGRATION.md
```

## 🎨 Próximas Características a Implementar

### Backend (Prioridad Alta)
1. Repositorio de contratos con Supabase
2. Endpoints POST /api/contratos
3. Endpoints GET /api/contratos/:id
4. Sistema de versionado de términos esenciales

### Frontend (Prioridad Alta)
1. Context Provider para gestión de estado
2. Componente Stepper (10 pasos)
3. Step 1: Formulario de inmueble
4. Integración con API de backend

### Certificación (Prioridad Media)
1. Mejorar event service
2. Implementar verificación de cadena
3. Preparar para integración QTSP real

## 🐛 Testing

Crear tests básicos:
```bash
# Backend
cd backend
npm install -D jest @types/jest ts-jest
npx jest --init

# Frontend
cd frontend
npm install -D vitest @testing-library/react
```

## 🚀 Deployment

Para desplegar:
1. Backend → Railway, Render, o Vercel Functions
2. Frontend → Vercel, Netlify, o Lovable
3. Database → Ya en Supabase (producción lista)

---

**Estado Actual**: ✅ Base sólida establecida, lista para desarrollo de features  
**Próximo Objetivo**: Implementar repositorios y endpoints básicos de contratos
