import React, { useState, useEffect } from 'react';
import { useContract } from '../../context/ContractContext';

interface Conyuge {
    nombre: string;
    apellidos: string;
    tipo_documento: string;
    numero_documento: string;
    comparecera: boolean;
}

interface PersonaFisica {
    id?: string;
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

interface PersonaJuridica {
    id?: string;
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

type Parte = PersonaFisica | PersonaJuridica;

export const Step3Partes: React.FC = () => {
    const { compradores, vendedores, addComprador, addVendedor, removeComprador, removeVendedor, setCurrentStep } = useContract();

    const [showCompradorForm, setShowCompradorForm] = useState(false);
    const [showVendedorForm, setShowVendedorForm] = useState(false);
    const [editingCompradorIndex, setEditingCompradorIndex] = useState<number | null>(null);
    const [editingVendedorIndex, setEditingVendedorIndex] = useState<number | null>(null);

    // Toggle tipo persona
    const [tipoCompradorForm, setTipoCompradorForm] = useState<'PERSONA_FISICA' | 'PERSONA_JURIDICA'>('PERSONA_FISICA');
    const [tipoVendedorForm, setTipoVendedorForm] = useState<'PERSONA_FISICA' | 'PERSONA_JURIDICA'>('PERSONA_FISICA');

    const [formComprador, setFormComprador] = useState<PersonaFisica>({
        tipo: 'PERSONA_FISICA',
        rol: 'COMPRADOR',
        nombre: '',
        apellidos: '',
        tipo_documento: 'DNI',
        numero_documento: '',
        email: '',
        telefono: '',
        domicilio: '',
        estado_civil: 'SOLTERO',
        vivienda_habitual: false,
        requiere_consentimiento_conyuge: false,
        porcentaje: 100,
        obligado_aceptar: true,
        obligado_firmar: true,
    });

    const [formVendedor, setFormVendedor] = useState<PersonaFisica>({
        tipo: 'PERSONA_FISICA',
        rol: 'VENDEDOR',
        nombre: '',
        apellidos: '',
        tipo_documento: 'DNI',
        numero_documento: '',
        email: '',
        telefono: '',
        domicilio: '',
        estado_civil: 'SOLTERO',
        vivienda_habitual: false,
        requiere_consentimiento_conyuge: false,
        porcentaje: 100,
        obligado_aceptar: true,
        obligado_firmar: true,
    });

    // Auto-sugerir consentimiento conyugal
    useEffect(() => {
        if (formComprador.estado_civil === 'CASADO') {
            if (formComprador.regimen_economico === 'GANANCIALES') {
                setFormComprador(prev => ({ ...prev, requiere_consentimiento_conyuge: true }));
            } else if (formComprador.vivienda_habitual) {
                setFormComprador(prev => ({ ...prev, requiere_consentimiento_conyuge: true }));
            }
        } else {
            setFormComprador(prev => ({ ...prev, requiere_consentimiento_conyuge: false }));
        }
    }, [formComprador.estado_civil, formComprador.regimen_economico, formComprador.vivienda_habitual]);

    useEffect(() => {
        if (formVendedor.estado_civil === 'CASADO') {
            if (formVendedor.regimen_economico === 'GANANCIALES') {
                setFormVendedor(prev => ({ ...prev, requiere_consentimiento_conyuge: true }));
            } else if (formVendedor.vivienda_habitual) {
                setFormVendedor(prev => ({ ...prev, requiere_consentimiento_conyuge: true }));
            }
        } else {
            setFormVendedor(prev => ({ ...prev, requiere_consentimiento_conyuge: false }));
        }
    }, [formVendedor.estado_civil, formVendedor.regimen_economico, formVendedor.vivienda_habitual]);

    const handleChangeComprador = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (name.startsWith('conyuge.')) {
            const field = name.split('.')[1];
            setFormComprador(prev => ({
                ...prev,
                conyuge: {
                    ...prev.conyuge,
                    [field]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
                } as Conyuge
            }));
        } else {
            setFormComprador(prev => ({
                ...prev,
                [name]: type === 'number' ? Number(value) :
                    type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                        value
            }));
        }
    };

    const handleChangeVendedor = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (name.startsWith('conyuge.')) {
            const field = name.split('.')[1];
            setFormVendedor(prev => ({
                ...prev,
                conyuge: {
                    ...prev.conyuge,
                    [field]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
                } as Conyuge
            }));
        } else {
            setFormVendedor(prev => ({
                ...prev,
                [name]: type === 'number' ? Number(value) :
                    type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                        value
            }));
        }
    };

    const handleAddComprador = () => {
        if (!formComprador.nombre || !formComprador.apellidos || !formComprador.numero_documento || !formComprador.email) {
            alert('Completa los campos obligatorios: Nombre, Apellidos, Nº Documento y Email.');
            return;
        }

        if (formComprador.requiere_consentimiento_conyuge && (!formComprador.conyuge?.nombre || !formComprador.conyuge?.numero_documento)) {
            if (!confirm('Se requiere consentimiento del cónyuge pero no has completado sus datos. ¿Deseas continuar?')) {
                return;
            }
        }

        if (editingCompradorIndex !== null) {
            // Update existing
            const updated = [...compradores];
            updated[editingCompradorIndex] = formComprador as any;
            // Would need updateCompradores function
            setEditingCompradorIndex(null);
        } else {
            addComprador(formComprador as any);
        }

        resetCompradorForm();
        setShowCompradorForm(false);
    };

    const handleAddVendedor = () => {
        if (!formVendedor.nombre || !formVendedor.apellidos || !formVendedor.numero_documento || !formVendedor.email) {
            alert('Completa los campos obligatorios: Nombre, Apellidos, Nº Documento y Email.');
            return;
        }

        if (formVendedor.requiere_consentimiento_conyuge && (!formVendedor.conyuge?.nombre || !formVendedor.conyuge?.numero_documento)) {
            if (!confirm('Se requiere consentimiento del cónyuge pero no has completado sus datos. ¿Deseas continuar?')) {
                return;
            }
        }

        if (editingVendedorIndex !== null) {
            setEditingVendedorIndex(null);
        } else {
            addVendedor(formVendedor as any);
        }

        resetVendedorForm();
        setShowVendedorForm(false);
    };

    const resetCompradorForm = () => {
        setFormComprador({
            tipo: 'PERSONA_FISICA',
            rol: 'COMPRADOR',
            nombre: '',
            apellidos: '',
            tipo_documento: 'DNI',
            numero_documento: '',
            email: '',
            telefono: '',
            domicilio: '',
            estado_civil: 'SOLTERO',
            vivienda_habitual: false,
            requiere_consentimiento_conyuge: false,
            porcentaje: 100,
            obligado_aceptar: true,
            obligado_firmar: true,
        });
    };

    const resetVendedorForm = () => {
        setFormVendedor({
            tipo: 'PERSONA_FISICA',
            rol: 'VENDEDOR',
            nombre: '',
            apellidos: '',
            tipo_documento: 'DNI',
            numero_documento: '',
            email: '',
            telefono: '',
            domicilio: '',
            estado_civil: 'SOLTERO',
            vivienda_habitual: false,
            requiere_consentimiento_conyuge: false,
            porcentaje: 100,
            obligado_aceptar: true,
            obligado_firmar: true,
        });
    };

    const getConsentimientoSugerencia = (estadoCivil?: string, regimen?: string, viviendaHabitual?: boolean) => {
        if (estadoCivil !== 'CASADO') return null;

        if (regimen === 'GANANCIALES') {
            return '⚠️ En régimen de gananciales, salvo pacto, se requiere consentimiento del cónyuge para disponer.';
        }

        if (viviendaHabitual) {
            return 'ℹ️ Si la vivienda es habitual, puede requerirse consentimiento del cónyuge (art. 1320 CC).';
        }

        return null;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (compradores.length === 0 || vendedores.length === 0) {
            alert('Debes añadir al menos un comprador y un vendedor.');
            return;
        }

        // Validate percentages
        const sumCompradores = compradores.reduce((sum: number, c: any) => sum + (c.porcentaje || 0), 0);
        const sumVendedores = vendedores.reduce((sum: number, v: any) => sum + (v.porcentaje || 0), 0);

        if (Math.abs(sumCompradores - 100) > 0.01) {
            if (!confirm(`Los porcentajes de compradores suman ${sumCompradores.toFixed(2)}%. ¿Deseas continuar de todos modos?`)) {
                return;
            }
        }

        if (Math.abs(sumVendedores - 100) > 0.01) {
            if (!confirm(`Los porcentajes de vendedores suman ${sumVendedores.toFixed(2)}%. ¿Deseas continuar de todos modos?`)) {
                return;
            }
        }

        setCurrentStep(4);
    };

    return (
        <div className="step-3-container">
            <div className="step-3-main">
                <div className="banner-warning">
                    <strong>⚠️ Esta herramienta NO es asesoramiento jurídico.</strong> Revisa los datos con un profesional antes de firmar.
                </div>

                <h2 className="step-title">👥 Paso 3: Partes del Contrato</h2>
                <p className="step-description">
                    Identifica a compradores, vendedores y terceros relacionados. Incluye datos de régimen matrimonial y representación cuando procedan.
                </p>

                <form onSubmit={handleSubmit} className="step-form">
                    {/* 1. COMPRADORES */}
                    <div className="form-section">
                        <div className="partes-header">
                            <h3>1️⃣ Compradores</h3>
                            <button type="button" onClick={() => { setShowCompradorForm(!showCompradorForm); if (!showCompradorForm) resetCompradorForm(); }} className="btn btn-secondary">
                                {showCompradorForm ? 'Cancelar' : '+ Añadir comprador'}
                            </button>
                        </div>

                        {showCompradorForm && (
                            <div className="parte-form-pf">
                                <h4>Datos del comprador (Persona física)</h4>

                                {/* Datos básicos */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Nombre <span className="required">*</span></label>
                                        <input type="text" name="nombre" value={formComprador.nombre} onChange={handleChangeComprador} required placeholder="Laura" />
                                    </div>
                                    <div className="form-group">
                                        <label>Apellidos <span className="required">*</span></label>
                                        <input type="text" name="apellidos" value={formComprador.apellidos} onChange={handleChangeComprador} required placeholder="Pérez Gómez" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Tipo de documento <span className="required">*</span></label>
                                        <select name="tipo_documento" value={formComprador.tipo_documento} onChange={handleChangeComprador} required>
                                            <option value="DNI">DNI</option>
                                            <option value="NIE">NIE</option>
                                            <option value="PASAPORTE">Pasaporte</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Nº de documento <span className="required">*</span></label>
                                        <input type="text" name="numero_documento" value={formComprador.numero_documento} onChange={handleChangeComprador} required placeholder="00000000X" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Email <span className="required">*</span></label>
                                        <input type="email" name="email" value={formComprador.email} onChange={handleChangeComprador} required placeholder="laura@example.com" />
                                    </div>
                                    <div className="form-group">
                                        <label>Teléfono (recomendado)</label>
                                        <input type="tel" name="telefono" value={formComprador.telefono} onChange={handleChangeComprador} placeholder="600000000" />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Domicilio (recomendado)</label>
                                    <input type="text" name="domicilio" value={formComprador.domicilio} onChange={handleChangeComprador} placeholder="C/ Ejemplo 1, Madrid" />
                                </div>

                                {/* Estado civil y régimen */}
                                <div className="subsection-regimen">
                                    <h5>Estado Civil y Régimen Económico</h5>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Estado civil</label>
                                            <select name="estado_civil" value={formComprador.estado_civil} onChange={handleChangeComprador}>
                                                <option value="SOLTERO">Soltero/a</option>
                                                <option value="CASADO">Casado/a</option>
                                                <option value="DIVORCIADO">Divorciado/a</option>
                                                <option value="VIUDO">Viudo/a</option>
                                                <option value="PAREJA_HECHO">Pareja de hecho</option>
                                            </select>
                                        </div>

                                        {formComprador.estado_civil === 'CASADO' && (
                                            <div className="form-group">
                                                <label>Régimen económico matrimonial</label>
                                                <select name="regimen_economico" value={formComprador.regimen_economico} onChange={handleChangeComprador}>
                                                    <option value="">Seleccionar...</option>
                                                    <option value="GANANCIALES">Sociedad de gananciales</option>
                                                    <option value="SEPARACION_BIENES">Separación de bienes</option>
                                                    <option value="PARTICIPACION">Participación (u otro)</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {formComprador.estado_civil === 'CASADO' && (
                                        <>
                                            <div className="form-group">
                                                <label>
                                                    <input type="checkbox" name="vivienda_habitual" checked={formComprador.vivienda_habitual} onChange={handleChangeComprador} />
                                                    &nbsp;¿El inmueble es vivienda habitual?
                                                </label>
                                            </div>

                                            <div className="form-group">
                                                <label>
                                                    <input type="checkbox" name="requiere_consentimiento_conyuge" checked={formComprador.requiere_consentimiento_conyuge} onChange={handleChangeComprador} />
                                                    &nbsp;¿Se requiere consentimiento del cónyuge?
                                                </label>
                                            </div>

                                            {getConsentimientoSugerencia(formComprador.estado_civil, formComprador.regimen_economico, formComprador.vivienda_habitual) && (
                                                <div className="info-box small">
                                                    <small>{getConsentimientoSugerencia(formComprador.estado_civil, formComprador.regimen_economico, formComprador.vivienda_habitual)}</small>
                                                </div>
                                            )}

                                            {formComprador.requiere_consentimiento_conyuge && (
                                                <div className="subsection-conyuge">
                                                    <h6>Datos del Cónyuge</h6>
                                                    <div className="form-row">
                                                        <div className="form-group">
                                                            <label>Nombre del cónyuge</label>
                                                            <input type="text" name="conyuge.nombre" value={formComprador.conyuge?.nombre || ''} onChange={handleChangeComprador} placeholder="Carlos" />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Apellidos del cónyuge</label>
                                                            <input type="text" name="conyuge.apellidos" value={formComprador.conyuge?.apellidos || ''} onChange={handleChangeComprador} placeholder="Ruiz" />
                                                        </div>
                                                    </div>
                                                    <div className="form-row">
                                                        <div className="form-group">
                                                            <label>Tipo de documento</label>
                                                            <select name="conyuge.tipo_documento" value={formComprador.conyuge?.tipo_documento || 'DNI'} onChange={handleChangeComprador}>
                                                                <option value="DNI">DNI</option>
                                                                <option value="NIE">NIE</option>
                                                                <option value="PASAPORTE">Pasaporte</option>
                                                            </select>
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Nº de documento</label>
                                                            <input type="text" name="conyuge.numero_documento" value={formComprador.conyuge?.numero_documento || ''} onChange={handleChangeComprador} placeholder="11111111Y" />
                                                        </div>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>
                                                            <input type="checkbox" name="conyuge.comparecera" checked={formComprador.conyuge?.comparecera || false} onChange={handleChangeComprador} />
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
                                        <input type="number" name="porcentaje" value={formComprador.porcentaje} onChange={handleChangeComprador} min="0" max="100" step="0.01" />
                                        <small>En copropiedad, el porcentaje debe sumar 100%.</small>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>
                                            <input type="checkbox" name="obligado_aceptar" checked={formComprador.obligado_aceptar} onChange={handleChangeComprador} />
                                            &nbsp;Obligado a aceptar términos
                                        </label>
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <input type="checkbox" name="obligado_firmar" checked={formComprador.obligado_firmar} onChange={handleChangeComprador} />
                                            &nbsp;Obligado a firmar
                                        </label>
                                    </div>
                                </div>

                                <button type="button" onClick={handleAddComprador} className="btn btn-primary">
                                    {editingCompradorIndex !== null ? 'Actualizar comprador' : 'Guardar comprador'}
                                </button>
                            </div>
                        )}

                        {/* Lista de compradores */}
                        <div className="partes-list">
                            {compradores.map((c: any, i: number) => (
                                <div key={i} className="parte-card-full">
                                    <div className="parte-info-full">
                                        <h4>{c.nombre} {c.apellidos}</h4>
                                        <p><strong>{c.tipo_documento}:</strong> {c.numero_documento}</p>
                                        <p><strong>Email:</strong> {c.email}</p>
                                        {c.estado_civil === 'CASADO' && <p><strong>Estado civil:</strong> Casado/a ({c.regimen_economico || 'No especificado'})</p>}
                                        {c.requiere_consentimiento_conyuge && <p className="warning-text">⚠️ Requiere consentimiento del cónyuge</p>}
                                        <p><strong>Participación:</strong> {c.porcentaje}%</p>
                                        <div className="flags">
                                            {c.obligado_aceptar && <span className="flag-badge">Acepta</span>}
                                            {c.obligado_firmar && <span className="flag-badge">Firma</span>}
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeComprador(i)} className="btn-remove">🗑️</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. VENDEDORES - MISMA ESTRUCTURA */}
                    <div className="form-section">
                        <div className="partes-header">
                            <h3>2️⃣ Vendedores</h3>
                            <button type="button" onClick={() => { setShowVendedorForm(!showVendedorForm); if (!showVendedorForm) resetVendedorForm(); }} className="btn btn-secondary">
                                {showVendedorForm ? 'Cancelar' : '+ Añadir vendedor'}
                            </button>
                        </div>

                        {showVendedorForm && (
                            <div className="parte-form-pf">
                                <h4>Datos del vendedor (Persona física)</h4>

                                {/* Repetir estructura similar para vendedor */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Nombre <span className="required">*</span></label>
                                        <input type="text" name="nombre" value={formVendedor.nombre} onChange={handleChangeVendedor} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Apellidos <span className="required">*</span></label>
                                        <input type="text" name="apellidos" value={formVendedor.apellidos} onChange={handleChangeVendedor} required />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Tipo de documento <span className="required">*</span></label>
                                        <select name="tipo_documento" value={formVendedor.tipo_documento} onChange={handleChangeVendedor} required>
                                            <option value="DNI">DNI</option>
                                            <option value="NIE">NIE</option>
                                            <option value="PASAPORTE">Pasaporte</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Nº de documento <span className="required">*</span></label>
                                        <input type="text" name="numero_documento" value={formVendedor.numero_documento} onChange={handleChangeVendedor} required />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Email <span className="required">*</span></label>
                                        <input type="email" name="email" value={formVendedor.email} onChange={handleChangeVendedor} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Teléfono</label>
                                        <input type="tel" name="telefono" value={formVendedor.telefono} onChange={handleChangeVendedor} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Domicilio</label>
                                    <input type="text" name="domicilio" value={formVendedor.domicilio} onChange={handleChangeVendedor} />
                                </div>

                                {/* Estado civil - igual que comprador */}
                                <div className="subsection-regimen">
                                    <h5>Estado Civil y Régimen Económico</h5>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Estado civil</label>
                                            <select name="estado_civil" value={formVendedor.estado_civil} onChange={handleChangeVendedor}>
                                                <option value="SOLTERO">Soltero/a</option>
                                                <option value="CASADO">Casado/a</option>
                                                <option value="DIVORCIADO">Divorciado/a</option>
                                                <option value="VIUDO">Viudo/a</option>
                                                <option value="PAREJA_HECHO">Pareja de hecho</option>
                                            </select>
                                        </div>

                                        {formVendedor.estado_civil === 'CASADO' && (
                                            <div className="form-group">
                                                <label>Régimen económico</label>
                                                <select name="regimen_economico" value={formVendedor.regimen_economico} onChange={handleChangeVendedor}>
                                                    <option value="">Seleccionar...</option>
                                                    <option value="GANANCIALES">Sociedad de gananciales</option>
                                                    <option value="SEPARACION_BIENES">Separación de bienes</option>
                                                    <option value="PARTICIPACION">Participación (u otro)</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {formVendedor.estado_civil === 'CASADO' && (
                                        <>
                                            <div className="form-group">
                                                <label>
                                                    <input type="checkbox" name="vivienda_habitual" checked={formVendedor.vivienda_habitual} onChange={handleChangeVendedor} />
                                                    &nbsp;¿El inmueble es vivienda habitual?
                                                </label>
                                            </div>

                                            <div className="form-group">
                                                <label>
                                                    <input type="checkbox" name="requiere_consentimiento_conyuge" checked={formVendedor.requiere_consentimiento_conyuge} onChange={handleChangeVendedor} />
                                                    &nbsp;¿Se requiere consentimiento del cónyuge?
                                                </label>
                                            </div>

                                            {getConsentimientoSugerencia(formVendedor.estado_civil, formVendedor.regimen_economico, formVendedor.vivienda_habitual) && (
                                                <div className="info-box small">
                                                    <small>{getConsentimientoSugerencia(formVendedor.estado_civil, formVendedor.regimen_economico, formVendedor.vivienda_habitual)}</small>
                                                </div>
                                            )}

                                            {formVendedor.requiere_consentimiento_conyuge && (
                                                <div className="subsection-conyuge">
                                                    <h6>Datos del Cónyuge</h6>
                                                    <div className="form-row">
                                                        <div className="form-group">
                                                            <label>Nombre</label>
                                                            <input type="text" name="conyuge.nombre" value={formVendedor.conyuge?.nombre || ''} onChange={handleChangeVendedor} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Apellidos</label>
                                                            <input type="text" name="conyuge.apellidos" value={formVendedor.conyuge?.apellidos || ''} onChange={handleChangeVendedor} />
                                                        </div>
                                                    </div>
                                                    <div className="form-row">
                                                        <div className="form-group">
                                                            <label>Tipo documento</label>
                                                            <select name="conyuge.tipo_documento" value={formVendedor.conyuge?.tipo_documento || 'DNI'} onChange={handleChangeVendedor}>
                                                                <option value="DNI">DNI</option>
                                                                <option value="NIE">NIE</option>
                                                                <option value="PASAPORTE">Pasaporte</option>
                                                            </select>
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Nº documento</label>
                                                            <input type="text" name="conyuge.numero_documento" value={formVendedor.conyuge?.numero_documento || ''} onChange={handleChangeVendedor} />
                                                        </div>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>
                                                            <input type="checkbox" name="conyuge.comparecera" checked={formVendedor.conyuge?.comparecera || false} onChange={handleChangeVendedor} />
                                                            &nbsp;El cónyuge comparecerá
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Porcentaje (%)</label>
                                        <input type="number" name="porcentaje" value={formVendedor.porcentaje} onChange={handleChangeVendedor} min="0" max="100" step="0.01" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>
                                            <input type="checkbox" name="obligado_aceptar" checked={formVendedor.obligado_aceptar} onChange={handleChangeVendedor} />
                                            &nbsp;Obligado a aceptar
                                        </label>
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <input type="checkbox" name="obligado_firmar" checked={formVendedor.obligado_firmar} onChange={handleChangeVendedor} />
                                            &nbsp;Obligado a firmar
                                        </label>
                                    </div>
                                </div>

                                <button type="button" onClick={handleAddVendedor} className="btn btn-primary">
                                    Guardar vendedor
                                </button>
                            </div>
                        )}

                        {/* Lista vendedores */}
                        <div className="partes-list">
                            {vendedores.map((v: any, i: number) => (
                                <div key={i} className="parte-card-full">
                                    <div className="parte-info-full">
                                        <h4>{v.nombre} {v.apellidos}</h4>
                                        <p><strong>{v.tipo_documento}:</strong> {v.numero_documento}</p>
                                        <p><strong>Email:</strong> {v.email}</p>
                                        {v.estado_civil === 'CASADO' && <p><strong>Estado civil:</strong> Casado/a ({v.regimen_economico || 'No especificado'})</p>}
                                        {v.requiere_consentimiento_conyuge && <p className="warning-text">⚠️ Requiere consentimiento del cónyuge</p>}
                                        <p><strong>Participación:</strong> {v.porcentaje}%</p>
                                        <div className="flags">
                                            {v.obligado_aceptar && <span className="flag-badge">Acepta</span>}
                                            {v.obligado_firmar && <span className="flag-badge">Firma</span>}
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeVendedor(i)} className="btn-remove">🗑️</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Form actions */}
                    <div className="form-actions">
                        <button type="button" onClick={() => setCurrentStep(2)} className="btn btn-secondary">
                            ← Atrás
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Continuar →
                        </button>
                    </div>
                </form>
            </div>

            {/* SIDEBAR */}
            <div className="step-3-sidebar">
                <div className="sidebar-card">
                    <h4>👥 Intervinientes</h4>

                    <div className="sidebar-section">
                        <strong>Compradores ({compradores.length})</strong>
                        {compradores.length === 0 ? (
                            <p className="text-muted">Ninguno añadido</p>
                        ) : (
                            compradores.map((c: any, i: number) => (
                                <div key={i} className="sidebar-parte">
                                    <p>{c.nombre} {c.apellidos}</p>
                                    <small>{c.porcentaje}%</small>
                                    {c.requiere_consentimiento_conyuge && <small className="warning-text">⚠️ Cónyuge</small>}
                                </div>
                            ))
                        )}
                        {compradores.length > 0 && (
                            <p className="total-porcentaje">
                                Total: {compradores.reduce((sum: number, c: any) => sum + (c.porcentaje || 0), 0).toFixed(2)}%
                                {Math.abs(compradores.reduce((sum: number, c: any) => sum + (c.porcentaje || 0), 0) - 100) > 0.01 && ' ⚠️'}
                            </p>
                        )}
                    </div>

                    <div className="sidebar-section">
                        <strong>Vendedores ({vendedores.length})</strong>
                        {vendedores.length === 0 ? (
                            <p className="text-muted">Ninguno añadido</p>
                        ) : (
                            vendedores.map((v: any, i: number) => (
                                <div key={i} className="sidebar-parte">
                                    <p>{v.nombre} {v.apellidos}</p>
                                    <small>{v.porcentaje}%</small>
                                    {v.requiere_consentimiento_conyuge && <small className="warning-text">⚠️ Cónyuge</small>}
                                </div>
                            ))
                        )}
                        {vendedores.length > 0 && (
                            <p className="total-porcentaje">
                                Total: {vendedores.reduce((sum: number, v: any) => sum + (v.porcentaje || 0), 0).toFixed(2)}%
                                {Math.abs(vendedores.reduce((sum: number, v: any) => sum + (v.porcentaje || 0), 0) - 100) > 0.01 && ' ⚠️'}
                            </p>
                        )}
                    </div>

                    {(compradores.length === 0 || vendedores.length === 0) && (
                        <div className="sidebar-alert">
                            <small>⚠️ Añade al menos un comprador y un vendedor</small>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
