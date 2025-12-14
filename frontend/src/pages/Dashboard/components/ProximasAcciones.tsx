import React from 'react';

/**
 * Acción sugerida para el usuario.
 * Tipo importable para uso externo.
 */
export interface AccionSugerida {
    id: string;
    icon: string;
    titulo: string;
    descripcion: string;
    accion: (() => void) | null;
    disabled: boolean;
    primary?: boolean;
}

interface ProximasAccionesProps {
    acciones: AccionSugerida[];
}

/**
 * ProximasAcciones - Dumb component que muestra las acciones sugeridas.
 * 
 * Este componente no conoce estados ni lógica de negocio.
 * Las acciones son derivadas por el ViewModel y pasadas como props.
 */
export default function ProximasAcciones({ acciones }: ProximasAccionesProps) {
    if (acciones.length === 0) {
        return null;
    }

    return (
        <div className="proximas-acciones-panel">
            <h3 className="panel-titulo">
                <span className="titulo-icon">🎯</span>
                Próximas Acciones
            </h3>
            <div className="acciones-grid">
                {acciones.map((accion) => (
                    <div
                        key={accion.id}
                        className={`accion-card ${accion.disabled ? 'disabled' : ''} ${accion.primary ? 'primary' : ''}`}
                        onClick={accion.disabled || !accion.accion ? undefined : accion.accion}
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
