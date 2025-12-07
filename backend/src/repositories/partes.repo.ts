import { supabase } from '../config/supabase.js';
import { v4 as uuid } from 'uuid';
import { nowIso } from '../utils/time.js';
import type { Parte } from '../types/models.js';

/**
 * Repositorio para gestión de partes (compradores, vendedores, etc.)
 */

export async function createParte(data: Partial<Parte>): Promise<Parte> {
    const id = uuid();
    const ts = nowIso();

    const parte = {
        id,
        rol: data.rol!,
        nombre: data.nombre!,
        apellidos: data.apellidos!,
        estado_civil: data.estado_civil || null,
        tipo_documento: data.tipo_documento!,
        numero_documento: data.numero_documento!,
        email: data.email!,
        telefono: data.telefono || null,
        domicilio: data.domicilio || null,
        es_representante: data.es_representante || false,
        representa_a: data.representa_a || null,
        created_at: ts,
        updated_at: ts,
    };

    const { data: inserted, error } = await supabase
        .from('partes')
        .insert(parte)
        .select()
        .single();

    if (error) throw error;
    return inserted;
}

export async function getParteById(id: string): Promise<Parte | null> {
    const { data, error } = await supabase
        .from('partes')
        .select('*')
        .eq('id', id)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

export async function getPartesByContrato(
    contratoId: string
): Promise<any[]> {
    const { data, error } = await supabase
        .from('contratos_partes')
        .select(
            `
      *,
      parte:partes(*)
    `
        )
        .eq('contrato_id', contratoId);

    if (error) throw error;
    return data || [];
}

export async function updateParte(
    id: string,
    patch: Partial<Parte>
): Promise<Parte> {
    const { data, error } = await supabase
        .from('partes')
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

export async function deleteParte(id: string): Promise<void> {
    const { error } = await supabase.from('partes').delete().eq('id', id);

    if (error) throw error;
}
