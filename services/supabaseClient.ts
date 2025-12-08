import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ndrdksmdkhljymuvxjly.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0aETJTgJJ5SZDXppAfRTnw_LO2_J_j6';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Using mock mode.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// Helper to set current user context for RLS
export const setUserContext = async (userId: string, authId: string) => {
    await supabase.rpc('set_config', {
        setting_name: 'app.current_user_id',
        setting_value: userId
    });

    await supabase.rpc('set_config', {
        setting_name: 'app.current_user_auth_id',
        setting_value: authId
    });
};
