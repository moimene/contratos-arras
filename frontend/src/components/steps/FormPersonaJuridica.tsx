import React from 'react';

interface PersonaJuridica {
    tipo: 'PERSONA_JURIDICA';
    rol: 'COMPRADOR' | 'VENDEDOR';
    denominacion: string;
    cif: string;
    domicilio_social?: string;
    registro_mercantil?: {
        provincia?: string;
        tomo?: string;
        libro?: string;
        folio?: string;
        hoja?: string;
    };
    representante: {
        tipo_representante: 'ADMINISTRADOR_UNICO' | 'ADMINISTRADOR_SOLIDARIO' | 'ADMINISTRADOR_MANCOMUNADO' | 'APODERADO' | 'OTRO';
        nombre: string;
        apellidos: string;
        tipo_documento: string;
        numero_documento: string;
        email: string;
        base_representacion: 'CARGO' | 'PODER';
        datos_inscripcion?: string;
        poder_notarial?: {
            notario: string;
            fecha: string;
            protocolo: string;
            facultades: string;
            vigencia: string;
        };
    };
    porcentaje: number;
    obligado_aceptar: boolean;
    obligado_firmar: boolean;
}

interface FormPersonaJuridicaProps {
    formData: PersonaJuridica;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onSubmit: () => void;
    isEditing?: boolean;
}

export const FormPersonaJuridica: React.FC<FormPersonaJuridicaProps> = ({
    formData,
    onChange,
    onSubmit,
    isEditing = false
}) => {
    return (
        <div className="parte-form-pj">
            <h4>Datos de {formData.rol === 'COMPRADOR' ? 'comprador' : 'vendedor'} (Persona jurídica)</h4>

            {/* Datos de la sociedad */}
            <div className="subsection-sociedad">
                <h5>Datos de la Sociedad</h5>

                <div className="form-row">
                    <div className="form-group">
                        <label>Denominación social <span className="required">*</span></label>
                        <input
                            type="text"
                            name="denominacion"
                            value={formData.denominacion}
                            onChange={onChange}
                            required
                            placeholder="Inmuebles Delta, S.L."
                        />
                    </div>
                    <div className="form-group">
                        <label>CIF <span className="required">*</span></label>
                        <input
                            type="text"
                            name="cif"
                            value={formData.cif}
                            onChange={onChange}
                            required
                            placeholder="B12345678"
                            pattern="[A-Z][0-9]{8}"
                        />
                        <small>Formato: 1 letra + 8 dígitos</small>
                    </div>
                </div>

                <div className="form-group">
                    <label>Domicilio social (recomendado)</label>
                    <input
                        type="text"
                        name="domicilio_social"
                        value={formData.domicilio_social || ''}
                        onChange={onChange}
                        placeholder="Av. Principal 10, Madrid"
                    />
                </div>

                <div className="subsection-registro">
                    <h6>Datos Registrales Mercantiles (recomendado)</h6>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Provincia</label>
                            <input
                                type="text"
                                name="registro_mercantil.provincia"
                                value={formData.registro_mercantil?.provincia || ''}
                                onChange={onChange}
                                placeholder="Madrid"
                            />
                        </div>
                        <div className="form-group">
                            <label>Tomo</label>
                            <input
                                type="text"
                                name="registro_mercantil.tomo"
                                value={formData.registro_mercantil?.tomo || ''}
                                onChange={onChange}
                                placeholder="12345"
                            />
                        </div>
                        <div className="form-group">
                            <label>Libro</label>
                            <input
                                type="text"
                                name="registro_mercantil.libro"
                                value={formData.registro_mercantil?.libro || ''}
                                onChange={onChange}
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Folio</label>
                            <input
                                type="text"
                                name="registro_mercantil.folio"
                                value={formData.registro_mercantil?.folio || ''}
                                onChange={onChange}
                                placeholder="67"
                            />
                        </div>
                        <div className="form-group">
                            <label>Hoja</label>
                            <input
                                type="text"
                                name="registro_mercantil.hoja"
                                value={formData.registro_mercantil?.hoja || ''}
                                onChange={onChange}
                                placeholder="M-123456"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Representante */}
            <div className="subsection-representante">
                <h5>Representación</h5>

                <div className="form-group">
                    <label>Tipo de representante <span className="required">*</span></label>
                    <select
                        name="representante.tipo_representante"
                        value={formData.representante.tipo_representante}
                        onChange={onChange}
                        required
                    >
                        <option value="ADMINISTRADOR_UNICO">Administrador único</option>
                        <option value="ADMINISTRADOR_SOLIDARIO">Administrador solidario</option>
                        <option value="ADMINISTRADOR_MANCOMUNADO">Administrador mancomunado</option>
                        <option value="APODERADO">Apoderado</option>
                        <option value="OTRO">Otro</option>
                    </select>
                </div>

                <h6>Datos del Representante (firma en nombre de la sociedad)</h6>
                <div className="form-row">
                    <div className="form-group">
                        <label>Nombre <span className="required">*</span></label>
                        <input
                            type="text"
                            name="representante.nombre"
                            value={formData.representante.nombre}
                            onChange={onChange}
                            required
                            placeholder="María"
                        />
                    </div>
                    <div className="form-group">
                        <label>Apellidos <span className="required">*</span></label>
                        <input
                            type="text"
                            name="representante.apellidos"
                            value={formData.representante.apellidos}
                            onChange={onChange}
                            required
                            placeholder="López García"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Tipo de documento <span className="required">*</span></label>
                        <select
                            name="representante.tipo_documento"
                            value={formData.representante.tipo_documento}
                            onChange={onChange}
                            required
                        >
                            <option value="DNI">DNI</option>
                            <option value="NIE">NIE</option>
                            <option value="PASAPORTE">Pasaporte</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Nº de documento <span className="required">*</span></label>
                        <input
                            type="text"
                            name="representante.numero_documento"
                            value={formData.representante.numero_documento}
                            onChange={onChange}
                            required
                            placeholder="22222222Z"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Email del representante <span className="required">*</span></label>
                    <input
                        type="email"
                        name="representante.email"
                        value={formData.representante.email}
                        onChange={onChange}
                        required
                        placeholder="maria.lopez@delta.es"
                    />
                </div>

                {/* Base de representación */}
                <div className="subsection-base-representacion">
                    <h6>Base de la Representación</h6>
                    <div className="form-group">
                        <label>
                            <input
                                type="radio"
                                name="representante.base_representacion"
                                value="CARGO"
                                checked={formData.representante.base_representacion === 'CARGO'}
                                onChange={onChange}
                            />
                            &nbsp;Por cargo (administrador con inscripción)
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="representante.base_representacion"
                                value="PODER"
                                checked={formData.representante.base_representacion === 'PODER'}
                                onChange={onChange}
                            />
                            &nbsp;Por poder notarial
                        </label>
                    </div>

                    {formData.representante.base_representacion === 'CARGO' && (
                        <div className="form-group">
                            <label>Datos inscripción del cargo</label>
                            <input
                                type="text"
                                name="representante.datos_inscripcion"
                                value={formData.representante.datos_inscripcion || ''}
                                onChange={onChange}
                                placeholder="Nombrado administrador según inscripción X del Registro Mercantil..."
                            />
                        </div>
                    )}

                    {formData.representante.base_representacion === 'PODER' && (
                        <div className="subsection-poder">
                            <h6>Poder Notarial</h6>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Notario autorizante</label>
                                    <input
                                        type="text"
                                        name="representante.poder_notarial.notario"
                                        value={formData.representante.poder_notarial?.notario || ''}
                                        onChange={onChange}
                                        placeholder="D. Juan Notario"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fecha del poder</label>
                                    <input
                                        type="date"
                                        name="representante.poder_notarial.fecha"
                                        value={formData.representante.poder_notarial?.fecha || ''}
                                        onChange={onChange}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nº de protocolo</label>
                                    <input
                                        type="text"
                                        name="representante.poder_notarial.protocolo"
                                        value={formData.representante.poder_notarial?.protocolo || ''}
                                        onChange={onChange}
                                        placeholder="2.345"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Vigencia</label>
                                    <input
                                        type="text"
                                        name="representante.poder_notarial.vigencia"
                                        value={formData.representante.poder_notarial?.vigencia || ''}
                                        onChange={onChange}
                                        placeholder="No revocado"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Facultades conferidas</label>
                                <textarea
                                    name="representante.poder_notarial.facultades"
                                    value={formData.representante.poder_notarial?.facultades || ''}
                                    onChange={onChange}
                                    rows={3}
                                    placeholder="Compraventa de inmuebles, cobro de arras, otorgamiento de escritura pública..."
                                    maxLength={500}
                                />
                                <small>{(formData.representante.poder_notarial?.facultades || '').length} / 500 caracteres</small>
                            </div>

                            <div className="info-box small">
                                <small>⚠️ Verifica que las facultades de representación incluyen expresamente 'compraventa' y 'cobro de arras'.</small>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Porcentaje y flags */}
            <div className="form-row">
                <div className="form-group">
                    <label>Porcentaje de participación (%)</label>
                    <input
                        type="number"
                        name="porcentaje"
                        value={formData.porcentaje}
                        onChange={onChange}
                        min="0"
                        max="100"
                        step="0.01"
                    />
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
                        &nbsp;Obligado a firmar (la firma material la realiza el representante)
                    </label>
                </div>
            </div>

            <button type="button" onClick={onSubmit} className="btn btn-primary">
                {isEditing ? 'Actualizar' : 'Guardar'} {formData.rol.toLowerCase()}
            </button>
        </div>
    );
};
