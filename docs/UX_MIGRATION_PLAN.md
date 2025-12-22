# Plan de Migración UX — Garrigues Brand Guidelines

## Resumen Ejecutivo

Este plan detalla la migración del sistema de diseño de Chrono-Flare para alinearlo con las **Directrices de Identidad Corporativa de Garrigues** (Agosto 2022).

### Cambios Principales

| Aspecto | Estado Actual | Estado Objetivo |
|---------|---------------|-----------------|
| **Color Principal** | `#FF6B35` (naranja) | `#004D40` (PANTONE 3308 C) |
| **Tipografía** | Inter | Montserrat (UI) + Arial (docs) |
| **Sistema de Tokens** | Variables CSS ad-hoc | Tokens estructurados |
| **Componentes** | Estilos inline | UI Kit estandarizado |

---

## Fase 1: Fundaciones (Semana 1)

### 1.1 Implementar Design Tokens

**Archivos creados:**
- `spec/ux/tokens/tokens.json` — Tokens en formato JSON
- `spec/ux/tokens/tokens.css` — Variables CSS generadas

**Acciones:**
1. Copiar `tokens.css` a `frontend/src/tokens.css`
2. Importar en `index.css` al inicio
3. Añadir Google Fonts Montserrat

```html
<!-- En index.html -->
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 1.2 Migrar Variables CSS Existentes

**Archivo:** `frontend/src/index.css`

```diff
:root {
-  --primary: #FF6B35;
-  --primary-dark: #E5562E;
+  --primary: #004D40;      /* PANTONE 3308 C */
+  --primary-dark: #00332B;
   ...
}

body {
-  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
+  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

---

## Fase 2: Componentes Core (Semana 2-3)

### 2.1 Auditoría de Componentes Existentes

| Componente Actual | Archivo | Cambios Requeridos |
|-------------------|---------|-------------------|
| Stepper | `components/Stepper.tsx` | Colores, estados, A11y |
| Botones | CSS classes `.btn-*` | Variantes según UI Kit |
| Forms | CSS classes `.form-*` | Labels, validación |
| Modales | `InviteModal/` | Focus trap, Esc |
| Alertas | `StateAlert/` | Variantes semánticas |
| Chat | `ChatPanel/` | A11y, estados |

### 2.2 Prioridad de Componentes

1. **Alta:** Button, TextField, Alert, Stepper
2. **Media:** Modal, Select, FileUploader
3. **Baja:** Tooltip, Skeleton, EmptyState

### 2.3 Patrón de Migración por Componente

```tsx
// Antes: estilos hardcoded
<button className="btn btn-primary">

// Después: tokens + variantes
<Button variant="primary" loading={isLoading}>
  Enviar solicitud
</Button>
```

---

## Fase 3: Pantallas (Semana 4)

### 3.1 Wizard de Contrato

Aplicar componentes migrados según `CASE0_COMPONENT_MAP.md`:

- Header con branding Garrigues
- Stepper con estados accesibles
- Formularios con validación inline
- Botones con copy accionable

### 3.2 Dashboard

- Colores corporativos
- Tipografía Montserrat
- Estados de contrato con semántica correcta

### 3.3 Centro de Comunicaciones

- Chat con A11y
- Alertas y callouts

---

## Fase 4: Validación (Semana 5)

### 4.1 Checklist por Componente

Para cada componente verificar:

- [ ] Usa tokens (no hardcode)
- [ ] Estados: default/hover/focus/disabled/loading
- [ ] Accesible por teclado
- [ ] No depende solo de color
- [ ] Copy accionable

### 4.2 Auditoría de Accesibilidad

```bash
# Auditoría con axe-core
npx @axe-core/cli http://localhost:5173
```

### 4.3 Validación de Marca

- [ ] Logo solo escala proporcional
- [ ] PANTONE 3308 C al 100%
- [ ] Montserrat en UI
- [ ] Arial en documentos exportables

---

## Impacto en Archivos

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `frontend/src/index.css` | Tokens, colores, tipografía |
| `frontend/src/components/Stepper.tsx` | Estilos, estados |
| `frontend/src/components/layout/Header.tsx` | Branding |
| `frontend/src/pages/*.tsx` | Clases CSS actualizadas |
| `frontend/index.html` | Google Fonts |

### Archivos Nuevos

| Archivo | Propósito |
|---------|-----------|
| `frontend/src/tokens.css` | Variables CSS |
| `frontend/src/components/ui/Button.tsx` | Componente Button |
| `frontend/src/components/ui/TextField.tsx` | Componente Input |
| `frontend/src/components/ui/Alert.tsx` | Componente Alert |

---

## Comparativa Visual

### Paleta de Colores

| Rol | Antes | Después |
|-----|-------|---------|
| Primary | 🟠 `#FF6B35` | 🟢 `#004D40` |
| Primary Dark | 🟠 `#E5562E` | 🟢 `#00332B` |
| Success | 🟢 `#10B981` | 🟢 `#2E7D32` |
| Warning | 🟡 `#F59E0B` | 🟡 `#F57C00` |
| Danger | 🔴 `#EF4444` | 🔴 `#C62828` |

### Tipografía

| Contexto | Antes | Después |
|----------|-------|---------|
| UI Web | Inter | Montserrat |
| Documentos | Inter | Arial |
| Código | Courier | Roboto Mono |

---

## Estimación de Esfuerzo

| Fase | Duración | Riesgo |
|------|----------|--------|
| Fundaciones | 3-5 días | Bajo |
| Componentes Core | 5-8 días | Medio |
| Pantallas | 3-5 días | Bajo |
| Validación | 2-3 días | Bajo |
| **Total** | **13-21 días** | — |

---

## Dependencias Externas

1. **Aprobación de Marca**: Validar con equipo de branding Garrigues
2. **Google Fonts**: Añadir Montserrat
3. **Testing A11y**: Herramientas axe-core / Pa11y

---

## Métricas de Éxito

- [ ] 0 colores hardcoded fuera de tokens
- [ ] Lighthouse Accessibility > 90
- [ ] Todos los componentes del UI Kit implementados
- [ ] Validación de marca aprobada
