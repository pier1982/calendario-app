import { createClient } from '@supabase/supabase-js'

// Legge le credenziali dalle variabili d'ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)