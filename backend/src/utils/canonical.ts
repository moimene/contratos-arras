/**
 * Canonicaliza un objeto JSON ordenando recursivamente sus claves
 * para garantizar hashes consistentes
 */
export function canonicalize(obj: any): string {
    const sortKeys = (o: any): any => {
        if (o === null || o === undefined) {
            return null;
        }

        if (Array.isArray(o)) {
            return o.map(sortKeys);
        }

        if (typeof o === 'object') {
            const sorted: any = {};
            const keys = Object.keys(o).sort();
            for (const key of keys) {
                sorted[key] = sortKeys(o[key]);
            }
            return sorted;
        }

        return o;
    };

    return JSON.stringify(sortKeys(obj));
}
