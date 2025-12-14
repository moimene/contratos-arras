/**
 * MandatoSelector - Selector visual "Actuando como..."
 * 
 * Muestra el mandato activo y permite cambiar si hay múltiples.
 * Se integra en el header del dashboard.
 */

import { useState, useRef, useEffect } from 'react';
import { useMandatoContext, getMandatoLabel, getMandatoIcon } from '../../contexts/MandatoContext';
import './MandatoSelector.css';

interface MandatoSelectorProps {
    compact?: boolean;
}

export default function MandatoSelector({ compact = false }: MandatoSelectorProps) {
    const {
        mandatoActivo,
        mandatosDisponibles,
        tieneMultiplesMandatos,
        necesitaSeleccion,
        setMandatoActivoId,
        loading
    } = useMandatoContext();

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (loading) {
        return (
            <div className="mandato-selector loading">
                <span className="loading-dot"></span>
            </div>
        );
    }

    // No mandates = no selector
    if (mandatosDisponibles.length === 0) {
        return null;
    }

    // Force selection overlay
    if (necesitaSeleccion) {
        return (
            <div className="mandato-selector force-selection" ref={dropdownRef}>
                <div className="force-selection-badge" onClick={() => setIsOpen(!isOpen)}>
                    ⚠️ Selecciona tu rol activo
                </div>
                {isOpen && (
                    <div className="mandato-dropdown open">
                        <div className="dropdown-header">
                            ¿En nombre de quién actúas?
                        </div>
                        {mandatosDisponibles.map(mandato => (
                            <button
                                key={mandato.id}
                                className="mandato-option"
                                onClick={() => {
                                    setMandatoActivoId(mandato.id);
                                    setIsOpen(false);
                                }}
                            >
                                <span className="option-icon">
                                    {getMandatoIcon(mandato.tipo_mandato)}
                                </span>
                                <span className="option-label">
                                    {getMandatoLabel(mandato.tipo_mandato)}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Normal view with active mandate
    if (!mandatoActivo) return null;

    return (
        <div
            className={`mandato-selector ${tieneMultiplesMandatos ? 'has-dropdown' : ''} ${compact ? 'compact' : ''}`}
            ref={dropdownRef}
        >
            <button
                className="mandato-chip"
                onClick={() => tieneMultiplesMandatos && setIsOpen(!isOpen)}
                disabled={!tieneMultiplesMandatos}
                title={tieneMultiplesMandatos ? 'Cambiar mandato activo' : undefined}
            >
                <span className="chip-icon">
                    {getMandatoIcon(mandatoActivo.tipo_mandato)}
                </span>
                <span className="chip-content">
                    {!compact && <span className="chip-prefix">Actuando como:</span>}
                    <span className="chip-label">
                        {getMandatoLabel(mandatoActivo.tipo_mandato)}
                    </span>
                </span>
                {tieneMultiplesMandatos && (
                    <span className={`chip-arrow ${isOpen ? 'open' : ''}`}>▼</span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && tieneMultiplesMandatos && (
                <div className="mandato-dropdown open">
                    <div className="dropdown-header">
                        Cambiar a:
                    </div>
                    {mandatosDisponibles
                        .filter(m => m.id !== mandatoActivo.id)
                        .map(mandato => (
                            <button
                                key={mandato.id}
                                className="mandato-option"
                                onClick={() => {
                                    setMandatoActivoId(mandato.id);
                                    setIsOpen(false);
                                }}
                            >
                                <span className="option-icon">
                                    {getMandatoIcon(mandato.tipo_mandato)}
                                </span>
                                <span className="option-label">
                                    {getMandatoLabel(mandato.tipo_mandato)}
                                </span>
                            </button>
                        ))}
                </div>
            )}
        </div>
    );
}
