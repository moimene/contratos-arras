/**
 * FormularioConvocatoria Component
 * 
 * Formulario estructurado para convocar a firma en notaría.
 * Incluye: notaría, fecha/hora, dirección, notas.
 */

import { useState } from 'react';
import './FormulariosComunicacion.css';

interface FormularioConvocatoriaProps {
    isOpen: boolean;
    onClose: () => void;
    onEnviado: () => void;
    contratoId: string;
    rolActual: string;
}

export default function FormularioConvocatoria({
    isOpen,
    onClose,
    onEnviado,
    contratoId,
    rolActual
}: FormularioConvocatoriaProps) {
    const [nombreNotaria, setNombreNotaria] = useState('');
    const [notario, setNotario] = useState('');
    const [fechaHora, setFechaHora] = useState('');
    const [direccion, setDireccion] = useState('');
    const [ciudad, setCiudad] = useState('');
    const [codigoPostal, setCodigoPostal] = useState('');
    const [documentosAportar, setDocumentosAportar] = useState('');
    const [notas, setNotas] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!nombreNotaria || !fechaHora || !direccion) {
            setError('Completa los campos obligatorios');
            return;
        }

        // Validar fecha futura
        const fechaCita = new Date(fechaHora);
        if (fechaCita <= new Date()) {
            setError('La fecha de la cita debe ser futura');
            return;
        }

        setLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

            const fechaFormateada = fechaCita.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const horaFormateada = fechaCita.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const contenido = `
## CONVOCATORIA PARA FIRMA DE ESCRITURA

Se convoca a todas las partes a la firma de la escritura pública de compraventa.

### Datos de la cita

| | |
|--|--|
| **Notaría** | ${nombreNotaria} |
${notario ? `| **Notario** | ${notario} |` : ''}
| **Fecha** | ${fechaFormateada} |
| **Hora** | ${horaFormateada} |
| **Dirección** | ${direccion} |
${ciudad ? `| **Ciudad** | ${ciudad} ${codigoPostal ? `(${codigoPostal})` : ''} |` : ''}

${documentosAportar ? `### Documentación a aportar\n\n${documentosAportar}` : ''}

${notas ? `### Notas adicionales\n\n${notas}` : ''}

---

> ⚠️ **IMPORTANTE**: La no comparecencia sin causa justificada podrá dar lugar a las consecuencias previstas en el contrato de arras, incluyendo la posible pérdida o devolución duplicada de las arras según corresponda.

---
*Esta convocatoria ha sido enviada a través de la plataforma y sellada con marca de tiempo cualificada (QTSP).*
            `.trim();

            const response = await fetch(
                `${apiUrl}/api/contratos/${contratoId}/comunicaciones`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tipoComunicacion: 'CONVOCATORIA_NOTARIA',
                        canal: 'PLATAFORMA',
                        remitenteRol: rolActual,
                        destinatariosRoles: ['COMPRADOR', 'VENDEDOR'],
                        asunto: `Convocatoria para firma de escritura - ${fechaFormateada}`,
                        contenido,
                        metadatos: {
                            nombre_notaria: nombreNotaria,
                            notario,
                            fecha_hora: fechaHora,
                            direccion,
                            ciudad,
                            codigo_postal: codigoPostal,
                            documentos_aportar: documentosAportar,
                            notas
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
            setError(err.message || 'Error al enviar convocatoria');
        } finally {
            setLoading(false);
        }
    };

    // Calcular fecha mínima (mañana)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDateTime = tomorrow.toISOString().slice(0, 16);

    return (
        <div className="form-comunicacion-overlay" onClick={onClose}>
            <div className="form-comunicacion-modal" onClick={e => e.stopPropagation()}>
                <div className="form-header convocatoria">
                    <h3>⚖️ Convocatoria Notarial</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="form-comunicacion">
                    {/* Notaría */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Nombre de la notaría *</label>
                            <input
                                type="text"
                                value={nombreNotaria}
                                onChange={e => setNombreNotaria(e.target.value)}
                                placeholder="Ej: Notaría García López"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Notario</label>
                            <input
                                type="text"
                                value={notario}
                                onChange={e => setNotario(e.target.value)}
                                placeholder="Nombre del notario"
                            />
                        </div>
                    </div>

                    {/* Fecha y hora */}
                    <div className="form-group">
                        <label>Fecha y hora de la cita *</label>
                        <input
                            type="datetime-local"
                            value={fechaHora}
                            onChange={e => setFechaHora(e.target.value)}
                            min={minDateTime}
                            required
                        />
                    </div>

                    {/* Dirección */}
                    <div className="form-group">
                        <label>Dirección de la notaría *</label>
                        <input
                            type="text"
                            value={direccion}
                            onChange={e => setDireccion(e.target.value)}
                            placeholder="Calle, número, piso..."
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Ciudad</label>
                            <input
                                type="text"
                                value={ciudad}
                                onChange={e => setCiudad(e.target.value)}
                                placeholder="Ciudad"
                            />
                        </div>
                        <div className="form-group">
                            <label>Código Postal</label>
                            <input
                                type="text"
                                value={codigoPostal}
                                onChange={e => setCodigoPostal(e.target.value)}
                                placeholder="28001"
                                maxLength={5}
                            />
                        </div>
                    </div>

                    {/* Documentación */}
                    <div className="form-group">
                        <label>Documentación a aportar</label>
                        <textarea
                            value={documentosAportar}
                            onChange={e => setDocumentosAportar(e.target.value)}
                            placeholder="Lista de documentos que deben traer las partes..."
                            rows={3}
                        />
                    </div>

                    {/* Notas */}
                    <div className="form-group">
                        <label>Notas adicionales</label>
                        <textarea
                            value={notas}
                            onChange={e => setNotas(e.target.value)}
                            placeholder="Instrucciones adicionales, parking, acceso..."
                            rows={2}
                        />
                    </div>

                    {error && (
                        <div className="form-error">⚠️ {error}</div>
                    )}

                    <div className="form-disclaimer warning">
                        <p>
                            ⚠️ Esta convocatoria será enviada a TODAS las partes del contrato
                            y quedará registrada como evidencia probatoria.
                        </p>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-enviar convocatoria" disabled={loading}>
                            {loading ? 'Enviando...' : '⚖️ Enviar Convocatoria'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
