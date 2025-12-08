import React, { useState, useEffect } from 'react';

interface ActaNoComparecenciaProps {
    contratoId: string;
    citaNotarialId: string;
}

interface Parte {
    id: string;
    nombre: string;
    apellidos?: string;
    rol: string;
}

export const ActaNoComparecencia: React.FC<ActaNoComparecenciaProps> = ({
    contratoId,
    citaNotarialId
}) => {
    const [partes, setPartes] = useState<Parte[]>([]);
    const [parteNoCompareciente, setParteNoCompareciente] = useState('');
    const [fechaHoraCita, setFechaHoraCita] = useState('');
    const [notaria, setNotaria] = useState('');
    const [resumenHechos, setResumenHechos] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [actaId, setActaId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        cargarDatos();
    }, [contratoId, citaNotarialId]);

    const cargarDatos = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

            // Cargar partes del contrato
            const response = await fetch(`${apiUrl}/api/contracts/${contratoId}`);
            const data = await response.json();

            if (data.success && data.data) {
                // Extraer partes
                const partesData: Parte[] = [];

                if (data.data.compradores) {
                    data.data.compradores.forEach((c: any) => {
                        partesData.push({
                            id: c.id,
                            nombre: c.nombre,
                            apellidos: c.apellidos,
                            rol: 'COMPRADOR',
                        });
                    });
                }

                if (data.data.vendedores) {
                    data.data.vendedores.forEach((v: any) => {
                        partesData.push({
                            id: v.id,
                            nombre: v.nombre,
                            apellidos: v.apellidos,
                            rol: 'VENDEDOR',
                        });
                    });
                }

                setPartes(partesData);
            }

            // Cargar datos de la cita
            const citaResponse = await fetch(`${apiUrl}/api/citas/${citaNotarialId}`);
            const citaData = await citaResponse.json();

            if (citaData.success && citaData.data) {
                setFechaHoraCita(citaData.data.fecha_hora_propuesta || citaData.data.fecha_hora_confirmada || '');
                setNotaria(citaData.data.notaria_nombre || '');
            }

        } catch (err) {
            console.error('Error cargando datos:', err);
        }
    };

    const handleGenerar = async () => {
        if (!parteNoCompareciente || !resumenHechos) {
            setError('Por favor completa todos los campos obligatorios');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

            const response = await fetch(`${apiUrl}/api/contracts/${contratoId}/acta`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    citaNotarialId,
                    parteNoComparecienteId: parteNoCompareciente,
                    fechaHoraCita: new Date(fechaHoraCita).toISOString(),
                    notaria,
                    resumenHechos,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setActaId(data.data.actaId);
            } else {
                setError(data.error || 'Error al generar acta');
            }
        } catch (err: any) {
            console.error('Error:', err);
            setError('Error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    if (success && actaId) {
        return (
            <div className="acta-success">
                <div className="success-icon">✅</div>
                <h3>Acta de No Comparecencia Generada</h3>
                <p>El acta ha sido registrada con sello de tiempo cualificado (TST).</p>

                <div className="acta-info">
                    <h4>📋 Próximos Pasos Automáticos:</h4>
                    <ol>
                        <li>✅ Acta registrada en blockchain de eventos</li>
                        <li>⏰ Notificación enviada a la parte no compareciente</li>
                        <li>⏳ Ventana de 48 horas iniciada para alegaciones</li>
                        <li>📄 Consecuencias calculadas según tipo de arras</li>
                    </ol>
                </div>

                <div className="acta-actions">
                    <button className="btn btn-primary">
                        📥 Descargar PDF del Acta
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            setSuccess(false);
                            setActaId(null);
                        }}
                    >
                        Generar Nueva Acta
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="acta-no-comparecencia-form">
            <h3>📄 Generar Acta de No Comparecencia</h3>
            <p className="form-subtitle">
                Documenta formalmente la no comparecencia de una parte a la cita notarial
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleGenerar(); }}>

                <div className="form-section">
                    <h4>⚠️ Parte No Compareciente</h4>

                    <div className="form-group">
                        <label htmlFor="parte-no-compareciente">
                            ¿Quién NO compareció? <span className="required">*</span>
                        </label>
                        <select
                            id="parte-no-compareciente"
                            value={parteNoCompareciente}
                            onChange={(e) => setParteNoCompareciente(e.target.value)}
                            required
                        >
                            <option value="">Selecciona una parte...</option>
                            {partes.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre} {p.apellidos} ({p.rol})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-section">
                    <h4>📅 Datos de la Cita</h4>

                    <div className="form-group">
                        <label htmlFor="fecha-cita">
                            Fecha y Hora de la Cita <span className="required">*</span>
                        </label>
                        <input
                            id="fecha-cita"
                            type="datetime-local"
                            value={fechaHoraCita}
                            onChange={(e) => setFechaHoraCita(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="notaria">
                            Notaría <span className="required">*</span>
                        </label>
                        <input
                            id="notaria"
                            type="text"
                            value={notaria}
                            onChange={(e) => setNotaria(e.target.value)}
                            placeholder="Ej: Notaría de Juan Pérez García"
                            required
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h4>📝 Descripción de los Hechos</h4>

                    <div className="form-group">
                        <label htmlFor="resumen-hechos">
                            Resumen de lo Ocurrido <span className="required">*</span>
                        </label>
                        <textarea
                            id="resumen-hechos"
                            value={resumenHechos}
                            onChange={(e) => setResumenHechos(e.target.value)}
                            placeholder="Describe lo sucedido: quién compareció, intentos de contacto con la parte ausente, etc."
                            rows={6}
                            required
                        />
                        <small className="help-text">
                            Este texto será incluido en el acta oficial. Sea preciso y objetivo.
                        </small>
                    </div>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="info-box" style={{ marginBottom: '1.5rem' }}>
                    <strong>⚖️ Consecuencias Automáticas:</strong>
                    <p>
                        El sistema calculará automáticamente las consecuencias legales según el tipo de arras pactado:
                    </p>
                    <ul>
                        <li><strong>Confirmatorias</strong>: Doble penalización + derecho a exigir cumplimiento</li>
                        <li><strong>Penitenciales</strong>: Pérdida de arras + resolución automática</li>
                        <li><strong>Penales</strong>: Indemnización + opción de cumplimiento o daños</li>
                    </ul>
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary btn-large"
                    >
                        {loading ? (
                            <>
                                <span className="spinner-small"></span>
                                Generando acta...
                            </>
                        ) : (
                            <>
                                📄 Generar Acta con TST
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
