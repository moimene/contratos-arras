/**
 * DocumentosStep Component
 * 
 * Componente embebible en los pasos del wizard para subir documentos
 * correspondientes a cada fase (Inmueble, Partes, etc.)
 */

import { useState, useEffect } from 'react';
import UploadModal from '../InventarioPanel/UploadModal';
import './DocumentosStep.css';

interface Archivo {
    id: string;
    nombreOriginal: string;
    tipoMime: string;
    tamanoBytes: number;
}

interface Documento {
    inventarioId: string;
    tipo: string;
    titulo: string;
    descripcion: string | null;
    grupo: string;
    responsableRol: string;
    estado: 'PENDIENTE' | 'SUBIDO' | 'VALIDADO' | 'RECHAZADO';
    obligatorio: boolean;
    archivo: Archivo | null;
}

interface DocumentosStepProps {
    contratoId: string;
    grupo: 'INMUEBLE' | 'PARTES' | 'ARRAS' | 'NOTARIA' | 'CIERRE';
    titulo?: string;
    descripcion?: string;
}

const GRUPO_INFO: Record<string, { icon: string; titulo: string; descripcion: string }> = {
    INMUEBLE: {
        icon: '🏠',
        titulo: 'Documentos del Inmueble',
        descripcion: 'Sube la documentación relativa a la propiedad'
    },
    PARTES: {
        icon: '👥',
        titulo: 'Documentos de Identificación',
        descripcion: 'Sube los DNI/NIE de las partes y representantes'
    },
    ARRAS: {
        icon: '💰',
        titulo: 'Documentos del Contrato',
        descripcion: 'Documentos relacionados con las arras'
    },
    NOTARIA: {
        icon: '⚖️',
        titulo: 'Documentos Notariales',
        descripcion: 'Documentación para la escritura'
    },
    CIERRE: {
        icon: '✅',
        titulo: 'Documentos de Cierre',
        descripcion: 'Documentos finales del expediente'
    }
};

export default function DocumentosStep({
    contratoId,
    grupo,
    titulo,
    descripcion
}: DocumentosStepProps) {
    const [documentos, setDocumentos] = useState<Documento[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [documentoParaSubir, setDocumentoParaSubir] = useState<Documento | null>(null);

    const grupoInfo = GRUPO_INFO[grupo] || GRUPO_INFO.INMUEBLE;

    useEffect(() => {
        if (contratoId) {
            fetchDocumentos();
        }
    }, [contratoId, grupo]);

    const fetchDocumentos = async () => {
        try {
            setLoading(true);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(
                `${apiUrl}/api/contratos/${contratoId}/documentos/filtrar?grupo=${grupo}`
            );
            const result = await response.json();

            if (result.success) {
                setDocumentos(result.data || []);
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            console.error('Error cargando documentos:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = (archivoId: string) => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        window.open(`${apiUrl}/api/archivos/${archivoId}/preview`, '_blank');
    };

    const handleDescargar = (archivoId: string) => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        window.open(`${apiUrl}/api/archivos/${archivoId}/descargar`, '_blank');
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const pendientes = documentos.filter(d => d.estado === 'PENDIENTE' || d.estado === 'RECHAZADO');
    const completados = documentos.filter(d => d.estado === 'SUBIDO' || d.estado === 'VALIDADO');
    const progreso = documentos.length > 0
        ? Math.round((completados.length / documentos.length) * 100)
        : 0;

    if (!contratoId) {
        return (
            <div className="documentos-step empty">
                <p>💡 Guarda el contrato primero para poder subir documentos</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="documentos-step loading">
                <div className="mini-spinner"></div>
                <span>Cargando documentos...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="documentos-step error">
                <span>⚠️ {error}</span>
                <button onClick={fetchDocumentos}>Reintentar</button>
            </div>
        );
    }

    if (documentos.length === 0) {
        return (
            <div className="documentos-step empty">
                <p>No hay documentos requeridos en esta fase</p>
            </div>
        );
    }

    return (
        <div className="documentos-step">
            <div className="docs-step-header">
                <div className="docs-step-title">
                    <span className="docs-icon">{grupoInfo.icon}</span>
                    <div>
                        <h4>{titulo || grupoInfo.titulo}</h4>
                        <p>{descripcion || grupoInfo.descripcion}</p>
                    </div>
                </div>
                <div className="docs-step-progress">
                    <div className="progress-bar-mini">
                        <div
                            className="progress-fill-mini"
                            style={{ width: `${progreso}%` }}
                        />
                    </div>
                    <span className="progress-text-mini">
                        {completados.length}/{documentos.length}
                    </span>
                </div>
            </div>

            <div className="docs-list">
                {documentos.map(doc => (
                    <div
                        key={doc.inventarioId}
                        className={`doc-item ${doc.estado.toLowerCase()}`}
                    >
                        <div className="doc-item-icon">
                            {doc.estado === 'PENDIENTE' && '⏳'}
                            {doc.estado === 'SUBIDO' && '📤'}
                            {doc.estado === 'VALIDADO' && '✅'}
                            {doc.estado === 'RECHAZADO' && '❌'}
                        </div>
                        <div className="doc-item-info">
                            <div className="doc-item-titulo">
                                {doc.titulo}
                                {doc.obligatorio && <span className="req-badge">*</span>}
                            </div>
                            {doc.archivo && (
                                <div className="doc-item-file">
                                    📄 {doc.archivo.nombreOriginal}
                                    <span className="file-size">({formatBytes(doc.archivo.tamanoBytes)})</span>
                                </div>
                            )}
                            {doc.descripcion && (
                                <div className="doc-item-desc">{doc.descripcion}</div>
                            )}
                        </div>
                        <div className="doc-item-actions">
                            {(doc.estado === 'PENDIENTE' || doc.estado === 'RECHAZADO') && (
                                <button
                                    className="btn-mini upload"
                                    onClick={() => setDocumentoParaSubir(doc)}
                                >
                                    📤 Subir
                                </button>
                            )}
                            {doc.archivo && (
                                <>
                                    <button
                                        className="btn-mini preview"
                                        onClick={() => handlePreview(doc.archivo!.id)}
                                    >
                                        👁️
                                    </button>
                                    <button
                                        className="btn-mini download"
                                        onClick={() => handleDescargar(doc.archivo!.id)}
                                    >
                                        ⬇️
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {pendientes.length > 0 && (
                <div className="docs-step-footer">
                    <span className="pending-notice">
                        ⏳ {pendientes.length} documento{pendientes.length > 1 ? 's' : ''} pendiente{pendientes.length > 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* Modal de subida */}
            {documentoParaSubir && (
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
