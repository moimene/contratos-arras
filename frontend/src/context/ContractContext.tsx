import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { isTerritorioForal, getForalRegion, getForalRegionDisplayName, getForalImplications } from '../utils/foralTerritories';

// Tipos
interface Inmueble {
    direccion_completa: string;
    codigo_postal?: string;
    ciudad: string;
    provincia: string;
    portal?: string;
    piso?: string;
    puerta?: string;
    url_anuncio?: string;

    // Catastro
    referencia_catastral?: string;
    uso_catastral?: string;
    superficie_construida_catastro?: number;
    anio_construccion_catastro?: number;

    // Registro
    rp_numero?: string;
    rp_localidad?: string;
    finca_numero?: string;
    cru_idufir?: string;
    tomo?: string;
    libro?: string;
    folio?: string;
    seccion?: string;
    datos_registrales?: string;
    titulo_adquisicion_vendedor?: string;

    // Características
    m2?: number;
    m2_utiles?: number;
    habitaciones?: number;
    banos?: number;
    ascensor?: boolean;
    planta?: string;
    descripcion_libre?: string;

    // Anexos
    anexos?: Array<{
        tipo: string;
        ubicacion?: string;
        superficie?: number;
        referencia_catastral?: string;
        finca_numero?: string;
        vinculacion?: string;
        descripcion?: string;
    }>;
}

// Configuración del Modo Estándar Observatorio
interface ConfiguracionEstandar {
    // Valores fijados por el modo estándar (no editables)
    ambito: {
        objeto: 'VIVIENDA';
        derecho: 'COMUN';
        sinHipoteca: true;
        sinArrendatarios: true;
    };
    arras: {
        naturaleza: 'PENITENCIALES';
    };

    // Valores por defecto (editables dentro del estándar)
    portadaDefaults: {
        formaPagoArras: 'AL_FIRMAR' | 'POSTERIOR';
        gastosQuien: 'LEY' | 'COMPRADOR';
        viaResolucion: 'JUZGADOS' | 'ARBITRAJE';
        firma: 'ELECTRONICA' | 'MANUSCRITA';
        anexos: string[];
    };

    // Campos que SÍ se pueden editar
    editables: string[];
}

interface Contrato {
    tipo_arras: 'CONFIRMATORIAS' | 'PENITENCIALES' | 'PENALES';
    precio_total: number;
    importe_arras: number;
    porcentaje_arras_calculado?: number;
    moneda?: string;
    fecha_limite_firma_escritura: string;
    forma_pago_arras: 'AL_FIRMAR' | 'POSTERIOR' | 'ESCROW';
    plazo_pago_arras_dias?: number;
    fecha_limite_pago_arras?: string;
    iban_vendedor?: string;
    banco_vendedor?: string;
    notario_designado_nombre?: string;
    notario_designado_direccion?: string;
    gastos_quien: 'LEY' | 'COMPRADOR';
    via_resolucion: 'JUZGADOS' | 'ARBITRAJE';
    firma_preferida: 'ELECTRONICA' | 'MANUSCRITA';
    condicion_suspensiva_texto?: string;
    observaciones?: string;

    // Manifestaciones del vendedor
    manifestacion_cosa_cierta?: boolean;
    manifestacion_libre_ocupantes?: boolean;
    manifestacion_libre_cargas?: boolean;
    manifestacion_corriente_pagos?: boolean;
    manifestacion_certificaciones?: boolean;

    // Modo Estándar Observatorio
    modoEstandarObservatorio?: boolean;
    configuracionEstandar?: ConfiguracionEstandar;
    otrosCambiosTerminos?: string;

    // ============================================
    // CONDICIONES PARA SELECCIÓN DE PLANTILLA
    // ============================================

    // Tipo de inmueble (default: VIVIENDA)
    objeto?: 'VIVIENDA' | 'LOCAL' | 'OFICINA' | 'SOLAR' | 'GARAJE' | 'OTRO';

    // Sin cargas (default: true = sin hipoteca)
    sinHipoteca?: boolean;

    // Sin arrendatarios (default: true = libre de ocupantes)
    sinArrendatarios?: boolean;

    // Derecho aplicable (default: COMUN)
    derecho?: 'COMUN' | 'FORAL';

    // Escrow/depósito notarial
    escrow?: {
        activo: boolean;
        depositario?: string;
        gastosCargo?: 'COMPRADOR' | 'VENDEDOR' | 'MITADES';
    };

    // Retenciones en el precio
    retenciones?: {
        activa: boolean;
        importe?: number;
        concepto?: string;
    };

    // Mobiliario y equipamiento incluido
    mobiliarioEquipamiento?: boolean;

    // Subrogación en arrendamiento (si sinArrendatarios = false)
    subrogacionArrendamiento?: boolean;
}

interface Parte {
    id?: string;
    nombre: string;
    apellidos: string;
    tipo_documento: string;
    numero_documento: string;
    estado_civil?: string;
    email?: string;
    telefono?: string;
    domicilio?: string;
}

interface ContractContextType {
    // Estado
    currentStep: number;
    inmueble: Partial<Inmueble>;
    contrato: Partial<Contrato>;
    compradores: Parte[];
    vendedores: Parte[];
    contratoId?: string;

    // Acciones
    setCurrentStep: (step: number) => void;
    setContratoId: (id: string) => void;
    updateInmueble: (data: Partial<Inmueble>) => void;
    updateContrato: (data: Partial<Contrato>) => void;
    addComprador: (parte: Parte) => void;
    addVendedor: (parte: Parte) => void;
    removeComprador: (index: number) => void;
    removeVendedor: (index: number) => void;
    submitContract: () => Promise<void>;
    reset: () => void;
    loadContratoExistente: (id: string) => Promise<void>;

    // Modo Estándar Observatorio
    activarModoEstandar: () => void;
    desactivarModoEstandar: (razon?: string) => void;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export const useContract = () => {
    const context = useContext(ContractContext);
    if (!context) {
        throw new Error('useContract debe usarse dentro de ContractProvider');
    }
    return context;
};

interface ContractProviderProps {
    children: ReactNode;
}

export const ContractProvider: React.FC<ContractProviderProps> = ({ children }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [inmueble, setInmueble] = useState<Partial<Inmueble>>({});
    const [contrato, setContrato] = useState<Partial<Contrato>>({
        tipo_arras: 'PENITENCIALES',
        gastos_quien: 'LEY',
        via_resolucion: 'JUZGADOS',
        firma_preferida: 'ELECTRONICA',
    });
    const [compradores, setCompradores] = useState<Parte[]>([]);
    const [vendedores, setVendedores] = useState<Parte[]>([]);
    const [contratoId, setContratoId] = useState<string>();

    const updateInmueble = (data: Partial<Inmueble>) => {
        setInmueble((prev) => ({ ...prev, ...data }));
    };

    const updateContrato = (data: Partial<Contrato>) => {
        setContrato((prev) => ({ ...prev, ...data }));
    };

    const addComprador = (parte: Parte) => {
        setCompradores((prev) => [...prev, parte]);
    };

    const addVendedor = (parte: Parte) => {
        setVendedores((prev) => [...prev, parte]);
    };

    const removeComprador = (index: number) => {
        setCompradores((prev) => prev.filter((_, i) => i !== index));
    };

    const removeVendedor = (index: number) => {
        setVendedores((prev) => prev.filter((_, i) => i !== index));
    };

    const submitContract = async () => {
        try {
            const response = await fetch('/api/contratos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inmueble,
                    contrato,
                }),
            });

            if (!response.ok) throw new Error('Error creando contrato');

            const data = await response.json();
            setContratoId(data.id);

            // Crear y vincular partes
            for (const vendedor of vendedores) {
                const parteRes = await fetch('/api/partes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...vendedor, rol: 'VENDEDOR' }),
                });
                const parteData = await parteRes.json();

                await fetch(`/api/contratos/${data.id}/partes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        parteId: parteData.id,
                        rolEnContrato: 'VENDEDOR',
                        obligadoAceptar: true,
                        obligadoFirmar: true,
                    }),
                });
            }

            for (const comprador of compradores) {
                const parteRes = await fetch('/api/partes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...comprador, rol: 'COMPRADOR' }),
                });
                const parteData = await parteRes.json();

                await fetch(`/api/contratos/${data.id}/partes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        parteId: parteData.id,
                        rolEnContrato: 'COMPRADOR',
                        obligadoAceptar: true,
                        obligadoFirmar: true,
                        porcentajePropiedad: 100,
                    }),
                });
            }
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    };

    const reset = () => {
        setCurrentStep(1);
        setInmueble({});
        setContrato({
            tipo_arras: 'PENITENCIALES',
            gastos_quien: 'LEY',
            via_resolucion: 'JUZGADOS',
            firma_preferida: 'ELECTRONICA',
        });
        setCompradores([]);
        setVendedores([]);
        setContratoId(undefined);
    };

    // ============================================
    // MODO ESTÁNDAR OBSERVATORIO - MÉTODOS
    // ============================================

    const activarModoEstandar = () => {
        setContrato((prev) => ({
            ...prev,
            modoEstandarObservatorio: true,
            configuracionEstandar: DEFAULT_CONFIG_ESTANDAR,
            // Aplicar defaults de la configuración estándar
            tipo_arras: 'PENITENCIALES',
            forma_pago_arras: 'AL_FIRMAR',
            gastos_quien: 'LEY',
            via_resolucion: 'JUZGADOS',
            firma_preferida: 'ELECTRONICA'
        }));
    };

    const desactivarModoEstandar = (razon?: string) => {
        if (razon) {
            console.log(`Modo estándar desactivado: ${razon}`);
        }

        setContrato((prev) => ({
            ...prev,
            modoEstandarObservatorio: false,
            configuracionEstandar: undefined,
            otrosCambiosTerminos: undefined
        }));
    };

    /**
     * Carga un contrato existente para editar en el wizard
     */
    const loadContratoExistente = async (id: string): Promise<void> => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/contracts/${id}`);

            if (!response.ok) {
                throw new Error('Contrato no encontrado');
            }

            const result = await response.json();
            if (!result.success || !result.data) {
                throw new Error(result.error || 'Error cargando contrato');
            }

            const data = result.data;

            // Establecer ID
            setContratoId(id);

            // Cargar inmueble
            if (data.inmueble) {
                setInmueble(data.inmueble);
            }

            // Cargar datos del contrato
            setContrato({
                tipo_arras: data.tipo_arras,
                precio_total: data.precio_total,
                importe_arras: data.importe_arras,
                porcentaje_arras_calculado: data.porcentaje_arras_calculado,
                fecha_limite_firma_escritura: data.fecha_limite_firma_escritura,
                forma_pago_arras: data.forma_pago_arras || 'AL_FIRMAR',
                plazo_pago_arras_dias: data.plazo_pago_arras_dias,
                gastos_quien: data.gastos_quien || 'LEY',
                via_resolucion: data.via_resolucion || 'JUZGADOS',
                firma_preferida: data.firma_preferida || 'ELECTRONICA',
                notario_designado_nombre: data.notario_designado_nombre,
                notario_designado_direccion: data.notario_designado_direccion,
                iban_vendedor: data.iban_vendedor,
                banco_vendedor: data.banco_vendedor,
                ...(data.datos_wizard || {})
            });

            // Cargar partes - mapear a estructura esperada por Step3Partes
            if (data.partes && Array.isArray(data.partes)) {
                const compradorsList: any[] = [];
                const vendedoresList: any[] = [];

                for (const p of data.partes) {
                    const parteData = p.parte || {};
                    const rol = p.rol_en_contrato as 'COMPRADOR' | 'VENDEDOR';

                    // Determinar si es persona física o jurídica
                    const esPJ = parteData.cif || parteData.denominacion;

                    if (esPJ) {
                        // Persona Jurídica
                        const pj = {
                            id: parteData.id || p.parte_id,
                            tipo: 'PERSONA_JURIDICA' as const,
                            rol,
                            denominacion: parteData.denominacion || parteData.nombre || '',
                            cif: parteData.cif || parteData.numero_documento || '',
                            domicilio_social: parteData.domicilio || '',
                            representante: {
                                tipo_representante: 'ADMINISTRADOR_UNICO' as const,
                                nombre: parteData.representante_nombre || '',
                                apellidos: parteData.representante_apellidos || '',
                                tipo_documento: 'DNI',
                                numero_documento: '',
                                email: parteData.email || '',
                                base_representacion: 'CARGO' as const
                            },
                            porcentaje: p.porcentaje_propiedad || 100,
                            obligado_aceptar: p.obligado_aceptar ?? true,
                            obligado_firmar: p.obligado_firmar ?? true
                        };

                        if (rol === 'COMPRADOR') {
                            compradorsList.push(pj);
                        } else if (rol === 'VENDEDOR') {
                            vendedoresList.push(pj);
                        }
                    } else {
                        // Persona Física
                        const pf = {
                            id: parteData.id || p.parte_id,
                            tipo: 'PERSONA_FISICA' as const,
                            rol,
                            nombre: parteData.nombre || '',
                            apellidos: parteData.apellidos || '',
                            tipo_documento: parteData.tipo_documento || 'DNI',
                            numero_documento: parteData.numero_documento || '',
                            email: parteData.email || '',
                            telefono: parteData.telefono || '',
                            domicilio: parteData.domicilio || '',
                            estado_civil: parteData.estado_civil || 'SOLTERO',
                            vivienda_habitual: false,
                            requiere_consentimiento_conyuge: false,
                            porcentaje: p.porcentaje_propiedad || 100,
                            obligado_aceptar: p.obligado_aceptar ?? true,
                            obligado_firmar: p.obligado_firmar ?? true
                        };

                        if (rol === 'COMPRADOR') {
                            compradorsList.push(pf);
                        } else if (rol === 'VENDEDOR') {
                            vendedoresList.push(pf);
                        }
                    }
                }

                setCompradores(compradorsList);
                setVendedores(vendedoresList);
            }

            console.log('Contrato cargado para edicion:', id);
        } catch (error) {
            console.error('Error cargando contrato existente:', error);
            throw error;
        }
    };

    return (
        <ContractContext.Provider
            value={{
                currentStep,
                inmueble,
                contrato,
                compradores,
                vendedores,
                contratoId,
                setCurrentStep,
                setContratoId,
                updateInmueble,
                updateContrato,
                addComprador,
                addVendedor,
                removeComprador,
                removeVendedor,
                submitContract,
                reset,
                loadContratoExistente,
                activarModoEstandar,
                desactivarModoEstandar,
            }}
        >
            {children}
        </ContractContext.Provider>
    );
};

// ============================================
// MODO ESTÁNDAR OBSERVATORIO - CONFIGURACIÓN
// ============================================

export const DEFAULT_CONFIG_ESTANDAR: ConfiguracionEstandar = {
    ambito: {
        objeto: 'VIVIENDA',
        derecho: 'COMUN',
        sinHipoteca: true,
        sinArrendatarios: true
    },
    arras: {
        naturaleza: 'PENITENCIALES'
    },
    portadaDefaults: {
        formaPagoArras: 'AL_FIRMAR',
        gastosQuien: 'LEY',
        viaResolucion: 'JUZGADOS',
        firma: 'ELECTRONICA',
        anexos: [
            'NOTA_SIMPLE',
            'IBI',
            'JUSTIFICANTE_ARRAS',
            'CERTIFICACION_ENERGETICA'
        ]
    },
    editables: [
        'precio_total',
        'importe_arras',
        'forma_pago_arras',
        'plazo_pago_arras_dias',
        'fecha_limite_pago_arras',
        'iban_vendedor',
        'banco_vendedor',
        'fecha_limite_firma_escritura',
        'notario_designado_nombre',
        'notario_designado_direccion',
        'gastos_quien',
        'via_resolucion',
        'firma_preferida',
        'otrosCambiosTerminos'
    ]
};

/**
 * Valida si el contrato cumple las condiciones del Modo Estándar Observatorio
 */
export const validateModoEstandar = (
    contrato: Partial<Contrato>,
    inmueble: Partial<Inmueble>
): { isValid: boolean; violations: string[]; warnings: string[] } => {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Validar tipo de arras
    if (contrato.tipo_arras !== 'PENITENCIALES') {
        violations.push('El modo estándar requiere arras penitenciales');
    }

    // Validar territorio foral
    if (inmueble.provincia && isTerritorioForal(inmueble.provincia)) {
        const region = getForalRegion(inmueble.provincia);
        const regionName = region ? getForalRegionDisplayName(region) : inmueble.provincia;
        const implication = region ? getForalImplications(region) : 'El territorio tiene derecho civil especial.';

        warnings.push(
            `⚠️ ATENCIÓN: Territorio Foral detectado (${regionName}). ${implication} Se recomienda revisión profesional antes de proceder con el modelo estándar.`
        );
    }

    // Nota: Las validaciones de hipoteca/arrendatarios se harían en Step 1 cuando esos campos se implementen

    return {
        isValid: violations.length === 0,
        violations,
        warnings
    };
};

/**
 * Obtiene la razón por la cual el modo estándar no puede activarse
 */
export const getModoEstandarBlockReason = (
    contrato: Partial<Contrato>
): string | null => {
    if (contrato.tipo_arras === 'CONFIRMATORIAS') {
        return 'Las arras confirmatorias no son compatibles con el modo estándar';
    }
    if (contrato.tipo_arras === 'PENALES') {
        return 'Las arras penales no son compatibles con el modo estándar';
    }
    // Otras validaciones se añadirán según se implementen los campos
    return null;
};
