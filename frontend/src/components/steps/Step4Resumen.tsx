import React, { useState } from 'react';
import { useContract } from '../../context/ContractContext';

export const Step4Resumen: React.FC = () => {
    const { inmueble, contrato, compradores, vendedores, submitContract, setCurrentStep } = useContract();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await submitContract();
            setCurrentStep(5);
        } catch (error) {
            alert('Error creando el contrato. Por favor, intenta de nuevo.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="step-container">
            <h2 className="step-title">📋 Paso 4: Resumen y Confirmación</h2>
            <p className="step-description">
                Revisa todos los datos antes de crear el contrato.
            </p>

            <div className="resumen-section">
                <h3>🏠 Inmueble</h3>
                <div className="resumen-card">
                    <p><strong>Dirección:</strong> {inmueble.direccion_completa}</p>
                    <p><strong>Ciudad:</strong> {inmueble.ciudad}, {inmueble.provincia}</p>
                    {inmueble.codigo_postal && <p><strong>CP:</strong> {inmueble.codigo_postal}</p>}
                    {inmueble.m2 && <p><strong>Superficie:</strong> {inmueble.m2} m²</p>}
                    {inmueble.habitaciones && <p><strong>Habitaciones:</strong> {inmueble.habitaciones}</p>}
                </div>
            </div>

            <div className="resumen-section">
                <h3>💰 Condiciones Económicas</h3>
                <div className="resumen-card">
                    <p><strong>Precio Total:</strong> {contrato.precio_total?.toLocaleString('es-ES')} €</p>
                    <p><strong>Arras:</strong> {contrato.importe_arras?.toLocaleString('es-ES')} € ({((contrato.importe_arras || 0) / (contrato.precio_total || 1) * 100).toFixed(2)}%)</p>
                    <p><strong>Tipo de Arras:</strong> {contrato.tipo_arras}</p>
                    <p><strong>Fecha Límite Escritura:</strong> {contrato.fecha_limite_firma_escritura ? new Date(contrato.fecha_limite_firma_escritura).toLocaleDateString('es-ES') : ''}</p>
                </div>
            </div>

            <div className="resumen-section">
                <h3>👥 Partes</h3>
                <div className="resumen-card">
                    <p><strong>Compradores:</strong></p>
                    <ul>
                        {compradores.map((c, i) => (
                            <li key={i}>{c.nombre} {c.apellidos} ({c.numero_documento})</li>
                        ))}
                    </ul>
                    <p><strong>Vendedores:</strong></p>
                    <ul>
                        {vendedores.map((v, i) => (
                            <li key={i}>{v.nombre} {v.apellidos} ({v.numero_documento})</li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="disclaimer-box">
                <h4>⚠️ Importante</h4>
                <p>
                    Al confirmar, se creará el contrato en el sistema. Podrás generar un PDF
                    borrador en el siguiente paso. Este borrador NO es vinculante hasta que
                    todas las partes acepten los términos y firmen electrónicamente.
                </p>
            </div>

            <div className="form-actions">
                <button type="button" onClick={() => setCurrentStep(3)} className="btn btn-secondary">
                    ← Atrás
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn btn-success"
                >
                    {loading ? 'Creando...' : '✓ Crear Contrato'}
                </button>
            </div>
        </div>
    );
};
