# Integración Futura de Firma Electrónica Cualificada (Signature Manager)

Este documento detalla la estrategia para integrar el módulo **Signature Manager** de GCloud Factory Digital Trust en una fase posterior.

## Objetivo
Permitir la firma electrónica cualificada (QES) o avanzada de contratos de arras y otros documentos legales dentro de Chrono-Flare.

## Prerrequisitos
1. **Integración QTSP Base**: Completada (Auth + Evidence Manager).
2. **Modelo de Datos**: Tablas para `signature_requests` y `signatories`.
3. **UI**: Interfaz para visualizar el estado de la firma y redirigir a los firmantes.

## Flujo Propuesto (Signature Workflow)

El flujo de trabajo estándar para una firma es:

1. **Crear Petición de Firma (Draft)**
   - **Endpoint**: `POST /api/v1/private/signature-requests`
   - **Payload**: Título, descripción, `externalId` (ID del contrato).
   - **Estado**: `DRAFT`.

2. **Añadir Documentos**
   - **Endpoint**: `POST /api/v1/private/signature-requests/{id}/documents`
   - **Acción**: Subir el PDF del contrato generado.
   - **Nota**: Se puede reutilizar el hash/archivo ya registrado en Evidence Manager, pero Signature Manager suele requerir el contenido para la visualización del firmante.

3. **Añadir Firmantes (Signatories)**
   - **Endpoint**: `POST /api/v1/private/signature-requests/{id}/signatories`
   - **Datos**: Nombre, email, teléfono (para SMS OTP), rol (SIGNER, APPROVER).
   - **Tipo de Firma**: Configurar si es OTP sms, certificado en nube, etc.

4. **Definir Coordenadas (Optional)**
   - Si se requiere firma visible en el PDF:
   - **Endpoint**: `PUT /api/v1/private/signature-requests/{reqId}/documents/{docId}/signatories/{sigId}/coordinates`

5. **Activar Petición**
   - **Endpoint**: `PUT /api/v1/private/signature-requests/{id}/activate`
   - **Resultado**: GCloud Factory envía emails/SMS a los firmantes.

6. **Webhooks / Polling**
   - Configurar un endpoint en Chrono-Flare para recibir notificaciones de estado (`SIGNED`, `REJECTED`).
   - O implementar un cron job que consulte el estado.

## Cambios Necesarios en Backend

### Nuevo Servicio: `qtspSignatureService.ts`
Implementar métodos para:
- `createSignatureRequest(contractId, ...)`
- `addSignatory(requestId, person)`
- `activateSignature(requestId)`
- `checkSignatureStatus(requestId)`

### Base de Datos
- Tabla `firmas_contrato`:
  - `id` (UUID)
  - `contrato_id` (FK)
  - `qtsp_request_id` (External Ref)
  - `estado` (PENDIENTE, EN_PROCESO, COMPLETADO, RECHAZADO)
  - `url_doc_firmado`

## Consideraciones de UX
- **Wizard**: Añadir un paso final "Firma" donde se inicia el proceso.
- **Dashboard**: Mostrar estado de firmas en tiempo real.
- **Redirección**: Si la firma es presencial (tablet), usar la URL de firma proporcionada por la API.

## Referencias
- [GCloud Factory Signature Manager Docs](https://digitaltrust.gcloudfactory.com/integration/signature-manager/step-by-step-guide.html)
