# UI Components - Garrigues UI Kit

Componentes React estandarizados siguiendo las Directrices de Identidad Corporativa de Garrigues.

## Instalación

Los componentes están en `frontend/src/components/ui/` y se importan desde el index:

```tsx
import { Button, TextField, Alert, Modal } from '@/components/ui';
// o
import { Button } from '../components/ui/Button';
```

---

## Componentes Disponibles

### Button

Botón con 4 variantes y 3 tamaños.

```tsx
<Button variant="primary" size="md" loading={false}>
  Guardar contrato
</Button>

<Button variant="secondary">Cancelar</Button>
<Button variant="tertiary">Más opciones</Button>
<Button variant="danger">Eliminar</Button>
```

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| variant | `'primary' \| 'secondary' \| 'tertiary' \| 'danger'` | `'primary'` | Estilo visual |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño |
| loading | `boolean` | `false` | Muestra spinner |
| fullWidth | `boolean` | `false` | Ocupa todo el ancho |
| leftIcon | `ReactNode` | — | Icono a la izquierda |
| rightIcon | `ReactNode` | — | Icono a la derecha |

---

### TextField

Input con label, validación y estados.

```tsx
<TextField
  label="Nombre completo"
  placeholder="Introduce tu nombre"
  required
  error={errors.nombre}
  helperText="Como aparece en tu DNI"
/>
```

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| label | `string` | — | Etiqueta (requerida) |
| helperText | `string` | — | Texto de ayuda |
| error | `string` | — | Mensaje de error |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño |
| leftIcon | `ReactNode` | — | Icono izquierdo |
| rightIcon | `ReactNode` | — | Icono derecho |

---

### Select

Dropdown con opciones.

```tsx
<Select
  label="Estado del contrato"
  options={[
    { value: 'borrador', label: 'Borrador' },
    { value: 'firmado', label: 'Firmado' },
    { value: 'completado', label: 'Completado' },
  ]}
  placeholder="Selecciona..."
/>
```

---

### Alert

Mensajes informativos con severidad.

```tsx
<Alert variant="info" title="Información">
  El contrato está pendiente de firma.
</Alert>

<Alert variant="warning" title="Atención" onDismiss={() => {}}>
  El plazo vence en 3 días.
</Alert>

<Alert variant="critical">Error al guardar el documento.</Alert>
<Alert variant="success">Contrato firmado correctamente.</Alert>
```

---

### Modal

Diálogos modales con accesibilidad completa.

```tsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Confirmar envío"
  size="md"
  footer={
    <>
      <Button variant="secondary" onClick={onClose}>Cancelar</Button>
      <Button variant="primary" onClick={onConfirm}>Confirmar</Button>
    </>
  }
>
  <p>¿Estás seguro de enviar el contrato?</p>
</Modal>
```

**Características:**
- Focus trap automático
- Cierre con Esc
- Previene scroll del body
- Restaura foco al cerrar

---

### Badge

Etiquetas de estado.

```tsx
<Badge variant="success">Activo</Badge>
<Badge variant="warning" size="sm">Pendiente</Badge>
<Badge variant="danger" dot />
```

---

### Skeleton

Placeholders de carga.

```tsx
<Skeleton variant="text" width="60%" />
<Skeleton variant="circular" width={40} height={40} />
<Skeleton variant="rectangular" height={200} />
<Skeleton variant="text" lines={3} />
```

---

### Spinner

Indicador de carga.

```tsx
<Spinner size="md" />
<Spinner size="lg" color="primary" label="Cargando datos..." />
```

---

## Colores (Tokens)

| Variable | Valor | Uso |
|----------|-------|-----|
| `--color-primary` | `#004D40` | PANTONE 3308 C |
| `--color-primary-dark` | `#00332B` | Hover/active |
| `--color-success` | `#2E7D32` | Éxito |
| `--color-warning` | `#F57C00` | Advertencia |
| `--color-error` | `#C62828` | Error |
| `--color-info` | `#0288D1` | Información |

---

## Accesibilidad

Todos los componentes cumplen con:

- ✅ Focus visible
- ✅ Navegación por teclado
- ✅ ARIA labels
- ✅ No dependen solo del color
- ✅ Roles semánticos
