import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

// Validate required environment variables
if (!config.supabase.url || !config.supabase.publishableKey) {
  console.warn('Supabase configuration missing. Some features may not work.');
}

// Create Supabase client
export const supabase = createClient(
  config.supabase.url,
  config.supabase.publishableKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(config.supabase.url && config.supabase.publishableKey);
};

export default supabase;