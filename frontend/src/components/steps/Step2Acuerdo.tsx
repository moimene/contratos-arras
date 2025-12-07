import React, { useState } from 'react';
import { useContract } from '../../context/ContractContext';

export const Step2Acuerdo: React.FC = () => {
    const { contrato, updateContrato, setCurrentStep } = useContract();

    const [formData, setFormData] = useState({
        tipo_arras: contrato.tipo_arras || 'PENITENCIALES',
        precio_total: contrato.precio_total || 0,
        importe_arras: contrato.importe_arras || 0,
        fecha_limite_firma_escritura: contrato.fecha_limite_firma_escritura || '',
        forma_pago_arras: contrato.forma_pago_arras || 'AL_FIRMAR',
        plazo_pago_arras_dias: contrato.plazo_pago_arras_dias || 0,
        iban_vendedor: contrato.iban_vendedor || '',
        banco_vendedor: contrato.banco_vendedor || '',
        notario_designado_nombre: contrato.notario_designado_nombre || '',
        notario_designado_direccion: contrato.notario_designado_direccion || '',
        gastos_quien: contrato.gastos_quien || 'LEY',
        via_resolucion: contrato.via_resolucion || 'JUZGADOS',
        firma_preferida: contrato.firma_preferida || 'ELECTRONICA',
        condicion_suspensiva_texto: contrato.condicion_suspensiva_texto || '',
        observaciones: contrato.observaciones || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'precio_total' || name === 'importe_arras' || name === 'plazo_pago_arras_dias'
                ? Number(value)
                : value,
        }));
    };

    const calcularPorcentajeArras = () => {
        if (formData.precio_total > 0 && formData.importe_arras > 0) {
            return ((formData.importe_arras / formData.precio_total) * 100).toFixed(2);
        }
        return '0';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateContrato(formData);
        setCurrentStep(3);
    };

    const handleBack = () => {
        setCurrentStep(1);
    };

    return (
        <div className="step-container">
            <h2 className="step-title">💰 Paso 2: Acuerdo y Condiciones Económicas</h2>
            <p className="step-description">
                Define el precio, las arras y las condiciones del contrato.
            </p>

            <form onSubmit={handleSubmit} className="step-form">
                <div className="form-section">
                    <h3>Tipo de Arras</h3>

                    <div className="form-group">
                        <label htmlFor="tipo_arras">
                            Naturaleza de las Arras <span className="required">*</span>
                        </label>
                        <select
                            id="tipo_arras"
                            name="tipo_arras"
                            value={formData.tipo_arras}
                            onChange={handleChange}
                            required
                        >
                            <option value="PENITENCIALES">
                                Penitenciales (Desistimiento con penalización)
                            </option>
                            <option value="CONFIRMATORIAS">
                                Confirmatorias (Confirman el contrato)
                            </option>
                            <option value="PENALES">
                                Penales (Indemnización por incumplimiento)
                            </option>
                        </select>
                        <small>
                            {formData.tipo_arras === 'PENITENCIALES' &&
                                'Si desiste el comprador pierde las arras; si desiste el vendedor las devuelve duplicadas.'}
                            {formData.tipo_arras === 'CONFIRMATORIAS' &&
                                'Las arras confirman el contrato. Se aplican reglas generales de incumplimiento.'}
                            {formData.tipo_arras === 'PENALES' &&
                                'Indemnización mínima en caso de incumplimiento. Permite exigir ejecución o resolución.'}
                        </small>
                    </div>
                </div>

                <div className="form-section">
                    <h3>Condiciones Económicas</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="precio_total">
                                Precio Total de Venta (€) <span className="required">*</span>
                            </label>
                            <input
                                type="number"
                                id="precio_total"
                                name="precio_total"
                                value={formData.precio_total || ''}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                                placeholder="450000"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="importe_arras">
                                Importe de las Arras (€) <span className="required">*</span>
                            </label>
                            <input
                                type="number"
                                id="importe_arras"
                                name="importe_arras"
                                value={formData.importe_arras || ''}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                                placeholder="45000"
                            />
                            {formData.precio_total > 0 && formData.importe_arras > 0 && (
                                <small className="highlight">
                                    {calcularPorcentajeArras()}% del precio total
                                </small>
                            )}
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3>Pago de las Arras</h3>

                    <div className="form-group">
                        <label htmlFor="forma_pago_arras">
                            Forma de Pago <span className="required">*</span>
                        </label>
                        <select
                            id="forma_pago_arras"
                            name="forma_pago_arras"
                            value={formData.forma_pago_arras}
                            onChange={handleChange}
                            required
                        >
                            <option value="AL_FIRMAR">En el momento de la firma del contrato</option>
                            <option value="DIFERIDO">Después de la firma del contrato</option>
                        </select>
                    </div>

                    {formData.forma_pago_arras === 'DIFERIDO' && (
                        <div className="form-group">
                            <label htmlFor="plazo_pago_arras_dias">
                                Plazo de Pago (días desde la firma) <span className="required">*</span>
                            </label>
                            <input
                                type="number"
                                id="plazo_pago_arras_dias"
                                name="plazo_pago_arras_dias"
                                value={formData.plazo_pago_arras_dias || ''}
                                onChange={handleChange}
                                required={formData.forma_pago_arras === 'DIFERIDO'}
                                min="1"
                                placeholder="7"
                            />
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="iban_vendedor">IBAN del Vendedor</label>
                            <input
                                type="text"
                                id="iban_vendedor"
                                name="iban_vendedor"
                                value={formData.iban_vendedor}
                                onChange={handleChange}
                                placeholder="ES91 2100 0418 4502 0005 1332"
                                maxLength={34}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="banco_vendedor">Banco del Vendedor</label>
                            <input
                                type="text"
                                id="banco_vendedor"
                                name="banco_vendedor"
                                value={formData.banco_vendedor}
                                onChange={handleChange}
                                placeholder="La Caixa - Oficina Castellana"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3>Escritura de Compraventa</h3>

                    <div className="form-group">
                        <label htmlFor="fecha_limite_firma_escritura">
                            Fecha Límite para Otorgar la Escritura <span className="required">*</span>
                        </label>
                        <input
                            type="date"
                            id="fecha_limite_firma_escritura"
                            name="fecha_limite_firma_escritura"
                            value={formData.fecha_limite_firma_escritura}
                            onChange={handleChange}
                            required
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="notario_designado_nombre">Notario Designado</label>
                        <input
                            type="text"
                            id="notario_designado_nombre"
                            name="notario_designado_nombre"
                            value={formData.notario_designado_nombre}
                            onChange={handleChange}
                            placeholder="Dña. María José Martínez García"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="notario_designado_direccion">Dirección del Notario</label>
                        <input
                            type="text"
                            id="notario_designado_direccion"
                            name="notario_designado_direccion"
                            value={formData.notario_designado_direccion}
                            onChange={handleChange}
                            placeholder="Calle de Serrano, 45, 28001 Madrid"
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h3>Otras Condiciones</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="gastos_quien">
                                Pago de Gastos <span className="required">*</span>
                            </label>
                            <select
                                id="gastos_quien"
                                name="gastos_quien"
                                value={formData.gastos_quien}
                                onChange={handleChange}
                                required
                            >
                                <option value="LEY">Conforme a la ley</option>
                                <option value="COMPRADOR">Por el comprador</option>
                            </select>
                            <small>
                                Ley: Vendedor paga escritura, comprador paga primera copia
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="via_resolucion">
                                Resolución de Conflictos <span className="required">*</span>
                            </label>
                            <select
                                id="via_resolucion"
                                name="via_resolucion"
                                value={formData.via_resolucion}
                                onChange={handleChange}
                                required
                            >
                                <option value="JUZGADOS">Juzgados y tribunales</option>
                                <option value="ARBITRAJE">Arbitraje notarial</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="firma_preferida">
                                Tipo de Firma <span className="required">*</span>
                            </label>
                            <select
                                id="firma_preferida"
                                name="firma_preferida"
                                value={formData.firma_preferida}
                                onChange={handleChange}
                                required
                            >
                                <option value="ELECTRONICA">Electrónica</option>
                                <option value="MANUSCRITA">Manuscrita</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="condicion_suspensiva_texto">Condición Suspensiva</label>
                        <textarea
                            id="condicion_suspensiva_texto"
                            name="condicion_suspensiva_texto"
                            value={formData.condicion_suspensiva_texto}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Ej: Sujeto a la concesión de hipoteca por importe de 360.000 EUR"
                        />
                        <small>
                            Condiciones que deben cumplirse para perfeccionar el contrato (ej: obtención de hipoteca)
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="observaciones">Observaciones y Pactos Adicionales</label>
                        <textarea
                            id="observaciones"
                            name="observaciones"
                            value={formData.observaciones}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Ej: El comprador se compromete a respetar el contrato de alquiler vigente hasta el 31/08/2025"
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={handleBack} className="btn btn-secondary">
                        ← Atrás
                    </button>
                    <button type="submit" className="btn btn-primary">
                        Continuar →
                    </button>
                </div>
            </form>
        </div>
    );
};
