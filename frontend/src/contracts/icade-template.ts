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

// ============================================
// CLÁUSULAS MODULARES (CONDICIONALES)
// ============================================

// 1) Inmueble NO vivienda (local, oficina, solar, garaje)
export const CLAUSULA_1_3_NO_VIVIENDA = {
    titulo: "1.3 Estado del Inmueble.",
    parrafos: [
        {
            subtitulo: "(a) Gastos e impuestos.",
            texto: "La parte vendedora manifiesta que el Inmueble se encuentra al corriente de pago del Impuesto sobre Bienes Inmuebles (IBI), tasas municipales que le afecten y, en su caso, de las cuotas de comunidad de propietarios o comunidad de garajes aplicables. En el momento de otorgar la escritura de compraventa, la parte vendedora aportará los justificantes y certificados que resulten habituales para acreditar dicha circunstancia.",
        },
        {
            subtitulo: "(b) Cargas y gravámenes.",
            texto: "Las partes declaran que la situación registral del Inmueble es la que resulta de la Nota Simple que se incorpora como Anexo 1. La parte vendedora se compromete a que, en el momento de la escritura de compraventa, el Inmueble se encuentre libre de cargas, gravámenes y limitaciones distintas de las que resulten de la citada Nota Simple o de otras que la parte compradora haya aceptado expresamente.",
        },
        {
            subtitulo: "(c) Ocupación y arrendamientos.",
            texto: "Salvo que se haga constar otra cosa en la Portada o en algún Anexo, el Inmueble se entregará libre de ocupantes y arrendatarios. En caso de existir arrendamientos u otros derechos de ocupación, se detallarán en la Portada o en el Anexo correspondiente y las partes acordarán si la parte compradora se subroga en tales contratos o si la parte vendedora asume su extinción previa o simultánea a la escritura.",
        },
        {
            subtitulo: "(d) Urbanismo y medio ambiente.",
            texto: "La parte vendedora declara que, a su leal saber y entender, no se han incoado expedientes sancionadores urbanísticos o medioambientales que afecten al Inmueble, ni existe conocimiento de infracciones graves pendientes de regularización. En caso de existir, se describirán en la Portada o en el Anexo correspondiente, y las partes acordarán el régimen de asunción de responsabilidades.",
        },
        {
            subtitulo: "(e) Certificaciones técnicas y/o energéticas.",
            texto: "La parte vendedora declara que el Inmueble dispone de las certificaciones técnicas y energéticas que la normativa aplicable exija para su uso (por ejemplo, certificado de eficiencia energética, licencias de actividad u otros), y entregará a la parte compradora los documentos disponibles en la fecha de la escritura.",
        },
    ],
};

export const CLAUSULA_4_2_NO_VIVIENDA = {
    titulo: "4.2 Impuestos.",
    parrafos: [
        {
            subtitulo: "(a) Plusvalía municipal.",
            texto: "El pago de la llamada 'plusvalía municipal' corresponderá a la parte vendedora, salvo que la ley aplicable o la Portada dispongan otra cosa, en cuyo caso se estará a lo pactado.",
        },
        {
            subtitulo: "(b) IBI.",
            texto: "Las partes podrán acordar en la Portada si el IBI del ejercicio en curso se prorratea entre parte compradora y parte vendedora en función de los días de titularidad, o si se aplica cualquier otro criterio permitido por la normativa.",
        },
        {
            subtitulo: "(c) Otros impuestos y tasas.",
            texto: "En caso de tratarse de un solar, local u otro inmueble sujeto a impuestos o tasas específicas (por ejemplo, tasas de residuos comerciales, impuestos sobre construcciones, instalaciones y obras u otros), las partes indicarán en la Portada o en las Observaciones qué tributos adicionales prevén y a cargo de quién se sitúan.",
        },
    ],
};

// 2) Pago de arras en depósito/escrow
export const CLAUSULA_2_2_ESCROW = {
    titulo: "2.2 Pago de las arras mediante depósito/escrow.",
    texto: `En lugar de pagar el Importe de las Arras directamente a la parte vendedora, las partes acuerdan que dicho importe se depositará en el Depositario designado en la Portada, en una cuenta separada a favor de la parte vendedora, con arreglo a las siguientes reglas:

(a) La parte compradora realizará el ingreso del Importe de las Arras en la cuenta designada por el Depositario antes de la fecha indicada, aportando justificante de dicho ingreso que se incorporará como Anexo.

(b) El Depositario retendrá el importe depositado hasta que se produzca alguno de los siguientes hitos: (i) El otorgamiento de la escritura de compraventa, en cuyo caso transferirá las arras a la parte vendedora o las imputará al precio según se pacte; o (ii) La comunicación fehaciente del desistimiento o del incumplimiento de alguna de las partes, en los términos previstos en la cláusula correspondiente a la naturaleza de las arras.

(c) En caso de desistimiento o incumplimiento, el Depositario liberará el Importe de las Arras a favor de la parte que, según el contrato, tenga derecho a conservarlas, a recibirlas en cantidad duplicada o a que le sean restituidas, previa acreditación razonable del supuesto ocurrido y notificación a ambas partes.

(d) Los gastos y comisiones del servicio de depósito/escrow serán a cargo de la parte indicada en la Portada.`,
};

// 3) Hipoteca pendiente (cancelación simultánea)
export const CLAUSULA_3_X_HIPOTECA = {
    titulo: "3.X Cancelación de cargas hipotecarias.",
    texto: `En caso de que, a la fecha de la escritura de compraventa, el Inmueble se encuentre gravado con una hipoteca inscrita, la parte vendedora se compromete a cancelar dicha hipoteca de forma simultánea al otorgamiento de la escritura de compraventa.

A tal fin:

(a) Las partes autorizan al Notario autorizante para que, del Precio de Compra que deba satisfacerse a la parte vendedora, retenga el importe necesario para abonar el saldo pendiente a la entidad acreedora, así como los gastos asociados a la cancelación, de conformidad con la carta de pago o manifestaciones de la propia entidad.

(b) El importe retenido se destinará al pago directo a la entidad acreedora y a la tramitación de la cancelación registral de la hipoteca, pudiendo el Notario o la gestoría que se designe conservarlo hasta la inscripción de la cancelación en el Registro de la Propiedad.

(c) Una vez practicada la cancelación registral, cualquier remanente que pudiera existir de la cantidad retenida será entregado a la parte vendedora, sin perjuicio de las liquidaciones de gastos que procedan.`,
};

// 4) Arrendamiento/ocupación (subrogación o entrega libre)
export const CLAUSULA_1_3_C_LIBRE = {
    titulo: "(c) Ocupación y arrendamientos - Entrega libre.",
    texto: "La parte vendedora declara que, en el momento de otorgar la escritura de compraventa, la vivienda se entregará libre de ocupantes y arrendatarios, de manera que no existirán contratos de arrendamiento u otros derechos de uso o disfrute vigentes que limiten la posesión de la parte compradora, salvo los que se hayan aceptado expresamente en la Portada o en el Anexo correspondiente.",
};

export const CLAUSULA_1_3_C_SUBROGACION = {
    titulo: "(c) Ocupación y arrendamientos - Subrogación.",
    texto: `La parte compradora acepta subrogarse en el contrato de arrendamiento existente sobre la vivienda, cuyos datos se identifican en la Portada o en el Anexo correspondiente. En tal caso:

(a) La parte vendedora declara haber informado al arrendatario de la transmisión conforme a la ley.

(b) La parte compradora asume los derechos y obligaciones derivados del contrato de arrendamiento desde la fecha de la escritura, sin perjuicio de los saldos a favor o en contra de la parte vendedora por periodos anteriores.`,
};

// 5) Territorio foral
export const CLAUSULA_9_FORAL = {
    titulo: "9. Ley aplicable y adecuación foral.",
    texto: `Este contrato se rige, con carácter general, por lo dispuesto en el derecho civil común (Código Civil) y por la normativa sectorial que resulte aplicable a la compraventa de inmuebles.

No obstante, si la vivienda se encuentra en un territorio con derecho civil propio o foral (en particular, Cataluña, Aragón, Navarra, Galicia, País Vasco o Illes Balears), las partes reconocen que:

(a) Pueden existir reglas especiales sobre el régimen económico matrimonial, la vivienda habitual, los derechos de adquisición preferente, los impuestos y otros aspectos sustantivos de la compraventa.

(b) Será necesario que el contenido de este contrato se adapte o complete con las cláusulas que exija la normativa foral aplicable y que el Notario autorizante verifique dicha adecuación.

(c) En caso de discrepancia entre lo previsto en este contrato y la normativa foral imperativa, prevalecerá esta última.`,
};

// 6) Retenciones en el precio
export const CLAUSULA_4_X_RETENCIONES = {
    titulo: "4.X Retenciones en el precio.",
    texto: `Con el fin de asegurar el correcto pago de determinadas obligaciones asociadas a la transmisión (por ejemplo, plusvalía municipal, IBI pendiente, cuotas de comunidad o gastos de determinadas obras), las partes convienen que, en el momento de la escritura de compraventa, se efectúe una retención del Precio de Compra por el importe indicado en la Portada, que el Notario o la gestoría designada conservarán y aplicarán conforme a lo siguiente:

(a) Se destinará prioritariamente a pagar los conceptos indicados en la Portada, conforme a los justificantes que se aporten.

(b) Una vez acreditado el pago de dichos conceptos, cualquier remanente se entregará a la parte vendedora.

(c) Si la retención resultara insuficiente, las partes se atendrán a lo pactado en la Portada o en las Observaciones para la liquidación del saldo pendiente.`,
};

// 7) Mobiliario y equipamiento
export const CLAUSULA_1_X_MOBILIARIO = {
    titulo: "1.X Mobiliario y equipamiento.",
    texto: `Además del Inmueble, forman parte de la presente compraventa los bienes muebles, electrodomésticos, instalaciones y elementos de equipamiento descritos en el Anexo "Inventario de Mobiliario y Equipamiento".

(a) La parte vendedora declara que dichos bienes son de su propiedad o que está facultada para transmitirlos, y que se entregarán a la parte compradora en el momento de la escritura, en el estado de uso y conservación en que se encuentren en esa fecha, sin garantía distinta de la legalmente exigible.

(b) La parte compradora manifiesta haber tenido ocasión de revisar el Inventario de Mobiliario y Equipamiento y acepta la compraventa de dichos bienes como cuerpo cierto, salvo vicios ocultos en los términos que prevea la ley.`,
};

// 8) Arras confirmatorias completas (sustitución cláusula 5)
export const CLAUSULA_5_CONFIRMATORIAS_COMPLETA = {
    titulo: "5. Consecuencias del incumplimiento (arras confirmatorias)",
    "5.1": {
        titulo: "5.1 Naturaleza confirmatoria de las arras.",
        texto: "Las partes convienen que las arras entregadas por la parte compradora a la parte vendedora tienen naturaleza confirmatoria. Las arras confirman la existencia del presente contrato de compraventa y se imputarán al Precio de Compra en el momento del otorgamiento de la escritura pública.",
    },
    "5.2": {
        titulo: "5.2 Incumplimiento imputable a una de las partes.",
        texto: `En caso de incumplimiento imputable a una de las partes, la parte cumplidora podrá optar, a su elección:

(a) Por exigir el cumplimiento del contrato, manteniéndolo vigente y solicitando, en su caso, la indemnización de los daños y perjuicios efectivamente sufridos; o

(b) Por resolver el contrato, solicitando igualmente la indemnización de los daños y perjuicios efectivamente sufridos.`,
    },
    "5.3": {
        titulo: "5.3 Imputación del importe de las arras.",
        texto: `El importe entregado como arras se imputará, en su caso, a la liquidación de los daños y perjuicios reconocidos a la parte cumplidora, sin perjuicio de:

(a) Su devolución al comprador, si el incumplimiento es imputable a la parte vendedora y no se reconoce un daño adicional; o

(b) Su retención por la parte vendedora, si el incumplimiento es imputable a la parte compradora y el importe de las arras se considera suficiente para cubrir los daños reconocidos; o

(c) La compensación parcial, si el importe de las arras no alcanzara el total de los daños y perjuicios efectivamente acreditados.`,
    },
    "5.4": {
        titulo: "5.4 Exclusión de facultad de desistimiento unilateral.",
        texto: "Conforme a lo anterior, las partes reconocen que estas arras no otorgan facultad de desistimiento unilateral con las consecuencias típicas de las arras penitenciales. Cualquier terminación anticipada sin causa acordada o sin mutuo acuerdo se considerará un incumplimiento contractual, sujeto al régimen previsto en esta cláusula.",
    },
};

// 9) Arras penales completas (sustitución cláusula 5)
export const CLAUSULA_5_PENALES_COMPLETA = {
    titulo: "5. Cláusula penal (arras penales)",
    "5.1": {
        titulo: "5.1 Naturaleza penal de las arras.",
        texto: "Las partes acuerdan que las arras entregadas por la parte compradora a la parte vendedora tienen naturaleza penal, a los efectos de los artículos aplicables del Código Civil. Las arras se configuran como una pena convencional para el supuesto de incumplimiento del presente contrato.",
    },
    "5.2": {
        titulo: "5.2 Penalización por incumplimiento.",
        texto: `En caso de incumplimiento imputable a una de las partes, esta vendrá obligada a abonar a la parte cumplidora una penalización equivalente al importe pactado en la Portada, sin perjuicio de lo que las partes pacten expresamente sobre la compatibilidad o no con otros daños y perjuicios:

Opción 1 - Pena sustitutiva de daños (por defecto): la parte cumplidora no podrá reclamar daños y perjuicios adicionales, salvo que se haya pactado expresamente lo contrario.

Opción 2 - Pena como mínimo de daños: la parte cumplidora podrá reclamar daños y perjuicios adicionales que excedan la pena, acreditando su existencia y cuantía.`,
    },
    "5.3": {
        titulo: "5.3 Ausencia de facultad de desistimiento.",
        texto: "Las arras penales reguladas en esta cláusula no confieren a ninguna de las partes un derecho automático de desistir unilateralmente del contrato. El pago de la pena será consecuencia de un incumplimiento contractual, no un mecanismo ordinario de resolución libre.",
    },
    "5.4": {
        titulo: "5.4 Moderación judicial (opcional).",
        texto: "La penalización convenida será susceptible de moderación judicial en caso de cumplimiento parcial o irregular de las obligaciones, conforme a la normativa aplicable y a la jurisprudencia, si así se indica en la Portada.",
    },
};
