/**
 * Select Component - Garrigues UI Kit
 * 
 * Select con label, helper text y estados
 */

import React, { type SelectHTMLAttributes, forwardRef, useId } from 'react';
import './Select.css';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    label: string;
    options: SelectOption[];
    placeholder?: string;
    helperText?: string;
    error?: string;
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    (
        {
            label,
            options,
            placeholder,
            helperText,
            error,
            size = 'md',
            fullWidth = false,
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
            'ui-select',
            `ui-select--${size}`,
            fullWidth && 'ui-select--full-width',
            hasError && 'ui-select--error',
            disabled && 'ui-select--disabled',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className={wrapperClasses}>
                <label htmlFor={id} className="ui-select__label">
                    {label}
                    {required && <span className="ui-select__required" aria-hidden="true">*</span>}
                </label>

                <div className="ui-select__wrapper">
                    <select
                        ref={ref}
                        id={id}
                        className="ui-select__input"
                        disabled={disabled}
                        required={required}
                        aria-invalid={hasError}
                        aria-describedby={
                            [hasError && errorId, helperText && helperId].filter(Boolean).join(' ') || undefined
                        }
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((option) => (
                            <option key={option.value} value={option.value} disabled={option.disabled}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <span className="ui-select__arrow" aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M3.5 4.5L6 7L8.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                    </span>
                </div>

                {hasError && (
                    <p id={errorId} className="ui-select__error" role="alert">
                        {error}
                    </p>
                )}

                {helperText && !hasError && (
                    <p id={helperId} className="ui-select__helper">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';

export default Select;
