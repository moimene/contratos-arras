# UI Kit mínimo — Componentes de Producto (Garrigues)

**Versión:** 1.0  
**Ámbito:** todas las apps; Caso 0 como referencia canónica.  
**Dependencias:** `spec/ux/tokens/tokens.json` y `spec/ux/tokens/tokens.css`.

---

## 0) Reglas base (marca) que afectan a UI

### Logo en UI (si aplica)
- No alterar el logotipo (solo escalado proporcional) y no crear versiones.
- El identificador se usa siempre en PANTONE 3308 C.
- Respetar el espacio reservado alrededor del identificador.

### Color
- Colores corporativos: solo uso al 100% de intensidad.
- Logotipo: PANTONE 3308 C es el único color autorizado; monocromo requiere autorización previa.

### Tipografía
- Montserrat: brochures/material publicitario.
- Arial: presentaciones, propuestas y documentos editables.

> Nota de producto: UI web/app usa Montserrat como primaria (con fallbacks). Outputs editables usan Arial.

### Malas prácticas (en UI también)
Evitar: porcentajes de color, deformación, tipografía incorrecta, versiones obsoletas, etc.

---

## 1) Fundaciones de UI

### 1.1 Tokens (obligatorio)
- Todo color/espaciado/radio debe venir de tokens.
- Prohibido hardcodear hex fuera de `tokens.*` salvo excepciones documentadas.

### 1.2 Escala tipográfica (sugerida)
- H1: 32/40, weight 700
- H2: 24/32, weight 700
- H3: 20/28, weight 600–700
- Body: 16/24, weight 400–500
- Small: 14/20, weight 400
- Micro: 12/16, weight 400

> Ajustar si el Design System existente ya define una escala.

### 1.3 Estados globales
Cada componente interactivo debe contemplar: `default`, `hover`, `active`, `focus`, `disabled`, `loading`.

Accesibilidad mínima:
- Focus visible.
- No depender solo de color para severidad o estados.

---

## 2) Componentes core (obligatorios)

A continuación, el contrato UX (qué hace + cómo se usa + A11y + variantes).  
**Implementación (React/Vue/etc.) queda a decisión del equipo**, pero el comportamiento debe respetarse.

---

### 2.1 Button
**Uso:** acción principal/ secundaria / terciaria.

**Variantes**
- `primary` (CTA principal)
- `secondary`
- `tertiary` (texto/enlace con affordance de botón)
- `danger` (solo si está aprobado como extensión de producto; si no, usar secondary + confirm modal)

**Estados**
- `loading`: muestra spinner + mantiene ancho para evitar layout shift
- `disabled`: no clickable + aria-disabled cuando aplique

**A11y / teclado**
- `Enter` / `Space` activan
- Focus visible
- `aria-busy="true"` en loading (si aplica)

**Copy**
- Verbo + objeto: "Enviar solicitud", "Descargar ficha", "Volver a editar".

---

### 2.2 Link
**Uso:** navegación o acciones no destructivas.  
**Regla:** si hace acción (no navegación), debe ser Button tertiary para no confundir.

**A11y**
- Subrayado visible (o estilo inequívoco).
- Estados hover/focus.

---

### 2.3 TextField (Input)
**Uso:** texto corto (nombre, CIF, etc).

**Anatomía**
- Label (siempre visible)
- Helper text (opcional)
- Error text (cuando aplique)

**Validación**
- Inline + onNextStep (en wizard)
- Error debe indicar qué falta y cómo corregirlo

**A11y**
- Label asociado al input
- Error anunciado (aria-describedby o aria-live en resumen de errores)

---

### 2.4 TextArea
**Uso:** descripciones (propósito, medidas, etc).  
**UX:** incluir contador si hay límites; permitir expandir (resize vertical) si la UI lo permite.

---

### 2.5 Select / ComboBox
**Uso:** opciones cerradas (sector, rol proveedor/usuario, etc).
- Si hay búsqueda y +20 opciones, usar `ComboBox` (typeahead).

**A11y**
- Navegable por teclado
- Indicar estado abierto/cerrado

---

### 2.6 Checkbox / Radio
**Uso**
- Checkbox: multi-selección (checklists, declaraciones)
- Radio: selección única (estado de madurez, etc)

**A11y**
- Área clicable suficiente
- Label clickable
- Focus visible en input real

---

### 2.7 FileUploader
**Uso:** anexos (DPIA, análisis de riesgos, etc).

**Requisitos UX**
- Mostrar:
  - formatos permitidos
  - tamaño máximo
  - estado: subiendo / listo / error
- Permitir eliminar y reemplazar

**A11y**
- Accesible por teclado
- Mensajes de error claros

---

### 2.8 Alert / Callout
**Uso:** información relevante sin bloquear.

**Variantes**
- `info`
- `warning`
- `critical`
- `success`

> Nota marca: si no se usan colores semánticos "rojo/ámbar", entonces la severidad debe apoyarse en icono + título + estructura (para no depender solo del color).

**A11y**
- No usar `role="alert"` salvo casos críticos; preferible `aria-live="polite"` para cambios no urgentes.

---

### 2.9 Modal (Confirmación)
**Uso:** acciones con impacto (enviar definitivamente, borrar borrador, etc).

**A11y**
- Focus trap
- `Esc` cierra (salvo casos especiales)
- Restaurar foco al disparador

---

### 2.10 Tooltip / InlineHelp
**Uso:** glosario ("¿Qué es EIPD?"), "por qué pedimos esto".

**Regla UX**
- Preferir `InlineHelp` persistente en campos críticos; tooltip solo para aclaraciones breves.

---

### 2.11 Skeleton / LoadingState
**Uso:** carga de resultados (preevaluación) y secciones del wizard.

**Regla**
- Skeleton debe reflejar estructura real para evitar "salto" visual.

---

### 2.12 EmptyState
**Uso:** sin hallazgos, sin resultados aún, sin documentos adjuntos.

**Incluye**
- título + breve explicación + CTA único (p. ej. "Iniciar solicitud")

---

## 3) Componentes Caso 0 (obligatorios si la app es regulatoria)

---

### 3.1 Stepper (Wizard)
**Uso:** formulario por secciones.

**Contrato UX**
- Mostrar progreso por pasos + nombre de sección
- Permitir:
  - "Guardar borrador"
  - "Continuar"
  - "Volver"
- Bloquear avance si hay errores críticos, pero:
  - mostrar resumen de errores
  - deep-link al campo con error

**A11y**
- Stepper navegable (si clickable)
- Indicar paso actual (aria-current)

---

### 3.2 RiskBadge
**Uso:** LOW / LIMITED / HIGH / UNACCEPTABLE.

**Contrato UX**
- Badge + texto explicativo (siempre).
- Prohibido expresar como "aprobado/no aprobado" (es preevaluación).

**A11y**
- No depender solo del color; incluir texto visible del nivel.

---

### 3.3 FindingsList + FindingItem
**Uso:** lista de hallazgos (info/advertencia/error) con recomendación y referencia.

**Estructura obligatoria por ítem**
- Severidad (texto + icono)
- Título corto (qué falta)
- Descripción (por qué importa)
- "Cómo corregirlo" (pasos accionables)
- Referencia/Fuente (si aplica)

**A11y**
- Lista semántica
- Expand/collapse opcional (acordeón) para detalles; accesible por teclado.

---

### 3.4 CitationBlock
**Uso:** mostrar fuentes/referencias de forma consistente.

**Requisitos**
- Formato: "Fuente: …" + identificador + enlace si aplica
- Acción "Copiar referencia" (opcional)
- Si hay múltiples, permitir colapsar/expandir

---

### 3.5 TechSheetSection
**Uso:** render de ficha técnica (resumen estructurado).

**Contrato UX**
- Encabezados consistentes
- Señalar "No descrito" cuando falte info
- CTA: "Descargar ficha" + "Volver a editar"

---

### 3.6 AssistantChat (UI)
**Uso:** asistente normativo (durante formulario y post‑resultado).

**Contrato UX**
- Estados:
  - idle (sugerencias de preguntas)
  - typing/loading
  - respuesta con fuentes
  - respuesta pidiendo aclaración
- Acciones por mensaje:
  - "Ver fuentes"
  - "Copiar"
  - "Esto me ayuda / no me ayuda" (feedback)

**A11y**
- Envío por Enter (con Shift+Enter salto de línea)
- Lectura clara por screen reader
- Control de scroll y foco

---

## 4) Eventos analíticos mínimos (por componente)
- Button: click (id + contexto)
- Stepper: next/back + step_name
- Form: field_error (field_id + error_type)
- FileUploader: upload_success/upload_fail
- RiskBadge: render (risk_level)
- FindingItem: expand/collapse + click "editar este paso"
- AssistantChat: question_sent + answer_shown + feedback

---

## 5) Checklist de aceptación por componente (DoD)
- [ ] Estados definidos (default/hover/focus/disabled/loading)
- [ ] Accesible por teclado
- [ ] No depende solo de color
- [ ] Copy accionable
- [ ] Usa tokens (sin hardcode)
