/**
 * DashboardSection - Componente de sección colapsable con anchor
 * 
 * Cada sección del dashboard puede:
 * - Expandirse/colapsarse
 * - Tener un anchor para navegación directa
 * - Mostrar contador de items pendientes
 */

import React, { useState, useRef, useEffect } from 'react';
import './DashboardSection.css';

interface DashboardSectionProps {
    id: string;
    title: string;
    icon?: string;
    badgeCount?: number;
    badgeType?: 'info' | 'warning' | 'success' | 'danger';
    defaultOpen?: boolean;
    priority?: number;
    children: React.ReactNode;
}

export default function DashboardSection({
    id,
    title,
    icon,
    badgeCount,
    badgeType = 'info',
    defaultOpen = false,
    children
}: DashboardSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const sectionRef = useRef<HTMLDivElement>(null);

    // Abrir sección si hay hash en la URL que coincide
    useEffect(() => {
        if (window.location.hash === `#${id}`) {
            setIsOpen(true);
            setTimeout(() => {
                sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [id]);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
        }
    };

    return (
        <section
            id={`seccion-${id}`}
            ref={sectionRef}
            className={`dashboard-section ${isOpen ? 'open' : 'closed'}`}
        >
            <header
                className="section-header"
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="button"
                aria-expanded={isOpen}
                aria-controls={`section-content-${id}`}
            >
                <div className="section-title">
                    {icon && <span className="section-icon">{icon}</span>}
                    <h3>{title}</h3>
                    {badgeCount !== undefined && badgeCount > 0 && (
                        <span className={`section-badge ${badgeType}`}>
                            {badgeCount}
                        </span>
                    )}
                </div>
                <span className={`section-chevron ${isOpen ? 'open' : ''}`}>
                    ▼
                </span>
            </header>

            <div
                id={`section-content-${id}`}
                className={`section-content ${isOpen ? 'expanded' : 'collapsed'}`}
                aria-hidden={!isOpen}
            >
                {isOpen && children}
            </div>
        </section>
    );
}
