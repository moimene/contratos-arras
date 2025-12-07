# API Reference - Sistema de Contratos de Arras

## Base URL
```
Development: http://localhost:4000/api
```

## Authentication
Actualmente no implementada. TODO: Añadir Supabase Auth en producción.

---

## Health Check

### GET /api/health
Verifica que el servidor esté funcionando.

**Response**
```json
{
  "status": "ok",
  "timestamp": "2025-12-07T18:33:54.123Z",
  "service": "arras-backend"
}
```

---

## Contratos

### POST /api/contratos
Crea un nuevo contrato con su inmueble.

**Request Body**
```json
{
  "inmueble": {
    "direccion_completa": "Calle Mayor 123",
    "codigo_postal": "28001",
    "ciudad": "Madrid",
    "provincia": "Madrid",
    "referencia_catastral": "1234567890",
    "datos_registrales": "Registro de la Propiedad nº 1..."
  },
  "contrato": {
    "tipo_arras": "PENITENCIALES",
    "precio_total": 250000,
    "importe_arras": 25000,
    "moneda": "EUR",
    "fecha_limite_firma_escritura": "2025-06-30T00:00:00Z",
    "forma_pago_arras": "AL_FIRMAR",
    "notario_designado_nombre": "Juan Pérez García",
    "gastos_quien": "LEY",
    "via_resolucion": "JUZGADOS",
    "firma_preferida": "ELECTRONICA"
  }
}
```

**Response 201**
```json
{
  "id": "uuid-del-contrato",
  "inmueble_id": "uuid-del-inmueble",
  "estado": "BORRADOR",
  "tipo_arras": "PENITENCIALES",
  "precio_total": 250000,
  "importe_arras": 25000,
  "porcentaje_arras_calculado": 10,
  "version_hash": "abc123...",
  "version_numero": 1,
  "identificador_unico": "uuid-único",
  "created_at": "2025-12-07T...",
  "inmueble": { ... }
}
```

**Events Certified**: `CONTRATO_CREADO`

---

### GET /api/contratos/:id
Obtiene un contrato completo con todas sus relaciones.

**Response 200**
```json
{
  "contrato": { ... },
  "inmueble": { ... },
  "partes": [
    {
      "id": "uuid-relacion",
      "contrato_id": "...",
      "parte_id": "...",
      "rol_en_contrato": "COMPRADOR",
      "obligado_aceptar": true,
      "obligado_firmar": true,
      "porcentaje_propiedad": 50,
      "parte": {
        "id": "...",
        "nombre": "María",
        "apellidos": "González López",
        "email": "maria@example.com",
        ...
      }
    }
  ],
  "obligadosAceptar": ["uuid-parte1", "uuid-parte2"],
  "aceptacionesValidas": [ ... ],
  "firmasValidas": [ ... ]
}
```

---

### PUT /api/contratos/:id
Actualiza datos del contrato y/o inmueble.

**Request Body**
```json
{
  "contrato": {
    "precio_total": 260000,
    "importe_arras": 26000
  },
  "inmueble": {
    "datos_registrales": "Registro actualizado..."
  }
}
```

**Response 200**
Contrato completo actualizado con nuevo `version_hash` si cambió algo esencial.

**Behavior**: Si se modifican términos esenciales:
- Se invalidan aceptaciones y firmas previas
- Estado → `EN_NEGOCIACION`
- Se incrementa `version_numero`

---

### POST /api/contratos/:id/partes
Vincula una parte (comprador/vendedor) a un contrato.

**Request Body**
```json
{
  "parteId": "uuid-de-la-parte",
  "rolEnContrato": "COMPRADOR",
  "obligadoAceptar": true,
  "obligadoFirmar": true,
  "porcentajePropiedad": 50
}
```

**Response 201**
```json
{
  "id": "uuid-relacion",
  "contrato_id": "...",
  "parte_id": "...",
  "rol_en_contrato": "COMPRADOR",
  "obligado_aceptar": true,
  "obligado_firmar": true,
  "porcentaje_propiedad": 50
}
```

---

### PATCH /api/contratos/:id/partes/:contratoParteId
Actualiza flags de obligado aceptar/firmar y porcentaje de propiedad.

**Request Body**
```json
{
  "obligadoAceptar": false,
  "porcentajePropiedad": 100
}
```

---

### DELETE /api/contratos/:id/partes/:contratoParteId
Elimina la vinculación de una parte al contrato.

**Response 200**
```json
{ "ok": true }
```

---

### GET /api/contratos/:id/estado
Obtiene el estado del contrato y requisitos cumplidos.

**Response 200**
```json
{
  "estado": "BORRADOR",
  "versionHash": "abc123...",
  "versionNumero": 1,
  "requisitos": {
    "tieneInmueble": true,
    "tienePartes": true,
    "tieneObligadosAceptar": true,
    "tieneObligadosFirmar": true,
    "todosAceptaron": false,
    "todosFirmaron": false
  }
}
```

---

## Partes

### POST /api/partes
Crea una nueva parte (persona física).

**Request Body**
```json
{
  "rol": "COMPRADOR",
  "nombre": "María",
  "apellidos": "González López",
  "estado_civil": "Soltera",
  "tipo_documento": "DNI",
  "numero_documento": "12345678A",
  "email": "maria@example.com",
  "telefono": "+34 600 123 456",
  "domicilio": "Calle Ejemplo 45, Madrid",
  "es_representante": false
}
```

**Response 201**
```json
{
  "id": "uuid-de-la-parte",
  "rol": "COMPRADOR",
  "nombre": "María",
  ...
  "created_at": "2025-12-07T..."
}
```

---

### GET /api/partes/:id
Obtiene una parte por ID.

---

### PUT /api/partes/:id
Actualiza una parte.

---

### DELETE /api/partes/:id
Elimina una parte (solo si no está vinculada a contratos).

---

## Aceptaciones

### GET /api/aceptaciones/:contratoId
Lista todas las aceptaciones de un contrato.

**Response 200**
```json
[
  {
    "id": "uuid-aceptacion",
    "contrato_id": "...",
    "parte_id": "...",
    "version_contrato": "abc123...",
    "fecha_hora_aceptacion": "2025-12-07T...",
    "direccion_ip": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "valida": true
  }
]
```

---

### POST /api/aceptaciones/:contratoId
Registra la aceptación de términos esenciales por una parte.

**Request Body**
```json
{
  "parteId": "uuid-de-la-parte"
}
```

**Response 200**
```json
{
  "ok": true,
  "allAccepted": false
}
```

**Behavior**:
- Captura IP y User-Agent automáticamente
- Si todos los obligados aceptan → Estado: `TERMINOS_ESENCIALES_ACEPTADOS`
- **Certifica evento**: `ACEPTACION_TERMINOS`

---

## Firmas

### GET /api/firmas/:contratoId
Lista todas las firmas de un contrato.

---

### POST /api/firmas/:contratoId
Registra la firma electrónica de una parte.

**Request Body**
```json
{
  "parteId": "uuid-de-la-parte"
}
```

**Response 200**
```json
{
  "ok": true,
  "allSigned": true
}
```

**Behavior**:
- Requiere estado `BORRADOR_GENERADO`
- Captura IP y User-Agent automáticamente
- Si todos los obligados firman → Estado: `FIRMADO`
- **Certifica evento**: `FIRMA_ELECTRONICA`

---

## Estados del Contrato

| Estado | Descripción |
|--------|-------------|
| `BORRADOR` | Contrato recién creado |
| `EN_NEGOCIACION` | Términos esenciales modificados, requiere re-aceptación |
| `TERMINOS_ESENCIALES_ACEPTADOS` | Todas las partes obligadas aceptaron |
| `BORRADOR_GENERADO` | PDF borrador generado (TODO) |
| `FIRMADO` | Todas las partes obligadas firmaron |
| `CERRADO` | Contrato cerrado (completado o cancelado) |

---

## Términos Esenciales (Control de Versión)

Los siguientes campos forman parte del `version_hash`:
- Datos del inmueble (dirección, ciudad, provincia)
- `tipo_arras`
- `precio_total`
- `importe_arras`
- `fecha_limite_firma_escritura`
- Configuración de pago de arras (`forma_pago_arras`, plazos)
- Partes obligadas con sus roles

**Si cambias cualquiera** → Se invalidan aceptaciones/firmas y estado → `EN_NEGOCIACION`.

---

## Certificación de Eventos (QTSP)

Todos los eventos importantes se certifican con sello de tiempo:
- `CONTRATO_CREADO`
- `ACEPTACION_TERMINOS`
- `FIRMA_ELECTRONICA`
- (más según se implementen)

Cada evento se:
1. Canonicaliza (JSON ordenado)
2. Calcula hash SHA-256
3. Encadena con evento anterior
4. Solicita sello de tiempo a QTSP (EAD Trust/GoCertius)
5. Persiste en `eventos` y `sellos_tiempo`

---

## Errors

### 400 Bad Request
```json
{
  "error": "Mensaje de error descriptivo"
}
```

### 404 Not Found
```json
{
  "error": "Recurso no encontrado"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error interno del servidor"
}
```

---

## TODO - Endpoints Pendientes

- `POST /api/contratos/:id/generar-borrador` - Generar PDF borrador
- `GET /api/contratos/:id/pdf/borrador` - Descargar PDF borrador
- `GET /api/contratos/:id/pdf/firmado` - Descargar PDF firmado
- `POST /api/contratos/:id/generar-minuta` - Generar minuta de escritura
- `POST /api/archivos/:contratoId/subir` - Subir archivos
- `POST /api/pagos/:contratoId` - Gestión de pagos
- `POST /api/actas-no-comparecencia/:contratoId` - Actas
- `POST /api/certificados/:contratoId/generar` - Certificados finales

---

**Última actualización**: 2025-12-07
