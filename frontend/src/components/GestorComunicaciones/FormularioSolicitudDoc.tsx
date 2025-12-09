/**
 * FormularioSolicitudDoc Component
 * 
 * Formulario estructurado para solicitar documentación.
 * Incluye: lista de documentos, plazo, justificación.
 */

import { useState } from 'react';
import './FormulariosComunicacion.css';

interface FormularioSolicitudDocProps {
    isOpen: boolean;
    onClose: () => void;
    onEnviado: () => void;
    contratoId: string;
    rolActual: string;
}

const DOCUMENTOS_PREDEFINIDOS = [
    { key: 'NOTA_SIMPLE', label: 'Nota simple actualizada' },
    { key: 'CERTIFICADO_CARGAS', label: 'Certificado de cargas' },
    { key: 'CERTIFICADO_ITE', label: 'Certificado ITE' },
    { key: 'CERTIFICADO_EFICIENCIA', label: 'Certificado de eficiencia energética' },
    { key: 'CEDULA_HABITABILIDAD', label: 'Cédula de habitabilidad' },
    { key: 'ULTIMO_RECIBO_IBI', label: 'Último recibo de IBI' },
    { key: 'CERTIFICADO_COMUNIDAD', label: 'Certificado de estar al corriente con la comunidad' },
    { key: 'SUMINISTROS', label: 'Últimos recibos de suministros (agua, luz, gas)' },
    { key: 'DNI_PARTES', label: 'Copia de DNI/NIE de las partes' },
    { key: 'PODERES', label: 'Poderes de representación' },
    { key: 'OTRO', label: 'Otro documento' }
];

const DESTINATARIOS = [
    { value: 'COMPRADOR', label: 'Parte compradora' },
    { value: 'VENDEDOR', label: 'Parte vendedora' },
    { value: 'AMBAS', label: 'Ambas partes' }
];

export default function FormularioSolicitudDoc({
    isOpen,
    onClose,
    onEnviado,
    contratoId,
    rolActual
}: FormularioSolicitudDocProps) {
    const [documentosSeleccionados, setDocumentosSeleccionados] = useState<string[]>([]);
    const [otroDocumento, setOtroDocumento] = useState('');
    const [destinatario, setDestinatario] = useState('');
    const [plazoDias, setPlazoDias] = useState('7');
    const [justificacion, setJustificacion] = useState('');
    const [urgente, setUrgente] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const toggleDocumento = (key: string) => {
        setDocumentosSeleccionados(prev =>
            prev.includes(key)
                ? prev.filter(d => d !== key)
                : [...prev, key]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (documentosSeleccionados.length === 0 || !destinatario) {
            setError('Selecciona al menos un documento y un destinatario');
            return;
        }

        setLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

            const documentosLabels = documentosSeleccionados.map(key => {
                if (key === 'OTRO') return otroDocumento || 'Otro documento';
                return DOCUMENTOS_PREDEFINIDOS.find(d => d.key === key)?.label || key;
            });

            const contenido = `
## SOLICITUD DE DOCUMENTACIÓN

${urgente ? '🔴 **URGENTE**\n' : ''}
Se solicita la siguiente documentación:

${documentosLabels.map(d => `- ${d}`).join('\n')}

### Plazo de entrega

La documentación debe ser entregada en un plazo máximo de **${plazoDias} días** desde la recepción de esta solicitud.
${justificacion ? `\n### Justificación\n\n${justificacion}` : ''}

---
*Esta solicitud ha sido enviada a través de la plataforma y sellada con marca de tiempo cualificada (QTSP).*
            `.trim();

            const response = await fetch(
                `${apiUrl}/api/contratos/${contratoId}/comunicaciones`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tipoComunicacion: 'SOLICITUD_DOCUMENTACION',
                        canal: 'PLATAFORMA',
                        remitenteRol: rolActual,
                        destinatariosRoles: destinatario === 'AMBAS'
                            ? ['COMPRADOR', 'VENDEDOR']
                            : [destinatario],
                        asunto: `Solicitud de documentación${urgente ? ' (URGENTE)' : ''}`,
                        contenido,
                        metadatos: {
                            documentos_solicitados: documentosSeleccionados,
                            documentos_labels: documentosLabels,
                            otro_documento: otroDocumento,
                            plazo_dias: parseInt(plazoDias),
                            urgente,
                            justificacion
                        },
                        enviarInmediatamente: true
                    })
                }
            );

            const result = await response.json();

            if (result.success) {
                onEnviado();
                onClose();
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            setError(err.message || 'Error al enviar solicitud');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-comunicacion-overlay" onClick={onClose}>
            <div className="form-comunicacion-modal large" onClick={e => e.stopPropagation()}>
                <div className="form-header solicitud">
                    <h3>📄 Solicitud de Documentación</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="form-comunicacion">
                    {/* Urgente */}
                    <div className="form-group">
                        <label className="checkbox-option urgente">
                            <input
                                type="checkbox"
                                checked={urgente}
                                onChange={e => setUrgente(e.target.checked)}
                            />
                            <span>🔴 Marcar como URGENTE</span>
                        </label>
                    </div>

                    {/* Documentos */}
                    <div className="form-group">
                        <label>Documentos a solicitar *</label>
                        <div className="checkbox-grid">
                            {DOCUMENTOS_PREDEFINIDOS.map(doc => (
                                <label key={doc.key} className="checkbox-option">
                                    <input
                                        type="checkbox"
                                        checked={documentosSeleccionados.includes(doc.key)}
                                        onChange={() => toggleDocumento(doc.key)}
                                    />
                                    <span>{doc.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {documentosSeleccionados.includes('OTRO') && (
                        <div className="form-group">
                            <label>Especifica el documento</label>
                            <input
                                type="text"
                                value={otroDocumento}
                                onChange={e => setOtroDocumento(e.target.value)}
                                placeholder="Nombre del documento..."
                            />
                        </div>
                    )}

                    {/* Destinatario */}
                    <div className="form-group">
                        <label>Destinatario *</label>
                        <div className="radio-group">
                            {DESTINATARIOS.map(d => (
                                <label key={d.value} className="radio-option">
                                    <input
                                        type="radio"
                                        name="destinatario"
                                        value={d.value}
                                        checked={destinatario === d.value}
                                        onChange={e => setDestinatario(e.target.value)}
                                    />
                                    <span>{d.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Plazo */}
                    <div className="form-group">
                        <label>Plazo de entrega (días) *</label>
                        <input
                            type="number"
                            value={plazoDias}
                            onChange={e => setPlazoDias(e.target.value)}
                            min="1"
                            max="30"
                            required
                            style={{ width: '100px' }}
                        />
                    </div>

                    {/* Justificación */}
                    <div className="form-group">
                        <label>Justificación (opcional)</label>
                        <textarea
                            value={justificacion}
                            onChange={e => setJustificacion(e.target.value)}
                            placeholder="Explica por qué necesitas esta documentación..."
                            rows={3}
                        />
                    </div>

                    {error && (
                        <div className="form-error">⚠️ {error}</div>
                    )}

                    <div className="form-disclaimer">
                        <p>
                            🔐 Esta solicitud será sellada con marca de tiempo cualificada (QTSP).
                        </p>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-enviar solicitud" disabled={loading}>
                            {loading ? 'Enviando...' : '📄 Enviar Solicitud'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
