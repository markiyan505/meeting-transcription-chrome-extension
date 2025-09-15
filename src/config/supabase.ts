export const SUPABASE_CONFIG = {
  url: "https://djijpkntnkherkbapkvy.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqaWpwa250bmtoZXJrYmFwa3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NTY1NDQsImV4cCI6MjA2NDUzMjU0NH0.Z-YTsdCzqeQ51j7LsZxXVbTP6P5S1M5qBqo_Yln90xU",

  auth: {
    accessTokenExpiry: 3600,
    refreshTokenExpiry: 2592000,
    refreshBeforeExpiry: 300,
  },

  storage: {
    sessionKey: "auth_session",
    configKey: "auth_config",
  },

  refresh: {
    checkInterval: 60000,
    maxRetries: 3,
    retryDelay: 5000,
  },
};

export function getSupabaseConfig() {
  return SUPABASE_CONFIG;
}

export function validateSupabaseConfig() {
  const config = getSupabaseConfig();

  if (!config.url || config.url === "https://your-project.supabase.co") {
    throw new Error("Supabase URL is not configured");
  }

  if (!config.anonKey || config.anonKey === "your-anon-key") {
    throw new Error("Supabase Anon Key is not configured");
  }

  return true;
}
