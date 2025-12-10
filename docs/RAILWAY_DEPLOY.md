# Despliegue en Railway

## Configuración de Railway

### Paso 1: Crear proyecto en Railway
1. Ve a [railway.app](https://railway.app) e inicia sesión
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Conecta tu repositorio `moimene/contratos-arras`

### Paso 2: Configurar servicio BACKEND
1. Click en **"Add New Service"** → **"GitHub Repo"**
2. Selecciona el repo y configura:
   - **Name:** `backend`
   - **Root Directory:** `backend`
   - **Build Command:** (usa Dockerfile automáticamente)

3. Variables de entorno (Settings → Variables):
```
SUPABASE_URL=https://vwoovqxurcnloqlqtupx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=4000
NODE_ENV=production
QTSP_MODE=stub
```

4. En **Settings → Networking**, genera un dominio público

### Paso 3: Configurar servicio FRONTEND
1. Click en **"Add New Service"** → **"GitHub Repo"**
2. Selecciona el repo y configura:
   - **Name:** `frontend`
   - **Root Directory:** `frontend`

3. Variables de entorno (Build Args):
```
VITE_API_URL=https://backend-XXXXX.railway.app
VITE_SUPABASE_URL=https://vwoovqxurcnloqlqtupx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **IMPORTANTE:** Reemplaza `backend-XXXXX.railway.app` con la URL real del backend desplegado.

4. En **Settings → Networking**, genera un dominio público

### Paso 4: Actualizar Supabase
En el dashboard de Supabase:
1. Ve a **Authentication → URL Configuration**
2. Añade la URL del frontend a **Site URL** y **Redirect URLs**

## URLs Finales

| Servicio | URL |
|----------|-----|
| Frontend | `https://frontend-XXXXX.railway.app` |
| Backend  | `https://backend-XXXXX.railway.app` |

## Comandos Útiles

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy manual
railway up
```

## Troubleshooting

### Error de CORS
Verifica que `VITE_API_URL` apunta al backend correcto.

### Error de autenticación Supabase
Añade las URLs de Railway a los Redirect URLs permitidos en Supabase.
