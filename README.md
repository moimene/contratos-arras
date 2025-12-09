# 🏠 Chrono-Flare | Contratos de Arras

> Sistema completo para la negociación y formalización de contratos de arras alineado con el **modelo Garrigues-ICADE**.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase)](https://supabase.com/)

---

## ✨ Características Principales

- 📝 **Wizard de Contrato** - Flujo guiado paso a paso para crear contratos de arras
- 🏠 **Gestión de Inmuebles** - Datos registrales, catastrales y de la finca
- 👥 **Gestión de Partes** - Compradores, vendedores y representantes
- 📋 **Cláusulas Modulares** - Configuración condicional según tipo de operación
- ✍️ **Firma Electrónica** - Integración con QTSP (EAD Trust / GoCertius)
- 📊 **Dashboard de Expediente** - Seguimiento completo del proceso
- 📁 **Gestor Documental** - Inventario de documentos con validación
- 💬 **Chat Certificado** - Comunicación entre partes con sello de tiempo
- ⚖️ **Fase Notaría** - Checklist documental para escritura pública
- 📜 **Acta de No Comparecencia** - Gestión de terminación anormal

---

## 🔧 Tecnologías

| Capa | Stack |
|------|-------|
| **Backend** | Node.js, Express, TypeScript |
| **Frontend** | React, TypeScript, Vite |
| **Base de Datos** | Supabase (PostgreSQL) |
| **Certificación** | EAD Trust / GoCertius (QTSP) |
| **Almacenamiento** | Supabase Storage |

---

## 📁 Estructura del Proyecto

```
chrono-flare/
├── backend/                    # API Node.js + Express
│   ├── migrations/             # Migraciones SQL
│   │   ├── 001_schema.sql
│   │   ├── ...
│   │   └── 014_notaria_document_types.sql
│   └── src/
│       ├── config/             # Configuración Supabase
│       ├── routes/             # Endpoints API
│       │   ├── contracts.ts    # CRUD contratos
│       │   ├── firmas.ts       # Firma electrónica
│       │   ├── notaria.ts      # Fase notarial
│       │   ├── inventario.ts   # Gestor documental
│       │   └── ...
│       ├── services/           # Lógica de negocio
│       │   ├── contractService.ts
│       │   ├── pdfService.ts
│       │   ├── notariaService.ts
│       │   ├── actaService.ts
│       │   └── qtspService.ts
│       ├── templates/          # Plantillas de contrato
│       └── server.ts
│
├── frontend/                   # React App
│   └── src/
│       ├── components/
│       │   ├── steps/          # Wizard steps
│       │   ├── notaria/        # Panel notaría
│       │   ├── GestorDocumental/
│       │   ├── GestorComunicaciones/
│       │   └── ChatPanel/
│       ├── pages/
│       │   ├── Dashboard/      # Dashboard expediente
│       │   └── ExpedientesList/
│       ├── contracts/          # Templates ICADE
│       └── context/            # React Context
│
└── n8n-workflows/              # Automatizaciones
```

---

## 🚀 Instalación

### Requisitos Previos
- Node.js 18+
- npm o yarn
- Cuenta en [Supabase](https://supabase.com)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/moimene/contratos-arras.git
cd contratos-arras
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env  # Configurar credenciales
npm run dev           # http://localhost:4000
```

### 3. Base de Datos (Supabase)

1. Ir a [Supabase Dashboard](https://supabase.com/dashboard)
2. Crear nuevo proyecto
3. SQL Editor → Ejecutar migraciones en orden:
   ```
   backend/migrations/001_schema.sql
   backend/migrations/002_seed_data.sql
   ...
   backend/migrations/014_notaria_document_types.sql
   ```
4. Configurar Storage buckets (opcional)

### 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env  # Configurar credenciales
npm run dev           # http://localhost:5173
```

---

## 📋 Variables de Entorno

### Backend (`.env`)

```env
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# Server
PORT=4000
NODE_ENV=development

# QTSP (Certificación)
QTSP_MODE=stub          # stub | production
QTSP_API_URL=https://api.gocertius.com
QTSP_API_KEY=tu-api-key
```

### Frontend (`.env`)

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_URL=http://localhost:4000
```

---

## 📚 API Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/contracts` | Crear contrato |
| `GET` | `/api/contracts/:id` | Obtener contrato |
| `POST` | `/api/contracts/:id/wizard` | Actualizar wizard |
| `POST` | `/api/firmas/:id/iniciar` | Iniciar firma |
| `GET` | `/api/notaria/:id/inventario` | Checklist notaría |
| `POST` | `/api/notaria/:id/generar-inventario` | Generar checklist |
| `GET` | `/api/inventario/:id` | Documentos expediente |
| `POST` | `/api/pdf/:id/generate` | Generar PDF contrato |

---

## 🔐 Seguridad

> ⚠️ **Importante para Producción**

- Configurar credenciales propias (no usar las de desarrollo)
- Habilitar **Row Level Security (RLS)** en Supabase
- Usar `SUPABASE_SERVICE_KEY` solo en backend
- Configurar CORS apropiadamente
- Implementar autenticación de usuarios

---

## ⚖️ Aviso Legal

> **Esta herramienta NO constituye asesoramiento jurídico.**
> 
> El contenido generado es orientativo y debe ser revisado por un profesional del derecho antes de su uso en operaciones reales. Los contratos generados siguen el modelo Garrigues-ICADE pero pueden requerir adaptaciones según la jurisdicción y circunstancias específicas de cada operación.

---

## 🛣️ Roadmap

- [x] Wizard de contrato (Steps 1-5)
- [x] Generación PDF con cláusulas modulares
- [x] Dashboard de expediente
- [x] Gestor documental con validación
- [x] Chat certificado entre partes
- [x] Fase Notaría con checklist condicional
- [x] Acta de No Comparecencia
- [ ] Integración n8n completa
- [ ] Notificaciones por email
- [ ] Firma electrónica avanzada (producción)
- [ ] Multi-tenancy SaaS

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'feat: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

---

## 📝 Licencia

Pendiente de definición.

---

<p align="center">
  <sub>Desarrollado con ❤️ para el sector inmobiliario español</sub>
</p>
