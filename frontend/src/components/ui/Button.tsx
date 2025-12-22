/**
 * Button Component - Garrigues UI Kit
 * 
 * Variantes: primary, secondary, tertiary, danger
 * Estados: default, hover, active, focus, disabled, loading
 */

import React, { type ButtonHTMLAttributes, forwardRef } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    fullWidth?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            loading = false,
            fullWidth = false,
            leftIcon,
            rightIcon,
            children,
            disabled,
            className = '',
            ...props
        },
        ref
    ) => {
        const classes = [
            'ui-button',
            `ui-button--${variant}`,
            `ui-button--${size}`,
            fullWidth && 'ui-button--full-width',
            loading && 'ui-button--loading',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <button
                ref={ref}
                className={classes}
                disabled={disabled || loading}
                aria-busy={loading}
                {...props}
            >
                {loading && (
                    <span className="ui-button__spinner" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray="31.4 31.4"
                            />
                        </svg>
                    </span>
                )}
                {!loading && leftIcon && (
                    <span className="ui-button__icon ui-button__icon--left">{leftIcon}</span>
                )}
                <span className="ui-button__text">{children}</span>
                {!loading && rightIcon && (
                    <span className="ui-button__icon ui-button__icon--right">{rightIcon}</span>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
