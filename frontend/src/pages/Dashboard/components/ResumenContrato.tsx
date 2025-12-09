/**
 * ResumenContrato - Summary panel for contract dashboard
 * 
 * Displays key contract information: property, terms, and parties
 */

interface ContratoData {
    id: string;
    numero_expediente: string;
    estado: string;
    tipo_arras: string;
    precio_total: number;
    importe_arras: number;
    porcentaje_arras_calculado?: number;
    fecha_limite_firma_escritura: string;
    inmueble: {
        direccion_completa: string;
        ciudad: string;
        provincia: string;
        codigo_postal?: string;
        referencia_catastral?: string;
    };
    partes: Array<{
        rol_en_contrato: string;
        parte: {
            nombre: string;
            apellidos: string;
            numero_documento: string;
        };
    }>;
}

interface ResumenContratoProps {
    contrato: ContratoData;
}

export default function ResumenContrato({ contrato }: ResumenContratoProps) {
    const { inmueble, partes } = contrato;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'No especificada';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Extract parties by role
    const vendedores = partes?.filter(p => p.rol_en_contrato === 'VENDEDOR') || [];
    const compradores = partes?.filter(p => p.rol_en_contrato === 'COMPRADOR') || [];

    return (
        <div className="resumen-contrato">
            <h3>📋 Resumen del Contrato</h3>

            <section className="resumen-seccion">
                <h4>🏠 Inmueble</h4>
                <div className="resumen-item">
                    <span className="label">Dirección:</span>
                    <span className="value">
                        {inmueble?.direccion_completa || 'N/A'}
                    </span>
                </div>
                <div className="resumen-item">
                    <span className="label">Ciudad:</span>
                    <span className="value">
                        {inmueble?.ciudad || 'N/A'}
                        {inmueble?.provincia && `, ${inmueble.provincia}`}
                    </span>
                </div>
                {inmueble?.codigo_postal && (
                    <div className="resumen-item">
                        <span className="label">C.P.:</span>
                        <span className="value">{inmueble.codigo_postal}</span>
                    </div>
                )}
                {inmueble?.referencia_catastral && (
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
                        {formatCurrency(contrato.importe_arras)}
                        {contrato.porcentaje_arras_calculado && ` (${contrato.porcentaje_arras_calculado}%)`}
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
                        {vendedores.length > 0 ? vendedores.map((v, i) => (
                            <div key={i} className="parte-item">
                                {v.parte?.nombre} {v.parte?.apellidos} ({v.parte?.numero_documento})
                            </div>
                        )) : <span className="empty-state">Sin vendedores</span>}
                    </span>
                </div>
                <div className="resumen-item">
                    <span className="label">Compradores:</span>
                    <span className="value">
                        {compradores.length > 0 ? compradores.map((c, i) => (
                            <div key={i} className="parte-item">
                                {c.parte?.nombre} {c.parte?.apellidos} ({c.parte?.numero_documento})
                            </div>
                        )) : <span className="empty-state">Sin compradores</span>}
                    </span>
                </div>
            </section>
        </div>
    );
}
