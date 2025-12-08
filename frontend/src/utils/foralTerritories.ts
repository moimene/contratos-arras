/**
 * Territorio Foral Detection Utility
 * 
 * Detects if a property is located in a "territorio foral" (region with special civil law)
 * which may require adaptations to the standard ICADE contract model.
 * 
 * Reference: https://www.notariosyregistradores.com/doctrina/articulos/derechos-forales/
 */

export const TERRITORIOS_FORALES = {
    PAIS_VASCO: ['Álava', 'Vizcaya', 'Guipúzcoa', 'Araba', 'Bizkaia', 'Gipuzkoa'],
    NAVARRA: ['Navarra', 'Nafarroa'],
    CATALUÑA: ['Barcelona', 'Girona', 'Lleida', 'Tarragona'],
    ARAGON: ['Huesca', 'Zaragoza', 'Teruel'],
    GALICIA: ['A Coruña', 'Lugo', 'Ourense', 'Pontevedra', 'La Coruña'],
    BALEARES: ['Illes Balears', 'Islas Baleares', 'Baleares'],
} as const;

export type ForalRegion = keyof typeof TERRITORIOS_FORALES;

/**
 * Checks if a given provincia (province) is in a territorio foral
 * @param provincia - Province name (case-insensitive)
 * @returns true if the province is in a foral territory
 */
export function isTerritorioForal(provincia: string | undefined): boolean {
    if (!provincia) return false;

    const normProvince = provincia.trim().toLowerCase();

    return Object.values(TERRITORIOS_FORALES)
        .flat()
        .some(p => p.toLowerCase() === normProvince);
}

/**
 * Gets the foral region name for a given provincia
 * @param provincia - Province name (case-insensitive)
 * @returns The foral region name or null if not in a foral territory
 */
export function getForalRegion(provincia: string | undefined): ForalRegion | null {
    if (!provincia) return null;

    const normProvince = provincia.trim().toLowerCase();

    for (const [region, provincias] of Object.entries(TERRITORIOS_FORALES)) {
        if (provincias.some(p => p.toLowerCase() === normProvince)) {
            return region as ForalRegion;
        }
    }

    return null;
}

/**
 * Gets a user-friendly name for a foral region
 * @param region - Foral region enum value
 * @returns Human-readable region name
 */
export function getForalRegionDisplayName(region: ForalRegion): string {
    const displayNames: Record<ForalRegion, string> = {
        PAIS_VASCO: 'País Vasco',
        NAVARRA: 'Navarra',
        CATALUÑA: 'Cataluña',
        ARAGON: 'Aragón',
        GALICIA: 'Galicia',
        BALEARES: 'Islas Baleares',
    };

    return displayNames[region];
}

/**
 * Gets a description of the foral implications for a given region
 * @param region - Foral region enum value
 * @returns Description of legal implications
 */
export function getForalImplications(region: ForalRegion): string {
    const implications: Record<ForalRegion, string> = {
        PAIS_VASCO: 'El derecho civil vasco puede afectar aspectos como el régimen económico matrimonial y la capacidad para contratar.',
        NAVARRA: 'El derecho foral navarro regula de forma específica las arras y el régimen económico matrimonial.',
        CATALUÑA: 'El derecho civil catalán tiene regulación propia sobre contratos de arras y régimen económico familiar.',
        ARAGON: 'El derecho foral aragonés puede afectar al régimen económico matrimonial y la capacidad contractual.',
        GALICIA: 'El derecho civil gallego tiene especialidades en materia de sociedad de gananciales y vivienda familiar.',
        BALEARES: 'El derecho civil balear regula de forma específica las instituciones familiares y los contratos inmobiliarios.',
    };

    return implications[region];
}
