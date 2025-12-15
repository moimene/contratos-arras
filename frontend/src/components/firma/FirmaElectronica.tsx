import React, { useCallback, useEffect, useState } from 'react';
import { useTipoRolUsuario } from '../../hooks/useTipoRolUsuario';
import { useAuth } from '../../features/auth/AuthContext';

interface FirmaElectronicaProps {
    contratoId: string;
    onFirmaCompletada?: () => void;
    onTodasFirmasCompletas?: () => void;
}

export const FirmaElectronica: React.FC<FirmaElectronicaProps> = ({
    contratoId,
    onFirmaCompletada,
    onTodasFirmasCompletas
}) => {
    const [partesReales, setPartesReales] = useState<any[]>([]);
    const [estadoFirmas, setEstadoFirmas] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [firmando, setFirmando] = useState<string | null>(null);
    const [aceptoTerminos, setAceptoTerminos] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>('');

    // Obtener rol del usuario actual para mostrar UI condicional
    const { role: rolActual, permissions, loading: roleLoading } = useTipoRolUsuario();
    const { user } = useAuth();

    const cargarEstadoFirmas = useCallback(async (signal?: AbortSignal) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/contracts/${contratoId}/firmas`, {
                signal
            });
            const data = await response.json();

            if (signal?.aborted) return;

            console.log('📊 Estado de firmas:', data);

            if (data.success) {
                setEstadoFirmas(data.data);
            } else {
                setError(data.error || 'Error al cargar firmas');
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error('❌ Error cargando firmas:', err);
            setError('Error al conectar con el servidor');
        }
    }, [contratoId]);

    const cargarDatosContrato = useCallback(async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            setError(null);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

            console.log('🔍 Cargando contrato:', contratoId);
            const contratoRes = await fetch(`${apiUrl}/api/contracts/${contratoId}`, {
                signal
            });
            const contratoData = await contratoRes.json();

            if (signal?.aborted) return;

            console.log('📦 Respuesta API completa:', contratoData);

            if (!contratoData.success) {
                setError(`Error del servidor: ${contratoData.error || 'Desconocido'}`);
                setDebugInfo(JSON.stringify(contratoData, null, 2));
                setLoading(false);
                return;
            }

            // Debug: verificar estructura
            console.log('📊 Estructura de partes:', {
                hayPartes: !!contratoData.data?.partes,
                cantidadPartes: contratoData.data?.partes?.length || 0,
                primeraParteEjemplo: contratoData.data?.partes?.[0]
            });

            if (contratoData.data?.partes && Array.isArray(contratoData.data.partes)) {
                // Intentar múltiples estrategias de mapeo
                let partesFlat: any[] = [];

                // Estrategia 1: contratos_partes con nested parte
                if (contratoData.data.partes[0]?.parte) {
                    console.log('✅ Usando estrategia 1: nested parte');
                    partesFlat = contratoData.data.partes.map((cp: any) => ({
                        parte_id: cp.parte_id,
                        tipo_parte: cp.tipo_parte || cp.parte?.rol,
                        obligado_firmar: cp.obligado_firmar,
                        ...cp.parte
                    }));
                }
                // Estrategia 2: datos directos (flat)
                else {
                    console.log('✅ Usando estrategia 2: flat data');
                    partesFlat = contratoData.data.partes.map((p: any) => ({
                        parte_id: p.parte_id || p.id,
                        tipo_parte: p.tipo_parte || p.rol,
                        obligado_firmar: p.obligado_firmar !== false,
                        nombre: p.nombre,
                        apellidos: p.apellidos,
                        tipo_documento: p.tipo_documento || 'DNI',
                        numero_documento: p.numero_documento
                    }));
                }

                console.log('✅ Partes procesadas:', partesFlat);
                console.log('🔎 DETALLE Partes:', JSON.stringify(partesFlat, null, 2));
                console.log('🔎 Primera parte tipo_parte:', partesFlat[0]?.tipo_parte);
                console.log('🔎 Segunda parte tipo_parte:', partesFlat[1]?.tipo_parte);

                setPartesReales(partesFlat);
                setDebugInfo(`Partes cargadas: ${partesFlat.length}`);
            } else {
                console.warn('⚠️ No hay partes en la respuesta');
                setDebugInfo('No se encontraron partes en la respuesta del servidor');
            }

            // Cargar estado de firmas
            await cargarEstadoFirmas(signal);
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error('❌ Error cargando datos:', err);
            setError(`Error: ${err.message}`);
            setDebugInfo(`Error: ${err.toString()}`);
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [cargarEstadoFirmas, contratoId]);

    useEffect(() => {
        const controller = new AbortController();
        cargarDatosContrato(controller.signal);
        return () => controller.abort();
    }, [cargarDatosContrato]);

    useEffect(() => {
        if (estadoFirmas?.todasFirmasCompletas && onTodasFirmasCompletas) {
            onTodasFirmasCompletas();
        }
    }, [estadoFirmas?.todasFirmasCompletas, onTodasFirmasCompletas]);

    const handleFirmar = async (parteId: string) => {
        setFirmando(parteId);
        setError(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/contracts/${contratoId}/firmar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(user?.id ? { 'x-user-id': user.id } : {}),
                },
                body: JSON.stringify({
                    parteId: parteId,
                    versionHash: `v1-${Date.now()}`,
                    documentoHash: `doc-${Date.now()}`,
                }),
            });

            const data = await response.json();

            if (data.success) {
                await cargarEstadoFirmas();
                setAceptoTerminos(prev => ({ ...prev, [parteId]: false }));
                if (onFirmaCompletada) onFirmaCompletada();
            } else {
                setError(data.error || 'Error al registrar firma');
            }
        } catch (err: any) {
            console.error('❌ Error al firmar:', err);
            setError('Error al conectar con el servidor');
        } finally {
            setFirmando(null);
        }
    };

    const renderParteFirma = (parte: any) => {
        const parteId = parte.parte_id || parte.id;
        const firmaDetalle = estadoFirmas?.detalles.find((d: any) => d.parteId === parteId);
        const yaFirmado = firmaDetalle?.firmado || false;
        const estaFirmandoEsta = firmando === parteId;

        // Determinar si el usuario actual puede firmar por esta parte
        // El usuario puede firmar si su rol coincide con el tipo_parte (COMPRADOR/VENDEDOR)
        const esMiRol = parte.tipo_parte === rolActual;
        const puedeActuar = esMiRol || permissions.canSign;

        return (
            <div key={parteId} className={`firma-parte-card ${yaFirmado ? 'firmado' : 'pendiente'}`}>
                <div className="firma-parte-header">
                    <div className="firma-parte-info">
                        <h4 className="firma-parte-nombre">
                            {parte.nombre} {parte.apellidos}
                        </h4>
                        <p className="firma-parte-dni">
                            {parte.tipo_documento || 'DNI'}: {parte.numero_documento}
                        </p>
                    </div>
                    <div className="firma-parte-status">
                        {yaFirmado ? (
                            <span className="status-badge firmado">
                                <span className="badge-icon">✓</span>
                                Firmado
                            </span>
                        ) : (
                            <span className="status-badge pendiente">
                                <span className="badge-icon">⏱</span>
                                Pendiente
                            </span>
                        )}
                    </div>
                </div>

                {/* Mostrar acciones de firma solo si el usuario puede actuar */}
                {!yaFirmado && puedeActuar && (
                    <div className="firma-parte-actions">
                        <label className="firma-checkbox-label">
                            <input
                                type="checkbox"
                                className="firma-checkbox"
                                checked={aceptoTerminos[parteId] || false}
                                onChange={(e) => setAceptoTerminos(prev => ({
                                    ...prev,
                                    [parteId]: e.target.checked
                                }))}
                            />
                            <span className="checkbox-text">
                                He leído, entendido y acepto todos los términos y condiciones de este contrato de arras
                            </span>
                        </label>

                        <button
                            onClick={() => handleFirmar(parteId)}
                            disabled={!aceptoTerminos[parteId] || estaFirmandoEsta}
                            className={`btn-firma ${aceptoTerminos[parteId] ? 'enabled' : 'disabled'}`}
                        >
                            {estaFirmandoEsta ? (
                                <>
                                    <span className="spinner"></span>
                                    Firmando...
                                </>
                            ) : (
                                <>
                                    <span className="btn-icon">✍️</span>
                                    Firmar Electrónicamente
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Mensaje para usuarios que no pueden firmar por esta parte */}
                {!yaFirmado && !puedeActuar && (
                    <div className="firma-esperando" style={{
                        padding: '0.75rem 1rem',
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        color: '#92400e',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span>⏳</span>
                        <span>Esperando firma de {parte.tipo_parte === 'COMPRADOR' ? 'la parte compradora' : 'la parte vendedora'}</span>
                    </div>
                )}

                {yaFirmado && firmaDetalle.fechaFirma && (
                    <div className="firma-fecha-info">
                        Firmado el {new Date(firmaDetalle.fechaFirma).toLocaleString('es-ES', {
                            dateStyle: 'long',
                            timeStyle: 'short'
                        })}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="firma-loading">
                <div className="spinner-large"></div>
                <p>Cargando estado de firmas...</p>
            </div>
        );
    }

    // Separar partes por tipo
    const compradores = partesReales.filter(p => p.tipo_parte === 'COMPRADOR');
    const vendedores = partesReales.filter(p => p.tipo_parte === 'VENDEDOR');

    console.log('🎯 FILTRADO:');
    console.log('  - partesReales.length:', partesReales.length);
    console.log('  - compradores:', compradores);
    console.log('  - vendedores:', vendedores);

    return (
        <div className="firma-electronica-wrapper">
            <div className="firma-header-section">
                <h3 className="firma-title">Firma Electrónica del Contrato</h3>
                <p className="firma-subtitle">
                    Todas las partes deben firmar para perfeccionar el contrato
                </p>
            </div>

            {estadoFirmas && (
                <div className="firma-progress-section">
                    <div className="progress-bar-wrapper">
                        <div
                            className="progress-bar-fill"
                            style={{
                                width: `${(estadoFirmas.firmasCompletadas / estadoFirmas.firmasRequeridas) * 100}%`
                            }}
                        ></div>
                    </div>
                    <p className="progress-text">
                        <strong>{estadoFirmas.firmasCompletadas}</strong> de <strong>{estadoFirmas.firmasRequeridas}</strong> firmas completadas
                    </p>
                    {estadoFirmas.todasFirmasCompletas && (
                        <div className="firma-completion-banner">
                            🎉 ¡Contrato completamente firmado! Todas las partes han firmado el documento.
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="firma-error-alert">
                    <span className="error-icon">⚠️</span>
                    {error}
                </div>
            )}

            {/* DEBUG INFO */}
            {partesReales.length === 0 && debugInfo && (
                <div className="firma-error-alert" style={{ marginTop: '1rem' }}>
                    <span className="error-icon">🐛</span>
                    <div>
                        <strong>Debug Info:</strong>
                        <pre style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{debugInfo}</pre>
                        <p style={{ marginTop: '0.5rem' }}>
                            <strong>Abre la consola del navegador (F12)</strong> para ver más detalles.
                        </p>
                    </div>
                </div>
            )}

            {/* GRUPO COMPRADORES */}
            {compradores.length > 0 && (
                <div className="firma-grupo">
                    <div className="firma-grupo-header compradores">
                        <span className="grupo-icon">👤</span>
                        <h3 className="grupo-titulo">
                            Parte Compradora {compradores.length > 1 && `(${compradores.length})`}
                        </h3>
                    </div>
                    <div className="firma-grupo-content">
                        {compradores.map(renderParteFirma)}
                    </div>
                </div>
            )}

            {/* GRUPO VENDEDORES */}
            {vendedores.length > 0 && (
                <div className="firma-grupo">
                    <div className="firma-grupo-header vendedores">
                        <span className="grupo-icon">🏠</span>
                        <h3 className="grupo-titulo">
                            Parte Vendedora {vendedores.length > 1 && `(${vendedores.length})`}
                        </h3>
                    </div>
                    <div className="firma-grupo-content">
                        {vendedores.map(renderParteFirma)}
                    </div>
                </div>
            )}

            {partesReales.length === 0 && !loading && (
                <div className="firma-error-alert">
                    <span className="error-icon">⚠️</span>
                    <strong>No se encontraron partes para este contrato.</strong>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        El API devuelve que el contrato requiere {estadoFirmas?.firmasRequeridas || '?'} firmas,
                        pero no se pudieron cargar los datos de las partes.
                    </p>
                </div>
            )}

            <div className="firma-footer-info">
                <div className="info-icon">
                    <img src="/eidas-badge.png" alt="eIDAS" style={{ height: '24px' }} />
                </div>
                <div className="info-content">
                    <strong>Firma Electrónica gestionada por EAD Trust (QTSP):</strong> Sellos de tiempo cualificados
                    y evidencias técnicas según Reglamento UE 910/2014 (eIDAS).
                </div>
            </div>
        </div>
    );
};
