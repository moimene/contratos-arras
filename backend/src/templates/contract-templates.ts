/**
 * Backend Modular Contract Templates
 * Equivalent to frontend/src/contracts/icade-template.ts
 * Used by pdfService.ts for conditional clause generation
 */

// ============================================
// HELPER: Check if province is in foral territory
// ============================================
export function isTerritoryForal(provincia: string): boolean {
    const foralesProvincias = [
        'Barcelona', 'Tarragona', 'Lleida', 'Girona', // Cataluña
        'Huesca', 'Teruel', 'Zaragoza', // Aragón
        'Navarra', // Navarra
        'A Coruña', 'Lugo', 'Ourense', 'Pontevedra', // Galicia 
        'Araba/Álava', 'Gipuzkoa', 'Bizkaia', // País Vasco
        'Illes Balears', 'Baleares', // Baleares
    ];
    return foralesProvincias.some(f => provincia?.toLowerCase().includes(f.toLowerCase()));
}

// ============================================
// CLAUSULA 1: OBJETO
// ============================================
export const CLAUSULA_1_1_TEXTO = {
    PENITENCIALES: 'El Vendedor vende la Vivienda al Comprador. La Vivienda se encuentra en buen estado de conservación y mantenimiento, y se vende con los derechos y accesorios que le pertenecen. Al firmar un contrato de compraventa con arras penitenciales, las partes pueden desistir de la compraventa con las consecuencias siguientes: si desiste el Comprador, pierde el Importe de las Arras; si desiste el Vendedor, tiene que devolver el Importe de las Arras multiplicado por dos.',
    CONFIRMATORIAS: 'El Vendedor vende la Vivienda al Comprador. La Vivienda se encuentra en buen estado de conservación y mantenimiento, y se vende con los derechos y accesorios que le pertenecen. Las arras entregadas son confirmatorias: constituyen anticipo y señal del precio pactado, sin facultad de desistimiento. El incumplimiento por cualquiera de las partes dará derecho a la otra a exigir el cumplimiento forzoso o la resolución del contrato, con indemnización de daños y perjuicios.',
    PENALES: 'El Vendedor vende la Vivienda al Comprador. La Vivienda se encuentra en buen estado de conservación y mantenimiento, y se vende con los derechos y accesorios que le pertenecen. Las arras entregadas son penales: en caso de incumplimiento, la parte cumplidora podrá optar entre exigir el cumplimiento o la resolución con la pena pactada equivalente al importe de las arras, sin perjuicio de la indemnización complementaria si el daño fuese mayor.',
};

// Estado de la vivienda - versión para NO vivienda
export const CLAUSULA_1_3_NO_VIVIENDA = {
    titulo: '1.3 Estado del Inmueble.',
    parrafos: [
        { subtitulo: '(a) Gastos e impuestos.', texto: 'El Inmueble se encuentra al corriente de pago de gastos e impuestos. En particular, se encuentra al corriente de pago del impuesto sobre bienes inmuebles (IBI), de los gastos de comunidad aplicables y de cualesquiera tasas o tributos locales.' },
        { subtitulo: '(b) Cargas.', texto: 'Las únicas cargas del Inmueble son: (i) las normas y obligaciones de la comunidad de propietarios del edificio, si existiere, y (ii) las afecciones fiscales. La Nota Simple donde constan las posibles cargas inscritas figura como Anexo 1.' },
        { subtitulo: '(c) Arrendatarios y ocupantes.', texto: 'El Inmueble se entrega libre de arrendatarios, ocupantes o usuarios de cualquier clase.' },
        { subtitulo: '(d) Licencias y autorizaciones.', texto: 'El Vendedor declara que el Inmueble cuenta con las licencias y autorizaciones administrativas exigibles y se encuentra en situación de legalidad urbanística.' },
    ],
};

// Estado de la vivienda - versión estándar
export const CLAUSULA_1_3_VIVIENDA_ITEMS = [
    { title: 'Gastos e impuestos.', text: 'La Vivienda se encuentra al corriente de pago de gastos e impuestos. En particular, se encuentra al corriente de pago del impuesto sobre bienes inmuebles (IBI), de los gastos de la comunidad de propietarios y de la tasa de recogida de residuos urbanos.' },
    { title: 'Cargas.', text: 'Las únicas cargas de la Vivienda son: (i) las normas y obligaciones de la comunidad de propietarios del edificio, y (ii) las afecciones fiscales. La Nota Simple donde constan las posibles cargas inscritas sobre la vivienda figura como Anexo 1.' },
    { title: 'Arrendatarios y ocupantes.', text: 'La Vivienda se entrega libre de inquilinos u ocupantes.' },
    { title: 'Certificado de eficiencia energética.', text: 'El Vendedor ha solicitado el certificado de eficiencia energética y entregará el original al Comprador a la vez que se firme la escritura de compraventa.' },
];

// Cláusula adicional: Mobiliario/Equipamiento
export const CLAUSULA_1_X_MOBILIARIO = {
    titulo: '1.X Mobiliario y Equipamiento.',
    texto: 'La compraventa incluye el mobiliario y equipamiento que figura en el inventario adjunto como Anexo X. Dicho mobiliario forma parte indisoluble del contrato y se valora a efectos fiscales en [IMPORTE] euros, que se encuentra incluido en el Precio de Compra. El Vendedor declara que el mobiliario es de su propiedad y se encuentra libre de cargas.',
};

// ============================================
// CLAUSULA 2: OBLIGACIONES DEL COMPRADOR (ESCROW)
// ============================================
export const CLAUSULA_2_2_ESCROW = {
    titulo: '2.2 Depósito en Cuenta Indisponible (Escrow).',
    texto: 'El Importe de las Arras se depositará en cuenta indisponible (escrow) gestionada por [DEPOSITARIO], con condiciones de liberación según se pacte. El depositario liberará los fondos al Vendedor únicamente previa instrucción conjunta de ambas partes o resolución judicial/arbitral firme. Los costes de gestión de la cuenta serán por cuenta de [PARTE QUE ASUME COSTE].',
};

// Pago arras normal (AL_FIRMAR / POSTERIOR)
export const CLAUSULA_2_2_NORMAL = {
    titulo: '2.2 Pago de las arras.',
    intro: 'Las arras son penitenciales y facultan al Comprador y al Vendedor para desistir del presente Contrato de Compraventa unilateralmente, de acuerdo con el artículo 1.454 del Código Civil.',
    opcion_AL_FIRMAR: 'El pago de las arras se realiza en el momento de la firma del Contrato. Se adjunta justificante de pago como Anexo 3.',
    opcion_POSTERIOR_PENITENCIALES: 'El pago de las arras se realizará después de la firma del Contrato. Si no se paga dentro del Plazo de Pago, el presente contrato quedará sin efecto por condición resolutoria, sin necesidad de declaración adicional.',
    opcion_POSTERIOR_CONFIRMATORIAS: 'El pago de las arras se realizará después de la firma del Contrato. El impago dentro del plazo pactado constituirá incumplimiento esencial que facultará al Vendedor para resolver el contrato con indemnización.',
    opcion_POSTERIOR_PENALES: 'El pago de las arras se realizará después de la firma del Contrato. El impago dentro del plazo pactado activará la cláusula penal pactada.',
};

// ============================================
// CLAUSULA 3: OBLIGACIONES DEL VENDEDOR
// ============================================
export const CLAUSULA_3_X_HIPOTECA = {
    titulo: '3.X Cancelación de hipoteca.',
    texto: 'El Vendedor se compromete a destinar parte del precio de venta a la cancelación de la hipoteca que grava la Vivienda y a otorgar la correspondiente escritura de cancelación registral antes o simultáneamente a la escritura de compraventa. El Comprador podrá retener del precio la cantidad necesaria para asegurar la cancelación.',
};

// ============================================
// CLAUSULA 4: OTRAS OBLIGACIONES
// ============================================
export const CLAUSULA_4_2_NO_VIVIENDA = {
    titulo: '4.2 Régimen fiscal de la transmisión.',
    parrafos: [
        { subtitulo: '(a) IVA o ITP.', texto: 'Las partes constatan que la transmisión puede estar sujeta a IVA (si el Vendedor es empresario o profesional y el Inmueble es de primera o segunda entrega sin uso) o a Impuesto sobre Transmisiones Patrimoniales (ITP), según corresponda legalmente. El coste de IVA o ITP será por cuenta de la parte compradora.' },
        { subtitulo: '(b) Plusvalía municipal.', texto: 'El Vendedor abonará el Impuesto sobre el Incremento de Valor de los Terrenos de Naturaleza Urbana (plusvalía municipal).' },
    ],
};

export const CLAUSULA_4_X_RETENCIONES = {
    titulo: '4.X Retenciones sobre el precio.',
    texto: 'El Comprador retendrá la cantidad de [IMPORTE_RETENCION] euros del precio pactado, en garantía de [CONCEPTO_RETENCION]. Dicha retención se liberará al Vendedor cuando se acredite debidamente [CONDICION_LIBERACION].',
};

// ============================================
// CLAUSULA 5: DESISTIMIENTO/INCUMPLIMIENTO (según tipo arras)
// ============================================
export const CLAUSULA_5 = {
    PENITENCIALES: {
        titulo: '5. DESISTIMIENTO UNILATERAL DE LA COMPRAVENTA',
        clausulas: [
            { num: '5.1', titulo: 'Desistimiento del Comprador.', texto: 'El Comprador puede desistir unilateralmente del Contrato desde su firma hasta la escritura. Si lo hace, perderá el Importe de las Arras a favor del Vendedor.' },
            { num: '5.2', titulo: 'Desistimiento del Vendedor.', texto: 'El Vendedor puede desistir unilateralmente de la compraventa. En este caso, deberá devolver al Comprador duplicado el Importe de las Arras recibido.' },
        ],
    },
    CONFIRMATORIAS: {
        titulo: '5. INCUMPLIMIENTO DEL CONTRATO',
        clausulas: [
            { num: '5.1', titulo: 'Naturaleza de las arras.', texto: 'Las arras entregadas son confirmatorias y constituyen señal y parte del precio pactado. No facultan a las partes para desistir unilateralmente del contrato.' },
            { num: '5.2', titulo: 'Incumplimiento del Comprador.', texto: 'Si el Comprador incumple sus obligaciones esenciales, el Vendedor podrá optar entre: (a) exigir el cumplimiento forzoso, o (b) resolver el contrato reteniendo las arras y reclamando además los daños y perjuicios que excedan de dicho importe.' },
            { num: '5.3', titulo: 'Incumplimiento del Vendedor.', texto: 'Si el Vendedor incumple sus obligaciones esenciales, el Comprador podrá optar entre: (a) exigir el cumplimiento forzoso, o (b) resolver el contrato exigiendo la devolución duplicada de las arras más los daños y perjuicios adicionales.' },
            { num: '5.4', titulo: 'Indemnización adicional.', texto: 'Las partes acuerdan que la indemnización establecida en las cláusulas anteriores es mínima. Si el daño efectivo fuese superior, la parte perjudicada podrá reclamar la diferencia.' },
        ],
    },
    PENALES: {
        titulo: '5. RÉGIMEN DE INCUMPLIMIENTO Y CLÁUSULA PENAL',
        clausulas: [
            { num: '5.1', titulo: 'Naturaleza de las arras.', texto: 'Las arras entregadas son penales: operan como garantía del cumplimiento y como tasación anticipada del daño en caso de incumplimiento. No facultan para el desistimiento libre.' },
            { num: '5.2', titulo: 'Incumplimiento del Comprador.', texto: 'Si el Comprador incumple sus obligaciones esenciales, perderá el Importe de las Arras en concepto de pena. El Vendedor podrá además optar entre exigir el cumplimiento efectivo o resolver el contrato.' },
            { num: '5.3', titulo: 'Incumplimiento del Vendedor.', texto: 'Si el Vendedor incumple sus obligaciones esenciales, deberá devolver duplicadas las arras recibidas en concepto de pena. El Comprador podrá además optar entre exigir el cumplimiento efectivo o resolver el contrato.' },
            { num: '5.4', titulo: 'Carácter de la pena.', texto: 'Las partes acuerdan expresamente que la pena establecida es cumulativa: podrá exigirse junto con la indemnización de los daños adicionales que excedan su importe, conforme al artículo 1.153 del Código Civil.' },
        ],
    },
};

// ============================================
// CLAUSULA 8: RESOLUCIÓN DE CONFLICTOS
// ============================================
export const CLAUSULA_8 = {
    JUZGADOS: 'Cualquier controversia que surja en relación con el presente Contrato se someterá a los juzgados y tribunales del lugar donde se encuentra la Vivienda.',
    ARBITRAJE: 'Las partes acuerdan someter cualquier controversia relacionada con este Contrato a arbitraje notarial de derecho, conforme al Reglamento de la Junta de Decanos de los Colegios Notariales de España.',
};

// ============================================
// CLAUSULA 9: LEY APLICABLE
// ============================================
export const CLAUSULA_9 = {
    COMUN: 'Este Contrato de Compraventa se rige por el Código Civil y demás normativa estatal aplicable.',
    FORAL: 'Este Contrato de Compraventa se rige por el Derecho civil propio del territorio donde se ubica la vivienda, con aplicación supletoria del Código Civil estatal.',
};

// ============================================
// CLAUSULA 10: FIRMA
// ============================================
export const CLAUSULA_10 = {
    ELECTRONICA: 'Las partes declaran que la presente firma electrónica tiene plena validez y efectos conforme a la Ley 6/2020, de 11 de noviembre, reguladora de determinados aspectos de los servicios electrónicos de confianza, y el Reglamento (UE) nº 910/2014 (eIDAS).',
    MANUSCRITA: 'Las partes firman el presente contrato de su puño y letra, manifestando su conformidad con todas las cláusulas y condiciones aquí recogidas.',
};
