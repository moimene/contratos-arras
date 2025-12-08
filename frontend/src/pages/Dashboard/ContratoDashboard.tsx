import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EstadoBadge from './components/EstadoBadge';
import ResumenContrato from './components/ResumenContrato';
import TimelineEvento from './components/TimelineEvento';
import ProximasAcciones from './components/ProximasAcciones';

interface ContratoData {
    id: string;
    numero_expediente: string;
    estado: string;
    datos_wizard: any;
    eventos: any[];
    partes: any[];
    documentos: any[];
    mensajes: any[];
    inmueble: any;
    created_at: string;
}

interface ContratoDashboardProps {
    contratoIdProp?: string;  // ID from Context (when embedded in wizard)
    isEmbedded?: boolean;     // True when displayed as Step 6
    onVolverWizard?: () => void; // Callback to return to Step 5
}

export default function ContratoDashboard({
    contratoIdProp,
    isEmbedded = false,
    onVolverWizard
}: ContratoDashboardProps = {}) {
    const { contratoId: contratoIdUrl } = useParams<{ contratoId: string }>();
    const navigate = useNavigate();

    // Use prop if provided, otherwise use URL param
    const contratoId = contratoIdProp || contratoIdUrl;

    const [contrato, setContrato] = useState<ContratoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchContratoData();
    }, [contratoId]);

    const fetchContratoData = async () => {
        if (!contratoId) {
            setError('ID de contrato no válido');
            setLoading(false);
            return;
        }

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/contracts/${contratoId}`);

            if (!response.ok) {
                throw new Error('Contrato no encontrado');
            }

            const data = await response.json();

            if (data.success) {
                setContrato(data.data);
            } else {
                throw new Error(data.error || 'Error al cargar contrato');
            }
        } catch (err: any) {
            console.error('Error al cargar contrato:', err);
            setError(err.message || 'Error al cargar el expediente');
        } finally {
            setLoading(false);
        }
    };

    const handleVolverWizard = () => {
        if (isEmbedded && onVolverWizard) {
            onVolverWizard();
        } else {
            navigate('/');
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Cargando expediente...</p>
            </div>
        );
    }

    if (error || !contrato) {
        return (
            <div className="dashboard-error">
                <div className="error-icon">⚠️</div>
                <h2>Error al cargar expediente</h2>
                <p>{error || 'No se pudo cargar el expediente'}</p>
                <button onClick={handleVolverWizard} className="btn-primary">
                    Volver al Inicio
                </button>
            </div>
        );
    }

    return (
        <div className="contrato-dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="header-title">
                        <h1>Expediente {contrato.numero_expediente}</h1>
                        <EstadoBadge estado={contrato.estado} />
                    </div>
                    <div className="header-actions">
                        <button onClick={handleVolverWizard} className="btn-secondary">
                            ← Volver al Wizard
                        </button>
                    </div>
                </div>
            </header>

            {/* Layout de 2 columnas */}
            <div className="dashboard-layout">
                {/* Sidebar izquierda */}
                <aside className="sidebar-left">
                    <ResumenContrato datos={contrato.datos_wizard} />

                    {/* Panel de Documentos */}
                    <div className="documentos-panel">
                        <h3>📁 Documentos</h3>
                        {contrato.documentos && contrato.documentos.length > 0 ? (
                            <ul className="documentos-lista">
                                {contrato.documentos.map((doc: any) => (
                                    <li key={doc.id} className="documento-item">
                                        <span className="documento-icono">📄</span>
                                        <div className="documento-info">
                                            <div className="documento-nombre">{doc.nombre_original}</div>
                                            <div className="documento-meta">
                                                {doc.tipo} · {new Date(doc.fecha_hora_subida).toLocaleDateString('es-ES')}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="empty-state">No hay documentos subidos aún</p>
                        )}
                    </div>
                </aside>

                {/* Contenido principal */}
                <main className="main-content">
                    {/* Panel de Próximas Acciones */}
                    <ProximasAcciones
                        contratoId={contrato.id}
                        estado={contrato.estado}
                        firmasCompletas={contrato.estado === 'FIRMADO' || contrato.estado === 'CONVOCATORIA_NOTARIAL'}
                    />

                    <TimelineEvento eventos={contrato.eventos || []} />

                    {/* Chat Panel (placeholder para futuro) */}
                    <div className="chat-panel">
                        <h3>💬 Chat del Expediente</h3>
                        {contrato.mensajes && contrato.mensajes.length > 0 ? (
                            <div className="mensajes-lista">
                                {contrato.mensajes.map((mensaje: any) => (
                                    <div key={mensaje.id} className="mensaje-item">
                                        <div className="mensaje-header">
                                            <span className="mensaje-autor">
                                                {mensaje.es_sistema ? '🤖 Sistema' : '👤 Usuario'}
                                            </span>
                                            <span className="mensaje-fecha">
                                                {new Date(mensaje.created_at).toLocaleString('es-ES')}
                                            </span>
                                        </div>
                                        <div className="mensaje-contenido">{mensaje.mensaje}</div>
                                        {mensaje.es_relevante_probatoriamente && (
                                            <div className="mensaje-relevancia">
                                                ⚖️ Relevante Probatoriamente
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="empty-state">No hay mensajes aún</p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
