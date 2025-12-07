/**
 * Retorna la fecha/hora actual en formato ISO 8601
 */
export const nowIso = (): string => {
    return new Date().toISOString();
};

/**
 * Añade horas a una fecha
 */
export const addHours = (date: Date, hours: number): Date => {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
};

/**
 * Verifica si una fecha está vencida
 */
export const isExpired = (isoDate: string): boolean => {
    return new Date() > new Date(isoDate);
};
