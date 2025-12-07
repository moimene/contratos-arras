import React from 'react';
import { useContract } from '../../context/ContractContext';

export const Step6Firma: React.FC = () => {
    const { contratoId, setCurrentStep } = useContract();

    return (
        <div className="step-container">
            <h2 className="step-title">✍️ Paso 6: Firma Electrónica</h2>
            <p className="step-description">
                Las partes deben firmar electrónicamente el contrato.
            </p>

            <div className="info-box">
                <h4>🔐 Proceso de Firma</h4>
                <p>
                    En producción, aquí se integraría con el sistema de firma electrónica.
                    Cada parte recibirá un enlace por email para firmar el contrato.
                </p>
                <p><strong>Estado actual:</strong> Pendiente de firmas</p>
            </div>

            <div className="placeholder-message">
                <p>⏳ Esta funcionalidad se completará en la siguiente fase</p>
                <p>Se integrará con el endpoint POST /api/firmas/:contratoId</p>
            </div>

            <div className="form-actions">
                <button type="button" onClick={() => setCurrentStep(5)} className="btn btn-secondary">
                    ← Atrás
                </button>
                <button type="button" onClick={() => setCurrentStep(7)} className="btn btn-primary">
                    Continuar →
                </button>
            </div>
        </div>
    );
};
