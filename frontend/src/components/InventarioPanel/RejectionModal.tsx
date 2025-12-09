/**
 * RejectionModal - Modal de rechazo de documentos
 * 
 * Permite rechazar un documento subido con un motivo obligatorio.
 */

import { useState } from 'react';
import './RejectionModal.css';

interface RejectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReject: (motivo: string) => void;
    itemTitulo: string;
}

export default function RejectionModal({
    isOpen,
    onClose,
    onReject,
    itemTitulo
}: RejectionModalProps) {
    const [motivo, setMotivo] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!motivo.trim()) return;

        setSubmitting(true);
        try {
            await onReject(motivo.trim());
            setMotivo('');
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="rejection-modal-overlay" onClick={onClose}>
            <div className="rejection-modal" onClick={(e) => e.stopPropagation()}>
                <div className="rejection-modal-header">
                    <h3>❌ Rechazar Documento</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="rejection-modal-body">
                    <p className="rejection-context">
                        Vas a rechazar: <strong>{itemTitulo}</strong>
                    </p>

                    <div className="form-group">
                        <label htmlFor="motivo">Motivo del rechazo *</label>
                        <textarea
                            id="motivo"
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            placeholder="Explica por qué se rechaza este documento..."
                            rows={4}
                            required
                        />
                    </div>

                    <div className="rejection-warning">
                        ⚠️ El usuario será notificado y deberá volver a subir el documento.
                    </div>
                </div>

                <div className="rejection-modal-footer">
                    <button
                        className="btn-cancel"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancelar
                    </button>
                    <button
                        className="btn-reject"
                        onClick={handleSubmit}
                        disabled={!motivo.trim() || submitting}
                    >
                        {submitting ? 'Rechazando...' : '❌ Confirmar Rechazo'}
                    </button>
                </div>
            </div>
        </div>
    );
}
