import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Don't throw on import - handle gracefully at runtime
let supabaseClient = null;

if (supabaseUrl && supabaseServiceKey) {
    supabaseClient = createClient(
        supabaseUrl,
        supabaseServiceKey,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        }
    );
}

export const supabase = supabaseClient;

export function getSupabase() {
    if (!supabaseClient) {
        throw new Error("Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.");
    }
    return supabaseClient;
}

export default supabase;