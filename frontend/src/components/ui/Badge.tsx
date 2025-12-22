/**
 * Badge Component - Garrigues UI Kit
 * 
 * Badges para estados, contadores, etiquetas
 */

import React from 'react';
import './Badge.css';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
    variant?: BadgeVariant;
    size?: BadgeSize;
    dot?: boolean;
    children?: React.ReactNode;
    className?: string;
}

export function Badge({
    variant = 'default',
    size = 'md',
    dot = false,
    children,
    className = '',
}: BadgeProps) {
    const classes = [
        'ui-badge',
        `ui-badge--${variant}`,
        `ui-badge--${size}`,
        dot && 'ui-badge--dot',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    if (dot) {
        return <span className={classes} />;
    }

    return <span className={classes}>{children}</span>;
}

export default Badge;
