import React from 'react';

interface EstadoBadgeProps {
    estado: string;
}

const ESTADO_CONFIG: Record<string, { label: string; className: string; icon: string }> = {
    BORRADOR: { label: 'Borrador', className: 'estado-borrador', icon: '📝' },
    EN_NEGOCIACION: { label: 'En Negociación', className: 'estado-en-negociacion', icon: '💬' },
    TERMINOS_ESENCIALES_ACEPTADOS: { label: 'Términos Aceptados', className: 'estado-terminos-aceptados', icon: '✅' },
    BORRADOR_GENERADO: { label: 'Borrador Generado', className: 'estado-borrador-generado', icon: '📄' },
    FIRMADO: { label: 'Firmado', className: 'estado-firmado', icon: '✍️' },
    DECLARADO_PAGO: { label: 'Pago Declarado', className: 'estado-declarado-pago', icon: '💳' },
    ARRAS_ACREDITADAS: { label: 'Arras Acreditadas', className: 'estado-arras-acreditadas', icon: '💰' },
    INTERIM: { label: 'Periodo Interim', className: 'estado-interim', icon: '⏳' },
    CONVOCATORIA_ESCRITURA: { label: 'Convocatoria Escritura', className: 'estado-convocatoria', icon: '📅' },
    ESCRITURA_OTORGADA: { label: 'Escritura Otorgada', className: 'estado-escritura-otorgada', icon: '🎉' },
    RESUELTO: { label: 'Resuelto', className: 'estado-resuelto', icon: '⚠️' },
    CERRADO: { label: 'Cerrado', className: 'estado-cerrado', icon: '🔒' },
};

export default function EstadoBadge({ estado }: EstadoBadgeProps) {
    const config = ESTADO_CONFIG[estado] || {
        label: estado,
        className: 'estado-desconocido',
        icon: '❓'
    };

    return (
        <div className={`estado-badge ${config.className}`}>
            <span className="estado-icon">{config.icon}</span>
            <span className="estado-label">{config.label}</span>
        </div>
    );
}
