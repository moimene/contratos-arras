# n8n Workflows - ChronoFlare

Workflows para gestionar comunicaciones certificadas **bidireccionales**:

- **Salientes**: Envío de notificaciones por Email/WhatsApp
- **Entrantes**: Recepción y certificación QTSP de emails

## 📦 Requisitos

- n8n instalado (self-hosted o cloud)
- Cuenta SMTP para emails (Gmail, SendGrid, Resend, etc.)
- Cuenta IMAP para recepción de emails
- Cuenta Twilio para WhatsApp (opcional)

## 🚀 Instalación

### 1. Importar el Workflow en n8n

1. Abre tu instancia de n8n
2. Ve a **Workflows** → **Import from File**
3. Selecciona `comunicaciones-workflow.json`
4. El workflow se importará con el webhook listo

### 2. Configurar Credenciales

#### Email (SMTP)
1. En n8n, ve a **Credentials** → **Add Credential**
2. Selecciona **SMTP**
3. Configura:
   - **Host**: smtp.gmail.com (o tu proveedor)
   - **Port**: 587
   - **Username**: tu email
   - **Password**: tu contraseña de aplicación

#### WhatsApp (Twilio)
1. Crea una cuenta en [Twilio](https://www.twilio.com/)
2. Activa WhatsApp Sandbox o compra un número
3. En n8n, añade credential **Twilio API**:
   - **Account SID**: desde tu dashboard Twilio
   - **Auth Token**: desde tu dashboard Twilio

### 3. Configurar ChronoFlare

En `backend/.env`, configura:

```env
N8N_ENABLED=true
N8N_WEBHOOK_URL=http://localhost:5678/webhook/comunicaciones
N8N_WEBHOOK_SECRET=tu_secret_aqui
```

Si usas n8n Cloud:
```env
N8N_WEBHOOK_URL=https://TU_INSTANCIA.app.n8n.cloud/webhook/comunicaciones
```

### 4. Activar el Workflow

1. En n8n, abre el workflow importado
2. Haz clic en el toggle para **Activar** el workflow
3. Copia la URL del webhook desde el nodo "Webhook - Comunicaciones"
4. Actualiza `N8N_WEBHOOK_URL` en tu `.env` si es diferente

## 🧪 Probar

### Desde API:

```bash
curl -X POST http://localhost:4000/api/notifications/test
```

### Respuesta esperada:
```json
{
  "success": true,
  "message": "Notificación de prueba enviada correctamente"
}
```

## 📧 Payload del Webhook

Cuando se crea una comunicación, ChronoFlare envía:

```json
{
  "event": "COMUNICACION_CREADA",
  "timestamp": "2024-12-09T11:00:00Z",
  "comunicacion": {
    "id": "uuid",
    "tipo": "RECLAMACION",
    "canal": "PLATAFORMA",
    "asunto": "Reclamación formal: Impago de arras",
    "contenido": "...",
    "remitenteRol": "ADMIN",
    "destinatarios": [
      {
        "rol": "COMPRADOR",
        "nombre": "Juan Pérez",
        "email": "juan@email.com",
        "telefono": "+34666123456"
      }
    ]
  },
  "contrato": {
    "id": "uuid",
    "numeroExpediente": "ARR-2024-001"
  },
  "notificarVia": ["EMAIL", "WHATSAPP"]
}
```

## 🔄 Eventos Soportados

| Evento | Descripción |
|--------|-------------|
| `COMUNICACION_CREADA` | Nueva comunicación interna |
| `COMUNICACION_ENVIADA` | Comunicación enviada |
| `COMUNICACION_EXTERNA_IMPORTADA` | Comunicación externa registrada |
| `TEST_NOTIFICATION` | Notificación de prueba |

## 🛠 Personalización

### Cambiar Template de Email

En el nodo "Enviar Email", modifica el campo `message` con tu HTML personalizado.

### Agregar Más Canales

Puedes extender el workflow añadiendo nodos para:
- Slack
- Telegram  
- SMS (via Twilio)
- Push notifications

## ❓ Troubleshooting

### El webhook no recibe datos
1. Verifica que `N8N_ENABLED=true`
2. Comprueba que la URL es correcta
3. Revisa los logs del backend

### Email no se envía
1. Verifica las credenciales SMTP
2. Para Gmail, usa una "App Password"
3. Comprueba que el puerto 587 no está bloqueado

### WhatsApp no funciona
1. Asegúrate de usar formato `+34XXXXXXXXX`
2. El número debe estar registrado en Twilio Sandbox
3. Verifica que tienes saldo en Twilio

---

## 📥 Recepción de Emails (Inbound)

### Arquitectura

```
Email → IMAP → n8n → ChronoFlare API → Certificación QTSP
```

La plataforma actúa como **tercero de confianza QTSP**:
- ✅ Certifica el momento de **recepción** en plataforma
- ⚠️ **No certifica** el momento del envío original

### Workflow: `recepcion-emails-workflow.json`

1. **Importar** en n8n
2. **Configurar credenciales IMAP**:
   - Host: imap.gmail.com
   - Port: 993
   - Username/Password

3. **Variables de entorno** en n8n:
   - `CHRONOFLARE_API_URL`: http://localhost:4000
   - `INBOUND_WEBHOOK_SECRET`: tu_secret

### Email por Expediente

Cada expediente tiene un email único para recibir comunicaciones:

```
expediente+ARR-2024-001@tu-dominio.com
```

Obtén el email de un expediente:
```bash
curl http://localhost:4000/api/inbound/email-address/CONTRATO_ID
```

### Flujo de Certificación

1. Email llega al buzón monitoreado por n8n
2. n8n extrae el número de expediente del destinatario
3. Envía el email a `/api/inbound/n8n/email-parsed`
4. ChronoFlare:
   - Calcula hash SHA-256 del contenido canónico
   - **Solicita sello QTSP inmediatamente**
   - Registra comunicación con sello
   - Registra evento

### Advertencia Legal

> ⚠️ **Importante**: El sello QTSP certifica que la comunicación fue **recibida** en la plataforma en un momento determinado. **NO certifica** que el remitente la envió en ese momento ni que fue entregada correctamente.

### Endpoints Inbound

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/inbound/email` | Recibe email genérico |
| POST | `/api/inbound/n8n/email-parsed` | Específico para n8n |
| POST | `/api/inbound/webhook` | Recibe webhook externo |
| GET | `/api/inbound/email-address/:contratoId` | Genera email del expediente |
| GET | `/api/inbound/stats/:contratoId` | Estadísticas de recepción |
