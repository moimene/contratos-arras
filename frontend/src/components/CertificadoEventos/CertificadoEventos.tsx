/**
 * CertificadoEventos Component
 * 
 * Muestra y permite descargar el Certificado de Eventos del expediente.
 */

import { useState } from 'react';
import './CertificadoEventos.css';

interface CertificadoEventosProps {
    contratoId: string;
}

interface CertificadoData {
    contratoId: string;
    numeroExpediente: string;
    fechaGeneracion: string;
    hashCertificado: string;
    selloQtspId: string | null;
    resumen: {
        totalEventos: number;
        totalComunicaciones: number;
        comunicacionesInternas: number;
        comunicacionesExternas: number;
        totalDocumentos: number;
    };
}

export default function CertificadoEventos({ contratoId }: CertificadoEventosProps) {
    const [loading, setLoading] = useState(false);
    const [certificado, setCertificado] = useState<CertificadoData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const generarCertificado = async () => {
        setLoading(true);
        setError(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(
                `${apiUrl}/api/contratos/${contratoId}/certificado`,
                { method: 'POST' }
            );
            const result = await response.json();

            if (result.success) {
                setCertificado(result.data);
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            setError(err.message || 'Error generando certificado');
        } finally {
            setLoading(false);
        }
    };

    const descargarHtml = () => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        window.open(`${apiUrl}/api/contratos/${contratoId}/certificado/html`, '_blank');
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="certificado-eventos">
            <div className="certificado-header">
                <h2>📋 Certificado de Eventos</h2>
                <p>Genera un certificado con todos los eventos, comunicaciones y documentos del expediente, sellado con QTSP.</p>
            </div>

            {!certificado ? (
                <div className="certificado-action">
                    <button
                        className="btn-generar"
                        onClick={generarCertificado}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Generando...
                            </>
                        ) : (
                            <>🔐 Generar Certificado</>
                        )}
                    </button>
                    {error && <p className="error-text">⚠️ {error}</p>}
                </div>
            ) : (
                <div className="certificado-resultado">
                    <div className="certificado-success">
                        <span className="success-icon">✅</span>
                        <div>
                            <strong>Certificado generado correctamente</strong>
                            <p>{formatDate(certificado.fechaGeneracion)}</p>
                        </div>
                    </div>

                    <div className="certificado-resumen">
                        <div className="resumen-item">
                            <span className="number">{certificado.resumen.totalEventos}</span>
                            <span className="label">Eventos</span>
                        </div>
                        <div className="resumen-item">
                            <span className="number">{certificado.resumen.comunicacionesInternas}</span>
                            <span className="label">Com. Internas</span>
                        </div>
                        <div className="resumen-item">
                            <span className="number">{certificado.resumen.comunicacionesExternas}</span>
                            <span className="label">Com. Externas</span>
                        </div>
                        <div className="resumen-item">
                            <span className="number">{certificado.resumen.totalDocumentos}</span>
                            <span className="label">Documentos</span>
                        </div>
                    </div>

                    <div className="certificado-hash">
                        <label>🔐 Hash SHA-256 del certificado:</label>
                        <code>{certificado.hashCertificado}</code>
                        {certificado.selloQtspId && (
                            <span className="sello-badge">🔐 Sellado QTSP</span>
                        )}
                    </div>

                    <div className="certificado-actions">
                        <button
                            className="btn-preview"
                            onClick={() => setShowPreview(true)}
                        >
                            👁️ Vista previa
                        </button>
                        <button
                            className="btn-download"
                            onClick={descargarHtml}
                        >
                            📥 Descargar HTML
                        </button>
                        <button
                            className="btn-regenerar"
                            onClick={generarCertificado}
                            disabled={loading}
                        >
                            🔄 Regenerar
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de vista previa */}
            {showPreview && (
                <div className="preview-overlay" onClick={() => setShowPreview(false)}>
                    <div className="preview-content" onClick={e => e.stopPropagation()}>
                        <button className="preview-close" onClick={() => setShowPreview(false)}>
                            ✕
                        </button>
                        <iframe
                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/contratos/${contratoId}/certificado/html`}
                            title="Vista previa del certificado"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
