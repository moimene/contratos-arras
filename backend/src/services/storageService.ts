import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_BASE_DIR = process.env.FILES_DIR || './files';

// Crear directorios si no existen
await fs.mkdir(path.join(STORAGE_BASE_DIR, 'pdfs'), { recursive: true });
await fs.mkdir(path.join(STORAGE_BASE_DIR, 'documentos'), { recursive: true });
await fs.mkdir(path.join(STORAGE_BASE_DIR, 'actas'), { recursive: true });

/**
 * Guarda un archivo en el storage local
 * En producción, esto podría usar S3, Supabase Storage, etc.
 * 
 * @param buffer - Buffer del archivo
 * @param filename - Nombre original del archivo
 * @param type - Tipo de archivo ('pdf', 'documento', 'acta')
 * @returns Path relativo del archivo guardado
 */
export async function guardarArchivo(
    buffer: Buffer,
    filename: string,
    type: 'pdf' | 'documento' | 'acta' = 'documento'
): Promise<string> {
    const extension = path.extname(filename);
    const uniqueFilename = `${uuidv4()}${extension}`;

    const subdir = type === 'pdf' ? 'pdfs' : type === 'acta' ? 'actas' : 'documentos';
    const fullPath = path.join(STORAGE_BASE_DIR, subdir, uniqueFilename);

    await fs.writeFile(fullPath, buffer);

    // Retornar path relativo
    return path.join(subdir, uniqueFilename);
}

/**
 * Lee un archivo del storage
 * 
 * @param relativePath - Path relativo del archivo
 * @returns Buffer del archivo
 */
export async function leerArchivo(relativePath: string): Promise<Buffer> {
    const fullPath = path.join(STORAGE_BASE_DIR, relativePath);
    return await fs.readFile(fullPath);
}

/**
 * Elimina un archivo del storage
 * 
 * @param relativePath - Path relativo del archivo
 */
export async function eliminarArchivo(relativePath: string): Promise<void> {
    const fullPath = path.join(STORAGE_BASE_DIR, relativePath);
    await fs.unlink(fullPath);
}

/**
 * Obtiene la URL pública de un archivo
 * En desarrollo: localhost
 * En producción: CDN o Supabase Storage URL
 * 
 * @param relativePath - Path relativo del archivo
 * @returns URL completa del archivo
 */
export function obtenerUrlPublica(relativePath: string): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
    return `${baseUrl}/storage/${relativePath}`;
}

console.log('✓ Storage service initialized:', STORAGE_BASE_DIR);
