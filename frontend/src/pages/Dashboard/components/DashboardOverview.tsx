/**
 * DashboardOverview - Panel de resumen del primer pliegue
 * 
 * Muestra en el primer pliegue:
 * - StateAlert (alertas de estado)
 * - ProximasAcciones
 * - Resumen de pendientes por sección
 */

import React from 'react';
import StateAlert from '../../../components/StateAlert/StateAlert';
import ProximasAcciones from './ProximasAcciones';
import type { AccionSugerida } from './ProximasAcciones';
import './DashboardOverview.css';

interface ContadoresResumen {
    docsPendientes: number;
    docsSubidos: number;
    docsValidados: number;
    docsRechazados: number;
    eventosTotal: number;
}

interface DashboardOverviewProps {
    contratoId: string;
    estado: string;
    acciones: AccionSugerida[];
    contadores: ContadoresResumen;
    onGoTo: (seccion: string) => void;
}

export default function DashboardOverview({
    contratoId,
    estado,
    acciones,
    contadores,
    onGoTo
}: DashboardOverviewProps) {
    const totalDocs = contadores.docsPendientes + contadores.docsSubidos +
        contadores.docsValidados + contadores.docsRechazados;

    const progresoDocs = totalDocs > 0
        ? Math.round((contadores.docsValidados / totalDocs) * 100)
        : 0;

    return (
        <div className="dashboard-overview">
            {/* Alerta de estado */}
            <StateAlert contratoId={contratoId} currentState={estado} />

            {/* Próximas acciones */}
            <ProximasAcciones acciones={acciones} />

            {/* Resumen de pendientes */}
            <div className="overview-resumen">
                <h3 className="resumen-titulo">
                    <span className="titulo-icon">📊</span>
                    Resumen del Expediente
                </h3>

                <div className="resumen-grid">
                    {/* Documentos */}
                    <div
                        className="resumen-card documentos"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onGoTo('documentos'); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onGoTo('documentos'); } }}
                        role="button"
                        tabIndex={0}
                    >
                        <div className="card-header">
                            <span className="card-icon">📁</span>
                            <span className="card-title">Documentos</span>
                        </div>
                        <div className="card-stats">
                            <div className="stat-row">
                                <span className="stat-label">Pendientes</span>
                                <span className={`stat-value ${contadores.docsPendientes > 0 ? 'warning' : ''}`}>
                                    {contadores.docsPendientes}
                                </span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">Validados</span>
                                <span className="stat-value success">{contadores.docsValidados}</span>
                            </div>
                            {contadores.docsRechazados > 0 && (
                                <div className="stat-row">
                                    <span className="stat-label">Rechazados</span>
                                    <span className="stat-value danger">{contadores.docsRechazados}</span>
                                </div>
                            )}
                        </div>
                        <div className="card-progress">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${progresoDocs}%` }}
                                />
                            </div>
                            <span className="progress-label">{progresoDocs}% completado</span>
                        </div>
                        <div className="card-action">Ver documentos →</div>
                    </div>

                    {/* Timeline */}
                    <div
                        className="resumen-card timeline"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onGoTo('timeline'); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onGoTo('timeline'); } }}
                        role="button"
                        tabIndex={0}
                    >
                        <div className="card-header">
                            <span className="card-icon">⏱️</span>
                            <span className="card-title">Timeline</span>
                        </div>
                        <div className="card-stats">
                            <div className="stat-row">
                                <span className="stat-label">Eventos registrados</span>
                                <span className="stat-value">{contadores.eventosTotal}</span>
                            </div>
                        </div>
                        <div className="card-action">Ver timeline →</div>
                    </div>

                    {/* Comunicaciones */}
                    <div
                        className="resumen-card comunicaciones"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onGoTo('comunicaciones'); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onGoTo('comunicaciones'); } }}
                        role="button"
                        tabIndex={0}
                    >
                        <div className="card-header">
                            <span className="card-icon">📧</span>
                            <span className="card-title">Comunicaciones</span>
                        </div>
                        <div className="card-action">Ver comunicaciones →</div>
                    </div>

                    {/* Certificado */}
                    <div
                        className="resumen-card certificado"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onGoTo('certificado'); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onGoTo('certificado'); } }}
                        role="button"
                        tabIndex={0}
                    >
                        <div className="card-header">
                            <span className="card-icon">📜</span>
                            <span className="card-title">Certificado</span>
                        </div>
                        <div className="card-action">Ver certificado →</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
