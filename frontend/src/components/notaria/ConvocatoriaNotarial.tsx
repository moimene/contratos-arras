import React, { useState } from 'react';

interface ConvocatoriaNotarialProps {
    contratoId: string;
    onCitaCreada?: (citaId: string) => void;
}

export const ConvocatoriaNotarial: React.FC<ConvocatoriaNotarialProps> = ({
    contratoId,
    onCitaCreada
}) => {
    const [notariaNombre, setNotariaNombre] = useState('');
    const [notariaDireccion, setNotariaDireccion] = useState('');
    const [notariaTelefono, setNotariaTelefono] = useState('');
    const [fechaCita, setFechaCita] = useState('');
    const [horaCita, setHoraCita] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [notas, setNotas] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

            // Combinar fecha y hora
            const fechaHoraPropuesta = new Date(`${fechaCita}T${horaCita}`);

            const response = await fetch(`${apiUrl}/api/contracts/${contratoId}/cita-notarial`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    notariaNombre,
                    notariaDireccion,
                    notariaTelefono,
                    fechaHoraPropuesta: fechaHoraPropuesta.toISOString(),
                    mensajeConvocatoria: mensaje,
                    notas,
                    destinatarios: [], // TODO: obtener parteIds del contrato
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                if (onCitaCreada) {
                    onCitaCreada(data.citaId);
                }
            } else {
                setError(data.error || 'Error al crear convocatoria');
            }
        } catch (err: any) {
            console.error('Error:', err);
            setError('Error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="convocatoria-success">
                <div className="success-icon">✅</div>
                <h3>¡Convocatoria Creada!</h3>
                <p>La cita notarial ha sido registrada exitosamente.</p>
                <p>Se ha creado automáticamente un checklist con los documentos necesarios.</p>
            </div>
        );
    }

    return (
        <div className="convocatoria-notarial-form">
            <h3>📅 Crear Convocatoria para Firma de Escritura</h3>
            <p className="form-subtitle">
                Programa la cita en notaría y genera el checklist documental
            </p>

            <form onSubmit={handleSubmit}>
                {/* Datos de la Notaría */}
                <div className="form-section">
                    <h4>🏛️ Datos de la Notaría</h4>

                    <div className="form-group">
                        <label htmlFor="notaria-nombre">
                            Nombre de la Notaría <span className="required">*</span>
                        </label>
                        <input
                            id="notaria-nombre"
                            type="text"
                            value={notariaNombre}
                            onChange={(e) => setNotariaNombre(e.target.value)}
                            placeholder="Ej: Notaría de Juan Pérez García"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="notaria-direccion">
                            Dirección <span className="required">*</span>
                        </label>
                        <textarea
                            id="notaria-direccion"
                            value={notariaDireccion}
                            onChange={(e) => setNotariaDireccion(e.target.value)}
                            placeholder="Calle, número, código postal, ciudad"
                            rows={3}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="notaria-telefono">Teléfono</label>
                        <input
                            id="notaria-telefono"
                            type="tel"
                            value={notariaTelefono}
                            onChange={(e) => setNotariaTelefono(e.target.value)}
                            placeholder="Ej: +34 912 345 678"
                        />
                    </div>
                </div>

                {/* Fecha y Hora */}
                <div className="form-section">
                    <h4>📆 Fecha y Hora de la Cita</h4>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="fecha-cita">
                                Fecha <span className="required">*</span>
                            </label>
                            <input
                                id="fecha-cita"
                                type="date"
                                value={fechaCita}
                                onChange={(e) => setFechaCita(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="hora-cita">
                                Hora <span className="required">*</span>
                            </label>
                            <input
                                id="hora-cita"
                                type="time"
                                value={horaCita}
                                onChange={(e) => setHoraCita(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Mensaje */}
                <div className="form-section">
                    <h4>💬 Mensaje de Convocatoria</h4>

                    <div className="form-group">
                        <label htmlFor="mensaje">
                            Mensaje (se enviará a todas las partes)
                        </label>
                        <textarea
                            id="mensaje"
                            value={mensaje}
                            onChange={(e) => setMensaje(e.target.value)}
                            placeholder="Mensaje opcional para las partes..."
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="notas">Notas Internas</label>
                        <textarea
                            id="notas"
                            value={notas}
                            onChange={(e) => setNotas(e.target.value)}
                            placeholder="Notas privadas (no se envían a las partes)"
                            rows={3}
                        />
                    </div>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="form-actions">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary btn-large"
                    >
                        {loading ? (
                            <>
                                <span className="spinner-small"></span>
                                Creando convocatoria...
                            </>
                        ) : (
                            <>
                                📅 Crear Convocatoria
                            </>
                        )}
                    </button>
                </div>

                <div className="info-box" style={{ marginTop: '1.5rem' }}>
                    <strong>ℹ️ Qué sucede al crear la convocatoria:</strong>
                    <ul>
                        <li>Se registra la cita con sello de tiempo (TST)</li>
                        <li>Se crea un checklist con 13 documentos requeridos</li>
                        <li>Se notifica a todas las partes (próximamente)</li>
                        <li>El estado del contrato cambia a "CONVOCATORIA_NOTARIAL"</li>
                    </ul>
                </div>
            </form>
        </div>
    );
};
