import { useState } from 'react';
import { isTerminal } from '../../../domain/contrato';
import './PanelResolucion.css';

interface PanelResolucionProps {
    contratoId: string;
    estado: string;
    onStatusChange: () => void;
}

type TipoResolucion = 'MUTUO_ACUERDO' | 'LITIGIO' | null;

export default function PanelResolucion({ contratoId, estado, onStatusChange }: PanelResolucionProps) {
    const [tipoResolucion, setTipoResolucion] = useState<TipoResolucion>(null);
    const [condiciones, setCondiciones] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Si el contrato ya está terminado, mostrar mensaje
    if (isTerminal(estado)) {
        return (
            <div className="panel-resolucion-terminado">
                <div className="alert-message info">
                    <span className="icon">🔒</span>
                    <div className="content">
                        <strong>Expediente Finalizado</strong>
                        <p>Este contrato se ha cerrado ({estado === 'LITIGIO' ? 'Litigio' : 'Resolución'}). No se permiten más modificaciones.</p>
                    </div>
                </div>
            </div>
        );
    }

    const handleResolucion = async () => {
        if (!tipoResolucion) return;

        if (tipoResolucion === 'MUTUO_ACUERDO' && !condiciones.trim()) {
            setError('Debes especificar las condiciones del acuerdo.');
            return;
        }

        if (tipoResolucion === 'LITIGIO' && !window.confirm('⚠️ ATENCIÓN: Esta acción es irreversible. Se declarará el expediente en LITIGIO y se bloquearán todas las acciones. ¿Estás seguro?')) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/contracts/${contratoId}/resolver`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: tipoResolucion,
                    condiciones: tipoResolucion === 'MUTUO_ACUERDO' ? condiciones : undefined
                })
            });

            const result = await response.json();

            if (result.success) {
                // Si es litigio, intentar generar certificado
                if (tipoResolucion === 'LITIGIO') {
                    try {
                        await fetch(`${apiUrl}/api/contratos/${contratoId}/certificado`, { method: 'POST' });
                    } catch (e) {
                        console.error('Error generando certificado automático', e);
                    }
                }
                onStatusChange();
                setTipoResolucion(null);
            } else {
                setError(result.error || 'Error al resolver el contrato');
            }
        } catch (err: any) {
            setError(err.message || 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="panel-resolucion">
            {!tipoResolucion ? (
                <div className="resolucion-actions">
                    <div className="action-card mutuo-acuerdo" onClick={() => setTipoResolucion('MUTUO_ACUERDO')}>
                        <span className="icon">🤝</span>
                        <h3>Resolver por Mutuo Acuerdo</h3>
                        <p>Las partes acuerdan terminar el contrato amistosamente. Permite devolución de arras o condiciones pactadas.</p>
                        <button className="btn-secondary">Iniciar Acuerdo</button>
                    </div>

                    <div className="action-card litigio" onClick={() => setTipoResolucion('LITIGIO')}>
                        <span className="icon">⚖️</span>
                        <h3>Declarar Litigio / Incumplimiento</h3>
                        <p className="danger-text">Cierre contencioso. Genera evidencias forenses para tribunales.</p>
                        <button className="btn-danger-outline">Declarar Litigio</button>
                    </div>
                </div>
            ) : (
                <div className={`resolucion-form ${tipoResolucion.toLowerCase()}`}>
                    <div className="form-header">
                        <button className="btn-back" onClick={() => { setTipoResolucion(null); setError(null); }}>← Volver</button>
                        <h3>{tipoResolucion === 'MUTUO_ACUERDO' ? '🤝 Resolución Amistosa' : '⚖️ Declaración de Litigio'}</h3>
                    </div>

                    {error && <div className="error-alert">{error}</div>}

                    {tipoResolucion === 'MUTUO_ACUERDO' && (
                        <div className="form-body">
                            <label>Condiciones de la Resolución <span className="required">*</span></label>
                            <textarea
                                value={condiciones}
                                onChange={(e) => setCondiciones(e.target.value)}
                                placeholder="Describe los términos acordados: devolución de cantidades, indemnizaciones, renuncia de derechos, etc."
                                rows={6}
                                maxLength={2000}
                                disabled={loading}
                            />
                            <p className="help-text">Estas condiciones quedarán registradas en el cierre del expediente.</p>

                            <button
                                className="btn-primary"
                                onClick={handleResolucion}
                                disabled={loading || !condiciones.trim()}
                            >
                                {loading ? 'Procesando...' : 'Confirmar Resolución y Cerrar'}
                            </button>
                        </div>
                    )}

                    {tipoResolucion === 'LITIGIO' && (
                        <div className="form-body warning-mode">
                            <div className="warning-box">
                                <strong>⚠️ Acción Irreversible</strong>
                                <p>Al declarar el litigio:</p>
                                <ul>
                                    <li>Se cambiará el estado a <strong>LITIGIO</strong>.</li>
                                    <li>Se bloqueará la edición del contrato.</li>
                                    <li>Se generará automáticamente un <strong>Certificado QTSP</strong> con todas las evidencias (trazabilidad).</li>
                                </ul>
                            </div>

                            <button
                                className="btn-danger"
                                onClick={handleResolucion}
                                disabled={loading}
                            >
                                {loading ? 'Generando evidencias...' : 'Confirmar Litigio y Certificar'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
