// ICADE Contract Template - Observatorio Legaltech Garrigues-ICADE v2.0
// CC BY 4.0 License

export const ICADE_METADATA = {
    cartela: "Estándar del Observatorio Legaltech Garrigues-ICADE (versión 2.0) • CC BY 4.0",
    version: "2.0",
    license: "CC BY 4.0",
    scope: "Vivienda en España bajo derecho civil común, sin hipoteca ni arrendatarios",
};

export const ICADE_TITLES = {
    PENITENCIALES: "Contrato de compraventa con arras penitenciales",
    CONFIRMATORIAS: "Contrato de compraventa con arras confirmatorias",
    PENALES: "Contrato de compraventa con arras penales",
};

export const ICADE_INTRO = {
    PENITENCIALES: `Este contrato es para la compraventa de una vivienda sujeta a arras penitenciales; las arras permiten desistir antes de la escritura con consecuencias económicas: si desiste la parte compradora, pierde las arras; si desiste la parte vendedora, deberá devolverlas duplicadas. La transmisión de la propiedad se produce al otorgar la escritura pública de compraventa. Alcance: vivienda ubicada en España bajo derecho civil común, sin hipoteca ni arrendatarios.`,
    CONFIRMATORIAS: `Este contrato es para la compraventa de una vivienda sujeta a arras confirmatorias; las arras confirman el contrato y, ante incumplimiento, la parte cumplidora podrá exigir el cumplimiento o la resolución con daños y perjuicios. La transmisión de la propiedad se produce al otorgar la escritura pública de compraventa. Alcance: vivienda ubicada en España bajo derecho civil común, sin hipoteca ni arrendatarios.`,
    PENALES: `Este contrato es para la compraventa de una vivienda sujeta a arras penales; las arras operan como cláusula penal tasada por incumplimiento, sin facultar desistimiento libre. La transmisión de la propiedad se produce al otorgar la escritura pública de compraventa. Alcance: vivienda ubicada en España bajo derecho civil común, sin hipoteca ni arrendatarios.`,
};

// Cláusula 1: Objeto
export const CLAUSULA_1 = {
    titulo: "1. Objeto",
    "1.1": {
        titulo: "1.1 Objeto.",
        texto_PENITENCIALES: "La parte vendedora vende la Vivienda a la parte compradora. La Vivienda se encuentra en buen estado de conservación y mantenimiento, y se vende con los derechos y accesorios que le pertenecen. Al firmar un contrato de compraventa con arras penitenciales, las partes pueden desistir de la compraventa con las consecuencias siguientes: si desiste la parte compradora, pierde el Importe de las Arras; si desiste la parte vendedora, tiene que devolver el Importe de las Arras multiplicado por dos.",
        texto_CONFIRMATORIAS: "La parte vendedora vende la Vivienda a la parte compradora. La Vivienda se encuentra en buen estado de conservación y mantenimiento, y se vende con los derechos y accesorios que le pertenecen. Las arras tienen naturaleza confirmatoria y refuerzan el contrato; ante incumplimiento, la parte cumplidora podrá exigir el cumplimiento o la resolución con indemnización de daños y perjuicios.",
        texto_PENALES: "La parte vendedora vende la Vivienda a la parte compradora. La Vivienda se encuentra en buen estado de conservación y mantenimiento, y se vende con los derechos y accesorios que le pertenecen. Las arras tienen naturaleza penal y operan como cláusula penal tasada por incumplimiento, sin conferir derecho de desistimiento unilateral.",
    },
    "1.2": {
        titulo: "1.2 Finalización de la compraventa.",
        texto: "La entrega de la Vivienda y la transmisión de su propiedad a la parte compradora se harán en el momento de otorgar la escritura pública de compraventa.",
    },
    "1.3": {
        titulo: "1.3 Estado de la Vivienda.",
        texto: `La parte vendedora manifiesta: (a) Gastos e impuestos: la Vivienda se encuentra al corriente de pago (IBI, comunidad, tasas); entregará certificado de comunidad en la escritura. (b) Cargas: las únicas cargas son las de comunidad y afecciones fiscales; la Nota Simple figura como Anexo 1 y no ha variado. (c) Arrendatarios y ocupantes: la Vivienda se entrega libre de inquilinos u ocupantes. (d) Situación medioambiental: no se han realizado actividades contaminantes ni recibido reclamaciones; se reiterará en escritura. (e) Certificado de eficiencia energética: solicitado y se entregará en la firma. (f) Tanteo y retracto urbanístico: la Vivienda no se halla en área con derecho de adquisición preferente; se reiterará en la escritura.`,
    },
};

// Cláusula 2: Obligaciones parte compradora
export const CLAUSULA_2 = {
    titulo: "2. Obligaciones de la parte compradora",
    "2.1": {
        titulo: "2.1 Pago de la Vivienda.",
        texto: "La parte compradora pagará el Precio de Compra (restándole las arras) mediante transferencia al IBAN y Banco indicados, al otorgar la escritura. El precio se pacta a cuerpo cierto; la parte compradora declara conocer la Vivienda (art. 1471 CC), sin perjuicio de la responsabilidad por vicios ocultos.",
    },
    "2.2": {
        titulo: "2.2 Pago de las arras.",
        intro: "La parte compradora pagará el Importe de las Arras a la parte vendedora, en una de las formas siguientes:",
        opcion_AL_FIRMAR: "(a) En el momento de la firma del Contrato de Compraventa. La parte compradora paga el Importe de las Arras al firmar y adjunta una copia de la transferencia como Anexo 3. Con este contrato, la parte vendedora confirma haber recibido el pago del Importe de las Arras.",
        opcion_POSTERIOR_PENITENCIALES: "(b) Después de la firma del Contrato de Compraventa. La parte compradora pagará el Importe de las Arras después de la firma y dentro del Plazo de Pago convenido, antes de la Fecha Límite para el Pago; se incorporará como Anexo 3 la acreditación mediante copia de la transferencia. Si no se ha pagado llegada la Fecha Límite, este contrato quedará automáticamente resuelto y sin efecto, pudiendo la parte vendedora disponer libremente de la Vivienda. Las arras son penitenciales y facultan el desistimiento conforme al art. 1454 CC y a la cláusula quinta.",
        opcion_POSTERIOR_CONFIRMATORIAS: "(b) Después de la firma del Contrato de Compraventa. La parte compradora pagará el Importe de las Arras después de la firma y dentro del Plazo de Pago convenido, antes de la Fecha Límite para el Pago; se incorporará como Anexo 3 la acreditación mediante copia de la transferencia. El impago del Importe de las Arras en plazo constituirá incumplimiento contractual, aplicándose lo dispuesto en la cláusula quinta sobre consecuencias del incumplimiento.",
        opcion_POSTERIOR_PENALES: "(b) Después de la firma del Contrato de Compraventa. La parte compradora pagará el Importe de las Arras después de la firma y dentro del Plazo de Pago convenido, antes de la Fecha Límite para el Pago; se incorporará como Anexo 3 la acreditación mediante copia de la transferencia. El impago del Importe de las Arras en plazo constituirá incumplimiento contractual, activándose la cláusula penal conforme a lo dispuesto en la cláusula quinta.",
    },
    "2.3": {
        titulo: "2.3 Notificar la cita con la Notaría.",
        texto: "La parte compradora comunicará a la vendedora la fecha de la escritura con 10 días de antelación a la fecha límite, indicando notario y domicilio en el municipio de la Vivienda; si no lo hace, se entenderá a las 12:00 h de la fecha límite, ante el Notario indicado en la Portada o, en su defecto, el que corresponda por turno.",
    },
};

// Cláusula 3: Obligaciones parte vendedora
export const CLAUSULA_3 = {
    titulo: "3. Obligaciones de la parte vendedora",
    "3.1": {
        titulo: "3.1 Entrega de la Vivienda.",
        texto: "La parte vendedora entregará la propiedad mediante la entrega de llaves al firmar la escritura, junto con los documentos que tenga en su poder. El riesgo se transmite a la parte compradora con la entrega de llaves.",
    },
    "3.2": {
        titulo: "3.2 Periodo intermedio.",
        texto: "Desde este contrato hasta la escritura, la parte vendedora: (a) dará acceso a la Vivienda a la parte compradora, financiadora y asesores; (b) informará de incidencias; (c) mantendrá la Vivienda en estado semejante y asegurada; (d) no constituirá cargas sin consentimiento previo escrito de la parte compradora; (e) asumirá gastos e impuestos del periodo.",
    },
};

// Cláusula 4: Gastos, impuestos y suministros
export const CLAUSULA_4 = {
    titulo: "4. Otras obligaciones (Gastos, impuestos y suministros)",
    "4.1": {
        titulo: "4.1 Gastos.",
        texto: "Las partes acuerdan el pago de los gastos relacionados con este contrato y la escritura de compraventa conforme a lo indicado en la Portada.",
    },
    "4.2": {
        titulo: "4.2 Impuestos.",
        texto: "(a) Plusvalía municipal: a cargo de la parte vendedora. (b) IBI del año de la compraventa: prorrata entre compradora y vendedora por días de titularidad.",
    },
    "4.3": {
        titulo: "4.3 Suministros.",
        texto: "(a) Pago: vendedora hasta la escritura (aunque facture después); compradora desde la escritura (aunque pague la vendedora). (b) Titularidad: la parte compradora cambiará la titularidad en 10 días; de no hacerlo, la parte vendedora podrá dar de baja los contratos.",
    },
};

// Cláusula 5: Desistimiento (3 variantes según tipo de arras)
export const CLAUSULA_5_PENITENCIALES = {
    titulo: "5. Desistimiento unilateral de la compraventa",
    "5.1": {
        titulo: "5.1 Desistimiento de la parte compradora.",
        texto: "Puede desistir desde la firma hasta la fecha prevista para la escritura; perderá el Importe de las Arras a favor de la parte vendedora, bastando notificación conforme a la cláusula 6. Si no acude o se niega a firmar/pagar, se entiende desistimiento salvo justa causa (cargas no comunicadas, ocupación no prevista); con justa causa, podrá resolver sin penalización y recuperar las arras.",
    },
    "5.2": {
        titulo: "5.2 Desistimiento de la parte vendedora.",
        texto: "Puede desistir desde la firma hasta la fecha prevista para la escritura; deberá devolver el Importe de las Arras duplicado, previa notificación y pago. La falta de comparecencia o negativa a firmar se entiende desistimiento con devolución duplicada.",
    },
    "5.3": {
        titulo: "5.3 Consideración de penalizaciones y exclusión de indemnización adicional.",
        texto: "Las penalizaciones por desistimiento compensan los perjuicios por no otorgar la escritura; se excluyen otras indemnizaciones o penalizaciones.",
    },
};

export const CLAUSULA_5_CONFIRMATORIAS = {
    titulo: "5. Consecuencias del incumplimiento (arras confirmatorias)",
    "5.1": {
        titulo: "5.1 Naturaleza confirmatoria.",
        texto: "Las partes convienen que las arras tienen naturaleza confirmatoria. En caso de incumplimiento imputable a una de las partes, la parte cumplidora podrá optar entre (i) exigir el cumplimiento del contrato, con indemnización de daños y perjuicios, o (ii) resolver el contrato, con indemnización de daños y perjuicios.",
    },
    "5.2": {
        titulo: "5.2 Imputación de las arras.",
        texto: "El importe entregado como arras se imputará, en su caso, a la liquidación de daños y perjuicios, sin perjuicio de su devolución o retención conforme a la opción ejercitada por la parte cumplidora.",
    },
    "5.3": {
        titulo: "5.3 Exclusión del desistimiento.",
        texto: "Las partes reconocen que las previsiones precedentes sustituyen cualquier facultad de desistimiento unilateral propia de las arras penitenciales.",
    },
};

export const CLAUSULA_5_PENALES = {
    titulo: "5. Cláusula penal (arras penales)",
    "5.1": {
        titulo: "5.1 Naturaleza penal.",
        texto: "Las partes acuerdan que las arras tienen naturaleza penal. En caso de incumplimiento imputable a una de las partes, esta abonará a la parte cumplidora la penalización pactada equivalente al Importe de las Arras, sin perjuicio de que dicha penalización se entienda como límite máximo de daños salvo pacto en contrario.",
    },
    "5.2": {
        titulo: "5.2 Exclusión del desistimiento.",
        texto: "Las arras penales no confieren a ninguna parte el derecho de desistir unilateralmente del contrato.",
    },
    "5.3": {
        titulo: "5.3 Moderación.",
        texto: "El juez o tribunal no podrá moderar la pena salvo que así lo permita la ley aplicable o se pacte expresamente.",
    },
};

// Cláusula 6: Notificaciones
export const CLAUSULA_6 = {
    titulo: "6. Notificaciones",
    "6.1": {
        titulo: "6.1 Notificaciones escritas.",
        texto: "Se realizarán por escrito a los correos electrónicos o direcciones postales indicados en la Portada; los cambios de dirección notificados sustituyen a los indicados en Portada.",
    },
    "6.2": {
        titulo: "6.2 Fecha de efectos.",
        texto: "La fecha será la del sistema usado (email) o la de entrega (correo certificado), aunque la otra parte la lea más tarde o no la lea, salvo culpa del remitente.",
    },
};

// Cláusula 7: Cesión
export const CLAUSULA_7 = {
    titulo: "7. Cesión",
    texto: "La parte compradora podrá ceder su posición antes de la escritura con consentimiento expreso y por escrito de la parte vendedora; el cesionario se subrogará en derechos y obligaciones.",
};

// Cláusula 8: Resolución de conflictos
export const CLAUSULA_8 = {
    titulo: "8. Resolución de conflictos",
    texto_JUZGADOS: "Los conflictos se resolverán ante los juzgados y tribunales del lugar de la Vivienda. Conforme a la Ley 1/2025, las partes deberán intentar un MASC (negociación, mediación, conciliación o arbitraje) antes del proceso judicial.",
    texto_ARBITRAJE: "Los conflictos se resolverán mediante arbitraje notarial de derecho, conforme al Reglamento de Arbitraje Notarial.",
};

// Cláusula 9: Ley aplicable
export const CLAUSULA_9 = {
    titulo: "9. Ley aplicable",
    texto_COMUN: "Este contrato se rige por el derecho civil común (Código Civil).",
    advertencia_FORAL: "Si la Vivienda está en Cataluña, Aragón, Navarra, Galicia, País Vasco o Baleares, la normativa foral prevalecerá y puede exigir adaptar cláusulas; las partes asumen la verificación de adecuación local.",
};

// Cláusula 10: Firma
export const CLAUSULA_10 = {
    titulo: "10. Firma",
    texto_ELECTRONICA: "Las partes podrán firmar con firma electrónica (simple, avanzada o cualificada), con los mismos efectos que la manuscrita.",
    texto_MANUSCRITA: "Las partes firmarán mediante firma manuscrita en presencia de fedatario o con reconocimiento posterior de firmas.",
};

// Anexos estándar
export const ANEXOS_ESTANDAR = [
    "Nota simple del Registro de la Propiedad",
    "Recibo del IBI",
    "Justificante de la transferencia",
    "Certificación energética",
];
