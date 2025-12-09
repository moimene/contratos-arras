import React, { useState } from 'react';
import { useContract } from '../../context/ContractContext';
import { isTerritorioForal, getForalRegion, getForalRegionDisplayName, getForalImplications } from '../../utils/foralTerritories';
import DocumentosStep from '../GestorDocumental/DocumentosStep';

interface Anexo {
    id?: string;
    tipo: 'PLAZA_GARAJE' | 'TRASTERO' | 'OTRA_VIVIENDA';
    ubicacion: string;
    superficie?: number;
    referencia_catastral?: string;
    rp_numero?: string;
    finca_numero?: string;
    cru_idufir?: string;
    vinculacion?: 'OB_REM' | 'INDEPENDIENTE';
    descripcion?: string;
}

export const Step1Inmueble: React.FC = () => {
    const { inmueble, updateInmueble, setCurrentStep, contrato, contratoId } = useContract();

    const [formData, setFormData] = useState({
        // Ubicación básica
        direccion_completa: inmueble.direccion_completa || '',
        codigo_postal: inmueble.codigo_postal || '',
        ciudad: inmueble.ciudad || '',
        provincia: inmueble.provincia || '',
        portal: '',
        piso: '',
        puerta: '',
        url_anuncio: '',

        // Catastro
        referencia_catastral: inmueble.referencia_catastral || '',
        uso_catastral: 'VIVIENDA',
        superficie_construida_catastro: 0,
        anio_construccion_catastro: 0,

        // Registro
        rp_numero: '',
        rp_localidad: '',
        finca_numero: '',
        cru_idufir: '',
        tomo: '',
        libro: '',
        folio: '',
        seccion: '',

        // Características
        m2: inmueble.m2 || 0,
        m2_utiles: 0,
        habitaciones: inmueble.habitaciones || 0,
        banos: inmueble.banos || 0,
        ascensor: false,
        planta: '',
        descripcion_libre: '',
    });

    const [anexos, setAnexos] = useState<Anexo[]>([]);
    const [showAnexoForm, setShowAnexoForm] = useState(false);
    const [anexoForm, setAnexoForm] = useState<Anexo>({
        tipo: 'PLAZA_GARAJE',
        ubicacion: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? Number(value) :
                type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                    value,
        }));
    };

    const handleAnexoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setAnexoForm((prev) => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value,
        }));
    };

    const handleAddAnexo = (e: React.FormEvent) => {
        e.preventDefault();
        setAnexos([...anexos, { ...anexoForm, id: Date.now().toString() }]);
        setAnexoForm({ tipo: 'PLAZA_GARAJE', ubicacion: '' });
        setShowAnexoForm(false);
    };

    const handleRemoveAnexo = (id: string) => {
        setAnexos(anexos.filter(a => a.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateInmueble({ ...formData, anexos });
        setCurrentStep(2);
    };

    const getAnexoLabel = (tipo: string) => {
        const labels = {
            PLAZA_GARAJE: '🚗 Plaza de garaje',
            TRASTERO: '📦 Trastero',
            OTRA_VIVIENDA: '🏡 Otra vivienda'
        };
        return labels[tipo as keyof typeof labels] || tipo;
    };

    return (
        <div className="step-1-container">
            <div className="step-1-main">
                <h2 className="step-title">🏠 Paso 1: Datos del Inmueble</h2>
                <p className="step-description">
                    Introduce los datos de la vivienda objeto del contrato de arras.
                </p>

                <form onSubmit={handleSubmit} className="step-form">
                    {/* 1. UBICACIÓN */}
                    <div className="form-section">
                        <h3>📍 Ubicación e Identificación Básica</h3>

                        <div className="form-group">
                            <label htmlFor="direccion_completa">
                                Dirección completa <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="direccion_completa"
                                name="direccion_completa"
                                value={formData.direccion_completa}
                                onChange={handleChange}
                                required
                                placeholder="C/ Ejemplo 12, 3ºB"
                                minLength={5}
                                maxLength={200}
                            />
                            <small>Vía y número; puedes añadir portal/escalera/piso/puerta.</small>
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
                                    placeholder="28001"
                                    pattern="[0-9]{5}"
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

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="portal">Portal / Escalera</label>
                                <input type="text" id="portal" name="portal" value={formData.portal} onChange={handleChange} placeholder="12" maxLength={20} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="piso">Piso</label>
                                <input type="text" id="piso" name="piso" value={formData.piso} onChange={handleChange} placeholder="3º" maxLength={10} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="puerta">Puerta</label>
                                <input type="text" id="puerta" name="puerta" value={formData.puerta} onChange={handleChange} placeholder="B" maxLength={10} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="url_anuncio">Enlace al anuncio</label>
                            <input type="url" id="url_anuncio" name="url_anuncio" value={formData.url_anuncio} onChange={handleChange} placeholder="https://..." />
                            <small>Para referencia informal.</small>
                        </div>
                    </div>

                    {/* FORAL TERRITORY ALERT */}
                    {contrato.modoEstandarObservatorio && formData.provincia && isTerritorioForal(formData.provincia) && (
                        <div className="foral-alert">
                            <div className="foral-alert-header">
                                <span className="foral-alert-icon">⚠️</span>
                                <h4>Territorio Foral Detectado</h4>
                            </div>
                            <div className="foral-alert-content">
                                <p className="foral-region">
                                    <strong>Región:</strong> {getForalRegionDisplayName(getForalRegion(formData.provincia)!)}
                                </p>
                                <p className="foral-implication">
                                    {getForalImplications(getForalRegion(formData.provincia)!)}
                                </p>
                                <div className="foral-alert-notice">
                                    <p>
                                        ℹ️ El <strong>Modelo Estándar del Observatorio Legaltech</strong> está diseñado para el derecho civil  común.
                                        En territorios con derecho foral, se recomienda revisión profesional para adaptar ciertas cláusulas.
                                    </p>
                                </div>
                                <div className="foral-alert-actions">
                                    <p><strong>Opciones:</strong></p>
                                    <ul>
                                        <li>✅ <strong>Continuar con el modelo estándar</strong> (válido como base, requiere revisión profesional posterior)</li>
                                        <li>🔄 <strong>Desactivar Modo Estándar</strong> y personalizar completamente (vuelve al Step 2)</li>
                                        <li>👨‍⚖️ <strong>Solicitar revisión profesional</strong> de las cláusulas afectadas antes de continuar</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. DATOS CATASTRALES */}
                    <div className="form-section">
                        <h3>📋 Datos Catastrales</h3>

                        <div className="form-group">
                            <label htmlFor="referencia_catastral">Referencia Catastral</label>
                            <input
                                type="text"
                                id="referencia_catastral"
                                name="referencia_catastral"
                                value={formData.referencia_catastral}
                                onChange={handleChange}
                                placeholder="1234567VK4513S0001AB"
                                minLength={14}
                                maxLength={20}
                            />
                            <small>Suele figurar en el recibo del IBI. Formato alfanumérico de 14–20 caracteres.</small>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="uso_catastral">Uso Catastral</label>
                                <select id="uso_catastral" name="uso_catastral" value={formData.uso_catastral} onChange={handleChange}>
                                    <option value="VIVIENDA">Vivienda</option>
                                    <option value="LOCAL">Local</option>
                                    <option value="OTROS">Otros</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="superficie_construida_catastro">Superficie construida (Catastro) m²</label>
                                <input
                                    type="number"
                                    id="superficie_construida_catastro"
                                    name="superficie_construida_catastro"
                                    value={formData.superficie_construida_catastro || ''}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="anio_construccion_catastro">Año de construcción</label>
                                <input
                                    type="number"
                                    id="anio_construccion_catastro"
                                    name="anio_construccion_catastro"
                                    value={formData.anio_construccion_catastro || ''}
                                    onChange={handleChange}
                                    min="1900"
                                    max={new Date().getFullYear()}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. DATOS REGISTRALES */}
                    <div className="form-section">
                        <h3>📜 Datos Registrales</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="rp_numero">Registro de la Propiedad nº</label>
                                <input type="text" id="rp_numero" name="rp_numero" value={formData.rp_numero} onChange={handleChange} placeholder="27" />
                            </div>

                            <div className="form-group">
                                <label htmlFor="rp_localidad">Localidad del Registro</label>
                                <input type="text" id="rp_localidad" name="rp_localidad" value={formData.rp_localidad} onChange={handleChange} placeholder="Madrid" />
                            </div>

                            <div className="form-group">
                                <label htmlFor="finca_numero">Finca registral nº</label>
                                <input type="text" id="finca_numero" name="finca_numero" value={formData.finca_numero} onChange={handleChange} placeholder="12345" />
                                <small>Número de finca en el Registro. Útil para identificar en la escritura.</small>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="cru_idufir">CRU / IDUFIR</label>
                            <input type="text" id="cru_idufir" name="cru_idufir" value={formData.cru_idufir} onChange={handleChange} placeholder="ES123...XYZ" />
                            <small>Identificador único registral si se conoce.</small>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="tomo">Tomo</label>
                                <input type="text" id="tomo" name="tomo" value={formData.tomo} onChange={handleChange} placeholder="1234" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="libro">Libro</label>
                                <input type="text" id="libro" name="libro" value={formData.libro} onChange={handleChange} placeholder="456" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="folio">Folio</label>
                                <input type="text" id="folio" name="folio" value={formData.folio} onChange={handleChange} placeholder="78" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="seccion">Sección</label>
                                <input type="text" id="seccion" name="seccion" value={formData.seccion} onChange={handleChange} placeholder="2" />
                            </div>
                        </div>

                        <div className="info-box">
                            <small>💡 Conviene indicar Finca registral y Registro si se conocen; puedes completarlos más tarde antes de la firma.</small>
                        </div>
                    </div>

                    {/* 4. CARACTERÍSTICAS */}
                    <div className="form-section">
                        <h3>✨ Características y Descripción</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="m2">Metros cuadrados (construidos) m²</label>
                                <input type="number" id="m2" name="m2" value={formData.m2 || ''} onChange={handleChange} min="0" step="0.01" />
                            </div>

                            <div className="form-group">
                                <label htmlFor="m2_utiles">Metros útiles m²</label>
                                <input type="number" id="m2_utiles" name="m2_utiles" value={formData.m2_utiles || ''} onChange={handleChange} min="0" step="0.01" />
                            </div>

                            <div className="form-group">
                                <label htmlFor="habitaciones">Habitaciones</label>
                                <input type="number" id="habitaciones" name="habitaciones" value={formData.habitaciones || ''} onChange={handleChange} min="0" />
                            </div>

                            <div className="form-group">
                                <label htmlFor="banos">Baños</label>
                                <input type="number" id="banos" name="banos" value={formData.banos || ''} onChange={handleChange} min="0" />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="ascensor">
                                    <input type="checkbox" id="ascensor" name="ascensor" checked={formData.ascensor} onChange={handleChange} />
                                    &nbsp;Ascensor
                                </label>
                            </div>

                            <div className="form-group">
                                <label htmlFor="planta">Planta</label>
                                <input type="text" id="planta" name="planta" value={formData.planta} onChange={handleChange} placeholder="3ª, bajo, ático..." maxLength={10} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="descripcion_libre">Descripción libre</label>
                            <textarea
                                id="descripcion_libre"
                                name="descripcion_libre"
                                value={formData.descripcion_libre}
                                onChange={handleChange}
                                rows={4}
                                maxLength={2000}
                                placeholder="Estado de conservación, reformas, equipamiento, vistas, ocupación, etc."
                            />
                            <small>{formData.descripcion_libre.length} / 2000 caracteres</small>
                        </div>
                    </div>

                    {/* 5. ANEXOS */}
                    <div className="form-section">
                        <div className="anexos-header">
                            <h3>🔗 Anexos Vinculados (garaje, trastero u otros)</h3>
                            <button type="button" onClick={() => setShowAnexoForm(!showAnexoForm)} className="btn btn-secondary">
                                {showAnexoForm ? 'Cancelar' : '+ Añadir anexo'}
                            </button>
                        </div>

                        {showAnexoForm && (
                            <div className="anexo-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Tipo de anexo <span className="required">*</span></label>
                                        <select name="tipo" value={anexoForm.tipo} onChange={handleAnexoChange} required>
                                            <option value="PLAZA_GARAJE">Plaza de garaje</option>
                                            <option value="TRASTERO">Trastero</option>
                                            <option value="OTRA_VIVIENDA">Otra vivienda</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Ubicación resumida</label>
                                        <input type="text" name="ubicacion" value={anexoForm.ubicacion} onChange={handleAnexoChange} placeholder="Sótano -1, plaza 27" maxLength={120} />
                                    </div>

                                    <div className="form-group">
                                        <label>Superficie m²</label>
                                        <input type="number" name="superficie" value={anexoForm.superficie || ''} onChange={handleAnexoChange} min="0" step="0.01" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Referencia catastral (anexo)</label>
                                        <input type="text" name="referencia_catastral" value={anexoForm.referencia_catastral || ''} onChange={handleAnexoChange} placeholder="1234..." />
                                    </div>

                                    <div className="form-group">
                                        <label>Finca registral nº (anexo)</label>
                                        <input type="text" name="finca_numero" value={anexoForm.finca_numero || ''} onChange={handleAnexoChange} />
                                    </div>

                                    <div className="form-group">
                                        <label>Vinculación jurídica</label>
                                        <select name="vinculacion" value={anexoForm.vinculacion || ''} onChange={handleAnexoChange}>
                                            <option value="">No especificada</option>
                                            <option value="OB_REM">Vinculación ob rem</option>
                                            <option value="INDEPENDIENTE">Independiente</option>
                                        </select>
                                        <small>Si el anexo está adscrito 'ob rem' a la vivienda.</small>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Descripción del anexo</label>
                                    <textarea name="descripcion" value={anexoForm.descripcion || ''} onChange={handleAnexoChange} rows={2} maxLength={500} placeholder="Plaza amplia junto a ascensor..." />
                                </div>

                                <button type="button" onClick={handleAddAnexo} className="btn btn-primary">Guardar anexo</button>
                            </div>
                        )}

                        {anexos.length > 0 && (
                            <div className="anexos-list">
                                {anexos.map((anexo) => (
                                    <div key={anexo.id} className="anexo-card">
                                        <div>
                                            <strong>{getAnexoLabel(anexo.tipo)}</strong>
                                            {anexo.ubicacion && <p>{anexo.ubicacion}</p>}
                                            {anexo.superficie && <p>{anexo.superficie} m²</p>}
                                            {anexo.finca_numero && <small>Finca: {anexo.finca_numero}</small>}
                                        </div>
                                        <button type="button" onClick={() => handleRemoveAnexo(anexo.id!)} className="btn-remove">🗑️</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                            Continuar →
                        </button>
                    </div>
                </form>
            </div>

            {/* RESUMEN LATERAL */}
            <div className="step-1-sidebar">
                <div className="sidebar-card">
                    <h4>🏠 Inmueble seleccionado</h4>

                    {formData.direccion_completa ? (
                        <>
                            <div className="sidebar-section">
                                <strong>Ubicación</strong>
                                <p>{formData.direccion_completa}</p>
                                <p>{formData.codigo_postal && `${formData.codigo_postal} `}{formData.ciudad}, {formData.provincia}</p>
                            </div>

                            {formData.referencia_catastral && (
                                <div className="sidebar-section">
                                    <strong>Catastro</strong>
                                    <p className="mono">{formData.referencia_catastral}</p>
                                </div>
                            )}

                            {formData.finca_numero && (
                                <div className="sidebar-section">
                                    <strong>Registro</strong>
                                    <p>RP nº {formData.rp_numero || '—'}, Finca {formData.finca_numero}</p>
                                </div>
                            )}

                            {(formData.m2 > 0 || formData.habitaciones > 0) && (
                                <div className="sidebar-section">
                                    <strong>Características</strong>
                                    <p>
                                        {formData.m2 > 0 && `${formData.m2} m²`}
                                        {formData.habitaciones > 0 && ` • ${formData.habitaciones} hab.`}
                                        {formData.banos > 0 && ` • ${formData.banos} baños`}
                                    </p>
                                </div>
                            )}

                            {anexos.length > 0 && (
                                <div className="sidebar-section">
                                    <strong>Anexos ({anexos.length})</strong>
                                    {anexos.map(a => (
                                        <p key={a.id}>{getAnexoLabel(a.tipo)} {a.ubicacion && `- ${a.ubicacion}`}</p>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-muted">Completa los datos para ver el resumen</p>
                    )}
                </div>

                {/* Documentos del inmueble */}
                {contratoId && (
                    <DocumentosStep
                        contratoId={contratoId}
                        grupo="INMUEBLE"
                    />
                )}
            </div>
        </div>
    );
};
