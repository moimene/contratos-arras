import React, { useState, useCallback } from 'react';
import { getEventoConfig } from '../../../domain/contrato';

interface Evento {
    id: string;
    tipo: string;
    payload_json: any;
    fecha_hora: string;
    actor_tipo: string;
    actor_usuario_id?: string;  // Usuario autenticado (auditoría)
    hash_sha256: string;
}

interface TimelineEventoProps {
    eventos: Evento[];
}

/**
 * TimelineEvento - Muestra la línea de tiempo de eventos del contrato.
 * Usa la configuración centralizada del dominio para los tipos de evento.
 * Optimiza el rendering con lazy stringify del payload.
 */
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

    return (
        <div className="timeline-eventos">
            <h3>⏱️ Timeline de Eventos</h3>

            {eventos.length === 0 ? (
                <div className="timeline-empty">
                    <p>No hay eventos registrados aún.</p>
                </div>
            ) : (
                <div className="timeline-list">
                    {eventos.map((evento, index) => (
                        <TimelineItem
                            key={evento.id}
                            evento={evento}
                            isLast={index === eventos.length - 1}
                            formatFecha={formatFecha}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Componente separado para optimizar el render de items individuales
interface TimelineItemProps {
    evento: Evento;
    isLast: boolean;
    formatFecha: (fecha: string) => string;
}

function TimelineItem({ evento, isLast, formatFecha }: TimelineItemProps) {
    const config = getEventoConfig(evento.tipo);
    const [isOpen, setIsOpen] = useState(false);

    // Lazy stringify: solo cuando el usuario abre los detalles
    const getPayloadString = useCallback(() => {
        if (!evento.payload_json || Object.keys(evento.payload_json).length === 0) {
            return null;
        }
        return JSON.stringify(evento.payload_json, null, 2);
    }, [evento.payload_json]);

    const hasPayload = evento.payload_json && Object.keys(evento.payload_json).length > 0;

    return (
        <div className="timeline-item">
            <div className="timeline-marker" style={{ backgroundColor: config.color }}>
                <span className="timeline-icon">{config.icon}</span>
            </div>

            {!isLast && <div className="timeline-line" />}

            <div className="timeline-content">
                <div className="timeline-header">
                    <h4 className="timeline-title">{config.label}</h4>
                    <span className="timeline-fecha">{formatFecha(evento.fecha_hora)}</span>
                </div>

                <div className="timeline-actor">
                    {evento.actor_tipo && (
                        <span className="actor-tag">{evento.actor_tipo}</span>
                    )}
                    {evento.actor_usuario_id && (
                        <span className="actor-user" title={`Usuario: ${evento.actor_usuario_id}`}>
                            👤 Usuario autenticado
                        </span>
                    )}
                </div>

                {hasPayload && (
                    <details
                        className="timeline-details"
                        open={isOpen}
                        onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
                    >
                        <summary>Ver detalles</summary>
                        {isOpen && (
                            <pre className="timeline-payload">
                                {getPayloadString()}
                            </pre>
                        )}
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
}
