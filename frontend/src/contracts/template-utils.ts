// Template utility functions for ICADE contract generation
import * as ICADE from './icade-template';

interface ContractData {
    inmueble: any;
    contrato: any;
    compradores: any[];
    vendedores: any[];
}

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
};

export const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const calculateArrasPercentage = (arras: number, precio: number): string => {
    if (!precio || !arras) return '0.00';
    return ((arras / precio) * 100).toFixed(2);
};

export const isTerritoryForal = (provincia: string): boolean => {
    const foralesProvincias = [
        'Barcelona', 'Tarragona', 'Lleida', 'Girona', // Cataluña
        'Huesca', 'Teruel', 'Zaragoza', // Aragón
        'Navarra', // Navarra
        'A Coruña', 'Lugo', 'Ourense', 'Pontevedra', // Galicia 
        'Araba/Álava', 'Gipuzkoa', 'Bizkaia', // País Vasco
        'Illes Balears', 'Baleares', // Baleares
    ];
    return foralesProvincias.some(f => provincia?.toLowerCase().includes(f.toLowerCase()));
};

export const getPersonaName = (persona: any): string => {
    if (persona.tipo === 'PERSONA_FISICA') {
        return `${persona.nombre} ${persona.apellidos}`;
    } else {
        return persona.denominacion;
    }
};

export const getPersonaDoc = (persona: any): string => {
    if (persona.tipo === 'PERSONA_FISICA') {
        return `${persona.tipo_documento}: ${persona.numero_documento}`;
    } else {
        return `CIF: ${persona.cif}`;
    }
};

export const getPersonaEstadoCivil = (persona: any): string => {
    if (persona.tipo === 'PERSONA_JURIDICA') return '';
    if (!persona.estado_civil) return '';

    const estados: Record<string, string> = {
        SOLTERO: 'Soltero/a',
        CASADO: 'Casado/a',
        DIVORCIADO: 'Divorciado/a',
        VIUDO: 'Viudo/a',
        PAREJA_HECHO: 'Pareja de hecho',
    };

    let text = estados[persona.estado_civil] || persona.estado_civil;

    if (persona.estado_civil === 'CASADO' && persona.regimen_economico) {
        const regimenes: Record<string, string> = {
            GANANCIALES: 'gananciales',
            SEPARACION_BIENES: 'separación de bienes',
            PARTICIPACION: 'participación',
        };
        text += ` en régimen de ${regimenes[persona.regimen_economico] || persona.regimen_economico}`;
    }

    return text;
};

export const getRepresentanteInfo = (persona: any): string => {
    if (persona.tipo === 'PERSONA_FISICA' || !persona.representante) return '';

    const rep = persona.representante;
    let info = `${rep.nombre} ${rep.apellidos} (${rep.tipo_documento}: ${rep.numero_documento})`;

    if (rep.base_representacion === 'CARGO') {
        const tipos: Record<string, string> = {
            ADMINISTRADOR_UNICO: 'Administrador único',
            ADMINISTRADOR_SOLIDARIO: 'Administrador solidario',
            ADMINISTRADOR_MANCOMUNADO: 'Administrador mancomunado',
            APODERADO: 'Apoderado',
            OTRO: 'Representante',
        };
        info = `${tipos[rep.tipo_representante] || rep.tipo_representante}: ${info}`;
        if (rep.datos_inscripcion) {
            info += ` — ${rep.datos_inscripcion}`;
        }
    } else if (rep.base_representacion === 'PODER' && rep.poder_notarial) {
        info += ` — Poder otorgado ante ${rep.poder_notarial.notario}, fecha ${formatDate(rep.poder_notarial.fecha)}, protocolo ${rep.poder_notarial.protocolo}`;
    }

    return info;
};

export const generateExpositivo = (data: ContractData): string => {
    const { inmueble, contrato, compradores, vendedores } = data;

    // Dirección completa
    const direccionCompleta = `${inmueble.direccion_completa || ''}, ${inmueble.codigo_postal || ''} ${inmueble.ciudad || ''}, ${inmueble.provincia || ''}`;

    // Precio y arras
    const precioFmt = formatCurrency(contrato.precio_total || 0);
    const arrasFmt = formatCurrency(contrato.importe_arras || 0);
    const porcent = calculateArrasPercentage(contrato.importe_arras, contrato.precio_total);

    // Tipo de arras
    const naturaleza = contrato.tipo_arras || 'PENITENCIALES';
    const naturalezaLc = naturaleza.toLowerCase();

    // Consecuencias
    let consecuencias = '';
    if (naturaleza === 'PENITENCIALES') {
        consecuencias = 'Si desiste la parte compradora, pierde las arras; si desiste la parte vendedora, debe devolverlas duplicadas.';
    } else if (naturaleza === 'CONFIRMATORIAS') {
        consecuencias = 'Ante incumplimiento, la parte cumplidora podrá exigir cumplimiento o resolución con indemnización de daños y perjuicios.';
    } else if (naturaleza === 'PENALES') {
        consecuencias = 'En caso de incumplimiento, se aplicará la penalización pactada equivalente al importe de las arras.';
    }

    // Forma de pago
    let pagoDesc = '';
    if (contrato.forma_pago_arras === 'AL_FIRMAR') {
        pagoDesc = 'se paga al firmar este contrato y se adjunta justificante (Anexo 3)';
    } else {
        const plazo = contrato.plazo_pago_arras_dias ? `dentro de ${contrato.plazo_pago_arras_dias} días` : '';
        const fecha = contrato.fecha_limite_pago_arras ? `antes del ${formatDate(contrato.fecha_limite_pago_arras)}` : '';
        const separador = plazo && fecha ? ' o ' : '';
        pagoDesc = `se pagará después de la firma, ${plazo}${separador}${fecha} mediante transferencia al IBAN de la parte vendedora`;

        if (naturaleza === 'PENITENCIALES') {
            pagoDesc += '. Si no se paga en plazo, el contrato quedará sin efecto por condición resolutoria';
        }
    }

    // Escritura
    const fechaEscritura = formatDate(contrato.fecha_limite_firma_escritura || '');
    let escrituraDesc = `La escritura pública se otorgará antes del ${fechaEscritura}`;
    if (contrato.notario_designado_nombre) {
        escrituraDesc = `La escritura se otorgará ante ${contrato.notario_designado_nombre}${contrato.notario_designado_direccion ? `, ${contrato.notario_designado_direccion}` : ''}`;
    }

    // Anexos si hay
    let anexosDesc = '';
    if (inmueble.anexos && inmueble.anexos.length > 0) {
        anexosDesc = ` Se incluyen como anexos: ${inmueble.anexos.map((a: any) => `${a.tipo} (${a.ubicacion})`).join(', ')}.`;
    }

    return `<div class="expositivo">
    <h3>Expositivo</h3>
    <p>La parte compradora adquiere la vivienda sita en ${direccionCompleta}, por precio total de ${precioFmt}; entrega ${arrasFmt} (${porcent}%) en concepto de arras ${naturalezaLc}. El pago de las arras ${pagoDesc}. ${escrituraDesc};  en ese acto se abonará el resto del precio. ${consecuencias}${anexosDesc}</p>
  </div>`;
};

export const generatePortadaHTML = (data: ContractData): string => {
    const { inmueble, contrato, compradores, vendedores } = data;

    // Parte Vendedora
    const vendedorasHTML = vendedores.map((v: any) => `
    <li>
      <strong>${getPersonaName(v)}</strong> — ${getPersonaDoc(v)} — ${v.porcentaje}%
      ${getPersonaEstadoCivil(v) ? `<br><small>Estado civil: ${getPersonaEstadoCivil(v)}</small>` : ''}
      ${getRepresentanteInfo(v) ? `<br><small class="representante">${getRepresentanteInfo(v)}</small>` : ''}
    </li>
  `).join('');

    // Parte Compradora
    const compradorasHTML = compradores.map((c: any) => `
    <li>
      <strong>${getPersonaName(c)}</strong> — ${getPersonaDoc(c)} — ${c.porcentaje}%
      ${getPersonaEstadoCivil(c) ? `<br><small>Estado civil: ${getPersonaEstadoCivil(c)}</small>` : ''}
      ${getRepresentanteInfo(c) ? `<br><small class="representante">${getRepresentanteInfo(c)}</small>` : ''}
    </li>
  `).join('');

    return `
  <h3>Portada — Instrucciones</h3>
  <p class="portada-instrucciones">Marca con "X" la opción que aplique y completa los campos entre corchetes cuando proceda.</p>
  
  <div class="portada-grid">
    <div class="portada-section">
      <h4>Parte vendedora</h4>
      <ul>${vendedorasHTML}</ul>
    </div>
    
    <div class="portada-section">
      <h4>Parte compradora</h4>
      <ul>${compradorasHTML}</ul>
    </div>
    
    <div class="portada-section">
      <h4>Vivienda</h4>
      <p><strong>Dirección:</strong> ${inmueble.direccion_completa || '-'}</p>
      ${inmueble.titulo_adquisicion_vendedor ? `<p><strong>Título de adquisición:</strong> ${inmueble.titulo_adquisicion_vendedor}</p>` : ''}
      ${inmueble.rp_numero ? `<p><strong>Datos registrales:</strong> RP nº ${inmueble.rp_numero} (${inmueble.rp_localidad || '-'}), ${inmueble.cru_idufir ? `CRU/IDUFIR: ${inmueble.cru_idufir}` : ''}</p>` : ''}
      ${inmueble.referencia_catastral ? `<p><strong>Referencia catastral:</strong> ${inmueble.referencia_catastral}</p>` : ''}
    </div>
    
    <div class="portada-section">
      <h4>Precio y arras</h4>
      <p><strong>Precio de compra:</strong> ${formatCurrency(contrato.precio_total || 0)}</p>
      <p><strong>Importe de arras:</strong> ${formatCurrency(contrato.importe_arras || 0)} (${calculateArrasPercentage(contrato.importe_arras, contrato.precio_total)}%)</p>
    </div>
    
    <div class="portada-section">
      <h4>Forma de pago de arras</h4>
      <p>${contrato.forma_pago_arras === 'AL_FIRMAR' ? '☑' : '☐'} Al firmar el Contrato</p>
      <p>${contrato.forma_pago_arras === 'POSTERIOR' ? '☑' : '☐'} Después de la firma</p>
      ${contrato.forma_pago_arras === 'POSTERIOR' ? `
        <p><strong>Plazo (días):</strong> ${contrato.plazo_pago_arras_dias || '-'}</p>
        <p><strong>Fecha límite:</strong> ${formatDate(contrato.fecha_limite_pago_arras || '')}</p>
        <p><strong>IBAN vendedora:</strong> ${contrato.iban_vendedor || '-'}</p>
        <p><strong>Banco:</strong> ${contrato.banco_vendedor || '-'}</p>
      ` : ''}
    </div>
    
    <div class="portada-section">
      <h4>Escritura de compraventa</h4>
      <p><strong>Fecha límite:</strong> ${formatDate(contrato.fecha_limite_firma_escritura || '')}</p>
      ${contrato.notario_designado_nombre ? `<p><strong>Notario:</strong> ${contrato.notario_designado_nombre}, ${contrato.notario_designado_direccion || ''}</p>` : ''}
    </div>
    
    <div class="portada-section">
      <h4>Pago de gastos</h4>
      <p>${contrato.gastos_quien === 'LEY' ? '☑' : '☐'} Conforme a la ley</p>
      <p>${contrato.gastos_quien === 'COMPRADOR' ? '☑' : '☐'} Por la parte compradora</p>
    </div>
    
    <div class="portada-section">
      <h4>Vía de resolución de conflictos</h4>
      <p>${contrato.via_resolucion === 'JUZGADOS' ? '☑' : '☐'} Juzgados y tribunales del lugar de la vivienda</p>
      <p>${contrato.via_resolucion === 'ARBITRAJE_NOTARIAL' ? '☑' : '☐'} Arbitraje notarial de derecho</p>
    </div>
    
    <div class="portada-section">
      <h4>Firma</h4>
      <p>${contrato.firma_preferida === 'ELECTRONICA' ? '☑' : '☐'} Electrónica</p>
      <p>${contrato.firma_preferida === 'MANUSCRITA' ? '☑' : '☐'} Manuscrita</p>
    </div>
    
    <div class="portada-section">
      <h4>Anexos</h4>
      <ol>
        ${ICADE.ANEXOS_ESTANDAR.map((anexo, i) => `<li>${anexo}</li>`).join('')}
      </ol>
    </div>
    
    ${contrato.condicion_suspensiva_texto || contrato.observaciones ? `
    <div class="portada-section portada-full">
      <h4>Otras condiciones</h4>
      ${contrato.condicion_suspensiva_texto ? `<p><strong>Condiciones suspensivas:</strong> ${contrato.condicion_suspensiva_texto}</p>` : ''}
      ${contrato.observaciones ? `<p><strong>Observaciones:</strong> ${contrato.observaciones}</p>` : ''}
    </div>
    ` : ''}
  </div>
  `;
};

export const generateTerminosHTML = (data: ContractData): string => {
    const { contrato } = data;
    const tipoArras = contrato.tipo_arras || 'PENITENCIALES';
    const formaPago = contrato.forma_pago_arras || 'AL_FIRMAR';
    const viaResolucion = contrato.via_resolucion || 'JUZGADOS';
    const tipoFirma = contrato.firma_preferida || 'ELECTRONICA';
    const provincia = data.inmueble.provincia || '';
    const esForal = isTerritoryForal(provincia);

    // Seleccionar textos según variante
    const clausula1_1_texto = ICADE.CLAUSULA_1['1.1'][`texto_${tipoArras}`] || ICADE.CLAUSULA_1['1.1'].texto_PENITENCIALES;
    const clausula2_2_pago = formaPago === 'AL_FIRMAR'
        ? ICADE.CLAUSULA_2['2.2'].opcion_AL_FIRMAR
        : ICADE.CLAUSULA_2['2.2'][`opcion_POSTERIOR_${tipoArras}`] || ICADE.CLAUSULA_2['2.2'].opcion_POSTERIOR_PENITENCIALES;

    const clausula5 = tipoArras === 'CONFIRMATORIAS' ? ICADE.CLAUSULA_5_CONFIRMATORIAS
        : tipoArras === 'PENALES' ? ICADE.CLAUSULA_5_PENALES
            : ICADE.CLAUSULA_5_PENITENCIALES;

    const clausula8_texto = viaResolucion === 'ARBITRAJE_NOTARIAL'
        ? ICADE.CLAUSULA_8.texto_ARBITRAJE
        : ICADE.CLAUSULA_8.texto_JUZGADOS;

    const clausula10_texto = tipoFirma === 'MANUSCRITA'
        ? ICADE.CLAUSULA_10.texto_MANUSCRITA
        : ICADE.CLAUSULA_10.texto_ELECTRONICA;

    return `
  <section class="terminos">
    <h3>Términos Estándar</h3>
    
    <h4>${ICADE.CLAUSULA_1.titulo}</h4>
    <p class="clausula-num">${ICADE.CLAUSULA_1['1.1'].titulo}</p>
    <p>${clausula1_1_texto}</p>
    <p class="clausula-num">${ICADE.CLAUSULA_1['1.2'].titulo}</p>
    <p>${ICADE.CLAUSULA_1['1.2'].texto}</p>
    <p class="clausula-num">${ICADE.CLAUSULA_1['1.3'].titulo}</p>
    <p>${ICADE.CLAUSULA_1['1.3'].texto}</p>
    
    <h4>${ICADE.CLAUSULA_2.titulo}</h4>
    <p class="clausula-num">${ICADE.CLAUSULA_2['2.1'].titulo}</p>
    <p>${ICADE.CLAUSULA_2['2.1'].texto}</p>
    <p class="clausula-num">${ICADE.CLAUSULA_2['2.2'].titulo}</p>
    <p>${ICADE.CLAUSULA_2['2.2'].intro}</p>
    <p>${clausula2_2_pago}</p>
    <p class="clausula-num">${ICADE.CLAUSULA_2['2.3'].titulo}</p>
    <p>${ICADE.CLAUSULA_2['2.3'].texto}</p>
    
    <h4>${ICADE.CLAUSULA_3.titulo}</h4>
    <p class="clausula-num">${ICADE.CLAUSULA_3['3.1'].titulo}</p>
    <p>${ICADE.CLAUSULA_3['3.1'].texto}</p>
    <p class="clausula-num">${ICADE.CLAUSULA_3['3.2'].titulo}</p>
    <p>${ICADE.CLAUSULA_3['3.2'].texto}</p>
    
    <h4>${ICADE.CLAUSULA_4.titulo}</h4>
    <p class="clausula-num">${ICADE.CLAUSULA_4['4.1'].titulo}</p>
    <p>${ICADE.CLAUSULA_4['4.1'].texto}</p>
    <p class="clausula-num">${ICADE.CLAUSULA_4['4.2'].titulo}</p>
    <p>${ICADE.CLAUSULA_4['4.2'].texto}</p>
    <p class="clausula-num">${ICADE.CLAUSULA_4['4.3'].titulo}</p>
    <p>${ICADE.CLAUSULA_4['4.3'].texto}</p>
    
    <h4>${clausula5.titulo}</h4>
    <p class="clausula-num">${clausula5['5.1'].titulo}</p>
    <p>${clausula5['5.1'].texto}</p>
    <p class="clausula-num">${clausula5['5.2'].titulo}</p>
    <p>${clausula5['5.2'].texto}</p>
    <p class="clausula-num">${clausula5['5.3'].titulo}</p>
    <p>${clausula5['5.3'].texto}</p>
    
    <h4>${ICADE.CLAUSULA_6.titulo}</h4>
    <p class="clausula-num">${ICADE.CLAUSULA_6['6.1'].titulo}</p>
    <p>${ICADE.CLAUSULA_6['6.1'].texto}</p>
    <p class="clausula-num">${ICADE.CLAUSULA_6['6.2'].titulo}</p>
    <p>${ICADE.CLAUSULA_6['6.2'].texto}</p>
    
    <h4>${ICADE.CLAUSULA_7.titulo}</h4>
    <p>${ICADE.CLAUSULA_7.texto}</p>
    
    <h4>${ICADE.CLAUSULA_8.titulo}</h4>
    <p>${clausula8_texto}</p>
    
    <h4>${ICADE.CLAUSULA_9.titulo}</h4>
    <p>${ICADE.CLAUSULA_9.texto_COMUN}${esForal ? ` ${ICADE.CLAUSULA_9.advertencia_FORAL}` : ''}</p>
    
    <h4>${ICADE.CLAUSULA_10.titulo}</h4>
    <p>${clausula10_texto}</p>
  </section>
  `;
};
