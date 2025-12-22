/**
 * Spinner Component - Garrigues UI Kit
 * 
 * Loading spinner animado
 */

import React from 'react';
import './Spinner.css';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
    size?: SpinnerSize;
    color?: 'primary' | 'white' | 'current';
    label?: string;
    className?: string;
}

export function Spinner({
    size = 'md',
    color = 'primary',
    label = 'Cargando...',
    className = '',
}: SpinnerProps) {
    const classes = [
        'ui-spinner',
        `ui-spinner--${size}`,
        `ui-spinner--${color}`,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classes} role="status" aria-label={label}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="31.4 31.4"
                    opacity="0.25"
                />
                <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="31.4 31.4"
                    strokeDashoffset="23.55"
                />
            </svg>
            <span className="ui-spinner__label">{label}</span>
        </div>
    );
}

export default Spinner;
