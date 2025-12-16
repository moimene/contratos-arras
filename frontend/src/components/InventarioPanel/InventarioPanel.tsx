/**
 * InventarioPanel - Checklist de Documentos
 * 
 * Panel visual para gestionar el inventario de documentos del expediente.
 * Según Directiva #003.
 */

import { useState, useEffect, useCallback } from 'react';
import './InventarioPanel.css';
import UploadModal from './UploadModal';
import RejectionModal from './RejectionModal';

interface InventarioItem {
    id: string;
    tipo: string;
    titulo: string;
    descripcion?: string;
    grupo: string;
    responsable_rol: string;
    obligatorio: boolean;
    estado: 'PENDIENTE' | 'SUBIDO' | 'VALIDADO' | 'RECHAZADO';
    fecha_subida?: string;
    fecha_validacion?: string;
    motivo_rechazo?: string;
}

interface InventarioData {
    items: InventarioItem[];
    agrupado: {
        INMUEBLE: InventarioItem[];
        PARTES: InventarioItem[];
        ARRAS: InventarioItem[];
        NOTARIA: InventarioItem[];
        CIERRE: InventarioItem[];
    };
    resumen: {
        total: number;
        pendiente: number;
        subido: number;
        validado: number;
        rechazado: number;
    };
}

interface InventarioPanelProps {
    contratoId: string;
    rolActual?: string;
    estadoContrato?: string;
}

const GRUPO_LABELS: Record<string, { icon: string; label: string }> = {
    INMUEBLE: { icon: '🏠', label: 'Inmueble y Titularidad' },
    PARTES: { icon: '👥', label: 'Partes y Representación' },
    ARRAS: { icon: '💰', label: 'Arras y Pagos' },
    NOTARIA: { icon: '📜', label: 'Notaría y Escritura' },
    CIERRE: { icon: '✅', label: 'Cierre e Incidencias' },
};

const ESTADO_STYLES: Record<string, { icon: string; class: string; label: string }> = {
    PENDIENTE: { icon: '🔴', class: 'estado-pendiente', label: 'Pendiente' },
    SUBIDO: { icon: '🟡', class: 'estado-subido', label: 'Subido' },
    VALIDADO: { icon: '✅', class: 'estado-validado', label: 'Validado' },
    RECHAZADO: { icon: '❌', class: 'estado-rechazado', label: 'Rechazado' },
};

export default function InventarioPanel({ contratoId, rolActual, estadoContrato: _estadoContrato }: InventarioPanelProps) {
    const [data, setData] = useState<InventarioData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        INMUEBLE: true,
        PARTES: true,
        ARRAS: true,
        NOTARIA: false,
        CIERRE: false,
    });
    const [uploadItem, setUploadItem] = useState<InventarioItem | null>(null);

    const fetchInventario = useCallback(async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            setError(null);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/contratos/${contratoId}/inventario`, { signal });
            const result = await response.json();

            if (signal?.aborted) return;

            if (result.success) {
                setData(result.data);
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            setError(err.message || 'Error al cargar inventario');
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [contratoId]);

    useEffect(() => {
        const controller = new AbortController();
        fetchInventario(controller.signal);
        return () => controller.abort();
    }, [fetchInventario]);

    const toggleGroup = (grupo: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [grupo]: !prev[grupo]
        }));
    };

    const handleSubirDocumento = (item: InventarioItem) => {
        setUploadItem(item);
    };

    const handleUploadComplete = () => {
        setUploadItem(null);
        fetchInventario();
    };

    const handleValidar = async (itemId: string) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            await fetch(`${apiUrl}/api/inventario/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    estado: 'VALIDADO',
                    validado_por_rol: rolActual
                })
            });
            fetchInventario();
        } catch (err) {
            console.error('Error validando documento:', err);
        }
    };

    const [rejectItem, setRejectItem] = useState<InventarioItem | null>(null);

    const handleRechazar = async (motivo: string) => {
        if (!rejectItem) return;

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            await fetch(`${apiUrl}/api/inventario/${rejectItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    estado: 'RECHAZADO',
                    motivo_rechazo: motivo,
                    validado_por_rol: rolActual
                })
            });
            setRejectItem(null);
            fetchInventario();
        } catch (err) {
            console.error('Error rechazando documento:', err);
        }
    };

    if (loading) {
        return (
            <div className="inventario-loading">
                <div className="loading-spinner"></div>
                <p>Cargando documentos...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="inventario-error">
                <p>⚠️ {error || 'No hay datos de inventario'}</p>
            </div>
        );
    }

    return (
        <div className="inventario-panel">
            <div className="inventario-header">
                <h3>📋 Checklist Documentos</h3>
                <div className="inventario-resumen">
                    <span className="resumen-item validados">
                        ✅ {data.resumen.validado}
                    </span>
                    <span className="resumen-item pendientes">
                        🔴 {data.resumen.pendiente}
                    </span>
                    <span className="resumen-item subidos">
                        🟡 {data.resumen.subido}
                    </span>
                    {data.resumen.rechazado > 0 && (
                        <span className="resumen-item rechazados">
                            ❌ {data.resumen.rechazado}
                        </span>
                    )}
                </div>
            </div>

            <div className="inventario-grupos">
                {Object.entries(GRUPO_LABELS).map(([grupo, { icon, label }]) => {
                    const items = data.agrupado[grupo as keyof typeof data.agrupado] || [];
                    if (items.length === 0) return null;

                    return (
                        <div key={grupo} className="inventario-grupo">
                            <div
                                className="grupo-header"
                                onClick={() => toggleGroup(grupo)}
                            >
                                <span className="grupo-icon">{icon}</span>
                                <span className="grupo-label">{label}</span>
                                <span className="grupo-count">
                                    {items.filter(i => i.estado === 'VALIDADO').length}/{items.length}
                                </span>
                                <span className="grupo-toggle">
                                    {expandedGroups[grupo] ? '▼' : '▶'}
                                </span>
                            </div>

                            {expandedGroups[grupo] && (
                                <div className="grupo-items">
                                    {items.map(item => (
                                        <div
                                            key={item.id}
                                            className={`inventario-item ${ESTADO_STYLES[item.estado].class}`}
                                        >
                                            <div className="item-estado">
                                                {ESTADO_STYLES[item.estado].icon}
                                            </div>
                                            <div className="item-info">
                                                <div className="item-titulo">
                                                    {item.titulo}
                                                    {item.obligatorio && <span className="obligatorio">*</span>}
                                                </div>
                                                {item.descripcion && (
                                                    <div className="item-descripcion">{item.descripcion}</div>
                                                )}
                                                <div className="item-meta">
                                                    <span className="item-responsable">
                                                        {item.responsable_rol.replace('_', ' ')}
                                                    </span>
                                                    {item.fecha_validacion && (
                                                        <span className="item-fecha">
                                                            ✓ {new Date(item.fecha_validacion).toLocaleDateString('es-ES')}
                                                        </span>
                                                    )}
                                                    {item.motivo_rechazo && (
                                                        <span className="item-rechazo">
                                                            ❌ {item.motivo_rechazo}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="item-acciones">
                                                {item.estado === 'PENDIENTE' && (
                                                    <button
                                                        className="btn-accion btn-subir"
                                                        onClick={() => handleSubirDocumento(item)}
                                                    >
                                                        📤 Subir
                                                    </button>
                                                )}
                                                {item.estado === 'SUBIDO' && (
                                                    <>
                                                        <button
                                                            className="btn-accion btn-validar"
                                                            onClick={() => handleValidar(item.id)}
                                                        >
                                                            ✅ Validar
                                                        </button>
                                                        <button
                                                            className="btn-accion btn-rechazar"
                                                            onClick={() => setRejectItem(item)}
                                                        >
                                                            ❌ Rechazar
                                                        </button>
                                                    </>
                                                )}
                                                {item.estado === 'VALIDADO' && (
                                                    <button className="btn-accion btn-ver">
                                                        👁️ Ver
                                                    </button>
                                                )}
                                                {item.estado === 'RECHAZADO' && (
                                                    <button
                                                        className="btn-accion btn-subir"
                                                        onClick={() => handleSubirDocumento(item)}
                                                    >
                                                        📤 Resubir
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Upload Modal */}
            {uploadItem && (
                <UploadModal
                    isOpen={true}
                    onClose={() => setUploadItem(null)}
                    onUploadComplete={handleUploadComplete}
                    contratoId={contratoId}
                    inventarioItemId={uploadItem.id}
                    itemTitulo={uploadItem.titulo}
                    tipoDocumento={uploadItem.tipo}
                />
            )}

            {/* Rejection Modal */}
            {rejectItem && (
                <RejectionModal
                    isOpen={true}
                    onClose={() => setRejectItem(null)}
                    onReject={handleRechazar}
                    itemTitulo={rejectItem.titulo}
                />
            )}
        </div>
    );
}
