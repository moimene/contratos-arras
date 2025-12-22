# Integración Digital Trust API

## Descripción

Plan de integración de la API **Digital Trust** de [GCloud Factory](https://digitaltrust.gcloudfactory.com) en Chrono-Flare para proporcionar sellos de tiempo cualificados (QTSP) con valor probatorio conforme a **eIDAS** (Reglamento UE 910/2014).

### ¿Qué es Digital Trust?

Digital Trust es una plataforma de servicios legales que permite:

- **Sellado de tiempo cualificado (TSP)**: Marcas de tiempo con validez legal
- **Registro en blockchain (DLT)**: Evidencia inmutable distribuida
- **Gestión de evidencias**: Organización jerárquica (Case File → Evidence Group → Evidence)
- **Reportes sellados**: Documentos PDF con certificación de integridad

---

## Arquitectura de Integración

### Mapeo Chrono-Flare ↔ Digital Trust

| Chrono-Flare | Digital Trust | Descripción |
|--------------|---------------|-------------|
| **Contrato** (expediente) | **Case File** | Cada contrato de arras = un expediente de evidencias |
| **Tipo de evento** | **Evidence Group** | Agrupación por categoría (docs, firmas, comunicaciones) |
| **Evento individual** | **Evidence** | Cada acción con hash SHA-256 sellado |

### Evidence Groups Definidos

```
📁 Case File (Contrato)
├── 📂 DOCUMENTS
│   ├── DOCUMENTO_SUBIDO
│   ├── DOCUMENTO_VALIDADO
│   └── DOCUMENTO_RECHAZADO
├── 📂 COMMUNICATIONS
│   ├── COMUNICACION_ENVIADA
│   ├── COMUNICACION_EXTERNA_IMPORTADA
│   └── COMUNICACION_LEIDA
├── 📂 SIGNATURES
│   ├── FIRMA_REGISTRADA
│   └── DOCUMENTO_FIRMADO_SUBIDO
└── 📂 EVENTS
    └── Todos los eventos del CertifiedEventBus
```

---

## Servicios Afectados

| Servicio | Archivo | Cambios |
|----------|---------|---------|
| **Gestor Documental** | `documentService.ts` | Crear Evidence al subir/validar/rechazar documentos |
| **Centro Comunicaciones** | `communicationService.ts` | Crear Evidence para cada comunicación sellada |
| **Servicio de Firma** | `firmaService.ts` | Crear Evidence al registrar firma electrónica |
| **Bus de Eventos** | `CertifiedEventBus.ts` | Integrar `DigitalTrustClient` como `ITimestampAuthority` |
| **Certificados** | `certificateService.ts` | Opción de generar reportes sellados desde Digital Trust |

---

## Flujo de Integración

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Chrono-Flare      │     │   Digital Trust API   │     │   TSP/DLT       │
│   Backend           │     │   (Evidence Manager)  │     │   Providers     │
└─────────┬───────────┘     └──────────┬───────────┘     └────────┬────────┘
          │                            │                          │
          │  1. POST /case-files       │                          │
          │ ─────────────────────────► │                          │
          │                            │                          │
          │  2. POST /evidence-groups  │                          │
          │ ─────────────────────────► │                          │
          │                            │                          │
          │  3. POST /evidences        │                          │
          │    (hash SHA-256)          │                          │
          │ ─────────────────────────► │  4. Solicitar TST        │
          │                            │ ────────────────────────►│
          │                            │                          │
          │                            │  5. Token RFC3161        │
          │                            │ ◄────────────────────────│
          │                            │                          │
          │  6. presigned URL          │                          │
          │ ◄───────────────────────── │                          │
          │                            │                          │
          │  7. PUT file (opcional)    │                          │
          │ ─────────────────────────► │                          │
          │                            │                          │
          │  8. POST /reports          │                          │
          │ ─────────────────────────► │                          │
          │                            │                          │
          │  9. Signed PDF             │                          │
          │ ◄───────────────────────── │                          │
          ▼                            ▼                          ▼
```

---

## Configuración

### Variables de Entorno

```env
# Digital Trust API (GCloud Factory)
DIGITAL_TRUST_LOGIN_URL=https://auth.gcloudfactory.com/oauth/token
DIGITAL_TRUST_API_URL=https://api.gcloudfactory.com/digital-trust/api/v1/private
DIGITAL_TRUST_CLIENT_ID=<tu_client_id>
DIGITAL_TRUST_CLIENT_SECRET=<tu_client_secret>

# Modo QTSP: 'stub' (desarrollo) o 'production' (Digital Trust)
QTSP_MODE=production
QTSP_PROVIDER=DIGITAL_TRUST
```

### Obtener Credenciales

1. Registrarse en [Digital Trust Portal](https://digitaltrust.gcloudfactory.com/register)
2. Contactar con el equipo para obtener `client_id` y `client_secret`
3. Configurar las variables en `.env`

---

## API Reference

### Autenticación

```http
POST {login_url}?grant_type=client_credentials&client_id={clientId}&client_secret={clientSecret}&scope=token
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Crear Case File

```http
POST /api/v1/private/case-files
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "id": "uuid-del-contrato",
  "code": "EXP-2024-00001",
  "title": "Contrato de Arras - Calle Mayor 1",
  "owner": "usuario@email.com",
  "metadata": {
    "estado": "FIRMADO",
    "importe_arras": 15000
  }
}
```

### Crear Evidence

```http
POST /api/v1/private/case-files/{caseFileId}/evidence-groups/{groupId}/evidences
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "evidenceId": "uuid-del-evento",
  "hash": "a1b2c3d4e5f6...",  // SHA-256 hex
  "title": "Firma electrónica comprador",
  "fileName": "contrato_firmado.pdf",
  "custodyType": "INTERNAL",
  "capturedAt": "2024-12-21T16:00:00Z",
  "testimony": {
    "TSP": {
      "required": true,
      "providers": ["EADTrust"]
    }
  },
  "metadata": {
    "tipo_evento": "FIRMA_REGISTRADA",
    "parte_id": "uuid-comprador"
  }
}
```

### Generar Reporte Sellado

```http
POST /api/v1/private/case-files/{caseFileId}/reports
Authorization: Bearer {access_token}
```

---

## Estructura de Archivos

```
backend/src/
├── qtsp/
│   ├── eadTrustClient.ts       # Cliente actual (stub)
│   └── digitalTrustClient.ts   # ⭐ NUEVO: Cliente Digital Trust
├── services/
│   ├── CertifiedEventBus.ts    # Bus de eventos con hash chain
│   ├── documentService.ts      # Gestión documental
│   ├── communicationService.ts # Centro de comunicaciones
│   ├── firmaService.ts         # Servicio de firma
│   └── certificateService.ts   # Generación de certificados
└── config/
    └── digitalTrust.ts         # ⭐ NUEVO: Configuración
```

---

## Migración de Base de Datos

```sql
-- Añadir referencia a Digital Trust en contratos
ALTER TABLE contratos_arras 
ADD COLUMN digital_trust_case_file_id UUID,
ADD COLUMN digital_trust_created_at TIMESTAMPTZ;

-- Añadir referencia a evidencias en eventos
ALTER TABLE eventos 
ADD COLUMN digital_trust_evidence_id UUID,
ADD COLUMN digital_trust_evidence_group_id UUID;

-- Índices
CREATE INDEX idx_contratos_dt_case_file ON contratos_arras(digital_trust_case_file_id);
CREATE INDEX idx_eventos_dt_evidence ON eventos(digital_trust_evidence_id);
```

---

## Testing

### Modo Desarrollo (Stub)

```bash
QTSP_MODE=stub npm run dev
```

Los sellos se simulan localmente sin llamar a la API.

### Modo Producción

```bash
QTSP_MODE=production npm run dev
```

Se crearán Case Files y Evidences reales en Digital Trust.

### Ejecutar Tests

```bash
# Tests unitarios
npm test -- --testPathPattern=digitalTrust

# Todos los tests
npm test
```

---

## Enlaces de Referencia

- [Documentación Digital Trust](https://digitaltrust.gcloudfactory.com/getting-started.html)
- [API Swagger](https://api.gcloudfactory.com/digital-trust/swagger-ui/)
- [Guía paso a paso](https://digitaltrust.gcloudfactory.com/evidence-manager/step-by-step-guide.html)
- [Reglamento eIDAS](https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32014R0910)

---

## Estado de Implementación

- [ ] Cliente `DigitalTrustClient`
- [ ] Integración `CertifiedEventBus`
- [ ] Integración `documentService`
- [ ] Integración `communicationService`
- [ ] Integración `firmaService`
- [ ] Integración `certificateService`
- [ ] Migración de base de datos
- [ ] Tests automatizados
- [ ] Documentación de producción

---

## Contacto

Para obtener credenciales de la API Digital Trust, contactar con:
- [Formulario de contacto GCloud Factory](https://digitaltrust.gcloudfactory.com/contact)
