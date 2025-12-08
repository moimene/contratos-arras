import React from 'react';

interface ParteCardProps {
    parte: any; // PersonaFisica | PersonaJuridica
    onRemove: () => void;
}

export const ParteCard: React.FC<ParteCardProps> = ({ parte, onRemove }) => {
    const isPersonaFisica = parte.tipo === 'PERSONA_FISICA';

    return (
        <div className="parte-card-full">
            <div className="parte-info-full">
                {isPersonaFisica ? (
                    <>
                        <h4>{parte.nombre} {parte.apellidos}</h4>
                        <p><strong>{parte.tipo_documento}:</strong> {parte.numero_documento}</p>
                        <p><strong>Email:</strong> {parte.email}</p>
                        {parte.estado_civil === 'CASADO' && (
                            <p><strong>Estado civil:</strong> Casado/a ({parte.regimen_economico || 'No especificado'})</p>
                        )}
                        {parte.requiere_consentimiento_conyuge && (
                            <p className="warning-text">⚠️ Requiere consentimiento del cónyuge</p>
                        )}
                    </>
                ) : (
                    <>
                        <h4>🏢 {parte.denominacion}</h4>
                        <p><strong>CIF:</strong> {parte.cif}</p>
                        {parte.domicilio_social && <p><strong>Domicilio:</strong> {parte.domicilio_social}</p>}
                        {parte.representante && (
                            <>
                                <p className="representante-info">
                                    <strong>Representante:</strong> {parte.representante.nombre} {parte.representante.apellidos}
                                </p>
                                <p><strong>Tipo:</strong> {getTipoRepresentanteLabel(parte.representante.tipo_representante)}</p>
                                {parte.representante.base_representacion === 'PODER' && parte.representante.poder_notarial && (
                                    <small className="poder-info">
                                        Poder notarial: {parte.representante.poder_notarial.notario}, {' '}
                                        Protocolo {parte.representante.poder_notarial.protocolo}
                                    </small>
                                )}
                            </>
                        )}
                    </>
                )}

                <p><strong>Participación:</strong> {parte.porcentaje}%</p>
                <div className="flags">
                    {parte.obligado_aceptar && <span className="flag-badge">Acepta</span>}
                    {parte.obligado_firmar && <span className="flag-badge">Firma</span>}
                </div>
            </div>
            <button type="button" onClick={onRemove} className="btn-remove">🗑️</button>
        </div>
    );
};

function getTipoRepresentanteLabel(tipo: string): string {
    const labels: Record<string, string> = {
        ADMINISTRADOR_UNICO: 'Administrador único',
        ADMINISTRADOR_SOLIDARIO: 'Administrador solidario',
        ADMINISTRADOR_MANCOMUNADO: 'Administrador mancomunado',
        APODERADO: 'Apoderado',
        OTRO: 'Otro'
    };
    return labels[tipo] || tipo;
}
