/**
 * ImportarComunicacionExterna Component
 * 
 * Modal para importar comunicaciones realizadas fuera de la plataforma.
 * Campos: canal, fecha, remitente, resumen, adjuntos.
 */

import { useState } from 'react';
import './ImportarExterna.css';

interface ImportarExternaProps {
    isOpen: boolean;
    onClose: () => void;
    onImported: () => void;
    contratoId: string;
    rolActual: string;
}

const CANALES = [
    { value: 'EMAIL', label: '📧 Email', icon: '📧' },
    { value: 'BUROFAX', label: '📮 Burofax', icon: '📮' },
    { value: 'CARTA_CERTIFICADA', label: '📬 Carta certificada', icon: '📬' },
    { value: 'CARTA_SIMPLE', label: '✉️ Carta simple', icon: '✉️' },
    { value: 'WHATSAPP', label: '💬 WhatsApp', icon: '💬' },
    { value: 'TELEFONO', label: '📞 Teléfono', icon: '📞' },
    { value: 'OTRO', label: '📋 Otro', icon: '📋' }
];

const TIPOS_FUNCION = [
    { value: '', label: 'Sin clasificar' },
    { value: 'RECLAMACION', label: 'Reclamación' },
    { value: 'SOLICITUD_INFO', label: 'Solicitud de información' },
    { value: 'ENTREGA_INFO', label: 'Entrega de información' },
    { value: 'CONVOCATORIA', label: 'Convocatoria' },
    { value: 'NO_COMPARECENCIA', label: 'Notificación no comparecencia' },
    { value: 'DESISTIMIENTO', label: 'Desistimiento' },
    { value: 'OTRO', label: 'Otro' }
];

export default function ImportarComunicacionExterna({
    isOpen,
    onClose,
    onImported,
    contratoId,
    rolActual
}: ImportarExternaProps) {
    const [canal, setCanal] = useState('EMAIL');
    const [fechaComunicacion, setFechaComunicacion] = useState('');
    const [remitenteExterno, setRemitenteExterno] = useState('');
    const [destinatariosExternos, setDestinatariosExternos] = useState('');
    const [resumenContenido, setResumenContenido] = useState('');
    const [tipoFuncion, setTipoFuncion] = useState('');
    const [adjuntos, setAdjuntos] = useState<File[]>([]);
    const [adjuntosSubidos, setAdjuntosSubidos] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAdjuntos(prev => [...prev, ...files]);
    };

    const handleRemoveFile = (index: number) => {
        setAdjuntos(prev => prev.filter((_, i) => i !== index));
    };

    const uploadFiles = async (): Promise<string[]> => {
        if (adjuntos.length === 0) return [];

        setUploadingFiles(true);
        const uploadedIds: string[] = [];
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

        for (const file of adjuntos) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('contrato_id', contratoId);
                formData.append('tipo', `DOC_EXTERNO_${canal}`);
                formData.append('subido_por_rol', rolActual);

                const response = await fetch(`${apiUrl}/api/upload`, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                if (result.success && result.data?.id) {
                    uploadedIds.push(result.data.id);
                }
            } catch (err) {
                console.error('Error subiendo archivo:', err);
            }
        }

        setUploadingFiles(false);
        return uploadedIds;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validaciones
        if (!fechaComunicacion || !remitenteExterno || !resumenContenido) {
            setError('Completa los campos obligatorios');
            return;
        }

        if (resumenContenido.length < 30) {
            setError('El resumen debe tener al menos 30 caracteres');
            return;
        }

        setLoading(true);

        try {
            // 1. Subir adjuntos si hay
            const adjuntosIds = await uploadFiles();

            // 2. Importar comunicación
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(
                `${apiUrl}/api/contratos/${contratoId}/comunicaciones/externas`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        canal,
                        fechaComunicacion: new Date(fechaComunicacion).toISOString(),
                        remitenteExterno,
                        destinatariosExternos,
                        resumenContenido,
                        tipoFuncion: tipoFuncion || undefined,
                        adjuntosArchivoIds: adjuntosIds,
                        registradoPorRol: rolActual
                    })
                }
            );

            const result = await response.json();

            if (result.success) {
                onImported();
                onClose();
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            setError(err.message || 'Error al importar comunicación');
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="importar-externa-overlay" onClick={onClose}>
            <div className="importar-externa-modal" onClick={e => e.stopPropagation()}>
                <div className="importar-header">
                    <h3>📥 Importar Comunicación Externa</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="importar-info">
                    <p>
                        Registra una comunicación realizada fuera de la plataforma.
                        Se sellará con marca de tiempo cualificada (QTSP).
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="importar-form">
                    {/* Canal */}
                    <div className="form-group">
                        <label>Canal de comunicación *</label>
                        <div className="canal-options">
                            {CANALES.map(c => (
                                <button
                                    key={c.value}
                                    type="button"
                                    className={`canal-btn ${canal === c.value ? 'active' : ''}`}
                                    onClick={() => setCanal(c.value)}
                                >
                                    <span className="canal-icon">{c.icon}</span>
                                    <span className="canal-label">{c.label.replace(/^.{2}\s/, '')}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Fecha */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="fecha">Fecha de la comunicación *</label>
                            <input
                                type="datetime-local"
                                id="fecha"
                                value={fechaComunicacion}
                                onChange={e => setFechaComunicacion(e.target.value)}
                                required
                                max={new Date().toISOString().slice(0, 16)}
                            />
                            <small>Fecha y hora aproximadas según la evidencia</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="tipoFuncion">Tipo (clasificación)</label>
                            <select
                                id="tipoFuncion"
                                value={tipoFuncion}
                                onChange={e => setTipoFuncion(e.target.value)}
                            >
                                {TIPOS_FUNCION.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Remitente y destinatarios */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="remitente">Remitente *</label>
                            <input
                                type="text"
                                id="remitente"
                                value={remitenteExterno}
                                onChange={e => setRemitenteExterno(e.target.value)}
                                placeholder="Ej: Parte vendedora, Notaría García..."
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="destinatarios">Destinatarios</label>
                            <input
                                type="text"
                                id="destinatarios"
                                value={destinatariosExternos}
                                onChange={e => setDestinatariosExternos(e.target.value)}
                                placeholder="Ej: Parte compradora y su asesor"
                            />
                        </div>
                    </div>

                    {/* Resumen */}
                    <div className="form-group">
                        <label htmlFor="resumen">Resumen del contenido *</label>
                        <textarea
                            id="resumen"
                            value={resumenContenido}
                            onChange={e => setResumenContenido(e.target.value)}
                            placeholder="Describe de forma clara y concisa el contenido de la comunicación..."
                            rows={5}
                            required
                            minLength={30}
                            maxLength={4000}
                        />
                        <small>
                            {resumenContenido.length}/4000 caracteres
                            {resumenContenido.length < 30 && resumenContenido.length > 0 &&
                                <span className="warning"> (mínimo 30)</span>
                            }
                        </small>
                    </div>

                    {/* Adjuntos */}
                    <div className="form-group">
                        <label>Documentos de soporte</label>
                        <div className="adjuntos-section">
                            <label className="adjuntos-upload-btn">
                                📎 Añadir archivo
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileSelect}
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    style={{ display: 'none' }}
                                />
                            </label>
                            <small>PDF, imágenes o documentos Word</small>
                        </div>

                        {adjuntos.length > 0 && (
                            <div className="adjuntos-list">
                                {adjuntos.map((file, idx) => (
                                    <div key={idx} className="adjunto-item">
                                        <span className="adjunto-icon">
                                            {file.type.includes('pdf') ? '📕' :
                                                file.type.includes('image') ? '🖼️' : '📄'}
                                        </span>
                                        <span className="adjunto-name">{file.name}</span>
                                        <span className="adjunto-size">{formatFileSize(file.size)}</span>
                                        <button
                                            type="button"
                                            className="adjunto-remove"
                                            onClick={() => handleRemoveFile(idx)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="importar-error">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="importar-disclaimer">
                        <p>
                            ℹ️ La plataforma sellará la existencia e integridad de lo que se sube
                            desde su incorporación, pero no puede garantizar la autenticidad previa
                            del documento externo.
                        </p>
                    </div>

                    <div className="importar-actions">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-import"
                            disabled={loading || uploadingFiles}
                        >
                            {loading || uploadingFiles
                                ? (uploadingFiles ? 'Subiendo archivos...' : 'Importando...')
                                : '📥 Importar y Sellar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
