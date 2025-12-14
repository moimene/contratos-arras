import { lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EstadoBadge from './components/EstadoBadge';
import ResumenContrato from './components/ResumenContrato';
import DashboardOverview from './components/DashboardOverview';
import DashboardSection from './components/DashboardSection';
import { EidasBadge } from '../../components/branding/TrustBadges';
import Navbar from '../../components/layout/Navbar';
import { useContrato } from '../../hooks/useContrato';
import { useTipoRolUsuario, ROL_LABELS, ROL_ICONS } from '../../hooks/useTipoRolUsuario';
import { useContratoDashboardVM } from './hooks/useContratoDashboardVM';
import { isPostFirma } from '../../domain/contrato';

// =============================================================================
// LAZY LOADED COMPONENTS - Solo se cargan cuando la sección se expande
// =============================================================================

// Componentes críticos (first fold) - carga síncrona
// EstadoBadge, ResumenContrato, DashboardOverview ya están arriba

// Componentes secundarios - lazy load
const TimelineEvento = lazy(() => import('./components/TimelineEvento'));
const GestorDocumental = lazy(() => import('../../components/GestorDocumental/GestorDocumental'));
const GestorComunicaciones = lazy(() => import('../../components/GestorComunicaciones/GestorComunicaciones'));
const CertificadoEventos = lazy(() => import('../../components/CertificadoEventos/CertificadoEventos'));
const ChatPanel = lazy(() => import('../../components/ChatPanel/ChatPanel'));
const ChecklistNotaria = lazy(() => import('../../components/notaria/ChecklistNotaria'));
const FirmaElectronica = lazy(() =>
    import('../../components/firma/FirmaElectronica').then(m => ({ default: m.FirmaElectronica }))
);

// Fallback de carga para secciones
function SectionLoader() {
    return (
        <div className="section-loading">
            <div className="loading-spinner small" />
            <span>Cargando...</span>
        </div>
    );
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

    // Use the centralized hook for contract data
    const { contrato, loading, error, refetch } = useContrato(contratoId);

    // Get the current user's role (query param > localStorage > fallback)
    const { role: rolActual, source: roleSource } = useTipoRolUsuario();

    // Use the ViewModel for UI logic derivation (with role for task engine)
    const vm = useContratoDashboardVM(contrato, rolActual);

    /**
     * Determina el paso del wizard al que debe navegar según el progreso del contrato
     */
    const getWizardStep = (): number => {
        if (!contrato) return 1;

        // Si está en FIRMADO o más avanzado, solo mostrar dashboard
        if (isPostFirma(contrato.estado)) {
            return 6; // Dashboard
        }

        const hasInmueble = contrato.inmueble && contrato.inmueble.direccion_completa;
        const hasPartes = contrato.partes && contrato.partes.length >= 2;
        const hasAcuerdo = contrato.datos_wizard?.acuerdo ||
            (contrato.tipo_arras && contrato.precio_total && contrato.importe_arras);
        const hasResumenAceptado = contrato.datos_wizard?.aceptado || contrato.estado === 'BORRADOR';
        const hasBorrador = contrato.estado === 'BORRADOR';

        // Determinar paso según progreso
        if (!hasInmueble) return 1;
        if (!hasAcuerdo) return 2;
        if (!hasPartes) return 3;
        if (!hasResumenAceptado) return 4;
        if (!hasBorrador) return 5;

        return 6;
    };

    const handleVolverWizard = () => {
        if (isEmbedded && onVolverWizard) {
            onVolverWizard();
        } else {
            const step = getWizardStep();

            if (!contrato || isPostFirma(contrato.estado)) {
                navigate('/');
                return;
            }

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
                                ← Volver
                            </button>
                        </div>
                    </div>
                </header>

                {/* Layout de 2 columnas */}
                <div className="dashboard-layout">
                    {/* Sidebar izquierda - Solo ResumenContrato */}
                    <aside className="sidebar-left">
                        <ResumenContrato contrato={contrato} />
                    </aside>

                    {/* Contenido principal */}
                    <main className="main-content">
                        {/* PRIMER PLIEGUE: Overview con alertas, acciones y resumen */}
                        <DashboardOverview
                            contratoId={contrato.id}
                            estado={contrato.estado}
                            acciones={vm.accionesSugeridas}
                            contadores={vm.contadores}
                            onGoTo={vm.onGoTo}
                        />

                        {/* Panel de Firma Electrónica - Solo visible en fase de firma */}
                        {vm.flags.showFirma && (
                            <DashboardSection
                                id="firma"
                                title="Firma Electrónica"
                                icon="✍️"
                                defaultOpen={true}
                            >
                                <Suspense fallback={<SectionLoader />}>
                                    <FirmaElectronica
                                        contratoId={contrato.id}
                                        onFirmaCompletada={refetch}
                                        onTodasFirmasCompletas={refetch}
                                    />
                                </Suspense>
                            </DashboardSection>
                        )}

                        {/* Sección Documentos */}
                        <DashboardSection
                            id="documentos"
                            title="Documentos"
                            icon="📁"
                            badgeCount={vm.contadores.docsPendientes}
                            badgeType={vm.contadores.docsPendientes > 0 ? 'warning' : 'info'}
                            defaultOpen={vm.contadores.docsPendientes > 0}
                        >
                            <Suspense fallback={<SectionLoader />}>
                                <GestorDocumental contratoId={contrato.id} rolActual={rolActual} />
                            </Suspense>
                        </DashboardSection>

                        {/* Sección Notaría - Solo visible post-firma */}
                        {vm.flags.showNotaria && (
                            <DashboardSection
                                id="notaria"
                                title="Notaría"
                                icon="⚖️"
                                defaultOpen={true}
                            >
                                <Suspense fallback={<SectionLoader />}>
                                    <ChecklistNotaria contratoId={contrato.id} />
                                </Suspense>
                            </DashboardSection>
                        )}

                        {/* Sección Comunicaciones */}
                        <DashboardSection
                            id="comunicaciones"
                            title="Comunicaciones"
                            icon="📧"
                            defaultOpen={false}
                        >
                            <Suspense fallback={<SectionLoader />}>
                                <GestorComunicaciones contratoId={contrato.id} rolActual={rolActual} />
                            </Suspense>
                        </DashboardSection>

                        {/* Sección Timeline */}
                        <DashboardSection
                            id="timeline"
                            title="Timeline de Eventos"
                            icon="⏱️"
                            badgeCount={vm.contadores.eventosTotal}
                            badgeType="info"
                            defaultOpen={false}
                        >
                            <Suspense fallback={<SectionLoader />}>
                                <TimelineEvento eventos={contrato.eventos || []} />
                            </Suspense>
                        </DashboardSection>

                        {/* Sección Certificado */}
                        <DashboardSection
                            id="certificado"
                            title="Certificado de Eventos"
                            icon="📜"
                            defaultOpen={false}
                        >
                            <Suspense fallback={<SectionLoader />}>
                                <CertificadoEventos contratoId={contrato.id} />
                            </Suspense>
                        </DashboardSection>

                        {/* Sección Chat */}
                        <DashboardSection
                            id="chat"
                            title="Chat del Expediente"
                            icon="💬"
                            defaultOpen={false}
                        >
                            <Suspense fallback={<SectionLoader />}>
                                <ChatPanel contratoId={contrato.id} />
                            </Suspense>
                        </DashboardSection>

                    </main>
                </div>
            </div>
        </>
    );
}
