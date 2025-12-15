import React, { useState, useCallback } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import './ExternalUploadPanel.css';

interface ExternalUploadPanelProps {
    contratoId: string;
    onUploadComplete: (documentId: string, sha256: string) => void;
}

/**
 * Panel for uploading externally signed contract documents.
 * This is an alternative to in-platform electronic signing, for cases where
 * the contract was signed physically or on another platform.
 */
export const ExternalUploadPanel: React.FC<ExternalUploadPanelProps> = ({
    contratoId,
    onUploadComplete
}) => {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile?.type === 'application/pdf') {
            setFile(droppedFile);
            setError(null);
        } else {
            setError('Solo se permiten archivos PDF');
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type === 'application/pdf') {
                setFile(selectedFile);
                setError(null);
            } else {
                setError('Solo se permiten archivos PDF');
            }
        }
    };

    const computeSha256 = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            // Compute SHA-256 hash
            const sha256 = await computeSha256(file);
            console.log('📄 File SHA-256:', sha256);

            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('contrato_id', contratoId);
            formData.append('tipo', 'CONTRATO_ARRAS_FIRMADO');
            formData.append('origen', 'EXTERNO');
            formData.append('sha256_hash', sha256);

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/upload`, {
                method: 'POST',
                headers: {
                    ...(user?.id ? { 'x-user-id': user.id } : {}),
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Error al subir el documento');
            }

            console.log('✅ Document uploaded:', data);
            onUploadComplete(data.data?.archivo_id || data.archivo_id, sha256);

        } catch (err: any) {
            console.error('❌ Upload error:', err);
            setError(err.message || 'Error al subir el documento');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="external-upload-panel">
            <div className="panel-header">
                <span className="panel-icon">📤</span>
                <div>
                    <h4>Subir Contrato Firmado Externamente</h4>
                    <p>Si el contrato fue firmado fuera de la plataforma, súbelo aquí para su ratificación.</p>
                </div>
            </div>

            <div
                className={`upload-dropzone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {file ? (
                    <div className="file-preview">
                        <span className="file-icon">📄</span>
                        <div className="file-info">
                            <span className="file-name">{file.name}</span>
                            <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <button
                            type="button"
                            className="btn-remove"
                            onClick={() => setFile(null)}
                            title="Quitar archivo"
                        >
                            ×
                        </button>
                    </div>
                ) : (
                    <div className="dropzone-content">
                        <span className="dropzone-icon">📁</span>
                        <p>Arrastra aquí el PDF firmado</p>
                        <span className="dropzone-or">o</span>
                        <label className="btn-select-file">
                            Seleccionar archivo
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                hidden
                            />
                        </label>
                    </div>
                )}
            </div>

            {error && (
                <div className="upload-error">
                    <span>⚠️</span> {error}
                </div>
            )}

            <div className="upload-actions">
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                >
                    {isUploading ? (
                        <>
                            <span className="spinner"></span>
                            Subiendo...
                        </>
                    ) : (
                        <>
                            📤 Subir Documento Externo
                        </>
                    )}
                </button>
            </div>

            <div className="upload-info-note">
                <span className="info-icon">ℹ️</span>
                <span>
                    Una vez subido, ambas partes (COMPRADOR y VENDEDOR) deberán ratificar
                    el documento para que el contrato quede perfeccionado.
                </span>
            </div>
        </div>
    );
};
