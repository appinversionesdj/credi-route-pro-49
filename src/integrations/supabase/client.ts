import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Obtener las variables de entorno
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://lvwsrwaepgievgqflziq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2d3Nyd2FlcGdpZXZncWZsemlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODMwMTksImV4cCI6MjA3MzY1OTAxOX0.h2pHAlj3E982KpuJD9IcgLa2iqq8mRIzHdfY3cKznXE";

// Verificar que las variables estén configuradas
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('❌ Error: Las variables de entorno de Supabase no están configuradas');
  console.error('Por favor, crea un archivo .env.local con:');
  console.error('VITE_SUPABASE_URL=tu_url_de_supabase');
  console.error('VITE_SUPABASE_ANON_KEY=tu_clave_anonima');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Función para verificar la conexión
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('deudores').select('count').limit(1);
    if (error) {
      console.error('❌ Error de conexión a Supabase:', error);
      return false;
    }
    console.log('✅ Conexión a Supabase exitosa');
    return true;
  } catch (err) {
    console.error('❌ Error de conexión a Supabase:', err);
    return false;
  }
};