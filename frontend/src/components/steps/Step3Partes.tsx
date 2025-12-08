import React, { useState, useEffect } from 'react';
import { useContract } from '../../context/ContractContext';
import { FormPersonaFisica } from './FormPersonaFisica';
import { FormPersonaJuridica } from './FormPersonaJuridica';
import { ParteCard } from './ParteCard';

// Interfaces locales (duplicadas por simplicidad, considerar mover a types/)
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

interface TerceroRelacionado {
    id?: string;
    tipo: 'ASESOR_COMPRADOR' | 'ASESOR_VENDEDOR' | 'AGENTE' | 'NOTARIA_CONTACTO' | 'OTRO';
    nombre_razon_social: string;
    email: string;
    telefono?: string;
    numero_colegiado?: string;
    observaciones?: string;
}

type Parte = PersonaFisica | PersonaJuridica;

const getInitialPF = (rol: 'COMPRADOR' | 'VENDEDOR'): PersonaFisica => ({
    tipo: 'PERSONA_FISICA',
    rol,
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

const getInitialPJ = (rol: 'COMPRADOR' | 'VENDEDOR'): PersonaJuridica => ({
    tipo: 'PERSONA_JURIDICA',
    rol,
    denominacion: '',
    cif: '',
    domicilio_social: '',
    representante: {
        tipo_representante: 'ADMINISTRADOR_UNICO',
        nombre: '',
        apellidos: '',
        tipo_documento: 'DNI',
        numero_documento: '',
        email: '',
        base_representacion: 'CARGO',
    },
    porcentaje: 100,
    obligado_aceptar: true,
    obligado_firmar: true,
});

export const Step3Partes: React.FC = () => {
    const { compradores, vendedores, addComprador, addVendedor, removeComprador, removeVendedor, setCurrentStep } = useContract();

    const [showCompradorForm, setShowCompradorForm] = useState(false);
    const [showVendedorForm, setShowVendedorForm] = useState(false);
    const [showTerceroForm, setShowTerceroForm] = useState(false);

    // Tipo de formulario (PF o PJ)
    const [tipoCompradorForm, setTipoCompradorForm] = useState<'PERSONA_FISICA' | 'PERSONA_JURIDICA'>('PERSONA_FISICA');
    const [tipoVendedorForm, setTipoVendedorForm] = useState<'PERSONA_FISICA' | 'PERSONA_JURIDICA'>('PERSONA_FISICA');

    // Forms state
    const [formCompradorPF, setFormCompradorPF] = useState<PersonaFisica>(getInitialPF('COMPRADOR'));
    const [formCompradorPJ, setFormCompradorPJ] = useState<PersonaJuridica>(getInitialPJ('COMPRADOR'));
    const [formVendedorPF, setFormVendedorPF] = useState<PersonaFisica>(getInitialPF('VENDEDOR'));
    const [formVendedorPJ, setFormVendedorPJ] = useState<PersonaJuridica>(getInitialPJ('VENDEDOR'));

    const [terceros, setTerceros] = useState<TerceroRelacionado[]>([]);
    const [formTercero, setFormTercero] = useState<TerceroRelacionado>({
        tipo: 'ASESOR_COMPRADOR',
        nombre_razon_social: '',
        email: '',
        telefono: '',
    });

    // Auto-sugerir consentimiento conyugal para PF
    useEffect(() => {
        if (formCompradorPF.estado_civil === 'CASADO') {
            if (formCompradorPF.regimen_economico === 'GANANCIALES' || formCompradorPF.vivienda_habitual) {
                setFormCompradorPF(prev => ({ ...prev, requiere_consentimiento_conyuge: true }));
            }
        } else {
            setFormCompradorPF(prev => ({ ...prev, requiere_consentimiento_conyuge: false }));
        }
    }, [formCompradorPF.estado_civil, formCompradorPF.regimen_economico, formCompradorPF.vivienda_habitual]);

    useEffect(() => {
        if (formVendedorPF.estado_civil === 'CASADO') {
            if (formVendedorPF.regimen_economico === 'GANANCIALES' || formVendedorPF.vivienda_habitual) {
                setFormVendedorPF(prev => ({ ...prev, requiere_consentimiento_conyuge: true }));
            }
        } else {
            setFormVendedorPF(prev => ({ ...prev, requiere_consentimiento_conyuge: false }));
        }
    }, [formVendedorPF.estado_civil, formVendedorPF.regimen_economico, formVendedorPF.vivienda_habitual]);

    // Handlers PF
    const handleChangeCompradorPF = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (name.startsWith('conyuge.')) {
            const field = name.split('.')[1];
            setFormCompradorPF(prev => ({
                ...prev,
                conyuge: { ...prev.conyuge, [field]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value } as Conyuge
            }));
        } else {
            setFormCompradorPF(prev => ({
                ...prev,
                [name]: type === 'number' ? Number(value) : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
            }));
        }
    };

    const handleChangeVendedorPF = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (name.startsWith('conyuge.')) {
            const field = name.split('.')[1];
            setFormVendedorPF(prev => ({
                ...prev,
                conyuge: { ...prev.conyuge, [field]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value } as Conyuge
            }));
        } else {
            setFormVendedorPF(prev => ({
                ...prev,
                [name]: type === 'number' ? Number(value) : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
            }));
        }
    };

    // Handlers PJ
    const handleChangeCompradorPJ = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (name.startsWith('representante.')) {
            const field = name.split('.')[1];
            if (field === 'poder_notarial') {
                const subfield = name.split('.')[2];
                setFormCompradorPJ(prev => ({
                    ...prev,
                    representante: {
                        ...prev.representante,
                        poder_notarial: { ...prev.representante.poder_notarial, [subfield]: value } as any
                    }
                }));
            } else {
                setFormCompradorPJ(prev => ({
                    ...prev,
                    representante: { ...prev.representante, [field]: value }
                }));
            }
        } else if (name.startsWith('registro_mercantil.')) {
            const field = name.split('.')[1];
            setFormCompradorPJ(prev => ({
                ...prev,
                registro_mercantil: { ...prev.registro_mercantil, [field]: value }
            }));
        } else {
            setFormCompradorPJ(prev => ({
                ...prev,
                [name]: name === 'porcentaje' ? Number(value) : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
            }));
        }
    };

    const handleChangeVendedorPJ = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (name.startsWith('representante.')) {
            const field = name.split('.')[1];
            if (field === 'poder_notarial') {
                const subfield = name.split('.')[2];
                setFormVendedorPJ(prev => ({
                    ...prev,
                    representante: {
                        ...prev.representante,
                        poder_notarial: { ...prev.representante.poder_notarial, [subfield]: value } as any
                    }
                }));
            } else {
                setFormVendedorPJ(prev => ({
                    ...prev,
                    representante: { ...prev.representante, [field]: value }
                }));
            }
        } else if (name.startsWith('registro_mercantil.')) {
            const field = name.split('.')[1];
            setFormVendedorPJ(prev => ({
                ...prev,
                registro_mercantil: { ...prev.registro_mercantil, [field]: value }
            }));
        } else {
            setFormVendedorPJ(prev => ({
                ...prev,
                [name]: name === 'porcentaje' ? Number(value) : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
            }));
        }
    };

    // Submit handlers
    const handleAddComprador = () => {
        const parte = tipoCompradorForm === 'PERSONA_FISICA' ? formCompradorPF : formCompradorPJ;

        // Validations
        if (tipoCompradorForm === 'PERSONA_FISICA') {
            if (!formCompradorPF.nombre || !formCompradorPF.apellidos || !formCompradorPF.numero_documento || !formCompradorPF.email) {
                alert('Completa los campos obligatorios.');
                return;
            }
        } else {
            if (!formCompradorPJ.denominacion || !formCompradorPJ.cif || !formCompradorPJ.representante.nombre || !formCompradorPJ.representante.email) {
                alert('Completa los campos obligatorios de la sociedad y el representante.');
                return;
            }
        }

        addComprador(parte as any);
        resetCompradorForms();
        setShowCompradorForm(false);
    };

    const handleAddVendedor = () => {
        const parte = tipoVendedorForm === 'PERSONA_FISICA' ? formVendedorPF : formVendedorPJ;

        if (tipoVendedorForm === 'PERSONA_FISICA') {
            if (!formVendedorPF.nombre || !formVendedorPF.apellidos || !formVendedorPF.numero_documento || !formVendedorPF.email) {
                alert('Completa los campos obligatorios.');
                return;
            }
        } else {
            if (!formVendedorPJ.denominacion || !formVendedorPJ.cif || !formVendedorPJ.representante.nombre || !formVendedorPJ.representante.email) {
                alert('Completa los campos obligatorios de la sociedad y el representante.');
                return;
            }
        }

        addVendedor(parte as any);
        resetVendedorForms();
        setShowVendedorForm(false);
    };

    const handleAddTercero = () => {
        if (!formTercero.nombre_razon_social || !formTercero.email) {
            alert('Completa Nombre/Razón Social y Email.');
            return;
        }
        setTerceros([...terceros, { ...formTercero, id: Date.now().toString() }]);
        setFormTercero({ tipo: 'ASESOR_COMPRADOR', nombre_razon_social: '', email: '', telefono: '' });
        setShowTerceroForm(false);
    };

    const resetCompradorForms = () => {
        setFormCompradorPF(getInitialPF('COMPRADOR'));
        setFormCompradorPJ(getInitialPJ('COMPRADOR'));
    };

    const resetVendedorForms = () => {
        setFormVendedorPF(getInitialPF('VENDEDOR'));
        setFormVendedorPJ(getInitialPJ('VENDEDOR'));
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

        const sumCompradores = compradores.reduce((sum: number, c: any) => sum + (c.porcentaje || 0), 0);
        const sumVendedores = vendedores.reduce((sum: number, v: any) => sum + (v.porcentaje || 0), 0);

        if (Math.abs(sumCompradores - 100) > 0.01) {
            if (!confirm(`Los porcentajes de compradores suman ${sumCompradores.toFixed(2)}%. ¿Continuar?`)) return;
        }
        if (Math.abs(sumVendedores - 100) > 0.01) {
            if (!confirm(`Los porcentajes de vendedores suman ${sumVendedores.toFixed(2)}%. ¿Continuar?`)) return;
        }

        setCurrentStep(4);
    };

    const getTipoTerceroLabel = (tipo: string) => {
        const labels: Record<string, string> = {
            ASESOR_COMPRADOR: 'Asesor del comprador',
            ASESOR_VENDEDOR: 'Asesor del vendedor',
            AGENTE: 'Agente inmobiliario',
            NOTARIA_CONTACTO: 'Notaría de contacto',
            OTRO: 'Otro'
        };
        return labels[tipo] || tipo;
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
                            <button type="button" onClick={() => { setShowCompradorForm(!showCompradorForm); if (!showCompradorForm) resetCompradorForms(); }} className="btn btn-secondary">
                                {showCompradorForm ? 'Cancelar' : '+ Añadir comprador'}
                            </button>
                        </div>

                        {showCompradorForm && (
                            <>
                                <div className="tipo-persona-toggle">
                                    <label>
                                        <input type="radio" name="tipoComprador" value="PERSONA_FISICA" checked={tipoCompradorForm === 'PERSONA_FISICA'} onChange={() => setTipoCompradorForm('PERSONA_FISICA')} />
                                        <span>🧑 Persona física</span>
                                    </label>
                                    <label>
                                        <input type="radio" name="tipoComprador" value="PERSONA_JURIDICA" checked={tipoCompradorForm === 'PERSONA_JURIDICA'} onChange={() => setTipoCompradorForm('PERSONA_JURIDICA')} />
                                        <span>🏢 Persona jurídica (sociedad)</span>
                                    </label>
                                </div>

                                {tipoCompradorForm === 'PERSONA_FISICA' ? (
                                    <FormPersonaFisica
                                        formData={formCompradorPF}
                                        onChange={handleChangeCompradorPF}
                                        onSubmit={handleAddComprador}
                                        getConsentimientoSugerencia={getConsentimientoSugerencia}
                                    />
                                ) : (
                                    <FormPersonaJuridica
                                        formData={formCompradorPJ}
                                        onChange={handleChangeCompradorPJ}
                                        onSubmit={handleAddComprador}
                                    />
                                )}
                            </>
                        )}

                        <div className="partes-list">
                            {compradores.map((c: any, i: number) => (
                                <ParteCard key={i} parte={c} onRemove={() => removeComprador(i)} />
                            ))}
                        </div>
                    </div>

                    {/* 2. VENDEDORES */}
                    <div className="form-section">
                        <div className="partes-header">
                            <h3>2️⃣ Vendedores</h3>
                            <button type="button" onClick={() => { setShowVendedorForm(!showVendedorForm); if (!showVendedorForm) resetVendedorForms(); }} className="btn btn-secondary">
                                {showVendedorForm ? 'Cancelar' : '+ Añadir vendedor'}
                            </button>
                        </div>

                        {showVendedorForm && (
                            <>
                                <div className="tipo-persona-toggle">
                                    <label>
                                        <input type="radio" name="tipoVendedor" value="PERSONA_FISICA" checked={tipoVendedorForm === 'PERSONA_FISICA'} onChange={() => setTipoVendedorForm('PERSONA_FISICA')} />
                                        <span>🧑 Persona física</span>
                                    </label>
                                    <label>
                                        <input type="radio" name="tipoVendedor" value="PERSONA_JURIDICA" checked={tipoVendedorForm === 'PERSONA_JURIDICA'} onChange={() => setTipoVendedorForm('PERSONA_JURIDICA')} />
                                        <span>🏢 Persona jurídica (sociedad)</span>
                                    </label>
                                </div>

                                {tipoVendedorForm === 'PERSONA_FISICA' ? (
                                    <FormPersonaFisica
                                        formData={formVendedorPF}
                                        onChange={handleChangeVendedorPF}
                                        onSubmit={handleAddVendedor}
                                        getConsentimientoSugerencia={getConsentimientoSugerencia}
                                    />
                                ) : (
                                    <FormPersonaJuridica
                                        formData={formVendedorPJ}
                                        onChange={handleChangeVendedorPJ}
                                        onSubmit={handleAddVendedor}
                                    />
                                )}
                            </>
                        )}

                        <div className="partes-list">
                            {vendedores.map((v: any, i: number) => (
                                <ParteCard key={i} parte={v} onRemove={() => removeVendedor(i)} />
                            ))}
                        </div>
                    </div>

                    {/* 3. TERCEROS RELACIONADOS */}
                    <div className="form-section">
                        <div className="partes-header">
                            <h3>3️⃣ Terceros Relacionados (opcional)</h3>
                            <button type="button" onClick={() => setShowTerceroForm(!showTerceroForm)} className="btn btn-secondary">
                                {showTerceroForm ? 'Cancelar' : '+ Añadir tercero'}
                            </button>
                        </div>

                        {showTerceroForm && (
                            <div className="tercero-form">
                                <h4>Datos del tercero</h4>
                                <div className="form-group">
                                    <label>Tipo <span className="required">*</span></label>
                                    <select name="tipo" value={formTercero.tipo} onChange={(e) => setFormTercero({ ...formTercero, tipo: e.target.value as any })} required>
                                        <option value="ASESOR_COMPRADOR">Asesor del comprador</option>
                                        <option value="ASESOR_VENDEDOR">Asesor del vendedor</option>
                                        <option value="AGENTE">Agente inmobiliario</option>
                                        <option value="NOTARIA_CONTACTO">Notaría de contacto</option>
                                        <option value="OTRO">Otro</option>
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Nombre / Razón social <span className="required">*</span></label>
                                        <input type="text" value={formTercero.nombre_razon_social} onChange={(e) => setFormTercero({ ...formTercero, nombre_razon_social: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Email <span className="required">*</span></label>
                                        <input type="email" value={formTercero.email} onChange={(e) => setFormTercero({ ...formTercero, email: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Teléfono</label>
                                        <input type="tel" value={formTercero.telefono || ''} onChange={(e) => setFormTercero({ ...formTercero, telefono: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Nº colegiado (si aplica)</label>
                                        <input type="text" value={formTercero.numero_colegiado || ''} onChange={(e) => setFormTercero({ ...formTercero, numero_colegiado: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Observaciones</label>
                                    <textarea rows={2} value={formTercero.observaciones || ''} onChange={(e) => setFormTercero({ ...formTercero, observaciones: e.target.value })} maxLength={300} />
                                </div>
                                <button type="button" onClick={handleAddTercero} className="btn btn-primary">Guardar tercero</button>
                            </div>
                        )}

                        {terceros.length > 0 && (
                            <div className="terceros-list">
                                {terceros.map((t) => (
                                    <div key={t.id} className="tercero-card">
                                        <div>
                                            <strong>{getTipoTerceroLabel(t.tipo)}</strong>
                                            <p>{t.nombre_razon_social}</p>
                                            <small>{t.email} {t.telefono && `• ${t.telefono}`}</small>
                                        </div>
                                        <button type="button" onClick={() => setTerceros(terceros.filter(x => x.id !== t.id))} className="btn-remove">🗑️</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

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
                                    <p>{c.tipo === 'PERSONA_FISICA' ? `${c.nombre} ${c.apellidos}` : c.denominacion}</p>
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
                                    <p>{v.tipo === 'PERSONA_FISICA' ? `${v.nombre} ${v.apellidos}` : v.denominacion}</p>
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

                    {terceros.length > 0 && (
                        <div className="sidebar-section">
                            <strong>Terceros ({terceros.length})</strong>
                            {terceros.map((t) => (
                                <div key={t.id} className="sidebar-tercero">
                                    <small>{getTipoTerceroLabel(t.tipo)}</small>
                                    <p>{t.nombre_razon_social}</p>
                                </div>
                            ))}
                        </div>
                    )}

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
