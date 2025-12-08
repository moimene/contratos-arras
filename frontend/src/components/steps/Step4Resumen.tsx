import React, { useState, useEffect } from 'react';
import { useContract } from '../../context/ContractContext';

interface Acceptance {
    parteId: string;
    timestamp: string;
    ip: string;
    userAgent: string;
    version: string;
}

export const Step4Resumen: React.FC = () => {
    const { inmueble, contrato, compradores, vendedores, setCurrentStep } = useContract();

    const [acceptances, setAcceptances] = useState<Record<string, Acceptance>>({});
    const [checkedParties, setCheckedParties] = useState<Record<string, boolean>>({});
    const [contractVersion, setContractVersion] = useState<string>('');
    const [userIP, setUserIP] = useState<string>('');

    // Generate version hash from essential terms
    useEffect(() => {
        const generateVersion = async () => {
            const essentialTerms = {
                inmueble: {
                    direccion: inmueble.direccion_completa,
                    ciudad: inmueble.ciudad,
                    provincia: inmueble.provincia,
                    referencia_catastral: inmueble.referencia_catastral,
                },
                contrato: {
                    precio: contrato.precio_total,
                    arras: contrato.importe_arras,
                    tipo_arras: contrato.tipo_arras,
                    fecha_escritura: contrato.fecha_limite_firma_escritura,
                },
                compradores: compradores.map((c: any) => ({ id: c.id, nombre: c.nombre || c.denominacion, porcentaje: c.porcentaje })),
                vendedores: vendedores.map((v: any) => ({ id: v.id, nombre: v.nombre || v.denominacion, porcentaje: v.porcentaje })),
            };

            const termsString = JSON.stringify(essentialTerms);
            const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(termsString));
            const hashArray = Array.from(new Uint8Array(hash));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            setContractVersion(hashHex.substring(0, 16)); // First 16 chars for readability
        };

        generateVersion();
    }, [inmueble, contrato, compradores, vendedores]);

    // Get user IP
    useEffect(() => {
        // Simulate IP for demo (in production, use ipify.org or server-side)
        setUserIP('203.0.113.10');
    }, []);

    // Load acceptances from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(`acceptances_${contractVersion}`);
        if (stored) {
            setAcceptances(JSON.parse(stored));
        } else {
            setAcceptances({});
        }
    }, [contractVersion]);

    const getObligatedParties = () => {
        const obligated: any[] = [];

        compradores.forEach((c: any) => {
            if (c.obligado_aceptar) {
                obligated.push({ ...c, lado: 'COMPRADOR' });
            }
        });

        vendedores.forEach((v: any) => {
            if (v.obligado_aceptar) {
                obligated.push({ ...v, lado: 'VENDEDOR' });
            }
        });

        return obligated;
    };

    const handleAcceptance = (parteId: string) => {
        const acceptance: Acceptance = {
            parteId,
            timestamp: new Date().toISOString(),
            ip: userIP,
            userAgent: navigator.userAgent,
            version: contractVersion,
        };

        const newAcceptances = { ...acceptances, [parteId]: acceptance };
        setAcceptances(newAcceptances);
        localStorage.setItem(`acceptances_${contractVersion}`, JSON.stringify(newAcceptances));
    };

    const allPartiesAccepted = () => {
        const obligated = getObligatedParties();
        return obligated.every(p => acceptances[p.id || p.nombre]);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const calculatePercentage = () => {
        if (!contrato.precio_total || !contrato.importe_arras) return 0;
        return ((contrato.importe_arras / contrato.precio_total) * 100).toFixed(2);
    };

    const getArrasExplanation = () => {
        switch (contrato.tipo_arras) {
            case 'PENITENCIALES':
                return 'Permiten desistir antes de la escritura. Si desiste la parte compradora, pierde las arras; si desiste la parte vendedora, debe devolver el doble.';
            case 'CONFIRMATORIAS':
                return 'Confirman el contrato; ante incumplimiento, podrán exigirse el cumplimiento o la resolución con daños y perjuicios.';
            case 'PENALES':
                return 'Operan como cláusula penal con la penalización pactada.';
            default:
                return '';
        }
    };

    const generateNarrativeSummary = () => {
        const inmuebleDesc = `El inmueble sito en ${inmueble.direccion_completa || '-'}, ${inmueble.cp || '-'} ${inmueble.ciudad || '-'}, ${inmueble.provincia || '-'}${inmueble.referencia_catastral ? `, con referencia catastral ${inmueble.referencia_catastral}` : ''}${inmueble.finca_numero ? ` y Finca ${inmueble.finca_numero}, Registro de la Propiedad nº ${inmueble.rp_numero || '-'} (${inmueble.rp_localidad || '-'})` : ''}, es objeto del presente acuerdo.`;

        // Anexos si existen
        const anexosDesc = inmueble.anexos && inmueble.anexos.length > 0
            ? ` Se incluyen como anexos: ${inmueble.anexos.map((a: any) => `${a.tipo} (${a.ubicacion})`).join(', ')}.`
            : '';

        const arrasDesc = `La parte compradora entrega ${formatCurrency(contrato.importe_arras || 0)}, equivalentes al ${calculatePercentage()}% del precio total de ${formatCurrency(contrato.precio_total || 0)}, como arras ${contrato.tipo_arras?.toLowerCase() || 'confirmatorias'}. ${contrato.tipo_arras === 'PENITENCIALES' ? 'Si desiste la parte compradora, pierde las arras; si desiste la parte vendedora, devuelve el doble.' : ''}`;

        const pagoDesc = contrato.forma_pago_arras === 'AL_FIRMAR'
            ? 'El pago de las arras se realizará en el momento de la firma.'
            : `El pago de las arras se realizará ${contrato.plazo_pago_arras_dias ? `dentro de ${contrato.plazo_pago_arras_dias} días` : ''} ${contrato.fecha_limite_pago_arras ? `antes del ${formatDate(contrato.fecha_limite_pago_arras)}` : ''}${contrato.iban_vendedor ? ` mediante transferencia al IBAN de la parte vendedora` : ''}.${contrato.forma_pago_arras === 'POSTERIOR' ? ' Si no se paga en plazo, el contrato quedará sin efecto por condición resolutoria.' : ''}`;

        const notariaDesc = contrato.notario_designado_nombre
            ? ` La escritura se otorgará ante ${contrato.notario_designado_nombre}${contrato.notario_designado_direccion ? `, ${contrato.notario_designado_direccion}` : ''};`
            : ` La escritura pública deberá otorgarse antes del ${formatDate(contrato.fecha_limite_firma_escritura || '')};`;

        const escrituraDesc = `${notariaDesc} en ese acto se abonará el resto del precio.`;

        const gastosDesc = `Los gastos se distribuyen ${contrato.gastos_quien === 'LEY' ? 'conforme a la ley' : 'a cargo de la parte compradora'}.`;

        const resolucionDesc = `La resolución de conflictos se somete a ${contrato.via_resolucion === 'JUZGADOS' ? 'juzgados y tribunales' : 'arbitraje notarial'}.`;

        const firmaDesc = `La firma será ${contrato.firma_preferida?.toLowerCase() || 'electrónica'}.`;

        const condicionesDesc = contrato.condicion_suspensiva_texto ? ` Condiciones suspensivas: ${contrato.condicion_suspensiva_texto}.` : '';
        const observacionesDesc = contrato.observaciones ? ` Observaciones/pactos: ${contrato.observaciones}.` : '';

        // Identificación de partes
        const partesCompradoras = compradores.map((c: any) => {
            if (c.tipo === 'PERSONA_FISICA') {
                return `${c.nombre} ${c.apellidos} (${c.tipo_documento}: ${c.numero_documento})`;
            } else {
                const repr = c.representante ? ` representada por ${c.representante.nombre} ${c.representante.apellidos} (${c.representante.tipo_representante})` : '';
                return `${c.denominacion} (CIF: ${c.cif})${repr}`;
            }
        }).join('; ');

        const partesVendedoras = vendedores.map((v: any) => {
            if (v.tipo === 'PERSONA_FISICA') {
                return `${v.nombre} ${v.apellidos} (${v.tipo_documento}: ${v.numero_documento})`;
            } else {
                const base = v.representante?.base_representacion === 'PODER' && v.representante?.poder_notarial
                    ? ` mediante poder otorgado ante ${v.representante.poder_notarial.notario}, protocolo ${v.representante.poder_notarial.protocolo}`
                    : ` por cargo de ${v.representante?.tipo_representante}`;
                return `${v.denominacion} (CIF: ${v.cif}) representada por ${v.representante?.nombre} ${v.representante?.apellidos}${base}`;
            }
        }).join('; ');

        const partesDesc = ` Intervienen como parte compradora: ${partesCompradoras}; como parte vendedora: ${partesVendedoras}.`;

        // Régimen matrimonial si relevante
        const regimenDesc = compradores.concat(vendedores).filter((p: any) =>
            p.tipo === 'PERSONA_FISICA' && p.estado_civil === 'CASADO' && p.regimen_economico
        ).map((p: any) => {
            const lado = compradores.includes(p) ? 'compradora' : 'vendedora';
            const consentimiento = p.requiere_consentimiento_conyuge ? 'con' : 'sin';
            return ` La parte ${lado} ${p.nombre} ${p.apellidos} está casada en régimen de ${p.regimen_economico?.toLowerCase()?.replace('_', ' ')}, ${consentimiento} consentimiento del cónyuge.`;
        }).join('');

        return `${inmuebleDesc}${anexosDesc} ${arrasDesc} ${pagoDesc} ${escrituraDesc} ${gastosDesc} ${resolucionDesc} ${firmaDesc}${condicionesDesc}${observacionesDesc}${partesDesc}${regimenDesc}`;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!allPartiesAccepted()) {
            alert('Todas las partes obligadas deben aceptar antes de continuar.');
            return;
        }

        setCurrentStep(5);
    };

    return (
        <div className="step-4-container">
            <div className="step-4-main">
                <div className="banner-warning">
                    <strong>⚠️ Esta herramienta NO es asesoramiento jurídico.</strong> Revisa el contenido con un profesional antes de firmar.
                </div>

                <h2 className="step-title">📋 Paso 4: Resumen y Aceptación de Términos Esenciales</h2>
                <p className="step-description">
                    Revisa el resumen de los términos acordados. Cada parte obligada debe prestar su consentimiento explícito antes de generar el contrato.
                </p>

                <div className="info-banner">
                    <p>📌 El borrador que se generará en el siguiente paso es orientativo; no es vinculante hasta que todas las partes designadas acepten y firmen.</p>
                    <p>⚠️ Cualquier cambio en términos esenciales requerirá una nueva aceptación por todas las partes obligadas.</p>
                </div>

                <form onSubmit={handleSubmit} className="step-form">
                    {/* 1. INMUEBLE */}
                    <div className="summary-card">
                        <h3>🏠 Inmueble</h3>
                        <div className="summary-content">
                            <div className="summary-row">
                                <strong>Dirección:</strong>
                                <span>{inmueble.direccion_completa}</span>
                            </div>
                            <div className="summary-row">
                                <strong>Localidad:</strong>
                                <span>{inmueble.cp} {inmueble.ciudad}, {inmueble.provincia}</span>
                            </div>
                            {inmueble.referencia_catastral && (
                                <div className="summary-row">
                                    <strong>Ref. Catastral:</strong>
                                    <span>{inmueble.referencia_catastral}</span>
                                </div>
                            )}
                            {inmueble.rp_numero && (
                                <div className="summary-row">
                                    <strong>Registro Propiedad:</strong>
                                    <span>Nº {inmueble.rp_numero} ({inmueble.rp_localidad})</span>
                                </div>
                            )}
                            {inmueble.finca_numero && (
                                <div className="summary-row">
                                    <strong>Finca:</strong>
                                    <span>{inmueble.finca_numero} {inmueble.cru_idufir && `(CRU: ${inmueble.cru_idufir})`}</span>
                                </div>
                            )}
                            {inmueble.anexos && inmueble.anexos.length > 0 && (
                                <div className="summary-row">
                                    <strong>Anexos:</strong>
                                    <div className="anexos-list">
                                        {inmueble.anexos.map((a: any, i: number) => (
                                            <span key={i} className="anexo-tag">{a.tipo} ({a.ubicacion})</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="info-box small">
                                <small>ℹ️ Los datos registrales identifican jurídicamente el inmueble. Si falta alguno, podrás completarlo antes de la escritura.</small>
                            </div>
                        </div>
                    </div>

                    {/* 2. CONDICIONES ECONÓMICAS */}
                    <div className="summary-card">
                        <h3>💰 Condiciones Económicas</h3>
                        <div className="summary-content">
                            <div className="summary-row highlight">
                                <strong>Precio total:</strong>
                                <span className="precio-grande">{formatCurrency(contrato.precio_total)}</span>
                            </div>
                            <div className="summary-row highlight">
                                <strong>Importe de arras:</strong>
                                <span className="arras-grande">{formatCurrency(contrato.importe_arras)} ({calculatePercentage()}%)</span>
                            </div>
                            <div className="summary-row">
                                <strong>Naturaleza de las arras:</strong>
                                <span className="arras-tipo">{contrato.tipo_arras}</span>
                            </div>
                            <div className={`arras-explanation ${contrato.tipo_arras?.toLowerCase()}`}>
                                <p>{getArrasExplanation()}</p>
                            </div>
                            <div className="summary-row">
                                <strong>Forma de pago:</strong>
                                <span>{contrato.forma_pago_arras === 'AL_FIRMAR' ? 'En el momento de la firma' : 'Después de la firma'}</span>
                            </div>
                            {contrato.forma_pago_arras === 'POSTERIOR' && (
                                <>
                                    {contrato.plazo_pago_arras_dias && (
                                        <div className="summary-row">
                                            <strong>Plazo:</strong>
                                            <span>{contrato.plazo_pago_arras_dias} días</span>
                                        </div>
                                    )}
                                    {contrato.fecha_limite_pago_arras && (
                                        <div className="summary-row">
                                            <strong>Fecha límite:</strong>
                                            <span>{formatDate(contrato.fecha_limite_pago_arras)}</span>
                                        </div>
                                    )}
                                    {contrato.iban_vendedor && (
                                        <div className="summary-row">
                                            <strong>IBAN parte vendedora:</strong>
                                            <span>{contrato.iban_vendedor}</span>
                                        </div>
                                    )}
                                    <div className="resolutory-warning">
                                        <strong>⚠️ Condición resolutoria:</strong> Si no se paga el importe de las arras dentro del plazo pactado, el contrato quedará sin efecto, conforme a lo acordado.
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 3. ESCRITURA Y PLAZOS */}
                    <div className="summary-card">
                        <h3>🖋️ Escritura de Compraventa y Plazos</h3>
                        <div className="summary-content">
                            <div className="summary-row">
                                <strong>Fecha límite escritura:</strong>
                                <span>{formatDate(contrato.fecha_limite_firma_escritura)}</span>
                            </div>
                            {contrato.notario_designado_nombre && (
                                <div className="summary-row">
                                    <strong>Notaría designada:</strong>
                                    <span>{contrato.notario_designado_nombre}<br />{contrato.notario_designado_direccion}</span>
                                </div>
                            )}
                            <div className="info-box small">
                                <small>ℹ️ En la fecha de escritura se formaliza la compraventa y se paga el resto del precio.</small>
                            </div>
                        </div>
                    </div>

                    {/* 4. OTRAS CONDICIONES */}
                    <div className="summary-card">
                        <h3>⚙️ Otras Condiciones</h3>
                        <div className="summary-content">
                            <div className="summary-row">
                                <strong>Reparto de gastos:</strong>
                                <span>{contrato.gastos_quien === 'LEY' ? 'Conforme a ley' : 'Por la parte compradora'}</span>
                            </div>
                            <div className="summary-row">
                                <strong>Resolución conflictos:</strong>
                                <span>{contrato.via_resolucion === 'JUZGADOS' ? 'Juzgados y tribunales' : 'Arbitraje notarial'}</span>
                            </div>
                            <div className="summary-row">
                                <strong>Tipo de firma:</strong>
                                <span>{contrato.firma_preferida}</span>
                            </div>
                            {contrato.condicion_suspensiva_texto && (
                                <div className="summary-row">
                                    <strong>Condiciones suspensivas:</strong>
                                    <span>{contrato.condicion_suspensiva_texto}</span>
                                </div>
                            )}
                            {contrato.observaciones && (
                                <div className="summary-row">
                                    <strong>Observaciones:</strong>
                                    <span>{contrato.observaciones}</span>
                                </div>
                            )}
                            {(contrato.manifestacion_cosa_cierta || contrato.manifestacion_libre_ocupantes || contrato.manifestacion_libre_cargas) && (
                                <div className="summary-row">
                                    <strong>Manifestaciones vendedor:</strong>
                                    <ul className="manifestaciones-summary">
                                        {contrato.manifestacion_cosa_cierta && <li>✓ Cosa cierta y determinada</li>}
                                        {contrato.manifestacion_libre_ocupantes && <li>✓ Libre de ocupantes a la escritura</li>}
                                        {contrato.manifestacion_libre_cargas && <li>✓ Libre de cargas salvo pacto</li>}
                                        {contrato.manifestacion_corriente_pagos && <li>✓ Al corriente de pagos</li>}
                                        {contrato.manifestacion_certificaciones && <li>✓ Aportará certificaciones</li>}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 5. PARTES INTERVINIENTES */}
                    <div className="summary-card">
                        <h3>👥 Partes Intervinientes</h3>
                        <div className="summary-content">
                            <div className="partes-lado">
                                <h4>Parte Compradora</h4>
                                {compradores.map((c: any, i: number) => (
                                    <div key={i} className="parte-summary">
                                        <p><strong>{c.tipo === 'PERSONA_FISICA' ? `${c.nombre} ${c.apellidos}` : c.denominacion}</strong></p>
                                        <small>{c.tipo_documento || 'CIF'}: {c.numero_documento || c.cif} • {c.porcentaje}%</small>
                                        {c.requiere_consentimiento_conyuge && <small className="warning-text">⚠️ Requiere consentimiento del cónyuge</small>}
                                        {c.tipo === 'PERSONA_JURIDICA' && c.representante && (
                                            <small className="representante-text">Representante: {c.representante.nombre} {c.representante.apellidos}</small>
                                        )}
                                    </div>
                                ))}
                                <p className="total-participacion">Total: {compradores.reduce((sum: number, c: any) => sum + (c.porcentaje || 0), 0).toFixed(2)}%</p>
                            </div>

                            <div className="partes-lado">
                                <h4>Parte Vendedora</h4>
                                {vendedores.map((v: any, i: number) => (
                                    <div key={i} className="parte-summary">
                                        <p><strong>{v.tipo === 'PERSONA_FISICA' ? `${v.nombre} ${v.apellidos}` : v.denominacion}</strong></p>
                                        <small>{v.tipo_documento || 'CIF'}: {v.numero_documento || v.cif} • {v.porcentaje}%</small>
                                        {v.tipo === 'PERSONA_JURIDICA' && v.representante && (
                                            <>
                                                <small className="representante-text">Representante: {v.representante.nombre} {v.representante.apellidos} ({v.representante.tipo_representante})</small>
                                                {v.representante.poder_notarial && (
                                                    <small className="poder-text">Poder: {v.representante.poder_notarial.notario}, Protocolo {v.representante.poder_notarial.protocolo}</small>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                                <p className="total-participacion">Total: {vendedores.reduce((sum: number, v: any) => sum + (v.porcentaje || 0), 0).toFixed(2)}%</p>
                            </div>

                            <div className="info-box small">
                                <small>ℹ️ La suma de participaciones por cada lado debe totalizar el 100% antes de firmar.</small>
                            </div>
                        </div>
                    </div>

                    {/* NARRATIVE SUMMARY */}
                    <div className="narrative-summary">
                        <h3>📄 Resumen Narrativo</h3>
                        <p className="narrative-text">{generateNarrativeSummary()}</p>
                    </div>

                    {/* ACCEPTANCE PANEL */}
                    <div className="acceptance-panel">
                        <h3>✅ Aceptación de Términos Esenciales</h3>
                        <p className="acceptance-intro">
                            Las siguientes partes deben prestar su aceptación explícita de los términos esenciales (versión: {contractVersion.substring(0, 8)}):
                        </p>

                        {getObligatedParties().map((parte) => {
                            const parteId = parte.id || `${parte.nombre}-${parte.apellidos}`;
                            const hasAccepted = acceptances[parteId];

                            return (
                                <div key={parteId} className={`acceptance-item ${hasAccepted ? 'accepted' : ''}`}>
                                    <div className="acceptance-header">
                                        {parte.tipo === 'PERSONA_FISICA' ? (
                                            <>
                                                <h4>{parte.nombre} {parte.apellidos}</h4>
                                                <p className="documento">{parte.tipo_documento}: {parte.numero_documento}</p>
                                            </>
                                        ) : (
                                            <>
                                                <h4>🏢 {parte.denominacion}</h4>
                                                <p className="documento">CIF: {parte.cif}</p>
                                                <p className="representante-aceptacion">
                                                    Acepta en su nombre: {parte.representante?.nombre} {parte.representante?.apellidos},
                                                    {parte.tipo_documento}: {parte.representante?.numero_documento}
                                                    ({parte.representante?.tipo_representante})
                                                </p>
                                            </>
                                        )}
                                    </div>

                                    {!hasAccepted ? (
                                        <>
                                            <div className="acceptance-declaration">
                                                <p>
                                                    "Declaro que he leído y entiendo la información anterior sobre el inmueble, las partes intervinientes,
                                                    el precio, el importe y la naturaleza de las arras, la forma de pago y los plazos. Confirmo que coincide
                                                    con lo que deseo acordar, y acepto los términos esenciales de esta versión."
                                                </p>
                                            </div>

                                            <div className="acceptance-controls">
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={checkedParties[parteId] || false}
                                                        onChange={(e) => setCheckedParties({ ...checkedParties, [parteId]: e.target.checked })}
                                                    />
                                                    &nbsp;He leído y comprendo
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAcceptance(parteId)}
                                                    disabled={!checkedParties[parteId]}
                                                    className="btn btn-success"
                                                >
                                                    Acepto los términos esenciales
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="acceptance-confirmed">
                                            <p>✅ Aceptado el {new Date(hasAccepted.timestamp).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}. Versión: v{contractVersion.substring(0, 8)}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={() => {
                            if (Object.keys(acceptances).length > 0) {
                                if (!confirm('Si modificas términos esenciales, se invalidarán las aceptaciones previas. ¿Continuar?')) return;
                            }
                            setCurrentStep(3);
                        }} className="btn btn-secondary">
                            ← Atrás
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!allPartiesAccepted()}
                        >
                            Continuar → Crear contrato
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
