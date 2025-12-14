import React from 'react';
import { getEstadoConfig } from '../../../domain/contrato';

interface EstadoBadgeProps {
    estado: string;
}

/**
 * EstadoBadge - Muestra el estado del contrato con icono y color apropiado.
 * Usa la configuración centralizada del dominio para consistencia.
 */
export default function EstadoBadge({ estado }: EstadoBadgeProps) {
    const config = getEstadoConfig(estado);

    return (
        <div className={`estado-badge ${config.className}`}>
            <span className="estado-icon">{config.icon}</span>
            <span className="estado-label">{config.label}</span>
        </div>
    );
}
