import React from 'react';
import { useContract } from '../../context/ContractContext';

export const Step5Borrador: React.FC = () => {
    const { contratoId, setCurrentStep } = useContract();

    const handleDownloadPDF = () => {
        if (contratoId) {
            window.open(`/api/pdf/${contratoId}/borrador`, '_blank');
        }
    };

    return (
        <div className="step-container">
            <h2 className="step-title">📄 Paso 5: Borrador del Contrato</h2>
            <p className="step-description">
                El contrato ha sido creado. Descarga el PDF borrador para revisarlo.
            </p>

            <div className="success-message">
                <div className="success-icon">✅</div>
                <h3>¡Contrato Creado Exitosamente!</h3>
                <p>ID del Contrato: <code>{contratoId}</code></p>
            </div>

            <div className="info-box">
                <h4>📋 Sobre el Borrador</h4>
                <p>
                    El documento PDF que puedes descargar es un <strong>borrador informativo</strong>.
                    No es un contrato vinculante hasta que:
                </p>
                <ul>
                    <li>✓ Todas las partes acepten los términos esenciales</li>
                    <li>✓ Se genere el contrato definitivo</li>
                    <li>✓ Todas las partes firmen electrónicamente</li>
                </ul>
                <p>
                    El borrador incluye toda la información según la plantilla oficial ICADE.
                </p>
            </div>

            <div className="actions-grid">
                <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="btn btn-primary btn-large"
                >
                    📥 Descargar PDF Borrador
                </button>
            </div>

            <div className="form-actions">
                <button type="button" onClick={() => setCurrentStep(4)} className="btn btn-secondary">
                    ← Atrás
                </button>
                <button type="button" onClick={() => setCurrentStep(6)} className="btn btn-primary">
                    Continuar a Firmas →
                </button>
            </div>
        </div>
    );
};
