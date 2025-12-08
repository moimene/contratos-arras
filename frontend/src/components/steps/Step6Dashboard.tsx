import React from 'react';
import { useContract } from '../../context/ContractContext';
import ContratoDashboard from '../../pages/Dashboard/ContratoDashboard';

export const Step6Dashboard: React.FC = () => {
    const { contratoId, setCurrentStep } = useContract();

    if (!contratoId) {
        return (
            <div className="step-container">
                <div className="step-header">
                    <h2 className="step-title">📊 Paso 6: Dashboard del Expediente</h2>
                </div>
                <div className="error-message" style={{
                    padding: '2rem',
                    textAlign: 'center',
                    background: '#fee',
                    borderRadius: '8px',
                    margin: '2rem 0'
                }}>
                    <p>⚠️ No hay expediente creado aún.</p>
                    <p>Por favor, vuelve al Paso 5 y crea un expediente.</p>
                    <button
                        onClick={() => setCurrentStep(5)}
                        className="btn btn-primary"
                        style={{ marginTop: '1rem' }}
                    >
                        ← Volver al Paso 5
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="step-6-wrapper">
            <ContratoDashboard
                contratoIdProp={contratoId}
                isEmbedded={true}
                onVolverWizard={() => setCurrentStep(5)}
            />
        </div>
    );
};
