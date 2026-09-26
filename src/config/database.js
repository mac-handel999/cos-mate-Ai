import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const configured = Boolean(env.supabaseUrl && env.supabaseServiceKey);

if (!configured) {
    console.warn("Supabase server configuration is missing. Conversation memory is disabled.");
}

// This client is server-only. The service-role key is required because the
// schema enables RLS and channel users do not have Supabase Auth sessions.
export const supabase = configured
    ? createClient(env.supabaseUrl, env.supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    })
    : null;

export const isSupabaseConfigured = () => configured;

export default supabase;
