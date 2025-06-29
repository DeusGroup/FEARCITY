// Public Supabase configuration for client-side use
// IMPORTANT: These values should be loaded from environment variables
// Do not hardcode credentials in production
window.SUPABASE_CONFIG = {
  url: window.__VITE_SUPABASE_URL__ || "",
  anonKey: window.__VITE_SUPABASE_ANON_KEY__ || ""
};