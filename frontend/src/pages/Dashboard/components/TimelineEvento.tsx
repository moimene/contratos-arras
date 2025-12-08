import React from 'react';

interface Evento {
    id: string;
    tipo: string;
    payload_json: any;
    fecha_hora: string;
    actor_tipo: string;
    hash_sha256: string;
}

interface TimelineEventoProps {
    eventos: Evento[];
}

const EVENTO_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
    CREACION: { icon: '🎬', label: 'Expediente Creado', color: '#3b82f6' },
    COMPARTIDO: { icon: '🔗', label: 'Link Compartido', color: '#8b5cf6' },
    ACEPTACION_TERMINOS: { icon: '✅', label: 'Términos Aceptados', color: '#10b981' },
    BORRADOR_GENERADO: { icon: '📄', label: 'Borrador Generado', color: '#6366f1' },
    GENERACION_PDF: { icon: '📄', label: 'PDF Generado', color: '#6366f1' },
    FIRMA_COMPLETADA: { icon: '✍️', label: 'Firma Completada', color: '#059669' },
    PAGO_DECLARADO: { icon: '💳', label: 'Pago Declarado', color: '#f59e0b' },
    PAGO_VALIDADO: { icon: '💰', label: 'Pago Validado', color: '#10b981' },
    PAGO_RECHAZADO: { icon: '❌', label: 'Pago Rechazado', color: '#ef4444' },
    INICIO_INTERIM: { icon: '⏳', label: 'Inicio Periodo Interim', color: '#f59e0b' },
    CONVOCATORIA_FIJADA: { icon: '📅', label: 'Convocatoria Fijada', color: '#8b5cf6' },
    ESCRITURA_SUBIDA: { icon: '📝', label: 'Escritura Subida', color: '#059669' },
    ACTA_NO_COMPARECENCIA: { icon: '⚠️', label: 'Acta de No Comparecencia', color: '#dc2626' },
    RESOLUCION: { icon: '🔴', label: 'Resolución', color: '#b91c1c' },
    CIERRE: { icon: '🔒', label: 'Expediente Cerrado', color: '#6b7280' },
};

export default function TimelineEvento({ eventos }: TimelineEventoProps) {
    const formatFecha = (fecha: string) => {
        return new Date(fecha).toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getEventoConfig = (tipo: string) => {
        return EVENTO_CONFIG[tipo] || {
            icon: '📌',
            label: tipo,
            color: '#6b7280',
        };
    };

    return (
        <div className="timeline-eventos">
            <h3>⏱️ Timeline de Eventos</h3>

            {eventos.length === 0 ? (
                <div className="timeline-empty">
                    <p>No hay eventos registrados aún.</p>
                </div>
            ) : (
                <div className="timeline-list">
                    {eventos.map((evento, index) => {
                        const config = getEventoConfig(evento.tipo);
                        const isLast = index === eventos.length - 1;

                        return (
                            <div key={evento.id} className="timeline-item">
                                <div className="timeline-marker" style={{ backgroundColor: config.color }}>
                                    <span className="timeline-icon">{config.icon}</span>
                                </div>

                                {!isLast && <div className="timeline-line" />}

                                <div className="timeline-content">
                                    <div className="timeline-header">
                                        <h4 className="timeline-title">{config.label}</h4>
                                        <span className="timeline-fecha">{formatFecha(evento.fecha_hora)}</span>
                                    </div>

                                    {evento.actor_tipo && (
                                        <div className="timeline-actor">
                                            Actor: <span className="actor-tag">{evento.actor_tipo}</span>
                                        </div>
                                    )}

                                    {evento.payload_json && Object.keys(evento.payload_json).length > 0 && (
                                        <details className="timeline-details">
                                            <summary>Ver detalles</summary>
                                            <pre className="timeline-payload">
                                                {JSON.stringify(evento.payload_json, null, 2)}
                                            </pre>
                                        </details>
                                    )}

                                    {evento.hash_sha256 && (
                                        <div className="timeline-hash">
                                            <span className="hash-label">Hash:</span>
                                            <code className="hash-value">{evento.hash_sha256.substring(0, 16)}...</code>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
