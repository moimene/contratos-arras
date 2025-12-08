import React, { createContext, useContext, useState, type ReactNode } from 'react';

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

interface Contrato {
    tipo_arras: 'CONFIRMATORIAS' | 'PENITENCIALES' | 'PENALES';
    precio_total: number;
    importe_arras: number;
    fecha_limite_firma_escritura: string;
    forma_pago_arras: 'AL_FIRMAR' | 'DIFERIDO';
    plazo_pago_arras_dias?: number;
    iban_vendedor?: string;
    banco_vendedor?: string;
    notario_designado_nombre?: string;
    notario_designado_direccion?: string;
    gastos_quien: 'LEY' | 'COMPRADOR';
    via_resolucion: 'JUZGADOS' | 'ARBITRAJE';
    firma_preferida: 'ELECTRONICA' | 'MANUSCRITA';
    condicion_suspensiva_texto?: string;
    observaciones?: string;
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
    updateInmueble: (data: Partial<Inmueble>) => void;
    updateContrato: (data: Partial<Contrato>) => void;
    addComprador: (parte: Parte) => void;
    addVendedor: (parte: Parte) => void;
    removeComprador: (index: number) => void;
    removeVendedor: (index: number) => void;
    submitContract: () => Promise<void>;
    reset: () => void;
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
                updateInmueble,
                updateContrato,
                addComprador,
                addVendedor,
                removeComprador,
                removeVendedor,
                submitContract,
                reset,
            }}
        >
            {children}
        </ContractContext.Provider>
    );
};
