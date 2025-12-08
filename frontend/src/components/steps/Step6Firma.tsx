import React, { useState } from 'react';
import { useContract } from '../../context/ContractContext';
import { FirmaElectronica } from '../firma/FirmaElectronica';

export const Step6Firma: React.FC = () => {
    const { setCurrentStep, contratoId } = useContract();
    const [mostrarRedirect, setMostrarRedirect] = useState(false);
    const [countdown, setCountdown] = useState(3);

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

    return (
        <div className="step-container">
            <div className="step-header">
                <span className="step-icon">✍️</span>
                <div>
                    <h2>Paso 6: Firma Electrónica</h2>
                    <p className="step-description">Todas las partes deben firmar el contrato para perfeccionarlo</p>
                </div>
            </div>

            {/* Componente de firma electrónica */}
            <FirmaElectronica
                contratoId={contratoId}
                onFirmaCompletada={() => {
                    console.log('Firma registrada exitosamente');
                }}
                onTodasFirmasCompletas={handleTodasFirmasCompletas}
            />

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
