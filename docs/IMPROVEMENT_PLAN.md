# Plan de Mejoras y Roadmap Técnico

> **Última actualización:** 16/12/2025
> **Estado:** Fase 1 (Seguridad) Pendiente / Fases 2, 3, 4 Completadas

Este documento detalla el estado actual del refactoring y los pasos necesarios para completar la estabilización del proyecto.

---

## 📊 Resumen de Estado

| Fase | Tarea | Estado | Notas |
|------|-------|--------|-------|
| **1** | **Seguridad (Auth JWT)** | 🔴 **PENDIENTE** | **Crítico.** API routes públicas actualmente. |
| **2** | **Validación Zod** | ✅ **COMPLETADO** | Middleware `validate` activo. |
| **3** | **React Query** | ✅ **COMPLETADO** | Migrado `useContratoQuery` y `App.tsx`. |
| **4** | **Arquitectura/Tipos** | ✅ **COMPLETADO** | Backend DTOs -> Frontend DTOs. |
| **5** | **Limpieza** | ✅ **COMPLETADO** | Global Error Handler implementado. |

---

## 🚨 Próximos Pasos (Para abordar más adelante)

### 1. Corregir Configuración en Producción (Railway)
**Problema:** Login fallido ("Invalid API Key") y acceso fantasma.
**Solución:**
- [ ] Ir a Railway > Settings > Variables.
- [ ] Verificar `VITE_SUPABASE_ANON_KEY`.
- [ ] Asegurar que no tiene comillas extra (`"`) ni espacios.
- [ ] Redeploy.

### 2. Implementar Seguridad Backend (Fase 1)
**Problema:** Endpoints como `/api/contratos` son públicos. Cualquiera puede ver datos si conoce la URL, incluso sin login.
**Solución Técnica:**
1.  **Middleware de Autenticación (`verifySupabaseToken`)**:
    -   Validar el JWT (`Bearer token`) enviado por el frontend.
    -   No confiar únicamente en headers `x-user-id`.
    -   Usar `supabase.auth.getUser(token)` o verificar firma JWT localmente.
2.  **Proteger Rutas**:
    -   Aplicar middleware en `server.ts` o router-level.
    -   Ejemplo: `router.use(verifySupabaseToken)`.

### 3. Completar Migración a React Query
**Estado:** Se migró `useContrato` -> `useContratoQuery`.
**Pendiente:**
- [ ] Migrar el resto de hooks (`useExpedientes`, `useParticipantes`, etc.).
- [ ] Eliminar duplicidad de interfaces (usar `frontend/src/types/dtos.ts` extensivamente).

---

## 🛠️ Detalle de Mejoras Implementadas

### Backend: Validación Robusta
Se implementó `zod` para validar entradas. Evita errores silenciosos y corrupción de datos.
- Archivos: `src/middleware/validate.ts`, `src/schemas/*`.

### Frontend: React Query
Se configuró `QueryClient` global.
- Mejora performance con caché automática.
- Elimina "race conditions" en `useEffect`.
- Archivo clave: `src/hooks/queries/useContratoQuery.ts`.

### Arquitectura Espejo
Tipos sincronizados entre Backend y Frontend.
- Backend: Tipos inferidos de Zod.
- Frontend: `src/types/dtos.ts`.
