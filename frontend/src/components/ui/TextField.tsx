/**
 * TextField Component - Garrigues UI Kit
 * 
 * Input con label, helper text, error state y validación
 */

import React, { type InputHTMLAttributes, forwardRef, useId } from 'react';
import './TextField.css';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label: string;
    helperText?: string;
    error?: string;
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
    (
        {
            label,
            helperText,
            error,
            size = 'md',
            fullWidth = false,
            leftIcon,
            rightIcon,
            disabled,
            required,
            className = '',
            id: providedId,
            ...props
        },
        ref
    ) => {
        const generatedId = useId();
        const id = providedId || generatedId;
        const helperId = `${id}-helper`;
        const errorId = `${id}-error`;

        const hasError = Boolean(error);

        const wrapperClasses = [
            'ui-textfield',
            `ui-textfield--${size}`,
            fullWidth && 'ui-textfield--full-width',
            hasError && 'ui-textfield--error',
            disabled && 'ui-textfield--disabled',
            leftIcon && 'ui-textfield--has-left-icon',
            rightIcon && 'ui-textfield--has-right-icon',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className={wrapperClasses}>
                <label htmlFor={id} className="ui-textfield__label">
                    {label}
                    {required && <span className="ui-textfield__required" aria-hidden="true">*</span>}
                </label>

                <div className="ui-textfield__input-wrapper">
                    {leftIcon && (
                        <span className="ui-textfield__icon ui-textfield__icon--left" aria-hidden="true">
                            {leftIcon}
                        </span>
                    )}

                    <input
                        ref={ref}
                        id={id}
                        className="ui-textfield__input"
                        disabled={disabled}
                        required={required}
                        aria-invalid={hasError}
                        aria-describedby={
                            [hasError && errorId, helperText && helperId].filter(Boolean).join(' ') || undefined
                        }
                        {...props}
                    />

                    {rightIcon && (
                        <span className="ui-textfield__icon ui-textfield__icon--right" aria-hidden="true">
                            {rightIcon}
                        </span>
                    )}
                </div>

                {hasError && (
                    <p id={errorId} className="ui-textfield__error" role="alert">
                        {error}
                    </p>
                )}

                {helperText && !hasError && (
                    <p id={helperId} className="ui-textfield__helper">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

TextField.displayName = 'TextField';

export default TextField;
