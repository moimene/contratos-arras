import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { useTipoRolUsuario } from '../../hooks/useTipoRolUsuario';
import './RatificationPanel.css';

// Official legal text identifiers (from legal team)
const RATIFICATION_TEXT_ID = 'RATIFICACION_CONTRATO_FIRMADO_EXTERNO';
const RATIFICATION_TEXT_VERSION = '1.0.0';

interface Ratificacion {
    id: string;
    rol_parte: 'COMPRADOR' | 'VENDEDOR';
    usuario_id: string;
    fecha_ratificacion: string;
    sello_id?: string;
    perfiles?: {
        email: string;
        nombre_completo: string;
    };
}

interface RatificacionesResumen {
    completadas: number;
    requeridas: number;
    todasCompletas: boolean;
    COMPRADOR: Ratificacion | null;
    VENDEDOR: Ratificacion | null;
}

interface RatificationPanelProps {
    contratoId: string;
    documentoId: string;
    documentoSha256: string;
    onAllRatified?: () => void;
}

/**
 * Panel showing ratification status and allowing users to ratify an externally signed document.
 * Each party (COMPRADOR/VENDEDOR) must ratify for the contract to be finalized.
 */
export const RatificationPanel: React.FC<RatificationPanelProps> = ({
    contratoId,
    documentoId,
    documentoSha256,
    onAllRatified
}) => {
    const { user } = useAuth();
    const { role: rolActual, loading: roleLoading } = useTipoRolUsuario();

    const [resumen, setResumen] = useState<RatificacionesResumen | null>(null);
    const [loading, setLoading] = useState(true);
    const [ratificando, setRatificando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aceptoTerminos, setAceptoTerminos] = useState(false);

    const fetchRatificaciones = useCallback(async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/contratos/${contratoId}/ratificaciones`, {
                headers: {
                    ...(user?.id ? { 'x-user-id': user.id } : {}),
                }
            });

            const data = await response.json();
            if (data.success) {
                setResumen(data.data.resumen);
                if (data.data.resumen.todasCompletas && onAllRatified) {
                    onAllRatified();
                }
            } else {
                setError(data.error || 'Error cargando ratificaciones');
            }
        } catch (err: any) {
            console.error('Error fetching ratificaciones:', err);
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    }, [contratoId, user?.id, onAllRatified]);

    useEffect(() => {
        fetchRatificaciones();
    }, [fetchRatificaciones]);

    const handleRatificar = async () => {
        if (!aceptoTerminos) return;

        setRatificando(true);
        setError(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/contratos/${contratoId}/ratificaciones`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(user?.id ? { 'x-user-id': user.id } : {}),
                },
                body: JSON.stringify({
                    documentoId,
                    documentoSha256,
                    textId: RATIFICATION_TEXT_ID,
                    textVersion: RATIFICATION_TEXT_VERSION
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ Ratificación registrada:', data);
                setAceptoTerminos(false);
                await fetchRatificaciones();
            } else {
                setError(data.error || 'Error al ratificar');
            }
        } catch (err: any) {
            console.error('❌ Error ratificando:', err);
            setError('Error de conexión con el servidor');
        } finally {
            setRatificando(false);
        }
    };

    // Check if current user can ratify
    const puedeRatificar = ['COMPRADOR', 'VENDEDOR'].includes(rolActual || '');
    const yaRatifico = rolActual === 'COMPRADOR'
        ? !!resumen?.COMPRADOR
        : rolActual === 'VENDEDOR'
            ? !!resumen?.VENDEDOR
            : false;

    if (loading || roleLoading) {
        return (
            <div className="ratification-panel loading">
                <div className="loading-spinner"></div>
                <p>Cargando estado de ratificaciones...</p>
            </div>
        );
    }

    return (
        <div className="ratification-panel">
            <div className="panel-header">
                <span className="panel-icon">📋</span>
                <div>
                    <h4>Ratificación del Documento</h4>
                    <p>Cada parte debe ratificar el documento firmado externamente</p>
                </div>
            </div>

            {/* Progress */}
            <div className="ratification-progress">
                <div className="progress-bar-wrapper">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${((resumen?.completadas || 0) / (resumen?.requeridas || 2)) * 100}%` }}
                    ></div>
                </div>
                <p className="progress-text">
                    <strong>{resumen?.completadas || 0}</strong> de <strong>{resumen?.requeridas || 2}</strong> ratificaciones
                </p>
            </div>

            {/* Status cards for each party */}
            <div className="ratification-cards">
                {/* COMPRADOR */}
                <div className={`ratification-card ${resumen?.COMPRADOR ? 'completed' : 'pending'}`}>
                    <div className="card-header">
                        <span className="role-icon">👤</span>
                        <span className="role-name">Parte Compradora</span>
                        {resumen?.COMPRADOR ? (
                            <span className="status-badge completed">✓ Ratificado</span>
                        ) : (
                            <span className="status-badge pending">⏳ Pendiente</span>
                        )}
                    </div>
                    {resumen?.COMPRADOR && (
                        <div className="card-details">
                            <p className="ratified-by">
                                Por: {resumen.COMPRADOR.perfiles?.nombre_completo}
                            </p>
                            <p className="ratified-date">
                                {new Date(resumen.COMPRADOR.fecha_ratificacion).toLocaleString('es-ES', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                })}
                            </p>
                            {resumen.COMPRADOR.sello_id && (
                                <p className="qtsp-badge">🔒 Sellado QTSP</p>
                            )}
                        </div>
                    )}
                </div>

                {/* VENDEDOR */}
                <div className={`ratification-card ${resumen?.VENDEDOR ? 'completed' : 'pending'}`}>
                    <div className="card-header">
                        <span className="role-icon">🏠</span>
                        <span className="role-name">Parte Vendedora</span>
                        {resumen?.VENDEDOR ? (
                            <span className="status-badge completed">✓ Ratificado</span>
                        ) : (
                            <span className="status-badge pending">⏳ Pendiente</span>
                        )}
                    </div>
                    {resumen?.VENDEDOR && (
                        <div className="card-details">
                            <p className="ratified-by">
                                Por: {resumen.VENDEDOR.perfiles?.nombre_completo}
                            </p>
                            <p className="ratified-date">
                                {new Date(resumen.VENDEDOR.fecha_ratificacion).toLocaleString('es-ES', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                })}
                            </p>
                            {resumen.VENDEDOR.sello_id && (
                                <p className="qtsp-badge">🔒 Sellado QTSP</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Ratification action (if user can and hasn't already) */}
            {puedeRatificar && !yaRatifico && (
                <div className="ratification-action">
                    {/* Full legal text display */}
                    <div className="legal-text-container" style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '1.25rem',
                        marginBottom: '1rem',
                        fontSize: '0.9rem',
                        lineHeight: '1.6',
                        color: '#334155'
                    }}>
                        <p style={{ marginBottom: '1rem', fontWeight: 500 }}>
                            <strong>Declaro que he revisado el documento PDF que se muestra como "Contrato de arras firmado"
                                y reconozco que corresponde al contrato que he firmado fuera de esta plataforma.</strong>
                        </p>
                        <p style={{ marginBottom: '0.75rem' }}>Confirmo que:</p>
                        <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <strong>Reconozco como propio</strong> el contenido íntegro de dicho documento y que refleja
                                fielmente el acuerdo de arras alcanzado.
                            </li>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <strong>Ratifico su validez y eficacia</strong> a todos los efectos legales como contrato
                                de arras entre la parte compradora y la parte vendedora.
                            </li>
                            <li style={{ marginBottom: '0.5rem' }}>
                                <strong>Acepto que esta ratificación electrónica quede registrada</strong> en la plataforma,
                                vinculada a mi identidad de usuario, a la fecha y hora de realización y al propio documento PDF,
                                mediante un sistema de sellado de tiempo cualificado proporcionado por un prestador cualificado
                                de servicios de confianza.
                            </li>
                            <li>
                                Entiendo que esta actuación <strong>no sustituye</strong> a la firma manuscrita o electrónica
                                ya estampada en el contrato, sino que la <strong>refuerza probatoriamente</strong> dentro del
                                expediente digital, facilitando su trazabilidad y acreditación en caso de discrepancia futura.
                            </li>
                        </ol>
                    </div>

                    <label className="ratification-checkbox">
                        <input
                            type="checkbox"
                            checked={aceptoTerminos}
                            onChange={(e) => setAceptoTerminos(e.target.checked)}
                        />
                        <span className="checkbox-text">
                            He leído, entiendo y acepto íntegramente el texto de ratificación anterior.
                        </span>
                    </label>

                    <div className="legal-text-reference" style={{
                        fontSize: '0.75rem',
                        color: '#64748b',
                        marginTop: '0.5rem',
                        marginBottom: '1rem'
                    }}>
                        Referencia: {RATIFICATION_TEXT_ID} v{RATIFICATION_TEXT_VERSION}
                    </div>

                    <button
                        type="button"
                        className={`btn btn-ratify ${aceptoTerminos ? 'enabled' : 'disabled'}`}
                        onClick={handleRatificar}
                        disabled={!aceptoTerminos || ratificando}
                    >
                        {ratificando ? (
                            <>
                                <span className="spinner"></span>
                                Ratificando...
                            </>
                        ) : (
                            <>
                                ✍️ Ratificar como {rolActual === 'COMPRADOR' ? 'Parte Compradora' : 'Parte Vendedora'}
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Completion banner */}
            {resumen?.todasCompletas && (
                <div className="ratification-complete-banner">
                    🎉 ¡Documento ratificado por ambas partes! El contrato ha sido perfeccionado.
                </div>
            )}

            {/* Waiting message for non-parties */}
            {!puedeRatificar && !resumen?.todasCompletas && (
                <div className="ratification-waiting">
                    <span>👀</span>
                    <span>Esperando ratificación de las partes principales</span>
                </div>
            )}

            {error && (
                <div className="ratification-error">
                    <span>⚠️</span> {error}
                </div>
            )}

            {/* Document hash reference */}
            <div className="document-hash-info">
                <span className="hash-label">Hash SHA-256:</span>
                <code className="hash-value">{documentoSha256.substring(0, 16)}...{documentoSha256.substring(documentoSha256.length - 16)}</code>
            </div>
        </div>
    );
};
