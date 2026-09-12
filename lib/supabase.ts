import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY manquants. ' +
      'Copiez .env.example vers .env et renseignez les valeurs de votre projet Supabase.'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Nécessaire sur le web pour que le lien de réinitialisation de mot de
    // passe (qui revient avec un jeton dans l'URL) établisse bien une
    // session de récupération. Sans effet sur natif (pas de barre d'URL).
    detectSessionInUrl: true,
  },
});
