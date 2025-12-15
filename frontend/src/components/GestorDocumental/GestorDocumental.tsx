/**
 * GestorDocumental Component
 * 
 * Componente principal del gestor documental.
 * Muestra documentos del expediente organizados por grupo con filtros y acciones.
 */

import { useState, useEffect, useCallback } from 'react';
import './GestorDocumental.css';
import UploadModal from '../InventarioPanel/UploadModal';

interface Archivo {
    id: string;
    nombreOriginal: string;
    tipoMime: string;
    tamanoBytes: number;
    hashSha256: string;
    version: number;
    fechaSubida: string;
}

interface Documento {
    inventarioId: string | null;
    tipo: string;
    titulo: string;
    descripcion: string | null;
    grupo: string;
    subtipo: string | null;
    responsableRol: string;
    estado: 'PENDIENTE' | 'SUBIDO' | 'VALIDADO' | 'RECHAZADO';
    obligatorio: boolean;
    esCritico: boolean;
    archivo: Archivo | null;
    subidoPor: { rol: string; fecha: string } | null;
    validadoPor: { rol: string; fecha: string; motivoRechazo?: string } | null;
}

interface ResumenDocumentos {
    total: number;
    pendientes: number;
    subidos: number;
    validados: number;
    rechazados: number;
}

interface GestorDocumentalProps {
    contratoId: string;
    rolActual: string;
}

const GRUPOS = [
    { key: 'INMUEBLE', label: '🏠 Inmueble', color: '#4a90d9' },
    { key: 'PARTES', label: '👥 Partes', color: '#9b59b6' },
    { key: 'ARRAS', label: '💰 Arras', color: '#27ae60' },
    { key: 'NOTARIA', label: '⚖️ Notaría', color: '#e67e22' },
    { key: 'CIERRE', label: '✅ Cierre', color: '#2ecc71' },
    { key: 'URBANISTICO', label: '🏗️ Urbanístico', color: '#1abc9c' },
    { key: 'ADMINISTRATIVO', label: '📋 Administrativo', color: '#3498db' },
    { key: 'LEGAL', label: '⚖️ Legal', color: '#8e44ad' },
    { key: 'TECNICO', label: '🔧 Técnico', color: '#f39c12' },
    { key: 'FISCAL', label: '💼 Fiscal', color: '#16a085' },
    { key: 'ADICIONAL', label: '📎 Adicional', color: '#95a5a6' },
];

const ESTADOS = {
    PENDIENTE: { label: 'Pendiente', color: '#f39c12', icon: '⏳' },
    SUBIDO: { label: 'Subido', color: '#3498db', icon: '📤' },
    VALIDADO: { label: 'Validado', color: '#27ae60', icon: '✅' },
    RECHAZADO: { label: 'Rechazado', color: '#e74c3c', icon: '❌' },
};

export default function GestorDocumental({ contratoId, rolActual }: GestorDocumentalProps) {
    const [documentos, setDocumentos] = useState<Documento[]>([]);
    const [resumen, setResumen] = useState<ResumenDocumentos | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filtros
    const [filtroGrupo, setFiltroGrupo] = useState<string>('');
    const [filtroEstado, setFiltroEstado] = useState<string>('');
    const [grupoActivo, setGrupoActivo] = useState<string>('');

    // Modal de detalle
    const [documentoSeleccionado, setDocumentoSeleccionado] = useState<Documento | null>(null);
    const [showCrearAdhoc, setShowCrearAdhoc] = useState(false);

    // Modal de subida
    const [documentoParaSubir, setDocumentoParaSubir] = useState<Documento | null>(null);

    const fetchDocumentos = useCallback(async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            setError(null);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/contratos/${contratoId}/documentos`, {
                signal
            });
            const result = await response.json();

            if (signal?.aborted) return;

            if (result.success) {
                setDocumentos(result.data);
                setResumen(result.resumen);
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error('Error cargando documentos:', err);
            setError(err.message);
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [contratoId]);

    useEffect(() => {
        const controller = new AbortController();
        fetchDocumentos(controller.signal);
        return () => controller.abort();
    }, [fetchDocumentos]);

    const handleValidar = async (inventarioId: string) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/inventario/${inventarioId}/validar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ validadorRol: rolActual })
            });

            if (response.ok) {
                fetchDocumentos();
            }
        } catch (err) {
            console.error('Error validando:', err);
        }
    };

    const handleRechazar = async (inventarioId: string) => {
        const motivo = prompt('Motivo del rechazo:');
        if (!motivo) return;

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/inventario/${inventarioId}/rechazar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ motivo, validadorRol: rolActual })
            });

            if (response.ok) {
                fetchDocumentos();
            }
        } catch (err) {
            console.error('Error rechazando:', err);
        }
    };

    const handleDescargar = async (archivoId: string) => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        window.open(`${apiUrl}/api/archivos/${archivoId}/descargar`, '_blank');
    };

    const handlePreview = async (archivoId: string) => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        window.open(`${apiUrl}/api/archivos/${archivoId}/preview`, '_blank');
    };

    const handleEliminar = async (archivoId: string, nombreArchivo: string) => {
        if (!confirm(`¿Eliminar el documento "${nombreArchivo}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/upload/${archivoId}?rol=${rolActual}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchDocumentos();
            } else {
                const data = await response.json();
                alert(data.error || 'Error al eliminar documento');
            }
        } catch (err) {
            console.error('Error eliminando documento:', err);
            alert('Error al conectar con el servidor');
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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

    // Filtrar documentos
    const documentosFiltrados = documentos.filter(doc => {
        if (filtroGrupo && doc.grupo !== filtroGrupo) return false;
        if (filtroEstado && doc.estado !== filtroEstado) return false;
        if (grupoActivo && doc.grupo !== grupoActivo) return false;
        return true;
    });

    // Agrupar por grupo
    const documentosPorGrupo = GRUPOS.map(grupo => ({
        ...grupo,
        documentos: documentos.filter(d => d.grupo === grupo.key)
    })).filter(g => g.documentos.length > 0);

    if (loading) {
        return (
            <div className="gestor-documental loading">
                <div className="loading-spinner"></div>
                <p>Cargando documentos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="gestor-documental error">
                <p>⚠️ Error: {error}</p>
                <button onClick={() => fetchDocumentos()}>Reintentar</button>
            </div>
        );
    }

    return (
        <div className="gestor-documental">
            {/* Header con resumen */}
            <div className="gestor-header">
                <h2>📁 Gestor Documental</h2>
                {resumen && (
                    <div className="resumen-badges">
                        <span className="badge total">{resumen.total} docs</span>
                        <span className="badge pendiente">{resumen.pendientes} pendientes</span>
                        <span className="badge subido">{resumen.subidos} subidos</span>
                        <span className="badge validado">{resumen.validados} validados</span>
                        {resumen.rechazados > 0 && (
                            <span className="badge rechazado">{resumen.rechazados} rechazados</span>
                        )}
                    </div>
                )}
            </div>

            {/* Filtros */}
            <div className="gestor-filtros">
                <div className="filtro-grupo">
                    <label>Grupo:</label>
                    <select value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value)}>
                        <option value="">Todos</option>
                        {GRUPOS.map(g => (
                            <option key={g.key} value={g.key}>{g.label}</option>
                        ))}
                    </select>
                </div>
                <div className="filtro-estado">
                    <label>Estado:</label>
                    <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                        <option value="">Todos</option>
                        {Object.entries(ESTADOS).map(([key, val]) => (
                            <option key={key} value={key}>{val.icon} {val.label}</option>
                        ))}
                    </select>
                </div>
                <button
                    className="btn-crear-adhoc"
                    onClick={() => setShowCrearAdhoc(true)}
                >
                    ➕ Añadir requisito
                </button>
            </div>

            {/* Tabs por grupo */}
            <div className="grupo-tabs">
                <button
                    className={`tab ${grupoActivo === '' ? 'active' : ''}`}
                    onClick={() => setGrupoActivo('')}
                >
                    Todos
                </button>
                {documentosPorGrupo.map(g => (
                    <button
                        key={g.key}
                        className={`tab ${grupoActivo === g.key ? 'active' : ''}`}
                        onClick={() => setGrupoActivo(g.key)}
                        style={{ borderColor: grupoActivo === g.key ? g.color : 'transparent' }}
                    >
                        {g.label} ({g.documentos.length})
                    </button>
                ))}
            </div>

            {/* Lista de documentos */}
            <div className="documentos-lista">
                {documentosFiltrados.length === 0 ? (
                    <div className="no-documentos">
                        <p>No hay documentos que coincidan con los filtros.</p>
                    </div>
                ) : (
                    documentosFiltrados.map((doc, idx) => (
                        <div
                            key={doc.inventarioId || `archivo-${idx}`}
                            className={`documento-row ${doc.estado.toLowerCase()}`}
                        >
                            <div className="doc-icon">
                                {doc.archivo ? '📄' : '📋'}
                            </div>
                            <div className="doc-info">
                                <div className="doc-titulo">
                                    {doc.titulo}
                                    {doc.obligatorio && <span className="tag obligatorio">Requerido</span>}
                                    {doc.esCritico && <span className="tag critico">Crítico</span>}
                                </div>
                                <div className="doc-meta">
                                    <span className="doc-tipo">{doc.tipo}</span>
                                    <span className="doc-responsable">
                                        👤 {doc.responsableRol}
                                    </span>
                                    {doc.archivo && (
                                        <>
                                            <span className="doc-size">{formatBytes(doc.archivo.tamanoBytes)}</span>
                                            <span className="doc-version">v{doc.archivo.version}</span>
                                        </>
                                    )}
                                </div>
                                {doc.archivo?.hashSha256 && (
                                    <div className="doc-hash">
                                        🔐 {doc.archivo.hashSha256.substring(0, 16)}...
                                    </div>
                                )}
                            </div>
                            <div className="doc-estado">
                                <span
                                    className={`estado-badge ${doc.estado.toLowerCase()}`}
                                    style={{ backgroundColor: ESTADOS[doc.estado].color }}
                                >
                                    {ESTADOS[doc.estado].icon} {ESTADOS[doc.estado].label}
                                </span>
                                {doc.validadoPor?.motivoRechazo && (
                                    <span className="motivo-rechazo" title={doc.validadoPor.motivoRechazo}>
                                        💬 {doc.validadoPor.motivoRechazo.substring(0, 30)}...
                                    </span>
                                )}
                            </div>
                            <div className="doc-acciones">
                                {/* Botón de subida para PENDIENTE o RECHAZADO */}
                                {(doc.estado === 'PENDIENTE' || doc.estado === 'RECHAZADO') && doc.inventarioId && (
                                    <button
                                        className="btn-accion subir"
                                        onClick={() => setDocumentoParaSubir(doc)}
                                        title="Subir documento"
                                    >
                                        📤
                                    </button>
                                )}
                                {doc.archivo && (
                                    <>
                                        <button
                                            className="btn-accion preview"
                                            onClick={() => handlePreview(doc.archivo!.id)}
                                            title="Vista previa"
                                        >
                                            👁️
                                        </button>
                                        <button
                                            className="btn-accion descargar"
                                            onClick={() => handleDescargar(doc.archivo!.id)}
                                            title="Descargar"
                                        >
                                            ⬇️
                                        </button>
                                        <button
                                            className="btn-accion eliminar"
                                            onClick={() => handleEliminar(doc.archivo!.id, doc.archivo!.nombreOriginal)}
                                            title="Eliminar documento"
                                        >
                                            🗑️
                                        </button>
                                    </>
                                )}
                                {doc.estado === 'SUBIDO' && doc.inventarioId && (
                                    <>
                                        <button
                                            className="btn-accion validar"
                                            onClick={() => handleValidar(doc.inventarioId!)}
                                            title="Validar"
                                        >
                                            ✅
                                        </button>
                                        <button
                                            className="btn-accion rechazar"
                                            onClick={() => handleRechazar(doc.inventarioId!)}
                                            title="Rechazar"
                                        >
                                            ❌
                                        </button>
                                    </>
                                )}
                                <button
                                    className="btn-accion detalle"
                                    onClick={() => setDocumentoSeleccionado(doc)}
                                    title="Ver detalle"
                                >
                                    ℹ️
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de detalle */}
            {documentoSeleccionado && (
                <div className="modal-overlay" onClick={() => setDocumentoSeleccionado(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setDocumentoSeleccionado(null)}>✕</button>
                        <h3>📄 {documentoSeleccionado.titulo}</h3>

                        <div className="detalle-grid">
                            <div className="detalle-item">
                                <label>Tipo:</label>
                                <span>{documentoSeleccionado.tipo}</span>
                            </div>
                            <div className="detalle-item">
                                <label>Grupo:</label>
                                <span>{documentoSeleccionado.grupo}</span>
                            </div>
                            <div className="detalle-item">
                                <label>Estado:</label>
                                <span className={`estado-badge ${documentoSeleccionado.estado.toLowerCase()}`}>
                                    {ESTADOS[documentoSeleccionado.estado].icon} {ESTADOS[documentoSeleccionado.estado].label}
                                </span>
                            </div>
                            <div className="detalle-item">
                                <label>Responsable:</label>
                                <span>{documentoSeleccionado.responsableRol}</span>
                            </div>

                            {documentoSeleccionado.archivo && (
                                <>
                                    <div className="detalle-item full">
                                        <label>Hash SHA-256:</label>
                                        <code>{documentoSeleccionado.archivo.hashSha256}</code>
                                    </div>
                                    <div className="detalle-item">
                                        <label>Versión:</label>
                                        <span>{documentoSeleccionado.archivo.version}</span>
                                    </div>
                                    <div className="detalle-item">
                                        <label>Tamaño:</label>
                                        <span>{formatBytes(documentoSeleccionado.archivo.tamanoBytes)}</span>
                                    </div>
                                    <div className="detalle-item">
                                        <label>Fecha subida:</label>
                                        <span>{formatDate(documentoSeleccionado.archivo.fechaSubida)}</span>
                                    </div>
                                </>
                            )}

                            {documentoSeleccionado.validadoPor && (
                                <div className="detalle-item full">
                                    <label>Validación:</label>
                                    <span>
                                        {documentoSeleccionado.estado === 'RECHAZADO' ? '❌ Rechazado' : '✅ Validado'}
                                        por {documentoSeleccionado.validadoPor.rol}
                                        el {formatDate(documentoSeleccionado.validadoPor.fecha)}
                                        {documentoSeleccionado.validadoPor.motivoRechazo && (
                                            <span className="motivo-expansion">
                                                <br />Motivo: {documentoSeleccionado.validadoPor.motivoRechazo}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            )}

                            {documentoSeleccionado.descripcion && (
                                <div className="detalle-item full">
                                    <label>Descripción:</label>
                                    <span>{documentoSeleccionado.descripcion}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal crear ad-hoc */}
            {showCrearAdhoc && (
                <CrearAdhocModal
                    contratoId={contratoId}
                    rolActual={rolActual}
                    onClose={() => setShowCrearAdhoc(false)}
                    onCreated={() => {
                        setShowCrearAdhoc(false);
                        fetchDocumentos();
                    }}
                />
            )}

            {/* Modal de subida de documento */}
            {documentoParaSubir && documentoParaSubir.inventarioId && (
                <UploadModal
                    isOpen={true}
                    onClose={() => setDocumentoParaSubir(null)}
                    onUploadComplete={() => {
                        setDocumentoParaSubir(null);
                        fetchDocumentos();
                    }}
                    contratoId={contratoId}
                    inventarioItemId={documentoParaSubir.inventarioId}
                    itemTitulo={documentoParaSubir.titulo}
                    tipoDocumento={documentoParaSubir.tipo}
                />
            )}
        </div>
    );
}

// Componente para crear item ad-hoc
function CrearAdhocModal({ contratoId, rolActual, onClose, onCreated }: {
    contratoId: string;
    rolActual: string;
    onClose: () => void;
    onCreated: () => void;
}) {
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [grupo, setGrupo] = useState('ADICIONAL');
    const [responsableRol, setResponsableRol] = useState('COMPRADOR');
    const [esCritico, setEsCritico] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titulo.trim()) return;

        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/contratos/${contratoId}/inventario/adhoc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: grupo,
                    titulo,
                    descripcion,
                    grupo,
                    responsableRol,
                    esCritico,
                    creadoPorRol: rolActual
                })
            });

            if (response.ok) {
                onCreated();
            }
        } catch (err) {
            console.error('Error creando item ad-hoc:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content adhoc-form" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>
                <h3>➕ Añadir requisito documental</h3>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Título *</label>
                        <input
                            type="text"
                            value={titulo}
                            onChange={e => setTitulo(e.target.value)}
                            placeholder="Ej: Certificado urbanístico"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea
                            value={descripcion}
                            onChange={e => setDescripcion(e.target.value)}
                            placeholder="Instrucciones para quien debe subir este documento..."
                            rows={3}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Categoría</label>
                            <select value={grupo} onChange={e => setGrupo(e.target.value)}>
                                {GRUPOS.map(g => (
                                    <option key={g.key} value={g.key}>{g.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Responsable</label>
                            <select value={responsableRol} onChange={e => setResponsableRol(e.target.value)}>
                                <option value="COMPRADOR">Comprador</option>
                                <option value="VENDEDOR">Vendedor</option>
                                <option value="ASESOR_COMPRADOR">Asesor comprador</option>
                                <option value="ASESOR_VENDEDOR">Asesor vendedor</option>
                                <option value="NOTARIO">Notario</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={esCritico}
                                onChange={e => setEsCritico(e.target.checked)}
                            />
                            ⚠️ Documento crítico para transición de estado
                        </label>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Creando...' : 'Crear requisito'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
