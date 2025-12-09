/**
 * Panel de Checklist Notaría
 * 
 * Muestra el progreso del checklist documental para la fase NOTARIA
 * con indicadores de documentos base y condicionales.
 */

import { useState, useEffect } from 'react';
import './ChecklistNotaria.css';

interface InventarioItem {
    id: string;
    tipo: string;
    titulo: string;
    descripcion?: string;
    grupo: string;
    responsable_rol: string;
    obligatorio: boolean;
    estado: 'PENDIENTE' | 'SUBIDO' | 'VALIDADO' | 'RECHAZADO';
    archivo_id?: string;
    metadatos_extra?: any;
    created_at: string;
}

interface EstadoInventario {
    contrato_id: string;
    total: number;
    obligatorios: number;
    pendientes: number;
    subidos: number;
    validados: number;
    rechazados: number;
    completo: boolean;
    porcentaje: number;
}

interface ChecklistNotariaProps {
    contratoId: string;
    onGenerarInventario?: () => void;
}

const API_URL = 'http://localhost:4000';

const ESTADO_CONFIG: Record<string, { icon: string; label: string; className: string }> = {
    PENDIENTE: { icon: '⏳', label: 'Pendiente', className: 'estado-pendiente' },
    SUBIDO: { icon: '📤', label: 'Subido', className: 'estado-subido' },
    VALIDADO: { icon: '✅', label: 'Validado', className: 'estado-validado' },
    RECHAZADO: { icon: '❌', label: 'Rechazado', className: 'estado-rechazado' },
};

const ROL_CONFIG: Record<string, { icon: string; label: string }> = {
    COMPRADOR: { icon: '🛒', label: 'Comprador' },
    VENDEDOR: { icon: '🏠', label: 'Vendedor' },
    ASESOR_COMPRADOR: { icon: '👤', label: 'Asesor Comprador' },
    ASESOR_VENDEDOR: { icon: '👤', label: 'Asesor Vendedor' },
    NOTARIO: { icon: '⚖️', label: 'Notario' },
    PLATAFORMA: { icon: '🖥️', label: 'Plataforma' },
    OTRO: { icon: '📋', label: 'Otro' },
};

export default function ChecklistNotaria({ contratoId, onGenerarInventario }: ChecklistNotariaProps) {
    const [items, setItems] = useState<InventarioItem[]>([]);
    const [estado, setEstado] = useState<EstadoInventario | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [generando, setGenerando] = useState(false);

    // Cargar datos
    useEffect(() => {
        cargarDatos();
    }, [contratoId]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError(null);

            // Cargar items y estado en paralelo
            const [itemsRes, estadoRes] = await Promise.all([
                fetch(`${API_URL}/api/notaria/${contratoId}/inventario`),
                fetch(`${API_URL}/api/notaria/${contratoId}/inventario/estado`),
            ]);

            if (!itemsRes.ok || !estadoRes.ok) {
                throw new Error('Error cargando datos del inventario');
            }

            const itemsData = await itemsRes.json();
            const estadoData = await estadoRes.json();

            setItems(itemsData.data || []);
            setEstado(estadoData.data || null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerarInventario = async () => {
        try {
            setGenerando(true);
            const res = await fetch(`${API_URL}/api/notaria/${contratoId}/generar-inventario`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
                throw new Error('Error generando inventario');
            }

            const data = await res.json();
            console.log('Inventario generado:', data);

            // Recargar datos
            await cargarDatos();
            onGenerarInventario?.();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setGenerando(false);
        }
    };

    // Agrupar items por responsable
    const itemsPorResponsable = items.reduce((acc, item) => {
        const rol = item.responsable_rol || 'OTRO';
        if (!acc[rol]) acc[rol] = [];
        acc[rol].push(item);
        return acc;
    }, {} as Record<string, InventarioItem[]>);

    if (loading) {
        return (
            <div className="checklist-notaria-loading">
                <div className="loading-spinner"></div>
                <p>Cargando checklist notaría...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="checklist-notaria-error">
                <span>⚠️ {error}</span>
                <button onClick={cargarDatos}>Reintentar</button>
            </div>
        );
    }

    return (
        <div className="checklist-notaria">
            <div className="checklist-header">
                <h3>📋 Checklist Notaría</h3>
                {items.length === 0 && (
                    <button
                        className="btn-generar-inventario"
                        onClick={handleGenerarInventario}
                        disabled={generando}
                    >
                        {generando ? '⏳ Generando...' : '➕ Generar Checklist'}
                    </button>
                )}
            </div>

            {/* Barra de progreso */}
            {estado && (
                <div className="progreso-container">
                    <div className="progreso-stats">
                        <div className="stat">
                            <span className="stat-value">{estado.validados}</span>
                            <span className="stat-label">Validados</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{estado.subidos}</span>
                            <span className="stat-label">Subidos</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{estado.pendientes}</span>
                            <span className="stat-label">Pendientes</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{estado.total}</span>
                            <span className="stat-label">Total</span>
                        </div>
                    </div>
                    <div className="progreso-bar">
                        <div
                            className="progreso-bar-fill"
                            style={{ width: `${estado.porcentaje}%` }}
                        />
                    </div>
                    <div className="progreso-text">
                        {estado.completo ? (
                            <span className="completo">✅ Checklist completo</span>
                        ) : (
                            <span>{estado.porcentaje}% completado</span>
                        )}
                    </div>
                </div>
            )}

            {/* Lista de items agrupados por responsable */}
            {items.length > 0 ? (
                <div className="items-container">
                    {Object.entries(itemsPorResponsable).map(([rol, rolItems]) => (
                        <div key={rol} className="items-grupo">
                            <h4 className="grupo-titulo">
                                {ROL_CONFIG[rol]?.icon || '📋'} {ROL_CONFIG[rol]?.label || rol}
                            </h4>
                            <ul className="items-lista">
                                {rolItems.map((item) => (
                                    <li key={item.id} className={`item ${item.estado.toLowerCase()}`}>
                                        <div className="item-info">
                                            <span className="item-estado">
                                                {ESTADO_CONFIG[item.estado]?.icon}
                                            </span>
                                            <div className="item-texto">
                                                <span className="item-titulo">{item.titulo}</span>
                                                {item.obligatorio && (
                                                    <span className="badge-obligatorio">Obligatorio</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="item-acciones">
                                            {item.estado === 'PENDIENTE' && (
                                                <button className="btn-small btn-subir">📤 Subir</button>
                                            )}
                                            {item.estado === 'SUBIDO' && (
                                                <button className="btn-small btn-validar">✅ Validar</button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="no-items">
                    <p>No hay documentos en el checklist.</p>
                    <p>Haz clic en "Generar Checklist" para crear los ítems según las condiciones del contrato.</p>
                </div>
            )}
        </div>
    );
}
