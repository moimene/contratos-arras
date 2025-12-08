import React from 'react';

interface Conyuge {
    nombre: string;
    apellidos: string;
    tipo_documento: string;
    numero_documento: string;
    comparecera: boolean;
}

interface PersonaFisica {
    tipo: 'PERSONA_FISICA';
    rol: 'COMPRADOR' | 'VENDEDOR';
    nombre: string;
    apellidos: string;
    tipo_documento: string;
    numero_documento: string;
    email: string;
    telefono?: string;
    domicilio?: string;
    estado_civil?: 'SOLTERO' | 'CASADO' | 'DIVORCIADO' | 'VIUDO' | 'PAREJA_HECHO';
    regimen_economico?: 'GANANCIALES' | 'SEPARACION_BIENES' | 'PARTICIPACION';
    vivienda_habitual?: boolean;
    requiere_consentimiento_conyuge?: boolean;
    conyuge?: Conyuge;
    porcentaje: number;
    obligado_aceptar: boolean;
    obligado_firmar: boolean;
}

interface FormPersonaFisicaProps {
    formData: PersonaFisica;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSubmit: () => void;
    isEditing?: boolean;
    getConsentimientoSugerencia: (estadoCivil?: string, regimen?: string, viviendaHabitual?: boolean) => string | null;
}

export const FormPersonaFisica: React.FC<FormPersonaFisicaProps> = ({
    formData,
    onChange,
    onSubmit,
    isEditing = false,
    getConsentimientoSugerencia
}) => {
    return (
        <div className="parte-form-pf">
            <h4>Datos de {formData.rol === 'COMPRADOR' ? 'comprador' : 'vendedor'} (Persona física)</h4>

            {/* Datos básicos */}
            <div className="form-row">
                <div className="form-group">
                    <label>Nombre <span className="required">*</span></label>
                    <input type="text" name="nombre" value={formData.nombre} onChange={onChange} required placeholder="Laura" />
                </div>
                <div className="form-group">
                    <label>Apellidos <span className="required">*</span></label>
                    <input type="text" name="apellidos" value={formData.apellidos} onChange={onChange} required placeholder="Pérez Gómez" />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Tipo de documento <span className="required">*</span></label>
                    <select name="tipo_documento" value={formData.tipo_documento} onChange={onChange} required>
                        <option value="DNI">DNI</option>
                        <option value="NIE">NIE</option>
                        <option value="PASAPORTE">Pasaporte</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Nº de documento <span className="required">*</span></label>
                    <input type="text" name="numero_documento" value={formData.numero_documento} onChange={onChange} required placeholder="00000000X" />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Email <span className="required">*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={onChange} required placeholder="laura@example.com" />
                </div>
                <div className="form-group">
                    <label>Teléfono (recomendado)</label>
                    <input type="tel" name="telefono" value={formData.telefono || ''} onChange={onChange} placeholder="600000000" />
                </div>
            </div>

            <div className="form-group">
                <label>Domicilio (recomendado)</label>
                <input type="text" name="domicilio" value={formData.domicilio || ''} onChange={onChange} placeholder="C/ Ejemplo 1, Madrid" />
            </div>

            {/* Estado civil y régimen */}
            <div className="subsection-regimen">
                <h5>Estado Civil y Régimen Económico</h5>

                <div className="form-row">
                    <div className="form-group">
                        <label>Estado civil</label>
                        <select name="estado_civil" value={formData.estado_civil} onChange={onChange}>
                            <option value="SOLTERO">Soltero/a</option>
                            <option value="CASADO">Casado/a</option>
                            <option value="DIVORCIADO">Divorciado/a</option>
                            <option value="VIUDO">Viudo/a</option>
                            <option value="PAREJA_HECHO">Pareja de hecho</option>
                        </select>
                    </div>

                    {formData.estado_civil === 'CASADO' && (
                        <div className="form-group">
                            <label>Régimen económico matrimonial</label>
                            <select name="regimen_economico" value={formData.regimen_economico || ''} onChange={onChange}>
                                <option value="">Seleccionar...</option>
                                <option value="GANANCIALES">Sociedad de gananciales</option>
                                <option value="SEPARACION_BIENES">Separación de bienes</option>
                                <option value="PARTICIPACION">Participación (u otro)</option>
                            </select>
                        </div>
                    )}
                </div>

                {formData.estado_civil === 'CASADO' && (
                    <>
                        <div className="form-group">
                            <label>
                                <input type="checkbox" name="vivienda_habitual" checked={formData.vivienda_habitual || false} onChange={onChange} />
                                &nbsp;¿El inmueble es vivienda habitual?
                            </label>
                        </div>

                        <div className="form-group">
                            <label>
                                <input type="checkbox" name="requiere_consentimiento_conyuge" checked={formData.requiere_consentimiento_conyuge || false} onChange={onChange} />
                                &nbsp;¿Se requiere consentimiento del cónyuge?
                            </label>
                        </div>

                        {getConsentimientoSugerencia(formData.estado_civil, formData.regimen_economico, formData.vivienda_habitual) && (
                            <div className="info-box small">
                                <small>{getConsentimientoSugerencia(formData.estado_civil, formData.regimen_economico, formData.vivienda_habitual)}</small>
                            </div>
                        )}

                        {formData.requiere_consentimiento_conyuge && (
                            <div className="subsection-conyuge">
                                <h6>Datos del Cónyuge</h6>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Nombre del cónyuge</label>
                                        <input type="text" name="conyuge.nombre" value={formData.conyuge?.nombre || ''} onChange={onChange} placeholder="Carlos" />
                                    </div>
                                    <div className="form-group">
                                        <label>Apellidos del cónyuge</label>
                                        <input type="text" name="conyuge.apellidos" value={formData.conyuge?.apellidos || ''} onChange={onChange} placeholder="Ruiz" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Tipo de documento</label>
                                        <select name="conyuge.tipo_documento" value={formData.conyuge?.tipo_documento || 'DNI'} onChange={onChange}>
                                            <option value="DNI">DNI</option>
                                            <option value="NIE">NIE</option>
                                            <option value="PASAPORTE">Pasaporte</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Nº de documento</label>
                                        <input type="text" name="conyuge.numero_documento" value={formData.conyuge?.numero_documento || ''} onChange={onChange} placeholder="11111111Y" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>
                                        <input type="checkbox" name="conyuge.comparecera" checked={formData.conyuge?.comparecera || false} onChange={onChange} />
                                        &nbsp;El cónyuge comparecerá para prestar consentimiento
                                    </label>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="info-box small">
                    <small>ℹ️ Si es vivienda habitual, puede requerirse consentimiento del cónyuge, incluso en separación de bienes.</small>
                </div>
            </div>

            {/* Porcentaje y flags */}
            <div className="form-row">
                <div className="form-group">
                    <label>Porcentaje de participación (%)</label>
                    <input type="number" name="porcentaje" value={formData.porcentaje} onChange={onChange} min="0" max="100" step="0.01" />
                    <small>En copropiedad, el porcentaje debe sumar 100%.</small>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>
                        <input type="checkbox" name="obligado_aceptar" checked={formData.obligado_aceptar} onChange={onChange} />
                        &nbsp;Obligado a aceptar términos
                    </label>
                </div>
                <div className="form-group">
                    <label>
                        <input type="checkbox" name="obligado_firmar" checked={formData.obligado_firmar} onChange={onChange} />
                        &nbsp;Obligado a firmar
                    </label>
                </div>
            </div>

            <button type="button" onClick={onSubmit} className="btn btn-primary">
                {isEditing ? 'Actualizar' : 'Guardar'} {formData.rol.toLowerCase()}
            </button>
        </div>
    );
};
