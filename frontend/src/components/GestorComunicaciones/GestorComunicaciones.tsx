/**
 * GestorComunicaciones Component
 * 
 * Componente principal del gestor de comunicaciones.
 * Muestra comunicaciones internas y externas con filtros y acciones.
 */

import { useState, useEffect } from 'react';
import ImportarComunicacionExterna from './ImportarExterna';
import FormularioReclamacion from './FormularioReclamacion';
import FormularioSolicitudDoc from './FormularioSolicitudDoc';
import FormularioConvocatoria from './FormularioConvocatoria';
import './GestorComunicaciones.css';

interface Comunicacion {
    id: string;
    contrato_id: string;
    tipo_comunicacion: string;
    tipo_funcion: string | null;
    canal: string;
    remitente_rol: string | null;
    remitente_externo: string | null;
    destinatarios_roles: string[];
    destinatarios_externos: string | null;
    asunto: string | null;
    contenido: string | null;
    resumen_externo: string | null;
    fecha_comunicacion: string;
    fecha_registro: string;
    estado: 'BORRADOR' | 'ENVIADA' | 'ENTREGADA' | 'LEIDA' | 'RESPONDIDA';
    es_externa: boolean;
    adjuntos_archivo_ids: string[];
    hash_contenido: string | null;
    sello_qtsp_id: string | null;
}

interface GestorComunicacionesProps {
    contratoId: string;
    rolActual: string;
}

const TIPOS = [
    { key: 'RECLAMACION', label: '⚠️ Reclamación' },
    { key: 'SOLICITUD_DOCUMENTACION', label: '📄 Solicitud doc.' },
    { key: 'NOTIFICACION_GENERAL', label: '📢 Notificación' },
    { key: 'CONVOCATORIA_NOTARIA', label: '⚖️ Convocatoria' },
    { key: 'ALEGACION', label: '💬 Alegación' },
    { key: 'RESPUESTA', label: '↩️ Respuesta' },
    { key: 'COMUNICACION_EXTERNA_IMPORTADA', label: '📥 Externa' }
];

const CANALES = {
    PLATAFORMA: { icon: '🖥️', label: 'Plataforma' },
    EMAIL: { icon: '📧', label: 'Email' },
    BUROFAX: { icon: '📮', label: 'Burofax' },
    CARTA_CERTIFICADA: { icon: '📬', label: 'Carta cert.' },
    CARTA_SIMPLE: { icon: '✉️', label: 'Carta' },
    WHATSAPP: { icon: '💬', label: 'WhatsApp' },
    TELEFONO: { icon: '📞', label: 'Teléfono' },
    OTRO: { icon: '📋', label: 'Otro' }
};

const ESTADOS = {
    BORRADOR: { icon: '📝', label: 'Borrador', color: '#718096' },
    ENVIADA: { icon: '📤', label: 'Enviada', color: '#4299e1' },
    ENTREGADA: { icon: '📬', label: 'Entregada', color: '#38a169' },
    LEIDA: { icon: '👁️', label: 'Leída', color: '#9f7aea' },
    RESPONDIDA: { icon: '↩️', label: 'Respondida', color: '#ed8936' }
};

export default function GestorComunicaciones({ contratoId, rolActual }: GestorComunicacionesProps) {
    const [comunicaciones, setComunicaciones] = useState<Comunicacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filtros
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroCanal, setFiltroCanal] = useState('');
    const [filtroExterna, setFiltroExterna] = useState<'todas' | 'internas' | 'externas'>('todas');

    // Modales
    const [showImportarExterna, setShowImportarExterna] = useState(false);
    const [showReclamacion, setShowReclamacion] = useState(false);
    const [showSolicitudDoc, setShowSolicitudDoc] = useState(false);
    const [showConvocatoria, setShowConvocatoria] = useState(false);
    const [showNuevaMenu, setShowNuevaMenu] = useState(false);
    const [comunicacionDetalle, setComunicacionDetalle] = useState<Comunicacion | null>(null);

    useEffect(() => {
        fetchComunicaciones();
    }, [contratoId]);

    const fetchComunicaciones = async () => {
        try {
            setLoading(true);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/contratos/${contratoId}/comunicaciones`);
            const result = await response.json();

            if (result.success) {
                setComunicaciones(result.data);
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            console.error('Error cargando comunicaciones:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRemitente = (c: Comunicacion) => {
        if (c.es_externa) {
            return c.remitente_externo || 'Externo';
        }
        return c.remitente_rol || 'Sistema';
    };

    const getDestinatarios = (c: Comunicacion) => {
        if (c.es_externa) {
            return c.destinatarios_externos || '';
        }
        return c.destinatarios_roles?.join(', ') || '';
    };

    const getContenidoPreview = (c: Comunicacion) => {
        const texto = c.resumen_externo || c.contenido || c.asunto || '';
        return texto.length > 100 ? texto.substring(0, 100) + '...' : texto;
    };

    // Filtrar
    const comunicacionesFiltradas = comunicaciones.filter(c => {
        if (filtroTipo && c.tipo_comunicacion !== filtroTipo) return false;
        if (filtroCanal && c.canal !== filtroCanal) return false;
        if (filtroExterna === 'internas' && c.es_externa) return false;
        if (filtroExterna === 'externas' && !c.es_externa) return false;
        return true;
    });

    // Estadísticas
    const stats = {
        total: comunicaciones.length,
        internas: comunicaciones.filter(c => !c.es_externa).length,
        externas: comunicaciones.filter(c => c.es_externa).length,
        pendientes: comunicaciones.filter(c => c.estado === 'ENVIADA').length
    };

    if (loading) {
        return (
            <div className="gestor-comunicaciones loading">
                <div className="loading-spinner"></div>
                <p>Cargando comunicaciones...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="gestor-comunicaciones error">
                <p>⚠️ Error: {error}</p>
                <button onClick={fetchComunicaciones}>Reintentar</button>
            </div>
        );
    }

    return (
        <div className="gestor-comunicaciones">
            {/* Header */}
            <div className="comunicaciones-header">
                <h2>💬 Gestor de Comunicaciones</h2>
                <div className="header-stats">
                    <span className="stat">{stats.total} total</span>
                    <span className="stat interna">{stats.internas} internas</span>
                    <span className="stat externa">{stats.externas} externas</span>
                </div>
            </div>

            {/* Acciones */}
            <div className="comunicaciones-actions">
                <div className="dropdown-container">
                    <button
                        className="btn-nueva"
                        onClick={() => setShowNuevaMenu(!showNuevaMenu)}
                    >
                        📨 Nueva comunicación ▼
                    </button>
                    {showNuevaMenu && (
                        <div className="dropdown-menu">
                            <button onClick={() => { setShowReclamacion(true); setShowNuevaMenu(false); }}>
                                ⚠️ Reclamación
                            </button>
                            <button onClick={() => { setShowSolicitudDoc(true); setShowNuevaMenu(false); }}>
                                📄 Solicitud de documentación
                            </button>
                            <button onClick={() => { setShowConvocatoria(true); setShowNuevaMenu(false); }}>
                                ⚖️ Convocatoria notarial
                            </button>
                        </div>
                    )}
                </div>
                <button className="btn-importar" onClick={() => setShowImportarExterna(true)}>
                    📥 Importar externa
                </button>
            </div>

            {/* Filtros */}
            <div className="comunicaciones-filtros">
                <div className="filtro-tabs">
                    <button
                        className={`tab ${filtroExterna === 'todas' ? 'active' : ''}`}
                        onClick={() => setFiltroExterna('todas')}
                    >
                        Todas
                    </button>
                    <button
                        className={`tab ${filtroExterna === 'internas' ? 'active' : ''}`}
                        onClick={() => setFiltroExterna('internas')}
                    >
                        🖥️ Internas
                    </button>
                    <button
                        className={`tab ${filtroExterna === 'externas' ? 'active' : ''}`}
                        onClick={() => setFiltroExterna('externas')}
                    >
                        📥 Externas
                    </button>
                </div>

                <div className="filtro-selects">
                    <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                        <option value="">Todos los tipos</option>
                        {TIPOS.map(t => (
                            <option key={t.key} value={t.key}>{t.label}</option>
                        ))}
                    </select>

                    <select value={filtroCanal} onChange={e => setFiltroCanal(e.target.value)}>
                        <option value="">Todos los canales</option>
                        {Object.entries(CANALES).map(([key, val]) => (
                            <option key={key} value={key}>{val.icon} {val.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Lista */}
            <div className="comunicaciones-lista">
                {comunicacionesFiltradas.length === 0 ? (
                    <div className="no-comunicaciones">
                        <p>No hay comunicaciones que mostrar</p>
                        <button onClick={() => setShowImportarExterna(true)}>
                            📥 Importar primera comunicación externa
                        </button>
                    </div>
                ) : (
                    comunicacionesFiltradas.map(c => (
                        <div
                            key={c.id}
                            className={`comunicacion-row ${c.es_externa ? 'externa' : 'interna'}`}
                            onClick={() => setComunicacionDetalle(c)}
                        >
                            <div className="comunicacion-icon">
                                {CANALES[c.canal as keyof typeof CANALES]?.icon || '📋'}
                            </div>

                            <div className="comunicacion-info">
                                <div className="comunicacion-header-row">
                                    <span className="comunicacion-tipo">
                                        {c.es_externa ? '📥 Externa' : c.tipo_comunicacion.replace(/_/g, ' ')}
                                    </span>
                                    <span className="comunicacion-fecha">
                                        {formatDate(c.fecha_comunicacion)}
                                    </span>
                                </div>

                                <div className="comunicacion-participantes">
                                    <span className="remitente">{getRemitente(c)}</span>
                                    <span className="arrow">→</span>
                                    <span className="destinatarios">{getDestinatarios(c) || 'N/A'}</span>
                                </div>

                                <div className="comunicacion-preview">
                                    {getContenidoPreview(c)}
                                </div>

                                <div className="comunicacion-meta">
                                    <span
                                        className="estado-badge"
                                        style={{
                                            background: `${ESTADOS[c.estado]?.color}20`,
                                            color: ESTADOS[c.estado]?.color
                                        }}
                                    >
                                        {ESTADOS[c.estado]?.icon} {ESTADOS[c.estado]?.label}
                                    </span>

                                    {c.adjuntos_archivo_ids?.length > 0 && (
                                        <span className="adjuntos-badge">
                                            📎 {c.adjuntos_archivo_ids.length}
                                        </span>
                                    )}

                                    {c.sello_qtsp_id && (
                                        <span className="sello-badge" title="Sellado QTSP">
                                            🔐
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="comunicacion-actions">
                                <button
                                    className="btn-accion"
                                    onClick={e => {
                                        e.stopPropagation();
                                        setComunicacionDetalle(c);
                                    }}
                                >
                                    👁️
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal detalle */}
            {comunicacionDetalle && (
                <div className="modal-overlay" onClick={() => setComunicacionDetalle(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setComunicacionDetalle(null)}>✕</button>
                        <h3>
                            {comunicacionDetalle.es_externa ? '📥 Comunicación Externa' : '📨 Comunicación'}
                        </h3>

                        <div className="detalle-grid">
                            <div className="detalle-item">
                                <label>Canal:</label>
                                <span>
                                    {CANALES[comunicacionDetalle.canal as keyof typeof CANALES]?.icon}{' '}
                                    {CANALES[comunicacionDetalle.canal as keyof typeof CANALES]?.label}
                                </span>
                            </div>
                            <div className="detalle-item">
                                <label>Fecha:</label>
                                <span>{formatDate(comunicacionDetalle.fecha_comunicacion)}</span>
                            </div>
                            <div className="detalle-item">
                                <label>Remitente:</label>
                                <span>{getRemitente(comunicacionDetalle)}</span>
                            </div>
                            <div className="detalle-item">
                                <label>Destinatarios:</label>
                                <span>{getDestinatarios(comunicacionDetalle) || 'N/A'}</span>
                            </div>
                            <div className="detalle-item">
                                <label>Estado:</label>
                                <span
                                    className="estado-badge"
                                    style={{
                                        background: `${ESTADOS[comunicacionDetalle.estado]?.color}20`,
                                        color: ESTADOS[comunicacionDetalle.estado]?.color
                                    }}
                                >
                                    {ESTADOS[comunicacionDetalle.estado]?.icon} {ESTADOS[comunicacionDetalle.estado]?.label}
                                </span>
                            </div>
                            {comunicacionDetalle.sello_qtsp_id && (
                                <div className="detalle-item">
                                    <label>Sello QTSP:</label>
                                    <span className="sello-info">🔐 Sellado</span>
                                </div>
                            )}
                            {comunicacionDetalle.hash_contenido && (
                                <div className="detalle-item full">
                                    <label>Hash SHA-256:</label>
                                    <code>{comunicacionDetalle.hash_contenido}</code>
                                </div>
                            )}
                            <div className="detalle-item full">
                                <label>Contenido:</label>
                                <div className="contenido-box">
                                    {comunicacionDetalle.resumen_externo || comunicacionDetalle.contenido || 'Sin contenido'}
                                </div>
                            </div>
                            {comunicacionDetalle.adjuntos_archivo_ids?.length > 0 && (
                                <div className="detalle-item full">
                                    <label>Adjuntos:</label>
                                    <span>{comunicacionDetalle.adjuntos_archivo_ids.length} archivo(s)</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal importar externa */}
            <ImportarComunicacionExterna
                isOpen={showImportarExterna}
                onClose={() => setShowImportarExterna(false)}
                onImported={() => {
                    setShowImportarExterna(false);
                    fetchComunicaciones();
                }}
                contratoId={contratoId}
                rolActual={rolActual}
            />

            {/* Modal Reclamación */}
            <FormularioReclamacion
                isOpen={showReclamacion}
                onClose={() => setShowReclamacion(false)}
                onEnviado={() => {
                    setShowReclamacion(false);
                    fetchComunicaciones();
                }}
                contratoId={contratoId}
                rolActual={rolActual}
            />

            {/* Modal Solicitud Documentación */}
            <FormularioSolicitudDoc
                isOpen={showSolicitudDoc}
                onClose={() => setShowSolicitudDoc(false)}
                onEnviado={() => {
                    setShowSolicitudDoc(false);
                    fetchComunicaciones();
                }}
                contratoId={contratoId}
                rolActual={rolActual}
            />

            {/* Modal Convocatoria */}
            <FormularioConvocatoria
                isOpen={showConvocatoria}
                onClose={() => setShowConvocatoria(false)}
                onEnviado={() => {
                    setShowConvocatoria(false);
                    fetchComunicaciones();
                }}
                contratoId={contratoId}
                rolActual={rolActual}
            />
        </div>
    );
}
