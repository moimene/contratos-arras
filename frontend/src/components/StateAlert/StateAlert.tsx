/**
 * StateAlert - Alerta de bloqueo de transición
 * 
 * Muestra alertas cuando faltan documentos para avanzar de estado.
 */

import { useState, useEffect } from 'react';
import './StateAlert.css';

interface PendingDocument {
    id: string;
    titulo: string;
    tipo: string;
    responsable_rol: string;
}

interface EligibilityData {
    canAdvance: boolean;
    targetState: string;
    blockingReasons: string[];
    pendingDocuments: PendingDocument[];
}

interface StateAlertProps {
    contratoId: string;
    currentState: string;
    onDocumentClick?: (documentId: string) => void;
}

const STATE_LABELS: Record<string, string> = {
    INICIADO: 'Iniciado',
    BORRADOR: 'Borrador',
    FIRMADO: 'Firmado',
    NOTARIA: 'En Notaría',
    TERMINADO: 'Terminado',
    LITIGIO: 'En Litigio'
};

export default function StateAlert({ contratoId, currentState, onDocumentClick }: StateAlertProps) {
    const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        fetchEligibility();
    }, [contratoId, currentState]);

    const fetchEligibility = async () => {
        try {
            setLoading(true);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(
                `${apiUrl}/api/contratos/${contratoId}/transition/eligibility?currentState=${currentState}`
            );
            const result = await response.json();

            if (result.success) {
                setEligibility(result.data);
            }
        } catch (err) {
            console.error('Error checking eligibility:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !eligibility) return null;

    // Si puede avanzar, mostrar indicador positivo
    if (eligibility.canAdvance) {
        return (
            <div className="state-alert success">
                <div className="alert-icon">✅</div>
                <div className="alert-content">
                    <p className="alert-title">Listo para avanzar</p>
                    <p className="alert-text">
                        Puedes avanzar a <strong>{STATE_LABELS[eligibility.targetState]}</strong>
                    </p>
                </div>
            </div>
        );
    }

    // Si hay bloqueos, mostrar alerta
    return (
        <div className="state-alert warning">
            <div className="alert-header" onClick={() => setExpanded(!expanded)}>
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                    <p className="alert-title">Documentos pendientes</p>
                    <p className="alert-text">
                        No puedes avanzar a <strong>{STATE_LABELS[eligibility.targetState]}</strong>
                    </p>
                </div>
                <span className="expand-toggle">{expanded ? '▼' : '▶'}</span>
            </div>

            {expanded && (
                <div className="alert-details">
                    <ul className="blocking-reasons">
                        {eligibility.blockingReasons.map((reason, i) => (
                            <li key={i}>{reason}</li>
                        ))}
                    </ul>

                    {eligibility.pendingDocuments.length > 0 && (
                        <div className="pending-docs">
                            <p className="docs-title">Documentos faltantes:</p>
                            <ul className="docs-list">
                                {eligibility.pendingDocuments.map(doc => (
                                    <li
                                        key={doc.id}
                                        className="doc-item"
                                        onClick={() => onDocumentClick?.(doc.id)}
                                    >
                                        <span className="doc-titulo">{doc.titulo}</span>
                                        <span className="doc-responsable">
                                            📋 {doc.responsable_rol.replace('_', ' ')}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
