import { SUPABASE_CONFIG } from "@/config/supabase";
const SUPABASE_URL = SUPABASE_CONFIG.url;
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  storage: {
    sessionKey: string;
  };
  auth: {
    refreshBeforeExpiry: number;
  };
}

export function getSupabaseConfig(): SupabaseConfig {
  return {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    storage: {
      sessionKey: 'auth_session',
    },
    auth: {
      refreshBeforeExpiry: 120,
    },
  };
}

export function validateSupabaseConfig(): void {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase URL and Anon Key must be provided in your .env file. " +
      "Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    );
  }
}