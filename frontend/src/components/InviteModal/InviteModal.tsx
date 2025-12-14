/**
 * InviteModal - Modal completo para invitar usuarios a un expediente
 * 
 * Campos:
 * - Email destino (opcional para enlace abierto)
 * - Rol invitado (COMPRADOR, VENDEDOR, TERCERO, NOTARIO, OBSERVADOR)
 * - Tipo mandato (solo si TERCERO)
 * - Permisos (solo si TERCERO)
 * - Caducidad
 * - Mensaje opcional
 */

import { useState, useEffect } from 'react';
import './InviteModal.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface InviteModalProps {
    contratoId: string;
    userId?: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

type RolInvitado = 'COMPRADOR' | 'VENDEDOR' | 'TERCERO' | 'NOTARIO' | 'OBSERVADOR';
type TipoMandato = 'PARTE_COMPRADORA' | 'PARTE_VENDEDORA' | 'AMBAS_PARTES' | 'NOTARIA' | 'OBSERVADOR_TECNICO';

const ROL_OPTIONS: { value: RolInvitado; label: string; icon: string; description: string }[] = [
    { value: 'COMPRADOR', label: 'Comprador', icon: '🔑', description: 'Parte que adquiere el inmueble' },
    { value: 'VENDEDOR', label: 'Vendedor', icon: '🏠', description: 'Parte que vende el inmueble' },
    { value: 'TERCERO', label: 'Asesor / Agencia', icon: '🧭', description: 'Profesional que actúa en nombre de una parte' },
    { value: 'NOTARIO', label: 'Notaría', icon: '⚖️', description: 'Fedatario público para la escritura' },
    { value: 'OBSERVADOR', label: 'Observador', icon: '👁️', description: 'Solo lectura, sin acciones' }
];

const MANDATO_OPTIONS: { value: TipoMandato; label: string; description: string }[] = [
    { value: 'PARTE_COMPRADORA', label: 'Asesor de la parte compradora', description: 'Actúa en representación del comprador' },
    { value: 'PARTE_VENDEDORA', label: 'Asesor de la parte vendedora', description: 'Actúa en representación del vendedor' },
    { value: 'AMBAS_PARTES', label: 'Agencia (ambas partes)', description: 'Intermediario de ambas partes' }
];

interface PermisosMandato {
    puedeSubirDocumentos: boolean;
    puedeInvitar: boolean;
    puedeValidarDocumentos: boolean;
    puedeFirmar: boolean;
}

export default function InviteModal({ contratoId, userId, isOpen, onClose, onSuccess }: InviteModalProps) {
    // Form state
    const [email, setEmail] = useState('');
    const [rolInvitado, setRolInvitado] = useState<RolInvitado>('COMPRADOR');
    const [tipoMandato, setTipoMandato] = useState<TipoMandato>('PARTE_COMPRADORA');
    const [permisos, setPermisos] = useState<PermisosMandato>({
        puedeSubirDocumentos: true,
        puedeInvitar: false,
        puedeValidarDocumentos: false,
        puedeFirmar: false
    });
    const [diasCaducidad, setDiasCaducidad] = useState(7);
    const [mensaje, setMensaje] = useState('');
    const [enlaceAbierto, setEnlaceAbierto] = useState(false);

    // UI state
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resultado, setResultado] = useState<{ token: string; invitationUrl: string } | null>(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setEmail('');
            setRolInvitado('COMPRADOR');
            setTipoMandato('PARTE_COMPRADORA');
            setPermisos({ puedeSubirDocumentos: true, puedeInvitar: false, puedeValidarDocumentos: false, puedeFirmar: false });
            setDiasCaducidad(7);
            setMensaje('');
            setEnlaceAbierto(false);
            setError(null);
            setResultado(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSending(true);

        try {
            const fechaCaducidad = new Date();
            fechaCaducidad.setDate(fechaCaducidad.getDate() + diasCaducidad);

            const body: Record<string, any> = {
                rolInvitado,
                fechaCaducidad: fechaCaducidad.toISOString(),
                mensajeOpcional: mensaje || null
            };

            // Email only if not "enlace abierto"
            if (!enlaceAbierto && email) {
                body.emailDestino = email;
            }

            // Mandate and permissions for TERCERO
            if (rolInvitado === 'TERCERO') {
                body.tipoMandato = tipoMandato;
                body.permisosMandato = permisos;
            }

            const response = await fetch(`${API_URL}/api/contratos/${contratoId}/invitaciones`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(userId ? { 'x-user-id': userId } : {})
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (data.success) {
                setResultado({
                    token: data.data.token,
                    invitationUrl: data.data.invitationUrl
                });
                onSuccess?.();
            } else {
                setError(data.error || 'Error al crear invitación');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Enlace copiado al portapapeles');
    };

    const getPreviewText = (): string => {
        const rolLabel = ROL_OPTIONS.find(r => r.value === rolInvitado)?.label || rolInvitado;

        if (rolInvitado === 'TERCERO') {
            const mandatoLabel = MANDATO_OPTIONS.find(m => m.value === tipoMandato)?.label || tipoMandato;
            const permsText = [];
            if (permisos.puedeSubirDocumentos) permsText.push('subir documentos');
            if (permisos.puedeInvitar) permsText.push('invitar usuarios');
            if (permisos.puedeFirmar) permsText.push('firmar');

            return `Invitarás a ${email || 'alguien'} como **${mandatoLabel}** con permiso para ${permsText.join(', ') || 'solo lectura'}.`;
        }

        return `Invitarás a ${email || 'alguien'} como **${rolLabel}**.`;
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="invite-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2>✉️ Invitar a alguien</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {/* Success state */}
                {resultado ? (
                    <div className="modal-success">
                        <div className="success-icon">✅</div>
                        <h3>¡Invitación creada!</h3>
                        <p>Comparte este enlace con el invitado:</p>
                        <div className="link-box">
                            <input
                                type="text"
                                value={resultado.invitationUrl}
                                readOnly
                            />
                            <button onClick={() => copyToClipboard(resultado.invitationUrl)}>
                                📋 Copiar
                            </button>
                        </div>
                        <button className="btn-primary" onClick={onClose}>Cerrar</button>
                    </div>
                ) : (
                    /* Form */
                    <form onSubmit={handleSubmit}>
                        {/* Error */}
                        {error && (
                            <div className="form-error">⚠️ {error}</div>
                        )}

                        {/* Email or Open link */}
                        <div className="form-section">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={enlaceAbierto}
                                    onChange={e => setEnlaceAbierto(e.target.checked)}
                                />
                                Crear enlace abierto (sin email específico)
                            </label>

                            {!enlaceAbierto && (
                                <div className="form-field">
                                    <label>Email del invitado</label>
                                    <input
                                        type="email"
                                        placeholder="email@ejemplo.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required={!enlaceAbierto}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Role selection */}
                        <div className="form-section">
                            <label>Rol en el expediente</label>
                            <div className="role-grid">
                                {ROL_OPTIONS.map(rol => (
                                    <button
                                        key={rol.value}
                                        type="button"
                                        className={`role-option ${rolInvitado === rol.value ? 'selected' : ''}`}
                                        onClick={() => setRolInvitado(rol.value)}
                                    >
                                        <span className="role-icon">{rol.icon}</span>
                                        <span className="role-label">{rol.label}</span>
                                    </button>
                                ))}
                            </div>
                            <p className="role-description">
                                {ROL_OPTIONS.find(r => r.value === rolInvitado)?.description}
                            </p>
                        </div>

                        {/* Mandato selection (only for TERCERO) */}
                        {rolInvitado === 'TERCERO' && (
                            <div className="form-section highlight">
                                <label>¿En nombre de quién actúa?</label>
                                <div className="mandato-options">
                                    {MANDATO_OPTIONS.map(mandato => (
                                        <label
                                            key={mandato.value}
                                            className={`mandato-option ${tipoMandato === mandato.value ? 'selected' : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                name="tipoMandato"
                                                value={mandato.value}
                                                checked={tipoMandato === mandato.value}
                                                onChange={e => setTipoMandato(e.target.value as TipoMandato)}
                                            />
                                            <span className="mandato-label">{mandato.label}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* Permissions */}
                                <div className="permisos-section">
                                    <label>Permisos del mandato</label>
                                    <div className="permisos-grid">
                                        <label className="permiso-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={permisos.puedeSubirDocumentos}
                                                onChange={e => setPermisos(p => ({ ...p, puedeSubirDocumentos: e.target.checked }))}
                                            />
                                            <span>📄 Subir documentos</span>
                                        </label>
                                        <label className="permiso-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={permisos.puedeInvitar}
                                                onChange={e => setPermisos(p => ({ ...p, puedeInvitar: e.target.checked }))}
                                            />
                                            <span>✉️ Invitar usuarios</span>
                                        </label>
                                        <label className="permiso-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={permisos.puedeValidarDocumentos}
                                                onChange={e => setPermisos(p => ({ ...p, puedeValidarDocumentos: e.target.checked }))}
                                            />
                                            <span>✅ Validar documentos</span>
                                        </label>
                                        <label className="permiso-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={permisos.puedeFirmar}
                                                onChange={e => setPermisos(p => ({ ...p, puedeFirmar: e.target.checked }))}
                                            />
                                            <span>✍️ Firmar contrato</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Expiration and message */}
                        <div className="form-section form-row">
                            <div className="form-field">
                                <label>Caduca en</label>
                                <select
                                    value={diasCaducidad}
                                    onChange={e => setDiasCaducidad(Number(e.target.value))}
                                >
                                    <option value={1}>1 día</option>
                                    <option value={3}>3 días</option>
                                    <option value={7}>7 días</option>
                                    <option value={14}>14 días</option>
                                    <option value={30}>30 días</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-section">
                            <div className="form-field">
                                <label>Mensaje (opcional)</label>
                                <textarea
                                    placeholder="Añade un mensaje personal para el invitado..."
                                    value={mensaje}
                                    onChange={e => setMensaje(e.target.value)}
                                    rows={2}
                                />
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="preview-section">
                            <strong>Vista previa:</strong>
                            <p dangerouslySetInnerHTML={{
                                __html: getPreviewText().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            }} />
                        </div>

                        {/* Submit */}
                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={onClose}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn-primary" disabled={sending}>
                                {sending ? 'Enviando...' : '✉️ Crear invitación'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
