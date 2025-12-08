import React from 'react';

interface ResumenContratoProps {
    datos: {
        inmueble: any;
        contrato: any;
        compradores: any[];
        vendedores: any[];
    };
}

export default function ResumenContrato({ datos }: ResumenContratoProps) {
    const { inmueble, contrato, compradores, vendedores } = datos;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="resumen-contrato">
            <h3>📋 Resumen del Contrato</h3>

            <section className="resumen-seccion">
                <h4>🏠 Inmueble</h4>
                <div className="resumen-item">
                    <span className="label">Dirección:</span>
                    <span className="value">
                        {inmueble.direccion_completa}
                    </span>
                </div>
                <div className="resumen-item">
                    <span className="label">Ciudad:</span>
                    <span className="value">{inmueble.ciudad}, {inmueble.provincia}</span>
                </div>
                {inmueble.codigo_postal && (
                    <div className="resumen-item">
                        <span className="label">C.P.:</span>
                        <span className="value">{inmueble.codigo_postal}</span>
                    </div>
                )}
                {inmueble.referencia_catastral && (
                    <div className="resumen-item">
                        <span className="label">Ref. Catastral:</span>
                        <span className="value">{inmueble.referencia_catastral}</span>
                    </div>
                )}
            </section>

            <section className="resumen-seccion">
                <h4>💰 Condiciones Económicas</h4>
                <div className="resumen-item">
                    <span className="label">Precio Total:</span>
                    <span className="value destacado">{formatCurrency(contrato.precio_total)}</span>
                </div>
                <div className="resumen-item">
                    <span className="label">Arras:</span>
                    <span className="value">
                        {formatCurrency(contrato.importe_arras)} ({contrato.porcentaje_arras}%)
                    </span>
                </div>
                <div className="resumen-item">
                    <span className="label">Naturaleza:</span>
                    <span className="value capitalize">{contrato.tipo_arras}</span>
                </div>
                <div className="resumen-item">
                    <span className="label">Fecha Límite:</span>
                    <span className="value">{formatDate(contrato.fecha_limite_firma_escritura)}</span>
                </div>
            </section>

            <section className="resumen-seccion">
                <h4>👥 Partes</h4>
                <div className="resumen-item">
                    <span className="label">Vendedores:</span>
                    <span className="value">
                        {vendedores.map((v, i) => (
                            <div key={i} className="parte-item">
                                {v.nombre} {v.apellidos} ({v.numero_documento})
                            </div>
                        ))}
                    </span>
                </div>
                <div className="resumen-item">
                    <span className="label">Compradores:</span>
                    <span className="value">
                        {compradores.map((c, i) => (
                            <div key={i} className="parte-item">
                                {c.nombre} {c.apellidos} ({c.numero_documento})
                            </div>
                        ))}
                    </span>
                </div>
            </section>

            {contrato.modoEstandarObservatorio && (
                <section className="resumen-seccion modo-icade">
                    <div className="icade-badge">
                        <span className="icade-icon">✓</span>
                        <span>Modo Estándar Legaltech</span>
                    </div>
                </section>
            )}
        </div>
    );
}
