
import { createClient } from '@supabase/supabase-js';

// Helper to get config from Env or LocalStorage
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env[key]) return process.env[key];
  if (typeof window !== 'undefined') return localStorage.getItem(key);
  return '';
}

// Use provided credentials as defaults
const DEFAULT_URL = 'https://zuohfleakrsjkmpexryh.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1b2hmbGVha3JzamttcGV4cnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2OTg1NDEsImV4cCI6MjA3OTI3NDU0MX0.WMXf5NqChgCtwfOo9KunJI7DoGQLFsgutKRXOsj308E';

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL') || localStorage.getItem('SUPABASE_URL') || DEFAULT_URL;
const SUPABASE_KEY = getEnv('VITE_SUPABASE_KEY') || getEnv('SUPABASE_KEY') || localStorage.getItem('SUPABASE_KEY') || DEFAULT_KEY;

const isValidUrl = (url: string) => url && url.startsWith('https://');
const isValidKey = (key: string) => key && key.length > 20;

export const isSupabaseConfigured = isValidUrl(SUPABASE_URL) && isValidKey(SUPABASE_KEY);

export const supabase = isSupabaseConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : createClient('https://placeholder.supabase.co', 'placeholder');

export const configureBackend = (url: string, key: string) => {
  localStorage.setItem('SUPABASE_URL', url);
  localStorage.setItem('SUPABASE_KEY', key);
  window.location.reload();
};

export const disconnectBackend = () => {
  localStorage.removeItem('SUPABASE_URL');
  localStorage.removeItem('SUPABASE_KEY');
  window.location.reload();
};
