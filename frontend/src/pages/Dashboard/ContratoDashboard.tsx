import { useParams, useNavigate } from 'react-router-dom';
import EstadoBadge from './components/EstadoBadge';
import ResumenContrato from './components/ResumenContrato';
import TimelineEvento from './components/TimelineEvento';
import ProximasAcciones from './components/ProximasAcciones';
import GestorDocumental from '../../components/GestorDocumental/GestorDocumental';
import ChatPanel from '../../components/ChatPanel/ChatPanel';
import StateAlert from '../../components/StateAlert/StateAlert';
import GestorComunicaciones from '../../components/GestorComunicaciones/GestorComunicaciones';
import CertificadoEventos from '../../components/CertificadoEventos/CertificadoEventos';
import ChecklistNotaria from '../../components/notaria/ChecklistNotaria';
import { FirmaElectronica } from '../../components/firma/FirmaElectronica';
import { EidasBadge } from '../../components/branding/TrustBadges';
import Navbar from '../../components/layout/Navbar';
import { useContrato, type ContratoData } from '../../hooks/useContrato';
import { showFirma, showNotaria, isPostFirma, isTerminal } from '../../domain/contrato';

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

    // Use the centralized hook for contract data
    const { contrato, loading, error, refetch } = useContrato(contratoId);

    /**
     * Determina el paso del wizard al que debe navegar según el progreso del contrato
     */
    const getWizardStep = (): number => {
        if (!contrato) return 1;

        // Si está en FIRMADO o más avanzado, solo mostrar dashboard
        if (['FIRMADO', 'NOTARIA', 'TERMINADO', 'LITIGIO'].includes(contrato.estado)) {
            return 6; // Dashboard
        }

        const hasInmueble = contrato.inmueble && contrato.inmueble.direccion_completa;
        const hasPartes = contrato.partes && contrato.partes.length >= 2;
        const hasAcuerdo = contrato.datos_wizard?.acuerdo ||
            (contrato.tipo_arras && contrato.precio_total && contrato.importe_arras);
        const hasResumenAceptado = contrato.datos_wizard?.aceptado || contrato.estado === 'BORRADOR';
        const hasBorrador = contrato.estado === 'BORRADOR';

        // Determinar paso según progreso
        if (!hasInmueble) {
            return 1; // Step1Inmueble
        }
        if (!hasAcuerdo) {
            return 2; // Step2Acuerdo
        }
        if (!hasPartes) {
            return 3; // Step3Partes
        }
        if (!hasResumenAceptado) {
            return 4; // Step4Resumen
        }
        if (!hasBorrador) {
            return 5; // Step5Borrador
        }

        return 6; // Step6Firma/Dashboard
    };

    const handleVolverWizard = () => {
        if (isEmbedded && onVolverWizard) {
            onVolverWizard();
        } else {
            // Navegación inteligente según el progreso
            const step = getWizardStep();

            // Si estado es FIRMADO o posterior, ir al inicio
            if (!contrato || ['FIRMADO', 'NOTARIA', 'TERMINADO', 'LITIGIO'].includes(contrato.estado)) {
                navigate('/');
                return;
            }

            // Navegar al wizard con el paso correspondiente
            navigate(`/wizard/${contrato.id}?step=${step}`);
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
        <>
            <Navbar />
            <div className="contrato-dashboard">
                {/* Header */}
                <header className="dashboard-header">
                    <div className="header-content">
                        <div className="header-title">
                            <EidasBadge size="small" />
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
                        <ResumenContrato contrato={contrato} />

                        {/* Gestor Documental completo */}
                        <GestorDocumental contratoId={contrato.id} rolActual="ADMIN" />
                    </aside>

                    {/* Contenido principal */}
                    <main className="main-content">
                        {/* Alerta de transición de estado */}
                        <StateAlert contratoId={contrato.id} currentState={contrato.estado} />

                        {/* Panel de Próximas Acciones */}
                        <ProximasAcciones
                            contratoId={contrato.id}
                            estado={contrato.estado}
                            firmasCompletas={contrato.estado === 'FIRMADO' || contrato.estado === 'CONVOCATORIA_NOTARIAL'}
                        />

                        {/* Panel de Firma Electrónica - Visible en BORRADOR e INICIADO */}
                        {showFirma(contrato.estado) && (
                            <FirmaElectronica
                                contratoId={contrato.id}
                                onFirmaCompletada={refetch}
                                onTodasFirmasCompletas={refetch}
                            />
                        )}

                        {/* Checklist Notaría - Visible en fase NOTARIA o posterior */}
                        {showNotaria(contrato.estado) && (
                            <ChecklistNotaria contratoId={contrato.id} />
                        )}

                        <TimelineEvento eventos={contrato.eventos || []} />

                        {/* Gestor de Comunicaciones */}
                        <GestorComunicaciones contratoId={contrato.id} rolActual="ADMIN" />

                        {/* Certificado de Eventos */}
                        <CertificadoEventos contratoId={contrato.id} />

                        {/* Chat Panel */}
                        <ChatPanel contratoId={contrato.id} />
                    </main>
                </div>
            </div>
        </>
    );
}
