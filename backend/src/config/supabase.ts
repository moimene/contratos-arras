import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://wmoovqurcnloqltupx.supabase.co';
// Use service role key for backend operations (bypasses RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_KEY o SUPABASE_ANON_KEY no está configurada en las variables de entorno');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});

console.log('✓ Supabase client initialized:', supabaseUrl, '(service role)');
