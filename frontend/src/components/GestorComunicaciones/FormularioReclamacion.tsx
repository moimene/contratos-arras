/**
 * FormularioReclamacion Component
 * 
 * Formulario estructurado para enviar reclamaciones formales.
 * Incluye: motivo, importe reclamado, plazo de respuesta, acciones previstas.
 */

import { useState } from 'react';
import './FormulariosComunicacion.css';

interface FormularioReclamacionProps {
    isOpen: boolean;
    onClose: () => void;
    onEnviado: () => void;
    contratoId: string;
    rolActual: string;
}

const MOTIVOS_RECLAMACION = [
    { value: 'IMPAGO_ARRAS', label: 'Impago de arras' },
    { value: 'INCUMPLIMIENTO_PLAZO', label: 'Incumplimiento de plazo' },
    { value: 'DOCUMENTACION_FALTANTE', label: 'Documentación faltante' },
    { value: 'DEFECTOS_INMUEBLE', label: 'Defectos en el inmueble' },
    { value: 'NO_COMPARECENCIA', label: 'No comparecencia' },
    { value: 'OTRO', label: 'Otro motivo' }
];

const DESTINATARIOS = [
    { value: 'COMPRADOR', label: 'Parte compradora' },
    { value: 'VENDEDOR', label: 'Parte vendedora' },
    { value: 'AMBAS', label: 'Ambas partes' }
];

export default function FormularioReclamacion({
    isOpen,
    onClose,
    onEnviado,
    contratoId,
    rolActual
}: FormularioReclamacionProps) {
    const [motivo, setMotivo] = useState('');
    const [motivoDetalle, setMotivoDetalle] = useState('');
    const [importeReclamado, setImporteReclamado] = useState('');
    const [plazoDias, setPlazoDias] = useState('10');
    const [destinatario, setDestinatario] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [accionPrevista, setAccionPrevista] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!motivo || !destinatario || !descripcion) {
            setError('Completa los campos obligatorios');
            return;
        }

        setLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

            const contenido = `
## RECLAMACIÓN FORMAL

**Motivo:** ${MOTIVOS_RECLAMACION.find(m => m.value === motivo)?.label}
${motivoDetalle ? `\n**Detalle del motivo:** ${motivoDetalle}` : ''}
${importeReclamado ? `\n**Importe reclamado:** ${parseFloat(importeReclamado).toLocaleString('es-ES')} €` : ''}

### Descripción

${descripcion}

### Plazo de respuesta

Se requiere respuesta en un plazo máximo de **${plazoDias} días** desde la recepción de esta comunicación.
${accionPrevista ? `\n### Acciones previstas en caso de incumplimiento\n\n${accionPrevista}` : ''}

---
*Esta reclamación ha sido enviada a través de la plataforma y sellada con marca de tiempo cualificada (QTSP).*
            `.trim();

            const response = await fetch(
                `${apiUrl}/api/contratos/${contratoId}/comunicaciones`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tipoComunicacion: 'RECLAMACION',
                        canal: 'PLATAFORMA',
                        remitenteRol: rolActual,
                        destinatariosRoles: destinatario === 'AMBAS'
                            ? ['COMPRADOR', 'VENDEDOR']
                            : [destinatario],
                        asunto: `Reclamación: ${MOTIVOS_RECLAMACION.find(m => m.value === motivo)?.label}`,
                        contenido,
                        metadatos: {
                            motivo,
                            motivo_detalle: motivoDetalle,
                            importe_reclamado: importeReclamado ? parseFloat(importeReclamado) : null,
                            plazo_dias: parseInt(plazoDias),
                            accion_prevista: accionPrevista
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
            setError(err.message || 'Error al enviar reclamación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-comunicacion-overlay" onClick={onClose}>
            <div className="form-comunicacion-modal" onClick={e => e.stopPropagation()}>
                <div className="form-header reclamacion">
                    <h3>⚠️ Nueva Reclamación</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="form-comunicacion">
                    {/* Motivo */}
                    <div className="form-group">
                        <label>Motivo de la reclamación *</label>
                        <select value={motivo} onChange={e => setMotivo(e.target.value)} required>
                            <option value="">Selecciona un motivo</option>
                            {MOTIVOS_RECLAMACION.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    {motivo === 'OTRO' && (
                        <div className="form-group">
                            <label>Especifica el motivo</label>
                            <input
                                type="text"
                                value={motivoDetalle}
                                onChange={e => setMotivoDetalle(e.target.value)}
                                placeholder="Describe brevemente el motivo..."
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

                    {/* Importe y Plazo */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Importe reclamado (€)</label>
                            <input
                                type="number"
                                value={importeReclamado}
                                onChange={e => setImporteReclamado(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="form-group">
                            <label>Plazo de respuesta (días) *</label>
                            <input
                                type="number"
                                value={plazoDias}
                                onChange={e => setPlazoDias(e.target.value)}
                                min="1"
                                max="60"
                                required
                            />
                        </div>
                    </div>

                    {/* Descripción */}
                    <div className="form-group">
                        <label>Descripción de la reclamación *</label>
                        <textarea
                            value={descripcion}
                            onChange={e => setDescripcion(e.target.value)}
                            placeholder="Describe detalladamente los hechos que motivan esta reclamación..."
                            rows={5}
                            required
                            minLength={50}
                        />
                        <small>{descripcion.length}/2000 caracteres (mínimo 50)</small>
                    </div>

                    {/* Acción prevista */}
                    <div className="form-group">
                        <label>Acciones previstas en caso de incumplimiento</label>
                        <textarea
                            value={accionPrevista}
                            onChange={e => setAccionPrevista(e.target.value)}
                            placeholder="Ej: Inicio de procedimiento judicial, resolución del contrato, reclamación de daños..."
                            rows={3}
                        />
                    </div>

                    {error && (
                        <div className="form-error">⚠️ {error}</div>
                    )}

                    <div className="form-disclaimer">
                        <p>
                            🔐 Esta reclamación será sellada con marca de tiempo cualificada (QTSP)
                            y quedará registrada como evidencia en el expediente.
                        </p>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-enviar reclamacion" disabled={loading}>
                            {loading ? 'Enviando...' : '⚠️ Enviar Reclamación'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
