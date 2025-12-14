# Dashboard v2 - Plan de Refactorización

> **Objetivo**: Mejorar la UX del dashboard con cambios pequeños, reversibles y sin romper funcionalidad existente.

---

## Principios de Ejecución

1. **Feature flag** para activar Dashboard v2 sin sustituir el actual
2. **Cambios pequeños y reversibles**: cada PR debe ser mergeable independientemente
3. **Una única fuente de verdad de estado** en `domain/contrato/`
4. **No cambiar backend** en esta fase (salvo que sea imprescindible, en PR separado)

---

## Tabla de Estados: Backend → UI

| Estado Backend | Label UI | Icono | Tono | CSS Class |
|----------------|----------|-------|------|-----------|
| `BORRADOR` | Borrador | 📝 | info | `estado-borrador` |
| `INICIADO` | Iniciado | 🚀 | info | `estado-iniciado` |
| `EN_NEGOCIACION` | En Negociación | 💬 | info | `estado-en-negociacion` |
| `TERMINOS_ESENCIALES_ACEPTADOS` | Términos Aceptados | ✅ | ok | `estado-terminos-aceptados` |
| `BORRADOR_GENERADO` | Borrador Generado | 📄 | info | `estado-borrador-generado` |
| `EN_FIRMA` | Pendiente de Firmas | ✍️ | warn | `estado-en-firma` |
| `FIRMADO` | Firmado | ✍️ | ok | `estado-firmado` |
| `DECLARADO_PAGO` | Pago Declarado | 💳 | warn | `estado-declarado-pago` |
| `ARRAS_ACREDITADAS` | Arras Acreditadas | 💰 | ok | `estado-arras-acreditadas` |
| `INTERIM` | Periodo Interim | ⏳ | info | `estado-interim` |
| `CONVOCATORIA_NOTARIAL` | Convocatoria Notarial | 📅 | warn | `estado-convocatoria` |
| `CONVOCATORIA_ESCRITURA` | Convocatoria Escritura | 📅 | warn | `estado-convocatoria` |
| `NOTARIA` | En Notaría | ⚖️ | info | `estado-notaria` |
| `ESCRITURA_OTORGADA` | Escritura Otorgada | 🎉 | ok | `estado-escritura-otorgada` |
| `NO_COMPARECENCIA` | No Comparecencia | ⚠️ | danger | `estado-no-comparecencia` |
| `ACTA_NO_COMPARECENCIA` | Acta No Comparecencia | ⚠️ | danger | `estado-no-comparecencia` |
| `LITIGIO` | Litigio | ⚖️ | danger | `estado-litigio` |
| `RESUELTO` | Resuelto | ⚠️ | warn | `estado-resuelto` |
| `TERMINADO` | Terminado | 🔒 | info | `estado-terminado` |
| `CERRADO` | Cerrado | 🔒 | info | `estado-cerrado` |

### Alias de Estados
- `CONVOCATORIA_ESCRITURA` → alias de `CONVOCATORIA_NOTARIAL`
- `ACTA_NO_COMPARECENCIA` → alias de `NO_COMPARECENCIA`
- `CERRADO` → alias de `TERMINADO`

---

## Decisiones de Navegación

### CTA Principal
- **Acción primaria**: Scroll a sección interna del dashboard
- **Acción secundaria** (opcional): "Abrir vista completa" → navega a ruta dedicada

### Jerarquía del Primer Pliegue (Overview)
1. **Alerta de estado** (si aplica)
2. **Próximas acciones** requeridas
3. **Resumen de pendientes** (contadores por sección)

---

## PR-Plan de Implementación

### PR-1: Dominio de Estados y Eventos
**Archivos nuevos:**
- `frontend/src/domain/contrato/estado.ts`
- `frontend/src/domain/contrato/eventos.ts`
- `frontend/src/domain/contrato/index.ts`

**Archivos modificados:**
- `EstadoBadge.tsx` → importar de dominio
- `TimelineEvento.tsx` → importar de dominio

### PR-2: Hook useContrato
**Archivo nuevo:**
- `frontend/src/hooks/useContrato.ts`

**Archivo modificado:**
- `ContratoDashboard.tsx` → usar hook

### PR-3: ViewModel del Dashboard
**Archivo nuevo:**
- `frontend/src/pages/Dashboard/hooks/useContratoDashboardVM.ts`

**Archivo modificado:**
- `ProximasAcciones.tsx` → dumb component

### PR-4: Layout Overview + Secciones
**Archivos nuevos:**
- `DashboardOverview.tsx`
- `DashboardSection.tsx`

### PR-5: Rendimiento (Lazy Load)
**Archivo modificado:**
- `ContratoDashboard.tsx` → React.lazy + Suspense

### PR-6: Énfasis por Rol
**Archivos modificados:**
- Componentes del dashboard → badges "Tu acción"

---

## Verificación por PR

```bash
# Smoke test manual
1. Carga expediente válido
2. Error: contrato inexistente
3. Estados: BORRADOR, FIRMADO, NOTARIA, NO_COMPARECENCIA, LITIGIO, TERMINADO
4. CTAs scroll/navegar funcionan
5. FirmaElectronica refetch ok

# Build test
cd frontend && npm run build
```

---

## Feature Flag

```typescript
// frontend/src/config/featureFlags.ts
export const DASHBOARD_V2_ENABLED = import.meta.env.VITE_DASHBOARD_V2 === 'true';
```
