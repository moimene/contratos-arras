import React from 'react';
import './TrustBadges.css';

interface TrustBadgesProps {
    variant?: 'full' | 'compact' | 'footer';
    showEidas?: boolean;
}

export const TrustBadges: React.FC<TrustBadgesProps> = ({
    variant = 'full',
    showEidas = true
}) => {
    if (variant === 'compact') {
        return (
            <div className="trust-badges trust-badges-compact">
                {showEidas && (
                    <img
                        src="/eidas-badge.png"
                        alt="eIDAS Qualified Trust Services"
                        className="eidas-badge-small"
                    />
                )}
                <span className="trust-text-compact">
                    Servicios de Confianza Cualificados
                </span>
            </div>
        );
    }

    if (variant === 'footer') {
        return (
            <div className="trust-badges trust-badges-footer">
                <div className="trust-footer-logos">
                    <div className="trust-creator">
                        <span className="trust-label">Una plataforma de</span>
                        <img
                            src="/g-digital-logo.png"
                            alt="g-digital Grupo Garrigues"
                            className="logo-g-digital"
                        />
                    </div>
                    <div className="trust-operator">
                        <span className="trust-label">Operada por</span>
                        <img
                            src="/ead-trust-logo.png"
                            alt="EAD Trust QTSP"
                            className="logo-ead-trust"
                        />
                    </div>
                    {showEidas && (
                        <img
                            src="/eidas-badge.png"
                            alt="eIDAS"
                            className="eidas-badge-footer"
                        />
                    )}
                </div>
            </div>
        );
    }

    // variant === 'full'
    return (
        <div className="trust-badges trust-badges-full">
            <div className="trust-row">
                <div className="trust-creator">
                    <span className="trust-label">Una plataforma de</span>
                    <img
                        src="/g-digital-logo.png"
                        alt="g-digital Grupo Garrigues"
                        className="logo-g-digital"
                    />
                </div>
                <div className="trust-divider"></div>
                <div className="trust-operator">
                    <span className="trust-label">Operada por el QTSP</span>
                    <img
                        src="/ead-trust-logo.png"
                        alt="EAD Trust"
                        className="logo-ead-trust"
                    />
                </div>
            </div>
            {showEidas && (
                <div className="trust-eidas-row">
                    <img
                        src="/eidas-badge.png"
                        alt="eIDAS Qualified Trust Services"
                        className="eidas-badge"
                    />
                    <span className="eidas-text">
                        Servicios de Confianza Cualificados según Reglamento UE 910/2014
                    </span>
                </div>
            )}
        </div>
    );
};

export const EidasBadge: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({
    size = 'small'
}) => {
    return (
        <img
            src="/eidas-badge.png"
            alt="eIDAS"
            className={`eidas-badge eidas-badge-${size}`}
            title="Servicios de Confianza Cualificados - Reglamento eIDAS"
        />
    );
};
