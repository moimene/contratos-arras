
export interface GenerarActaData {
    contratoId: string;
    citaNotarialId: string;
    parteComparecienteId?: string;  // Opcional: quien sí compareció
    parteNoComparecienteId: string;  // Obligatorio: quien NO compareció
    fechaHoraCita: Date;
    notaria: string;
    resumenHechos: string;
}

export interface ConsecuenciasArras {
    tipoArras: 'CONFIRMATORIAS' | 'PENITENCIALES' | 'PENALES';
    importeArras: number;
    precioTotal: number;
    parteIncumplidora: 'COMPRADOR' | 'VENDEDOR';
    consecuencia: string;
    importePenalizacion?: number;
    derechoResolucion: boolean;
}

export interface ActaNoComparecenciaData {
    contrato: any;
    parteNoCompareciente: any;
    fechaHoraCita: Date;
    notaria: string;
    resumenHechos: string;
    consecuencias: ConsecuenciasArras;
    hashActa: string;
    tst: {
        fecha: Date;
        proveedor: string;
    };
}
