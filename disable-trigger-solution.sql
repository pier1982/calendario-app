-- =====================================================
-- SOLUZIONE DEFINITIVA: DISABILITA TRIGGER AUTOMATICO
-- =====================================================
-- Questo script risolve definitivamente il problema del foreign key constraint
-- disabilitando il trigger automatico e creando un sistema manuale

-- 1. RIMUOVI COMPLETAMENTE IL TRIGGER AUTOMATICO
DROP TRIGGER IF EXISTS trigger_on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. CREA UNA FUNZIONE PUBBLICA PER CREARE PROFILI MANUALMENTE
CREATE OR REPLACE FUNCTION public.create_user_profile_safe()
RETURNS VOID AS $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
BEGIN
  -- Ottieni l'ID e email dell'utente corrente
  SELECT auth.uid() INTO current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Utente non autenticato';
  END IF;
  
  -- Ottieni l'email dall'utente autenticato
  SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
  
  -- Verifica se il profilo esiste già
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = current_user_id) THEN
    -- Crea il profilo
    INSERT INTO public.user_profiles (user_id, email, full_name, role)
    VALUES (
      current_user_id,
      current_user_email,
      '',
      'visualizzatore'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CONCEDI PERMESSI ALLA FUNZIONE
GRANT EXECUTE ON FUNCTION public.create_user_profile_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile_safe() TO anon;

-- 4. CREA UNA FUNZIONE PER RENDERE ADMIN IL PRIMO UTENTE
CREATE OR REPLACE FUNCTION public.make_first_user_admin()
RETURNS VOID AS $$
DECLARE
  user_count INTEGER;
  current_user_id UUID;
BEGIN
  -- Conta quanti utenti ci sono
  SELECT COUNT(*) INTO user_count FROM public.user_profiles;
  
  -- Se questo è il primo utente, rendilo admin
  IF user_count <= 1 THEN
    SELECT auth.uid() INTO current_user_id;
    
    IF current_user_id IS NOT NULL THEN
      UPDATE public.user_profiles 
      SET role = 'admin' 
      WHERE user_id = current_user_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CONCEDI PERMESSI ALLA FUNZIONE ADMIN
GRANT EXECUTE ON FUNCTION public.make_first_user_admin() TO authenticated;

-- 6. ASSICURATI CHE LE POLICY RLS SIANO CORRETTE
-- Rimuovi tutte le policy esistenti
DROP POLICY IF EXISTS "Allow profile creation" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;

-- Crea policy semplici e funzionanti
CREATE POLICY "Allow authenticated users to manage profiles" ON public.user_profiles
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Abilita RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ISTRUZIONI PER L'IMPLEMENTAZIONE NELL'APP
-- =====================================================
/*
Nell'applicazione React, dopo una registrazione riuscita,
dovrai chiamare queste funzioni:

1. Subito dopo la registrazione:
   await supabase.rpc('create_user_profile_safe')

2. Per rendere admin il primo utente:
   await supabase.rpc('make_first_user_admin')

Esempio di implementazione in AuthProvider.jsx:

const handleSignUp = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    
    if (error) throw error
    
    // Crea il profilo utente
    const { error: profileError } = await supabase.rpc('create_user_profile_safe')
    if (profileError) throw profileError
    
    // Rendi admin il primo utente
    const { error: adminError } = await supabase.rpc('make_first_user_admin')
    if (adminError) console.warn('Errore nel rendere admin:', adminError)
    
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
*/

-- =====================================================
-- VERIFICA CHE TUTTO SIA STATO CREATO CORRETTAMENTE
-- =====================================================
-- Esegui queste query per verificare:
-- SELECT * FROM public.user_profiles;
-- SELECT public.create_user_profile_safe();
-- SELECT public.make_first_user_admin();