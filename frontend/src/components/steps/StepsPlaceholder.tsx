import React from 'react';
import { useContract } from '../../context/ContractContext';

const StepPlaceholder: React.FC<{ stepNumber: number; title: string; description: string }> = ({ stepNumber, title, description }) => {
    const { setCurrentStep } = useContract();

    return (
        <div className="step-container">
            <h2 className="step-title">🚧 Paso {stepNumber}: {title}</h2>
            <p className="step-description">{description}</p>

            <div className="placeholder-message">
                <h3>En Desarrollo</h3>
                <p>Esta funcionalidad se implementará en las siguientes fases del proyecto.</p>
            </div>

            <div className="form-actions">
                <button type="button" onClick={() => setCurrentStep(stepNumber - 1)} className="btn btn-secondary">
                    ← Atrás
                </button>
                {stepNumber < 10 && (
                    <button type="button" onClick={() => setCurrentStep(stepNumber + 1)} className="btn btn-primary">
                        Continuar →
                    </button>
                )}
            </div>
        </div>
    );
};

export const Step7Documentos: React.FC = () => (
    <StepPlaceholder
        stepNumber={7}
        title="Documentos y Notaría"
        description="Subida de documentos adicionales y coordinación con notaría"
    />
);

export const Step8Minuta: React.FC = () => (
    <StepPlaceholder
        stepNumber={8}
        title="Minuta de Escritura"
        description="Generación de minuta para escritura pública"
    />
);

export const Step9Incidencias: React.FC = () => (
    <StepPlaceholder
        stepNumber={9}
        title="Incidencias"
        description="Gestión de pagos y no comparecencia"
    />
);

export const Step10Certificado: React.FC = () => (
    <StepPlaceholder
        stepNumber={10}
        title="Certificado Final"
        description="Conformidad y certificado histórico del contrato"
    />
);
