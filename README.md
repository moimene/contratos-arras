# Sistema de Gestión de Contratos de Arras

Sistema completo para la negociación y formalización de contratos de arras alineado con el modelo Garrigues-ICADE.

## 🔧 Tecnologías

- **Backend**: Node.js, Express, TypeScript, Supabase (PostgreSQL)
- **Frontend**: React, TypeScript, Vite
- **Certificación**: EAD Trust / GoCertius (QTSP)

## 📁 Estructura del Proyecto

```
chrono-flare/
├── backend/          # API Node.js + Express
│   ├── src/
│   │   ├── config/   # Configuración Supabase
│   │   ├── database/ # Schema SQL
│   │   ├── routes/   # Endpoints API
│   │   ├── services/ # Lógica de negocio
│   │   ├── qtsp/     # Integración QTSP
│   │   └── server.ts
│   └── package.json
└── frontend/         # React App
    ├── src/
    │   ├── components/
    │   ├── config/   # Cliente Supabase
    │   └── context/
    └── package.json
```

## 🚀 Instalación

### 1. Backend

```bash
cd backend
npm install
# Configurar .env con credenciales Supabase
npm run dev  # Corre en http://localhost:4000
```

### 2. Crear Schema en Supabase

1. Ir a Supabase Dashboard
2. SQL Editor → Ejecutar `backend/src/database/schema.sql`
3. Configurar Storage buckets (opcional)

### 3. Frontend

```bash
cd frontend
npm install
# Configurar .env con credenciales Supabase
npm run dev  # Corre en http://localhost:5173
```

## 📋 Variables de Entorno

### Backend (.env)
```
SUPABASE_URL=https://wmoovqurcnloqltupx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
PORT=4000
QTSP_MODE=stub
```

### Frontend (.env)
```
VITE_SUPABASE_URL=https://wmoovqurcnloqltupx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_BASE_URL=http://localhost:4000/api
```

## 📚 Documentación

- [Plan de Implementación](../brain/implementation_plan.md)
- [Modelo de Datos](backend/src/database/schema.sql)
- [API Docs](docs/API.md) _(próximamente)_

## ⚠️ Aviso Legal

Esta herramienta NO constituye asesoramiento jurídico. El contenido generado es orientativo y debe ser revisado por un profesional del derecho.

## 🔐 Seguridad

- Las credenciales mostradas son de desarrollo
- Configurar variables de entorno apropiadas en producción
- Habilitar RLS en Supabase para producción

## 📝 Licencia

Pendiente de definición
