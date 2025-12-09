/**
 * UploadModal - Modal de subida de documentos
 * 
 * Permite subir archivos con drag-and-drop y preview.
 */

import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import './UploadModal.css';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadComplete: () => void;
    contratoId: string;
    inventarioItemId: string;
    itemTitulo: string;
    tipoDocumento: string;
}

export default function UploadModal({
    isOpen,
    onClose,
    onUploadComplete,
    contratoId,
    inventarioItemId,
    itemTitulo,
    tipoDocumento
}: UploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        setError(null);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            validateAndSetFile(droppedFile);
        }
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            validateAndSetFile(selectedFile);
        }
    };

    const validateAndSetFile = (f: File) => {
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(f.type)) {
            setError('Tipo de archivo no permitido. Use PDF, imágenes (JPG/PNG) o documentos Word.');
            return;
        }

        if (f.size > 10 * 1024 * 1024) {
            setError('El archivo es demasiado grande. Máximo 10MB.');
            return;
        }

        setFile(f);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setProgress(0);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('contrato_id', contratoId);
            formData.append('inventario_item_id', inventarioItemId);
            formData.append('tipo', tipoDocumento);
            formData.append('subido_por_rol', 'USUARIO');

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${apiUrl}/api/upload`);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setProgress(percent);
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    onUploadComplete();
                    onClose();
                } else {
                    const response = JSON.parse(xhr.responseText);
                    setError(response.error || 'Error al subir el archivo');
                }
                setUploading(false);
            };

            xhr.onerror = () => {
                setError('Error de conexión al subir el archivo');
                setUploading(false);
            };

            xhr.send(formData);
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
            setUploading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="upload-modal-overlay" onClick={onClose}>
            <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
                <div className="upload-modal-header">
                    <h3>📤 Subir Documento</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="upload-modal-body">
                    <p className="upload-context">
                        Subiendo: <strong>{itemTitulo}</strong>
                    </p>

                    <div
                        className={`drop-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelect}
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                            style={{ display: 'none' }}
                        />

                        {!file ? (
                            <>
                                <div className="drop-icon">📁</div>
                                <p className="drop-text">
                                    Arrastra un archivo aquí o <span className="link">haz clic para seleccionar</span>
                                </p>
                                <p className="drop-hint">PDF, imágenes o documentos Word (máx. 10MB)</p>
                            </>
                        ) : (
                            <div className="file-preview">
                                <div className="file-icon">
                                    {file.type.includes('pdf') ? '📕' :
                                        file.type.includes('image') ? '🖼️' : '📄'}
                                </div>
                                <div className="file-info">
                                    <div className="file-name">{file.name}</div>
                                    <div className="file-size">{formatFileSize(file.size)}</div>
                                </div>
                                <button
                                    className="remove-file"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="upload-error">
                            ⚠️ {error}
                        </div>
                    )}

                    {uploading && (
                        <div className="upload-progress">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="progress-text">{progress}%</span>
                        </div>
                    )}
                </div>

                <div className="upload-modal-footer">
                    <button
                        className="btn-cancel"
                        onClick={onClose}
                        disabled={uploading}
                    >
                        Cancelar
                    </button>
                    <button
                        className="btn-upload"
                        onClick={handleUpload}
                        disabled={!file || uploading}
                    >
                        {uploading ? 'Subiendo...' : '📤 Subir Documento'}
                    </button>
                </div>
            </div>
        </div>
    );
}
