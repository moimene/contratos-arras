/**
 * ChatPanel - Chat del Expediente
 * 
 * Panel de chat para comunicación en el expediente.
 * Incluye marcado de mensajes probatoriamente relevantes.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import './ChatPanel.css';

interface Mensaje {
    id: string;
    mensaje: string;
    remitente_nombre: string;
    es_sistema: boolean;
    es_relevante_probatoriamente: boolean;
    motivo_relevancia?: string;
    created_at: string;
}

interface ChatPanelProps {
    contratoId: string;
    usuarioNombre?: string;
}

export default function ChatPanel({ contratoId, usuarioNombre = 'Usuario' }: ChatPanelProps) {
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchMensajes = useCallback(async (signal?: AbortSignal) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/contratos/${contratoId}/mensajes`, { signal });
            const result = await response.json();

            if (signal?.aborted) return;

            if (result.success) {
                setMensajes(result.data);
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error('Error cargando mensajes:', err);
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [contratoId]);

    useEffect(() => {
        const controller = new AbortController();
        fetchMensajes(controller.signal);

        // Polling cada 10 segundos para nuevos mensajes
        const interval = setInterval(() => {
            fetchMensajes(controller.signal);
        }, 10000);

        return () => {
            controller.abort();
            clearInterval(interval);
        };
    }, [fetchMensajes]);

    useEffect(() => {
        scrollToBottom();
    }, [mensajes]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async () => {
        if (!nuevoMensaje.trim() || sending) return;

        setSending(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/contratos/${contratoId}/mensajes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mensaje: nuevoMensaje.trim(),
                    remitente_nombre: usuarioNombre,
                    es_sistema: false
                })
            });

            const result = await response.json();
            if (result.success) {
                setMensajes(prev => [...prev, result.data]);
                setNuevoMensaje('');
            }
        } catch (err) {
            console.error('Error enviando mensaje:', err);
        } finally {
            setSending(false);
        }
    };

    const handleMarcarRelevante = async (mensajeId: string, esRelevante: boolean) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            await fetch(`${apiUrl}/api/mensajes/${mensajeId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    es_relevante_probatoriamente: esRelevante
                })
            });

            setMensajes(prev => prev.map(m =>
                m.id === mensajeId
                    ? { ...m, es_relevante_probatoriamente: esRelevante }
                    : m
            ));
        } catch (err) {
            console.error('Error marcando mensaje:', err);
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-panel">
            <div className="chat-header">
                <h3>💬 Chat del Expediente</h3>
                <span className="chat-count">{mensajes.length} mensajes</span>
            </div>

            <div className="chat-messages">
                {loading ? (
                    <div className="chat-loading">Cargando mensajes...</div>
                ) : mensajes.length === 0 ? (
                    <div className="chat-empty">
                        <p>No hay mensajes aún</p>
                        <span>Escribe el primer mensaje del expediente</span>
                    </div>
                ) : (
                    mensajes.map(mensaje => (
                        <div
                            key={mensaje.id}
                            className={`mensaje ${mensaje.es_sistema ? 'sistema' : ''} ${mensaje.es_relevante_probatoriamente ? 'relevante' : ''}`}
                        >
                            <div className="mensaje-header">
                                <span className="mensaje-autor">
                                    {mensaje.es_sistema ? '🤖 Sistema' : `👤 ${mensaje.remitente_nombre}`}
                                </span>
                                <span className="mensaje-fecha">{formatTime(mensaje.created_at)}</span>
                            </div>
                            <div className="mensaje-contenido">{mensaje.mensaje}</div>
                            {mensaje.es_relevante_probatoriamente && (
                                <div className="mensaje-relevancia">
                                    ⚖️ Relevante Probatoriamente
                                </div>
                            )}
                            {!mensaje.es_sistema && (
                                <div className="mensaje-acciones">
                                    <button
                                        className={`btn-relevancia ${mensaje.es_relevante_probatoriamente ? 'active' : ''}`}
                                        onClick={() => handleMarcarRelevante(mensaje.id, !mensaje.es_relevante_probatoriamente)}
                                        title={mensaje.es_relevante_probatoriamente ? 'Desmarcar como relevante' : 'Marcar como relevante probatoriamente'}
                                    >
                                        ⚖️
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
                <textarea
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe un mensaje..."
                    rows={2}
                    disabled={sending}
                />
                <button
                    className="btn-send"
                    onClick={handleSend}
                    disabled={!nuevoMensaje.trim() || sending}
                >
                    {sending ? '...' : '📤'}
                </button>
            </div>
        </div>
    );
}
