import React, { useState, useEffect } from 'react';

interface ChecklistDocumentalProps {
    contratoId: string;
}

interface ChecklistItem {
    id: string;
    descripcion: string;
    categoria: string;
    obligatorio: boolean;
    estado: 'PENDIENTE' | 'RECIBIDO' | 'VERIFICADO' | 'NO_APLICA';
    archivo_id?: string;
    fecha_subida?: string;
    fecha_verificacion?: string;
    notas?: string;
}

export const ChecklistDocumental: React.FC<ChecklistDocumentalProps> = ({ contratoId }) => {
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [estadoGeneral, setEstadoGeneral] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        cargarChecklist();
    }, [contratoId]);

    const cargarChecklist = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

            // Cargar items
            const responseItems = await fetch(`${apiUrl}/api/contracts/${contratoId}/checklist`);
            const dataItems = await responseItems.json();

            if (dataItems.success) {
                setItems(dataItems.data);
            }

            // Cargar estado general
            const responseEstado = await fetch(`${apiUrl}/api/contracts/${contratoId}/checklist/estado`);
            const dataEstado = await responseEstado.json();

            if (dataEstado.success) {
                setEstadoGeneral(dataEstado.data);
            }

        } catch (err) {
            console.error('Error cargando checklist:', err);
            setError('Error al cargar el checklist');
        } finally {
            setLoading(false);
        }
    };

    const handleMarcarNoAplica = async (itemId: string) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            await fetch(`${apiUrl}/api/checklist/${itemId}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'NO_APLICA' }),
            });

            await cargarChecklist();
        } catch (err) {
            console.error('Error:', err);
        }
    };

    if (loading) {
        return (
            <div className="checklist-loading">
                <div className="loading-spinner"></div>
                <p>Cargando checklist...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-message">
                {error}
            </div>
        );
    }

    // Agrupar por categoría
    const itemsPorCategoria = {
        COMPRADOR: items.filter(i => i.categoria === 'COMPRADOR'),
        VENDEDOR: items.filter(i => i.categoria === 'VENDEDOR'),
        COMUN: items.filter(i => i.categoria === 'COMUN'),
        OTRO: items.filter(i => i.categoria === 'OTRO'),
    };

    const iconoEstado = (estado: string) => {
        switch (estado) {
            case 'VERIFICADO': return '✅';
            case 'RECIBIDO': return '📄';
            case 'PENDIENTE': return '⏱️';
            case 'NO_APLICA': return '➖';
            default: return '❓';
        }
    };

    const colorEstado = (estado: string) => {
        switch (estado) {
            case 'VERIFICADO': return 'var(--success)';
            case 'RECIBIDO': return 'var(--warning)';
            case 'PENDIENTE': return 'var(--gray-400)';
            case 'NO_APLICA': return 'var(--gray-300)';
            default: return 'var(--gray-500)';
        }
    };

    return (
        <div className="checklist-documental">
            <div className="checklist-header">
                <h3>📋 Checklist Documental</h3>
                <p>Documentos necesarios para la firma de escritura</p>
            </div>

            {estadoGeneral && (
                <div className="checklist-progreso">
                    <div className="progreso-stats">
                        <div className="stat">
                            <span className="stat-value">{estadoGeneral.verificados}</span>
                            <span className="stat-label">Verificados</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{estadoGeneral.recibidos}</span>
                            <span className="stat-label">Recibidos</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{estadoGeneral.pendientes}</span>
                            <span className="stat-label">Pendientes</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{estadoGeneral.total_items}</span>
                            <span className="stat-label">Total</span>
                        </div>
                    </div>

                    <div className="progreso-bar-container">
                        <div
                            className="progreso-bar-fill"
                            style={{
                                width: `${(estadoGeneral.verificados / estadoGeneral.items_obligatorios) * 100}%`,
                            }}
                        ></div>
                    </div>

                    <div className="progreso-text">
                        {estadoGeneral.checklist_completo ? (
                            <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                                ✅ Checklist completo - Listo para escritura
                            </span>
                        ) : (
                            <span>
                                {estadoGeneral.verificados} de {estadoGeneral.items_obligatorios} documentos obligatorios verificados
                            </span>
                        )}
                    </div>
                </div>
            )}

            <div className="checklist-categorias">
                {Object.entries(itemsPorCategoria).map(([categoria, itemsCategoria]) => {
                    if (itemsCategoria.length === 0) return null;

                    const categoriaLabel = {
                        COMPRADOR: '👤 Parte Compradora',
                        VENDEDOR: '🏠 Parte Vendedora',
                        COMUN: '📄 Documentos Comunes',
                        OTRO: '📎 Otros Documentos',
                    }[categoria];

                    return (
                        <div key={categoria} className="checklist-categoria">
                            <h4 className="categoria-title">{categoriaLabel}</h4>

                            <div className="checklist-items">
                                {itemsCategoria.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`checklist-item ${item.estado.toLowerCase()}`}
                                    >
                                        <div className="item-header">
                                            <div className="item-info">
                                                <span
                                                    className="item-icono"
                                                    style={{ color: colorEstado(item.estado) }}
                                                >
                                                    {iconoEstado(item.estado)}
                                                </span>
                                                <span className="item-descripcion">
                                                    {item.descripcion}
                                                    {item.obligatorio && <span className="badge-obligatorio">Obligatorio</span>}
                                                </span>
                                            </div>
                                            <div className="item-acciones">
                                                {item.estado === 'PENDIENTE' && !item.obligatorio && (
                                                    <button
                                                        onClick={() => handleMarcarNoAplica(item.id)}
                                                        className="btn-small btn-secondary"
                                                    >
                                                        No aplica
                                                    </button>
                                                )}
                                                {item.estado === 'PENDIENTE' && (
                                                    <button className="btn-small btn-primary">
                                                        📤 Subir
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {item.fecha_verificacion && (
                                            <div className="item-fecha">
                                                Verificado el {new Date(item.fecha_verificacion).toLocaleDateString('es-ES')}
                                            </div>
                                        )}

                                        {item.notas && (
                                            <div className="item-notas">
                                                💬 {item.notas}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="checklist-footer">
                <div className="info-box">
                    <strong>ℹ️ Cómo funciona:</strong>
                    <ul>
                        <li><strong>Pendiente</strong>: Documento aún no subido</li>
                        <li><strong>Recibido</strong>: Documento subido, esperando verificación</li>
                        <li><strong>Verificado</strong>: Documento validado con hash y TST</li>
                        <li><strong>No aplica</strong>: Este documento no es necesario en este caso</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
