import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { ConvocatoriaNotarial } from '../../components/notaria/ConvocatoriaNotarial';
import ChecklistNotaria from '../../components/notaria/ChecklistNotaria';
import { EidasBadge } from '../../components/branding/TrustBadges';
import './NotariaPage.css';

interface ContratoInfo {
    id: string;
    numero_expediente: string;
    estado: string;
    inmueble?: {
        direccion_completa: string;
        ciudad: string;
    };
}

type TabType = 'convocatoria' | 'checklist';

const NotariaPage: React.FC = () => {
    const { contratoId } = useParams<{ contratoId: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('convocatoria');
    const [contrato, setContrato] = useState<ContratoInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cargarContrato = useCallback(async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            setError(null);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/contratos/${contratoId}`, { signal });

            if (signal?.aborted) return;

            if (!response.ok) {
                throw new Error('Error al cargar el contrato');
            }

            const data = await response.json();
            setContrato(data);
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error('Error:', err);
            setError(err.message || 'Error al cargar el contrato');
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [contratoId]);

    useEffect(() => {
        if (contratoId) {
            const controller = new AbortController();
            cargarContrato(controller.signal);
            return () => controller.abort();
        }
    }, [contratoId, cargarContrato]);

    const handleCitaCreada = (citaId: string) => {
        console.log('Cita creada:', citaId);
        // Cambiar a la pestaña de checklist después de crear la cita
        setActiveTab('checklist');
    };

    const handleVolverDashboard = () => {
        navigate(`/dashboard/${contratoId}`);
    };

    if (!contratoId) {
        return (
            <div className="notaria-page">
                <Navbar />
                <div className="notaria-error">
                    <p>❌ No se especificó un contrato</p>
                    <button onClick={() => navigate('/expedientes')} className="btn btn-primary">
                        Volver a Expedientes
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="notaria-page">
                <div className="notaria-container">
                    {/* Header */}
                    <header className="notaria-header">
                        <div className="header-left">
                            <button
                                onClick={handleVolverDashboard}
                                className="btn-volver"
                            >
                                ← Volver al Dashboard
                            </button>
                            <div className="header-info">
                                <h1>
                                    <EidasBadge size="small" />
                                    Gestión de Notaría
                                </h1>
                                {contrato && (
                                    <p className="expediente-info">
                                        {contrato.numero_expediente} • {contrato.inmueble?.direccion_completa}, {contrato.inmueble?.ciudad}
                                    </p>
                                )}
                            </div>
                        </div>
                    </header>

                    {loading ? (
                        <div className="notaria-loading">
                            <div className="loading-spinner"></div>
                            <p>Cargando información del contrato...</p>
                        </div>
                    ) : error ? (
                        <div className="notaria-error">
                            <p>⚠️ {error}</p>
                            <button onClick={() => cargarContrato()} className="btn btn-secondary">
                                Reintentar
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Tabs */}
                            <div className="notaria-tabs">
                                <button
                                    className={`tab ${activeTab === 'convocatoria' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('convocatoria')}
                                >
                                    📅 Convocatoria Notarial
                                </button>
                                <button
                                    className={`tab ${activeTab === 'checklist' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('checklist')}
                                >
                                    📋 Checklist Documental
                                </button>
                            </div>

                            {/* Content */}
                            <div className="notaria-content">
                                {activeTab === 'convocatoria' && (
                                    <ConvocatoriaNotarial
                                        contratoId={contratoId}
                                        onCitaCreada={handleCitaCreada}
                                    />
                                )}
                                {activeTab === 'checklist' && (
                                    <ChecklistNotaria
                                        contratoId={contratoId}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default NotariaPage;
