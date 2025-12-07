import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://wmoovqurcnloqltupx.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY no está configurada en las variables de entorno');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});

console.log('✓ Supabase client initialized:', supabaseUrl);
