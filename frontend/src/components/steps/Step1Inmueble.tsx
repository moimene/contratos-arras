import React, { useState } from 'react';
import { useContract } from '../../context/ContractContext';

export const Step1Inmueble: React.FC = () => {
    const { inmueble, updateInmueble, setCurrentStep } = useContract();

    const [formData, setFormData] = useState({
        direccion_completa: inmueble.direccion_completa || '',
        codigo_postal: inmueble.codigo_postal || '',
        ciudad: inmueble.ciudad || '',
        provincia: inmueble.provincia || '',
        referencia_catastral: inmueble.referencia_catastral || '',
        datos_registrales: inmueble.datos_registrales || '',
        m2: inmueble.m2 || 0,
        habitaciones: inmueble.habitaciones || 0,
        banos: inmueble.banos || 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'm2' || name === 'habitaciones' || name === 'banos'
                ? Number(value)
                : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateInmueble(formData);
        setCurrentStep(2);
    };

    return (
        <div className="step-container">
            <h2 className="step-title">📍 Paso 1: Datos del Inmueble</h2>
            <p className="step-description">
                Introduce los datos de la vivienda objeto del contrato de arras.
            </p>

            <form onSubmit={handleSubmit} className="step-form">
                <div className="form-section">
                    <h3>Ubicación</h3>

                    <div className="form-group">
                        <label htmlFor="direccion_completa">
                            Dirección Completa <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="direccion_completa"
                            name="direccion_completa"
                            value={formData.direccion_completa}
                            onChange={handleChange}
                            required
                            placeholder="Ej: Paseo de la Castellana, 123, 4º A"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="codigo_postal">Código Postal</label>
                            <input
                                type="text"
                                id="codigo_postal"
                                name="codigo_postal"
                                value={formData.codigo_postal}
                                onChange={handleChange}
                                placeholder="28046"
                                maxLength={5}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="ciudad">
                                Ciudad <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="ciudad"
                                name="ciudad"
                                value={formData.ciudad}
                                onChange={handleChange}
                                required
                                placeholder="Madrid"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="provincia">
                                Provincia <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="provincia"
                                name="provincia"
                                value={formData.provincia}
                                onChange={handleChange}
                                required
                                placeholder="Madrid"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3>Datos Registrales y Catastrales</h3>

                    <div className="form-group">
                        <label htmlFor="referencia_catastral">Referencia Catastral</label>
                        <input
                            type="text"
                            id="referencia_catastral"
                            name="referencia_catastral"
                            value={formData.referencia_catastral}
                            onChange={handleChange}
                            placeholder="1234567VK4812N0001AB"
                        />
                        <small>Puedes encontrarla en el recibo del IBI</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="datos_registrales">Datos Registrales</label>
                        <textarea
                            id="datos_registrales"
                            name="datos_registrales"
                            value={formData.datos_registrales}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Ej: Registro de la Propiedad nº 3 de Madrid, Tomo 2456, Libro 789, Folio 123, Finca 45678"
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h3>Características</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="m2">Metros Cuadrados (m²)</label>
                            <input
                                type="number"
                                id="m2"
                                name="m2"
                                value={formData.m2 || ''}
                                onChange={handleChange}
                                min="0"
                                placeholder="120"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="habitaciones">Habitaciones</label>
                            <input
                                type="number"
                                id="habitaciones"
                                name="habitaciones"
                                value={formData.habitaciones || ''}
                                onChange={handleChange}
                                min="0"
                                placeholder="3"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="banos">Baños</label>
                            <input
                                type="number"
                                id="banos"
                                name="banos"
                                value={formData.banos || ''}
                                onChange={handleChange}
                                min="0"
                                placeholder="2"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                        Continuar →
                    </button>
                </div>
            </form>
        </div>
    );
};
