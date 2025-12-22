/**
 * Modal Component - Garrigues UI Kit
 * 
 * Modal con focus trap, cierre con Esc, y restauración de foco
 */

import React, { useEffect, useRef, useCallback } from 'react';
import './Modal.css';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    footer?: React.ReactNode;
    closeOnOverlay?: boolean;
    closeOnEsc?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    title,
    size = 'md',
    children,
    footer,
    closeOnOverlay = true,
    closeOnEsc = true,
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Guardar elemento activo antes de abrir
    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement as HTMLElement;
        }
    }, [isOpen]);

    // Focus trap y restaurar foco al cerrar
    useEffect(() => {
        if (!isOpen) {
            if (previousActiveElement.current) {
                previousActiveElement.current.focus();
            }
            return;
        }

        const modal = modalRef.current;
        if (!modal) return;

        // Focus en el modal
        const focusableElements = modal.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        firstElement?.focus();

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        modal.addEventListener('keydown', handleTabKey);
        return () => modal.removeEventListener('keydown', handleTabKey);
    }, [isOpen]);

    // Cerrar con Esc
    useEffect(() => {
        if (!isOpen || !closeOnEsc) return;

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, closeOnEsc, onClose]);

    // Prevenir scroll del body
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleOverlayClick = useCallback(
        (e: React.MouseEvent) => {
            if (closeOnOverlay && e.target === e.currentTarget) {
                onClose();
            }
        },
        [closeOnOverlay, onClose]
    );

    if (!isOpen) return null;

    return (
        <div
            className="ui-modal-overlay"
            onClick={handleOverlayClick}
            aria-hidden="true"
        >
            <div
                ref={modalRef}
                className={`ui-modal ui-modal--${size}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <header className="ui-modal__header">
                    <h2 id="modal-title" className="ui-modal__title">
                        {title}
                    </h2>
                    <button
                        type="button"
                        className="ui-modal__close"
                        onClick={onClose}
                        aria-label="Cerrar modal"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                        </svg>
                    </button>
                </header>

                <div className="ui-modal__body">{children}</div>

                {footer && <footer className="ui-modal__footer">{footer}</footer>}
            </div>
        </div>
    );
}

export default Modal;
