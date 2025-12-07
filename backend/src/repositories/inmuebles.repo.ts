import { supabase } from '../config/supabase.js';
import { v4 as uuid } from 'uuid';
import { nowIso } from '../utils/time.js';
import type { Inmueble } from '../types/models.js';

/**
 * Repositorio para gestión de inmuebles
 */

export async function createInmueble(
    data: Partial<Inmueble>
): Promise<Inmueble> {
    const id = uuid();
    const ts = nowIso();

    const inmueble = {
        id,
        direccion_completa: data.direccion_completa!,
        codigo_postal: data.codigo_postal || null,
        ciudad: data.ciudad!,
        provincia: data.provincia!,
        identificador_catastral: data.identificador_catastral || null,
        referencia_catastral: data.referencia_catastral || null,
        datos_registrales: data.datos_registrales || null,
        titulo_adquisicion_vendedor: data.titulo_adquisicion_vendedor || null,
        nota_simple_csv: data.nota_simple_csv || null,
        nota_simple_fecha: data.nota_simple_fecha || null,
        url_anuncio: data.url_anuncio || null,
        datos_descripcion: data.datos_descripcion || null,
        m2: data.m2 || null,
        habitaciones: data.habitaciones || null,
        banos: data.banos || null,
        created_at: ts,
        updated_at: ts,
    };

    const { data: inserted, error } = await supabase
        .from('inmuebles')
        .insert(inmueble)
        .select()
        .single();

    if (error) throw error;
    return inserted;
}

export async function getInmuebleById(id: string): Promise<Inmueble | null> {
    const { data, error } = await supabase
        .from('inmuebles')
        .select('*')
        .eq('id', id)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

export async function updateInmueble(
    id: string,
    patch: Partial<Inmueble>
): Promise<Inmueble> {
    const { data, error } = await supabase
        .from('inmuebles')
        .update({
            ...patch,
            updated_at: nowIso(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteInmueble(id: string): Promise<void> {
    const { error } = await supabase.from('inmuebles').delete().eq('id', id);

    if (error) throw error;
}
