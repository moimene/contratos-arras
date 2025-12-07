import React from 'react';
import { useContract } from '../context/ContractContext';

interface Step {
    number: number;
    title: string;
    description: string;
}

const steps: Step[] = [
    { number: 1, title: 'Inmueble', description: 'Datos de la propiedad' },
    { number: 2, title: 'Acuerdo', description: 'Condiciones económicas' },
    { number: 3, title: 'Partes', description: 'Comprador y vendedor' },
    { number: 4, title: 'Resumen', description: 'Aceptación de términos' },
    { number: 5, title: 'Borrador', description: 'Generar PDF' },
    { number: 6, title: 'Firma', description: 'Firma electrónica' },
    { number: 7, title: 'Documentos', description: 'Notaría' },
    { number: 8, title: 'Minuta', description: 'Escritura' },
    { number: 9, title: 'Incidencias', description: 'Pagos y comparecencia' },
    { number: 10, title: 'Certificado', description: 'Conformidad final' },
];

export const Stepper: React.FC = () => {
    const { currentStep } = useContract();

    return (
        <div className="stepper">
            <div className="stepper-container">
                {steps.map((step, index) => (
                    <div key={step.number} className="stepper-step">
                        <div className="stepper-step-content">
                            <div
                                className={`stepper-circle ${currentStep === step.number
                                        ? 'active'
                                        : currentStep > step.number
                                            ? 'completed'
                                            : 'pending'
                                    }`}
                            >
                                {currentStep > step.number ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                ) : (
                                    step.number
                                )}
                            </div>
                            <div className="stepper-text">
                                <div className="stepper-title">{step.title}</div>
                                <div className="stepper-description">{step.description}</div>
                            </div>
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={`stepper-line ${currentStep > step.number ? 'completed' : 'pending'
                                    }`}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
