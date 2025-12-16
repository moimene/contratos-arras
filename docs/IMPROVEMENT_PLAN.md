# Plan de Mejoras y Refactorización Global

> Fecha: 2025-12-16
> Estado: Propuesta

Este documento detalla un plan integral para elevar la calidad, seguridad y mantenibilidad del código de Chrono-Flare, basado en una auditoría profunda del repositorio.

---

## 🚨 1. Seguridad Crítica: Autenticación Real

**Problema Actual:**
El backend confía ciegamente en el header `x-user-id` (`authorization.ts`).
```typescript
const userId = req.headers['x-user-id'] as string; // ⚠️ Inseguro si el acceso es directo
```
Cualquier usuario podría falsificar su identidad enviando este header con Postman/curl.

**Solución Propuesta:**
Implementar validación de JWT de Supabase.

1.  Enviar `Authorization: Bearer <token>` desde frontend.
2.  Crear middleware `verifySupabaseToken`:
    -   Verificar firma del JWT con `SUPABASE_JWT_SECRET`.
    -   Extraer `sub` (userId) y `email` del token decodificado.
    -   Inyectar estos valores seguros en `req.authContext`.

**Impacto:** Crítico (Seguridad)

---

## 🛡️ 2. Robustez: Validación de Esquemas (Zod)

**Problema Actual:**
Los endpoints consumen `req.body` directamente sin validación estricta.
```typescript
const { parteId, ... } = req.body; // ⚠️ Puede fallar silenciosamente o permitir basura
```

**Solución Propuesta:**
Integrar **Zod** para definir esquemas de entrada.

1.  Definir esquemas en `shared/schemas` (o `backend/src/schemas`).
2.  Crear middleware `validateBody(schema)`.
3.  Validar inputs antes de llamar a repositorios.

```typescript
const createContratoSchema = z.object({
  inmueble: z.object({ ... }),
  precio_total: z.number().positive(),
  ...
});

router.post('/', validateBody(createContratoSchema), controller);
```

**Impacto:** Alto (Estabilidad y DX)

---

## ⚡ 3. Modernización Frontend: TanStack Query

**Problema Actual:**
Gestión manual de `fetch`, estados de carga (`loading`, `error`) y race conditions (`AbortController`) en cada hook personalizado.
```typescript
// useContrato.ts (160 líneas de boilerplate)
useEffect(() => { const controller = new AbortController()... }, [])
```

**Solución Propuesta:**
Migrar a **TanStack Query (React Query)**.

1.  Configurar `QueryClientProvider` en `App.tsx`.
2.  Reemplazar `useContrato` con `useQuery`:
    ```typescript
    const { data: contrato } = useQuery({
      queryKey: ['contrato', id],
      queryFn: () => api.getContrato(id)
    });
    ```
3.  Reemplazar actualizaciones manuales con `invalidateQueries`.

**Beneficios:**
- Cache automático y deduplicación.
- Reintentos automáticos en fallos de red.
- Código 70% más conciso.
- Estados `isPending`, `isError` estandarizados.

**Impacto:** Medio (Mantenibilidad y UX)

---

## 🏗️ 4. Arquitectura: Typed API Client

**Problema Actual:**
El frontend no conoce los tipos de respuesta del backend, duplicando interfaces (`ContratoData` en frontend interfaces vs `Contrato` en backend types).

**Solución Propuesta:**
Compartir tipos entre backend y frontend.

1.  Mover tipos comunes a `packages/shared` o usar *monorepo setup*.
2.  O generar cliente API automáticamente con **OpenAPI** (Swagger).

**Impacto:** Medio (DX y Type Safety)

---

## 🧹 5. Limpieza y Deuda Técnica

- **TODOs Pendientes**: Hay múltiples `TODO` en el código (auth, endpoints pendientes, eadTrust real).
- **Error Handling**: Centralizar manejo de errores del backend en un middleware global en lugar de `try/catch` repetitivos en cada ruta.
- **Estilos**: Estandarizar CSS (algunos componentes tienen CSS modules, otros CSS global).

---

## 📋 Roadmap de Ejecución Recomendado

| Fase | Tarea | Esfuerzo | Prioridad |
|------|-------|----------|-----------|
| **1** | **Seguridad Auth JWT** | Bajo | 🔴 Crítica |
| **2** | **Validación Zod** | Medio | 🟠 Alta |
| **3** | **React Query** | Medio | 🟡 Media |
| **4** | **Error Middleware** | Bajo | 🟢 Baja |

Recomiendo comenzar inmediatamente con la **Fase 1 (Seguridad Auth)** ya que es una vulnerabilidad activa.
