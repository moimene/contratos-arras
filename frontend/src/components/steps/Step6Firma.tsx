import React, { useState } from 'react';
import { useContract } from '../../context/ContractContext';
import { FirmaElectronica } from '../firma/FirmaElectronica';
import { ExternalUploadPanel } from '../firma/ExternalUploadPanel';
import { RatificationPanel } from '../firma/RatificationPanel';

type SigningMode = 'IN_PLATFORM' | 'EXTERNAL';

export const Step6Firma: React.FC = () => {
    const { setCurrentStep, contratoId } = useContract();
    const [mostrarRedirect, setMostrarRedirect] = useState(false);
    const [countdown, setCountdown] = useState(3);

    // External upload state
    const [signingMode, setSigningMode] = useState<SigningMode>('IN_PLATFORM');
    const [externalDocId, setExternalDocId] = useState<string | null>(null);
    const [externalDocHash, setExternalDocHash] = useState<string | null>(null);

    if (!contratoId) {
        return (
            <div className="step-container">
                <h2>⚠️ Error</h2>
                <p>No se ha encontrado un ID de contrato válido. Por favor, vuelve a crear el expediente desde el Step 5.</p>
            </div>
        );
    }

    const handleTodasFirmasCompletas = () => {
        console.log('✅ Todas las firmas completadas');
        setMostrarRedirect(true);

        // Countdown de 3 segundos antes de redirectear
        let count = 3;
        const interval = setInterval(() => {
            count--;
            setCountdown(count);
            if (count <= 0) {
                clearInterval(interval);
                window.location.href = `/dashboard/contrato/${contratoId}`;
            }
        }, 1000);
    };

    const handleExternalUploadComplete = (documentId: string, sha256: string) => {
        console.log('📄 External document uploaded:', { documentId, sha256 });
        setExternalDocId(documentId);
        setExternalDocHash(sha256);
    };

    const handleAllRatified = () => {
        console.log('✅ All parties ratified');
        handleTodasFirmasCompletas();
    };

    return (
        <div className="step-container">
            <div className="step-header">
                <span className="step-icon">✍️</span>
                <div>
                    <h2>Paso 6: Firma Electrónica</h2>
                    <p className="step-description">Todas las partes deben firmar el contrato para perfeccionarlo</p>
                </div>
            </div>

            {/* Signing Mode Toggle */}
            <div className="signing-mode-toggle" style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1.5rem',
                padding: '0.25rem',
                background: '#f1f5f9',
                borderRadius: '10px',
                width: 'fit-content'
            }}>
                <button
                    type="button"
                    onClick={() => setSigningMode('IN_PLATFORM')}
                    style={{
                        padding: '0.75rem 1.25rem',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        background: signingMode === 'IN_PLATFORM' ? 'white' : 'transparent',
                        color: signingMode === 'IN_PLATFORM' ? '#6366f1' : '#64748b',
                        boxShadow: signingMode === 'IN_PLATFORM' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                >
                    ✍️ Firma en Plataforma
                </button>
                <button
                    type="button"
                    onClick={() => setSigningMode('EXTERNAL')}
                    style={{
                        padding: '0.75rem 1.25rem',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        background: signingMode === 'EXTERNAL' ? 'white' : 'transparent',
                        color: signingMode === 'EXTERNAL' ? '#6366f1' : '#64748b',
                        boxShadow: signingMode === 'EXTERNAL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                >
                    📤 Documento Externo
                </button>
            </div>

            {/* IN-PLATFORM SIGNING */}
            {signingMode === 'IN_PLATFORM' && (
                <FirmaElectronica
                    contratoId={contratoId}
                    onFirmaCompletada={() => {
                        console.log('Firma registrada exitosamente');
                    }}
                    onTodasFirmasCompletas={handleTodasFirmasCompletas}
                />
            )}

            {/* EXTERNAL DOCUMENT FLOW */}
            {signingMode === 'EXTERNAL' && (
                <>
                    {!externalDocId && (
                        <ExternalUploadPanel
                            contratoId={contratoId}
                            onUploadComplete={handleExternalUploadComplete}
                        />
                    )}

                    {externalDocId && externalDocHash && (
                        <RatificationPanel
                            contratoId={contratoId}
                            documentoId={externalDocId}
                            documentoSha256={externalDocHash}
                            onAllRatified={handleAllRatified}
                        />
                    )}
                </>
            )}

            {/* Mensaje de redirect con countdown */}
            {mostrarRedirect && (
                <div style={{
                    marginTop: '2rem',
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: '12px',
                    textAlign: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    🎉 ¡Proceso de firma completado! Redirigiendo al Dashboard en {countdown}...
                </div>
            )}

            {/* Botones de navegación */}
            <div className="form-actions" style={{ marginTop: '2rem' }}>
                <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="btn btn-secondary"
                    disabled={mostrarRedirect}
                >
                    ← Atrás
                </button>
                <button
                    type="button"
                    onClick={() => {
                        window.location.href = `/dashboard/contrato/${contratoId}`;
                    }}
                    className="btn btn-primary"
                >
                    Ir al Dashboard del Expediente →
                </button>
            </div>
        </div>
    );
};
