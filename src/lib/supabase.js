import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate credentials exist
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase credentials missing in .env file');
    console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Validate anon key format (should be a JWT starting with "eyJ")
if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
    console.error('❌ Invalid Supabase anon key format');
    console.error('Anon key should be a JWT token starting with "eyJ"');
    console.error('Current key:', supabaseAnonKey);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);