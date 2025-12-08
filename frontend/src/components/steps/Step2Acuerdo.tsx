import React, { useState, useEffect } from 'react';
import { useContract } from '../../context/ContractContext';
import { validateModoEstandar, getModoEstandarBlockReason } from '../../context/ContractContext';

export const Step2Acuerdo: React.FC = () => {
    const {
        contrato,
        inmueble,
        updateContrato,
        setCurrentStep,
        activarModoEstandar,
        desactivarModoEstandar
    } = useContract();

    const [formData, setFormData] = useState({
        // 1. Tipo de arras
        tipo_arras: contrato.tipo_arras || 'PENITENCIALES',

        // 2. Condiciones económicas
        precio_total: contrato.precio_total || 0,
        importe_arras: contrato.importe_arras || 0,
        moneda: 'EUR',

        // 3. Pago de arras
        forma_pago_arras: contrato.forma_pago_arras || 'AL_FIRMAR',
        plazo_pago_arras_dias: contrato.plazo_pago_arras_dias || 7,
        fecha_limite_pago_arras: contrato.fecha_limite_pago_arras || '',
        iban_vendedor: contrato.iban_vendedor || '',
        banco_vendedor: contrato.banco_vendedor || '',

        // 4. Escritura
        fecha_limite_firma_escritura: contrato.fecha_limite_firma_escritura || '',
        notario_designado_nombre: contrato.notario_designado_nombre || '',
        notario_designado_direccion: contrato.notario_designado_direccion || '',

        // 5. Otras condiciones
        gastos_quien: contrato.gastos_quien || 'LEY',
        via_resolucion: contrato.via_resolucion || 'JUZGADOS',
        firma_preferida: contrato.firma_preferida || 'ELECTRONICA',
        condicion_suspensiva_texto: contrato.condicion_suspensiva_texto || '',
        observaciones: contrato.observaciones || 'El comprador asumirá todos los impuestos y gastos asociados a la compraventa, incluidos los aranceles notariales y registrales que le correspondan y los tributos aplicables (ITP/AJD u otros), sin perjuicio de lo dispuesto por la normativa vigente.',

        // 6. Manifestaciones del vendedor
        manifestacion_cosa_cierta: false,
        manifestacion_libre_ocupantes: true,
        manifestacion_libre_cargas: true,
        manifestacion_corriente_pagos: true,
        manifestacion_certificaciones: true,
    });

    const [porcentajeArras, setPorcentajeArras] = useState(0);
    const [warnings, setWarnings] = useState<string[]>([]);

    // Estado para el modo estándar
    const [showModoEstandarModal, setShowModoEstandarModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '', actionLabel: '' });
    const [pendingChange, setPendingChange] = useState<{ field: string, value: any } | null>(null);

    // Calcular porcentaje de arras automáticamente
    useEffect(() => {
        if (formData.precio_total > 0 && formData.importe_arras >= 0) {
            const porcentaje = (formData.importe_arras / formData.precio_total) * 100;
            setPorcentajeArras(Number(porcentaje.toFixed(2)));

            // Warnings
            const newWarnings = [];
            if (porcentaje > 10) {
                newWarnings.push('⚠️ Importe de arras superior al 10% del precio; revisa si refleja la voluntad de las partes.');
            }
            if (formData.importe_arras === 0) {
                newWarnings.push('ℹ️ Sin entrega de arras. Revisa si se corresponde con el acuerdo.');
            }
            setWarnings(newWarnings);
        }
    }, [formData.precio_total, formData.importe_arras]);

    // Toggle del modo estándar
    const handleToggleModoEstandar = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isActivating = e.target.checked;

        if (isActivating) {
            // Activar modo estándar
            activarModoEstandar();
            // Actualizar formData con valores por defecto
            setFormData(prev => ({
                ...prev,
                tipo_arras: 'PENITENCIALES',
                forma_pago_arras: 'AL_FIRMAR',
                gastos_quien: 'LEY',
                via_resolucion: 'JUZGADOS',
                firma_preferida: 'ELECTRONICA'
            }));
        } else {
            // Desactivar modo estándar
            desactivarModoEstandar('Usuario desactivó manualmente el modo estándar');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        // GUARDAS DEL MODO ESTÁNDAR
        if (contrato.modoEstandarObservatorio) {
            // Detectar cambio a arras no penitenciales
            if (name === 'tipo_arras' && value !== 'PENITENCIALES') {
                setModalContent({
                    title: '⚠️ Cambio incompatible con el Modo Estándar',
                    message: `El cambio a arras ${value === 'CONFIRMATORIAS' ? 'confirmatorias' : 'penales'} no es compatible con el Modelo Estándar del Observatorio, que solo admite arras penitenciales. ¿Deseas desactivar el modo estándar y continuar con un modelo personalizado?`,
                    actionLabel: 'Sí, usar modelo personalizado'
                });
                setPendingChange({ field: name, value });
                setShowModoEstandarModal(true);
                return; // No aplicar el cambio todavía
            }

            // Otras guardas se añadirán según se implementen campos
            // (ej. con hipoteca, con arrendatarios, etc.)
        }

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? Number(value) :
                type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                    value,
        }));
    };

    // Confirmar salida del modo estándar
    const confirmarSalirModoEstandar = () => {
        if (pendingChange) {
            // Desactivar modo estándar
            desactivarModoEstandar(`Cambio a ${pendingChange.field} = ${pendingChange.value}`);

            // Aplicar el cambio pendiente
            setFormData(prev => ({
                ...prev,
                [pendingChange.field]: pendingChange.value
            }));

            setPendingChange(null);
        }
        setShowModoEstandarModal(false);
    };

    // Cancelar cambio y mantener modo estándar
    const cancelarCambio = () => {
        setPendingChange(null);
        setShowModoEstandarModal(false);
    };

    const getTipoArrasExplicacion = () => {
        const explicaciones = {
            PENITENCIALES: 'Permiten desistir antes de la escritura. Si desiste el comprador, pierde las arras; si desiste el vendedor, debe devolver el doble.',
            CONFIRMATORIAS: 'Confirman el contrato; en caso de incumplimiento, podrán exigirse el cumplimiento o la resolución con daños y perjuicios.',
            PENALES: 'Operan como cláusula penal: se fija una penalización por incumplimiento según lo pactado.'
        };
        return explicaciones[formData.tipo_arras as keyof typeof explicaciones] || '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones
        if (formData.precio_total <= 0) {
            alert('Introduce un precio total válido mayor que cero.');
            return;
        }

        if (formData.importe_arras < 0 || formData.importe_arras > formData.precio_total) {
            alert('El importe de arras debe ser mayor o igual a 0 y no superar el precio.');
            return;
        }

        if (formData.forma_pago_arras === 'POSTERIOR') {
            if (!formData.plazo_pago_arras_dias && !formData.fecha_limite_pago_arras) {
                alert('Indica un plazo (días) o una fecha límite de pago de las arras.');
                return;
            }
            if (formData.fecha_limite_pago_arras && new Date(formData.fecha_limite_pago_arras) <= new Date()) {
                alert('La fecha límite de pago debe ser posterior al día de hoy.');
                return;
            }
        }

        if (!formData.fecha_limite_firma_escritura || new Date(formData.fecha_limite_firma_escritura) <= new Date()) {
            alert('Indica una fecha límite válida para la escritura (posterior a hoy).');
            return;
        }

        updateContrato({ ...formData, porcentaje_arras_calculado: porcentajeArras });
        setCurrentStep(3);
    };

    const getPreviewText = () => {
        const precio = formData.precio_total.toLocaleString('es-ES');
        const arras = formData.importe_arras.toLocaleString('es-ES');
        const consecuencias = formData.tipo_arras === 'PENITENCIALES'
            ? 'si desiste el comprador, pierde las arras; si desiste el vendedor, devuelve el doble'
            : formData.tipo_arras === 'CONFIRMATORIAS'
                ? 'se podrá exigir el cumplimiento o la resolución con daños y perjuicios'
                : 'se aplicará la cláusula penal pactada';

        const formaPago = formData.forma_pago_arras === 'AL_FIRMAR'
            ? 'en el momento de la firma'
            : `dentro de ${formData.plazo_pago_arras_dias || 'los'} días desde la firma${formData.iban_vendedor ? `, mediante transferencia al IBAN ${formData.iban_vendedor}` : ''}`;

        return `El comprador entrega ${arras} € en concepto de arras, equivalentes al ${porcentajeArras}% del precio total de ${precio} €. Las arras son de naturaleza ${formData.tipo_arras.toLowerCase()}: ${consecuencias}. El pago de arras se realizará ${formaPago}. La escritura pública deberá otorgarse antes del ${new Date(formData.fecha_limite_firma_escritura).toLocaleDateString('es-ES')}; en ese acto se abonará el resto del precio. Los gastos se distribuyen ${formData.gastos_quien === 'LEY' ? 'conforme a la ley' : 'por el comprador'}. La resolución de conflictos se somete a ${formData.via_resolucion === 'JUZGADOS' ? 'los juzgados y tribunales' : 'arbitraje notarial'}. La firma se realizará de forma ${formData.firma_preferida.toLowerCase()}.${formData.condicion_suspensiva_texto ? ` Condición suspensiva: ${formData.condicion_suspensiva_texto}` : ''}`;
    };

    return (
        <div className="step-2-container">
            <div className="step-2-main">
                {/* MODO ESTÁNDAR OBSERVATORIO TOGGLE */}
                <div className="modo-estandar-section">
                    <label className="modo-estandar-toggle">
                        <input
                            type="checkbox"
                            checked={contrato.modoEstandarObservatorio || false}
                            onChange={handleToggleModoEstandar}
                        />
                        <span className="toggle-label">
                            <strong>✓ Usar condiciones estándar del Observatorio Legaltech Garrigues-ICADE</strong>
                        </span>
                    </label>

                    {contrato.modoEstandarObservatorio && (
                        <div className="modo-estandar-aviso">
                            <p>ℹ️ <strong>Modo Estándar Activo:</strong> Este contrato se genera conforme al modelo del Observatorio para vivienda en España (derecho civil común), sin hipoteca ni arrendatarios, con arras penitenciales.</p>
                        </div>
                    )}
                </div>

                {/* MODAL DE CONFIRMACIÓN PARA SALIR DEL MODO ESTÁNDAR */}
                {showModoEstandarModal && (
                    <div className="modal-overlay" onClick={cancelarCambio}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>{modalContent.title}</h3>
                            <p>{modalContent.message}</p>
                            <div className="modal-actions">
                                <button onClick={confirmarSalirModoEstandar} className="btn btn-primary">
                                    {modalContent.actionLabel}
                                </button>
                                <button onClick={cancelarCambio} className="btn btn-secondary">
                                    No, mantener modo estándar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="banner-warning">
                    <strong>⚠️ Esta herramienta NO es asesoramiento jurídico.</strong> Revisa el contenido con un profesional antes de firmar.
                </div>

                <h2 className="step-title">📋 Paso 2: Términos Esenciales del Acuerdo</h2>
                <p className="step-description">
                    Parametriza el contrato de arras. Este apartado define las condiciones económicas y jurídicas fundamentales.
                </p>

                <form onSubmit={handleSubmit} className="step-form">
                    {/* 1. TIPO DE ARRAS */}
                    <div className="form-section">
                        <h3>1️⃣ Naturaleza de las Arras</h3>

                        <div className="form-group">
                            <label htmlFor="tipo_arras">
                                Tipo de arras <span className="required">*</span>
                            </label>
                            <select
                                id="tipo_arras"
                                name="tipo_arras"
                                value={formData.tipo_arras}
                                onChange={handleChange}
                                required
                            >
                                <option value="PENITENCIALES">Penitenciales (desistimiento con penalización)</option>
                                <option value="CONFIRMATORIAS">Confirmatorias (confirman el contrato)</option>
                                <option value="PENALES">Penales (indemnización por incumplimiento)</option>
                            </select>
                        </div>

                        <div className="explicacion-box">
                            <p><strong>Consecuencias legales:</strong> {getTipoArrasExplicacion()}</p>
                        </div>

                        <div className="info-box small">
                            <small>ℹ️ La elección de la naturaleza de las arras tiene efectos jurídicos relevantes; asegúrate de comprender sus consecuencias.</small>
                        </div>
                    </div>

                    {/* 2. CONDICIONES ECONÓMICAS */}
                    <div className="form-section">
                        <h3>2️⃣ Condiciones Económicas</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="precio_total">
                                    Precio total de venta (€) <span className="required">*</span>
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
                                    placeholder="200000"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="importe_arras">
                                    Importe de las arras (€) <span className="required">*</span>
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
                                    placeholder="20000"
                                />
                            </div>

                            <div className="form-group">
                                <label>Porcentaje de arras (calculado)</label>
                                <div className="calculated-field">
                                    {porcentajeArras > 0 ? `${porcentajeArras}%` : '—'}
                                </div>
                                <small>Equivalen al {porcentajeArras}% del precio</small>
                            </div>
                        </div>

                        {warnings.length > 0 && (
                            <div className="warnings-box">
                                {warnings.map((warning, i) => <p key={i}>{warning}</p>)}
                            </div>
                        )}
                    </div>

                    {/* 3. PAGO DE ARRAS */}
                    <div className="form-section">
                        <h3>3️⃣ Pago de las Arras</h3>

                        <div className="form-group">
                            <label htmlFor="forma_pago_arras">
                                Forma de pago <span className="required">*</span>
                            </label>
                            <select
                                id="forma_pago_arras"
                                name="forma_pago_arras"
                                value={formData.forma_pago_arras}
                                onChange={handleChange}
                                required
                            >
                                <option value="AL_FIRMAR">En el momento de la firma del contrato</option>
                                <option value="POSTERIOR">Después de la firma del contrato</option>
                            </select>
                        </div>

                        {formData.forma_pago_arras === 'POSTERIOR' && (
                            <>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="plazo_pago_arras_dias">Plazo de pago (días desde la firma)</label>
                                        <input
                                            type="number"
                                            id="plazo_pago_arras_dias"
                                            name="plazo_pago_arras_dias"
                                            value={formData.plazo_pago_arras_dias || ''}
                                            onChange={handleChange}
                                            min="1"
                                            placeholder="7"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="fecha_limite_pago_arras">o Fecha límite de pago</label>
                                        <input
                                            type="date"
                                            id="fecha_limite_pago_arras"
                                            name="fecha_limite_pago_arras"
                                            value={formData.fecha_limite_pago_arras}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="disclaimer-box">
                                    <h4>⚠️ Condición resolutoria</h4>
                                    <p>Si el comprador no satisface las arras dentro del plazo/fecha pactados, el contrato quedará sin efecto por condición resolutoria, sin perjuicio de las consecuencias adicionales que procedan según el tipo de arras y lo pactado.</p>
                                </div>
                            </>
                        )}

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="iban_vendedor">IBAN del vendedor {formData.forma_pago_arras === 'POSTERIOR' && '(recomendado)'}</label>
                                <input
                                    type="text"
                                    id="iban_vendedor"
                                    name="iban_vendedor"
                                    value={formData.iban_vendedor}
                                    onChange={handleChange}
                                    placeholder="ES00 0000 0000 0000 0000 0000"
                                    pattern="[A-Z]{2}[0-9]{22}"
                                />
                                <small>Formato IBAN (2 letras + 22 dígitos)</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="banco_vendedor">Banco del vendedor (opcional)</label>
                                <input
                                    type="text"
                                    id="banco_vendedor"
                                    name="banco_vendedor"
                                    value={formData.banco_vendedor}
                                    onChange={handleChange}
                                    placeholder="Entidad bancaria"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 4. ESCRITURA */}
                    <div className="form-section">
                        <h3>4️⃣ Escritura de Compraventa</h3>

                        <div className="form-group">
                            <label htmlFor="fecha_limite_firma_escritura">
                                Fecha límite para otorgar la escritura <span className="required">*</span>
                            </label>
                            <input
                                type="date"
                                id="fecha_limite_firma_escritura"
                                name="fecha_limite_firma_escritura"
                                value={formData.fecha_limite_firma_escritura}
                                onChange={handleChange}
                                required
                                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                            />
                            <small>Fecha máxima para formalizar la compraventa y pagar el resto del precio.</small>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="notario_designado_nombre">Notario designado (opcional)</label>
                                <input
                                    type="text"
                                    id="notario_designado_nombre"
                                    name="notario_designado_nombre"
                                    value={formData.notario_designado_nombre}
                                    onChange={handleChange}
                                    placeholder="Notaría Ejemplo"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="notario_designado_direccion">Dirección del notario (opcional)</label>
                                <input
                                    type="text"
                                    id="notario_designado_direccion"
                                    name="notario_designado_direccion"
                                    value={formData.notario_designado_direccion}
                                    onChange={handleChange}
                                    placeholder="C/ Mayor 1, Madrid"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 5. OTRAS CONDICIONES */}
                    <div className="form-section">
                        <h3>5️⃣ Otras Condiciones</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="gastos_quien">
                                    Pago de gastos <span className="required">*</span>
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
                            </div>

                            <div className="form-group">
                                <label htmlFor="via_resolucion">
                                    Resolución de conflictos <span className="required">*</span>
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
                                    Tipo de firma <span className="required">*</span>
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
                            <label htmlFor="condicion_suspensiva_texto">Condición suspensiva (opcional)</label>
                            <textarea
                                id="condicion_suspensiva_texto"
                                name="condicion_suspensiva_texto"
                                value={formData.condicion_suspensiva_texto}
                                onChange={handleChange}
                                rows={2}
                                maxLength={500}
                                placeholder="Condiciones que deben cumplirse para perfeccionar el contrato (p. ej., obtención de hipoteca, obtención de NIE, etc.)"
                            />
                            <small>{formData.condicion_suspensiva_texto.length} / 500 caracteres</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="observaciones">Observaciones y pactos adicionales</label>
                            <textarea
                                id="observaciones"
                                name="observaciones"
                                value={formData.observaciones}
                                onChange={handleChange}
                                rows={5}
                                maxLength={2000}
                                placeholder="Añade aquí pactos específicos (p. ej., entrega de llaves, mobiliario incluido, estado de cargas)."
                            />
                            <small>{formData.observaciones.length} / 2000 caracteres</small>
                        </div>
                    </div>

                    {/* 6. MANIFESTACIONES DEL VENDEDOR */}
                    <div className="form-section">
                        <h3>6️⃣ Manifestaciones del Vendedor (recomendado)</h3>
                        <p className="section-subtitle">Casillas de verificación que se incluirán en el contrato. Personaliza los textos según sea necesario.</p>

                        <div className="manifestaciones-list">
                            <div className="manifestacion-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="manifestacion_cosa_cierta"
                                        checked={formData.manifestacion_cosa_cierta}
                                        onChange={handleChange}
                                    />
                                    <strong>Cosa cierta:</strong> El inmueble se vende como 'cosa cierta' en el estado físico y jurídico actual conocido por el comprador.
                                </label>
                            </div>

                            <div className="manifestacion-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="manifestacion_libre_ocupantes"
                                        checked={formData.manifestacion_libre_ocupantes}
                                        onChange={handleChange}
                                    />
                                    <strong>Situación posesoria:</strong> Se entregará libre de ocupantes a la fecha de otorgamiento de la escritura.
                                </label>
                            </div>

                            <div className="manifestacion-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="manifestacion_libre_cargas"
                                        checked={formData.manifestacion_libre_cargas}
                                        onChange={handleChange}
                                    />
                                    <strong>Cargas y gravámenes:</strong> Se entregará libre de cargas, gravámenes y arrendamientos, salvo los expresamente aceptados por el comprador.
                                </label>
                            </div>

                            <div className="manifestacion-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="manifestacion_corriente_pagos"
                                        checked={formData.manifestacion_corriente_pagos}
                                        onChange={handleChange}
                                    />
                                    <strong>Suministros y comunidad:</strong> El vendedor declara estar al corriente de pago de suministros y cuotas de comunidad; aportará certificado de deudas.
                                </label>
                            </div>

                            <div className="manifestacion-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="manifestacion_certificaciones"
                                        checked={formData.manifestacion_certificaciones}
                                        onChange={handleChange}
                                    />
                                    <strong>Certificaciones y documentación:</strong> Aportará certificado de eficiencia energética y, en su caso, documentación técnica disponible (ITE, licencias, etc.).
                                </label>
                            </div>
                        </div>

                        <div className="info-box small">
                            <small>💡 Estos textos no sustituyen la revisión profesional. Son cláusulas habituales que pueden personalizarse.</small>
                        </div>
                    </div>

                    {/* PREVISUALIZACIÓN */}
                    <div className="form-section preview-section">
                        <h3>📄 Previsualización del Acuerdo</h3>
                        <div className="preview-text">
                            {getPreviewText()}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={() => setCurrentStep(1)} className="btn btn-secondary">
                            ← Atrás
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Continuar →
                        </button>
                    </div>
                </form>
            </div>

            {/* RESUMEN LATERAL */}
            <div className="step-2-sidebar">
                <div className="sidebar-card">
                    <h4>💰 Precio y Arras</h4>

                    <div className="sidebar-section">
                        <strong>Precio total</strong>
                        <p className="precio-grande">{formData.precio_total > 0 ? `${formData.precio_total.toLocaleString('es-ES')} €` : '—'}</p>
                    </div>

                    <div className="sidebar-section">
                        <strong>Arras</strong>
                        <p className="arras-grande">{formData.importe_arras > 0 ? `${formData.importe_arras.toLocaleString('es-ES')} €` : '—'}</p>
                        {porcentajeArras > 0 && <p className="porcentaje">({porcentajeArras}% del precio)</p>}
                    </div>

                    {formData.tipo_arras && (
                        <div className="sidebar-section">
                            <strong>Tipo de arras</strong>
                            <p>{formData.tipo_arras === 'PENITENCIALES' ? 'Penitenciales' : formData.tipo_arras === 'CONFIRMATORIAS' ? 'Confirmatorias' : 'Penales'}</p>
                        </div>
                    )}

                    {formData.forma_pago_arras && (
                        <div className="sidebar-section">
                            <strong>Pago de arras</strong>
                            <p>{formData.forma_pago_arras === 'AL_FIRMAR' ? 'En el momento de la firma' : 'Después de la firma'}</p>
                            {formData.forma_pago_arras === 'POSTERIOR' && formData.plazo_pago_arras_dias > 0 && (
                                <small>Plazo: {formData.plazo_pago_arras_dias} días</small>
                            )}
                            {formData.iban_vendedor && <small className="mono">{formData.iban_vendedor}</small>}
                        </div>
                    )}

                    {formData.fecha_limite_firma_escritura && (
                        <div className="sidebar-section">
                            <strong>Escritura</strong>
                            <p>{new Date(formData.fecha_limite_firma_escritura).toLocaleDateString('es-ES')}</p>
                            {formData.notario_designado_nombre && <small>{formData.notario_designado_nombre}</small>}
                        </div>
                    )}

                    <div className="sidebar-section">
                        <strong>Condiciones</strong>
                        <p>Gastos: {formData.gastos_quien === 'LEY' ? 'Conforme a ley' : 'Por comprador'}</p>
                        <p>Resolución: {formData.via_resolucion === 'JUZGADOS' ? 'Juzgados' : 'Arbitraje'}</p>
                        <p>Firma: {formData.firma_preferida === 'ELECTRONICA' ? 'Electrónica' : 'Manuscrita'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
