# Roadmap de Sprints - Chrono-Flare

> Última actualización: 2025-12-16

## 📊 Estado Actual del Proyecto

| Área | Estado | Notas |
|------|--------|-------|
| Backend API | ✅ 95% | 25+ routers, falta testing |
| Frontend Dashboard | ⚠️ 70% | Funcional pero necesita refactor |
| Autenticación | ✅ Completo | Supabase Auth |
| QTSP Integration | 🔶 Stub | Listo para producción |
| Documentación | ✅ Actualizada | README alineado con código |

---

## 🔥 Sprint 1: Estabilización (1-2 semanas)

> **Objetivo**: Resolver bugs conocidos y mejorar estabilidad

### 1.1 Correcciones Frontend
- [ ] Verificar AbortController en todos los componentes con fetch
- [ ] Unificar estados de contrato en diccionario único
- [ ] Corregir inconsistencias de naming (`CONVOCATORIA_NOTARIAL` vs `CONVOCATORIA_ESCRITURA`)

### 1.2 Correcciones Backend
- [ ] Validar que todos los endpoints devuelvan respuestas consistentes
- [ ] Revisar manejo de errores en rutas de mandatos
- [ ] Asegurar sello QTSP en todos los eventos críticos

### 1.3 Testing Básico
- [ ] Tests unitarios para servicios críticos (`eventService`, `pdfService`)
- [ ] Tests de integración para flujo de firma
- [ ] Tests E2E para wizard de contrato

---

## 🎨 Sprint 2: Refactorización Dashboard (2-3 semanas)

> **Objetivo**: Mejorar UX/UI y rendimiento del dashboard

### 2.1 Arquitectura de Componentes
- [ ] Extraer `useContrato(contratoId)` hook
- [ ] Crear `useContratoDashboardVM` para lógica derivada
- [ ] Separar layout de datos

### 2.2 Diseño Visual
- [ ] Implementar Overview colapsable arriba
- [ ] Secciones con anclas (Documentos, Notaría, Comunicaciones, etc.)
- [ ] Lazy-load de módulos pesados

### 2.3 Énfasis por Rol
- [ ] Introducir rol real del usuario (no hardcodeado)
- [ ] Contadores "tu acción" vs "acción de otro"
- [ ] Resaltado de pendientes por responsable

---

## 🔐 Sprint 3: Multi-tenancy y Organización (2 semanas)

> **Objetivo**: Habilitar organizaciones/equipos

### 3.1 Backend
- [ ] Completar CRUD de organizaciones
- [ ] Implementar límites por plan (FREE/STARTER/PRO)
- [ ] Políticas RLS por organización

### 3.2 Frontend
- [ ] Página de gestión de organización
- [ ] Invitación de miembros a organización
- [ ] Selector de organización activa

### 3.3 Permisos
- [ ] Roles organizacionales (OWNER/ADMIN/MEMBER)
- [ ] Permisos granulares por expediente

---

## 📧 Sprint 4: Notificaciones (1-2 semanas)

> **Objetivo**: Sistema completo de notificaciones

### 4.1 Backend
- [ ] Integración con n8n para envío de emails
- [ ] Templates de email para cada tipo de evento
- [ ] Cola de notificaciones con reintentos

### 4.2 Webhooks Inbound
- [ ] Procesar emails entrantes (Sendgrid/Mailgun)
- [ ] Vincular respuestas con expediente
- [ ] Registrar como comunicación externa

### 4.3 Notificaciones In-App
- [ ] Centro de notificaciones en frontend
- [ ] Badge de notificaciones pendientes
- [ ] Marcar como leído

---

## ⚖️ Sprint 5: Integración QTSP Real (2-3 semanas)

> **Objetivo**: Reemplazar stub por proveedor real

### 5.1 Selección de Proveedor
- [ ] Evaluar EADTrust, Signaturit, DocuSign
- [ ] Confirmar certificación eIDAS
- [ ] Obtener credenciales de sandbox

### 5.2 Implementación
- [ ] Adaptar `qtspClient` a API real
- [ ] Gestionar certificados X.509
- [ ] Validar tokens RFC3161

### 5.3 Testing
- [ ] Verificar sellos con herramientas third-party
- [ ] Test de carga de sellado
- [ ] Fallback si QTSP no disponible

---

## 📱 Sprint 6: Mobile & PWA (2-3 semanas)

> **Objetivo**: Experiencia móvil optimizada

### 6.1 Responsive
- [ ] Revisar todos los componentes en móvil
- [ ] Menú hamburguesa en navbar
- [ ] Dashboard adaptado a pantallas pequeñas

### 6.2 PWA
- [ ] Service worker para offline básico
- [ ] Manifest.json configurado
- [ ] Instalación desde navegador

---

## 🔮 Backlog Futuro

### Features Avanzadas
- [ ] Firma biométrica en tablet
- [ ] OCR de documentos (nota simple, DNI)
- [ ] Integración con Registro de la Propiedad
- [ ] Pagos con escrow (Stripe Connect)
- [ ] Arbitraje automatizado

### Integraciones
- [ ] API pública para integradores
- [ ] Webhook salientes configurables
- [ ] SDK para CRMs inmobiliarios

### Compliance
- [ ] Auditoría de seguridad externa
- [ ] Certificación ISO 27001
- [ ] RGPD: Derecho al olvido

---

## 📋 Matriz de Prioridades

| Sprint | Impacto | Esfuerzo | Prioridad |
|--------|---------|----------|-----------|
| 1. Estabilización | Alto | Bajo | 🔴 Crítica |
| 2. Dashboard Refactor | Alto | Medio | 🟠 Alta |
| 3. Multi-tenancy | Medio | Medio | 🟡 Media |
| 4. Notificaciones | Alto | Bajo | 🟠 Alta |
| 5. QTSP Real | Crítico | Alto | 🔴 Crítica |
| 6. Mobile/PWA | Medio | Medio | 🟡 Media |

---

## 🚀 Próxima Acción Recomendada

**Comenzar con Sprint 1** para estabilizar la plataforma antes de añadir nuevas funcionalidades. Priorizar:

1. Tests de flujo de firma (crítico para valor probatorio)
2. Unificación de estados en frontend
3. Validación de sello QTSP en eventos críticos
