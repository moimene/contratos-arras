import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ProximasAccionesProps {
    contratoId: string;
    estado: string;
    firmasCompletas: boolean;
}

export default function ProximasAcciones({ contratoId, estado, firmasCompletas }: ProximasAccionesProps) {
    const navigate = useNavigate();

    // Determinar qué acciones mostrar según el estado
    const getAcciones = () => {
        // Si aún está en firma
        if (!firmasCompletas || estado === 'BORRADOR_GENERADO' || estado === 'EN_FIRMA') {
            return [
                {
                    icon: '✍️',
                    titulo: 'Pendiente de Firmas',
                    descripcion: 'Esperando a que todas las partes firmen el contrato',
                    accion: null,
                    disabled: true
                }
            ];
        }

        // Una vez firmado
        if (estado === 'FIRMADO') {
            return [
                {
                    icon: '📅',
                    titulo: 'Convocar a Notaría',
                    descripcion: 'Crear cita notarial y convocar a las partes',
                    accion: () => navigate(`/notaria/${contratoId}/crear`),
                    disabled: false,
                    primary: true
                },
                {
                    icon: '📋',
                    titulo: 'Checklist Documentos',
                    descripcion: 'Gestionar documentación necesaria para la escritura',
                    accion: () => navigate(`/documentos/${contratoId}`),
                    disabled: false
                },
                {
                    icon: '📜',
                    titulo: 'Generar Certificado',
                    descripcion: 'Emitir certificado histórico del expediente',
                    accion: () => navigate(`/certificado/${contratoId}/generar`),
                    disabled: false
                }
            ];
        }

        // Convocatoria notarial creada
        if (estado === 'CONVOCATORIA_NOTARIAL') {
            return [
                {
                    icon: '📄',
                    titulo: 'Gestionar Documentos',
                    descripcion: 'Subir documentación requerida para la escritura',
                    accion: () => navigate(`/documentos/${contratoId}`),
                    disabled: false,
                    primary: true
                },
                {
                    icon: '❌',
                    titulo: 'Acta de No Comparecencia',
                    descripcion: 'Generar acta si alguna parte no comparece',
                    accion: () => navigate(`/acta/${contratoId}/crear`),
                    disabled: false
                }
            ];
        }

        // Acta de no comparecencia
        if (estado === 'ACTA_NO_COMPARECENCIA' || estado === 'NO_COMPARECENCIA') {
            return [
                {
                    icon: '⏱️',
                    titulo: 'Ventana de Alegaciones',
                    descripcion: 'Periodo de 48h para alegaciones del no compareciente',
                    accion: null,
                    disabled: true
                },
                {
                    icon: '📜',
                    titulo: 'Certificado Final',
                    descripcion: 'Emitir certificado con resultado del expediente',
                    accion: () => navigate(`/certificado/${contratoId}/generar`),
                    disabled: false
                }
            ];
        }

        // Default: opciones generales
        return [
            {
                icon: '📜',
                titulo: 'Ver Certificado',
                descripcion: 'Consultar certificado del expediente',
                accion: () => navigate(`/certificado/${contratoId}`),
                disabled: false
            }
        ];
    };

    const acciones = getAcciones();

    return (
        <div className="proximas-acciones-panel">
            <h3 className="panel-titulo">
                <span className="titulo-icon">🎯</span>
                Próximas Acciones
            </h3>
            <div className="acciones-grid">
                {acciones.map((accion, idx) => (
                    <div
                        key={idx}
                        className={`accion-card ${accion.disabled ? 'disabled' : ''} ${accion.primary ? 'primary' : ''}`}
                        onClick={accion.disabled ? undefined : accion.accion}
                        style={{ cursor: accion.disabled ? 'not-allowed' : 'pointer' }}
                    >
                        <div className="accion-icon">{accion.icon}</div>
                        <div className="accion-content">
                            <h4 className="accion-titulo">{accion.titulo}</h4>
                            <p className="accion-descripcion">{accion.descripcion}</p>
                        </div>
                        {!accion.disabled && (
                            <div className="accion-arrow">→</div>
                        )}
                    </div>
                ))}
            </div>

            {/* Info adicional */}
            <div className="acciones-info">
                <div className="info-icon">💡</div>
                <div className="info-text">
                    Las acciones disponibles dependen del estado actual del expediente.
                    Completa cada fase para avanzar al siguiente paso.
                </div>
            </div>
        </div>
    );
}
