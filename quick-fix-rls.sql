-- =====================================================
-- QUICK FIX PER PROBLEMA REGISTRAZIONE UTENTI
-- =====================================================
-- Esegui questo script nel SQL Editor di Supabase

-- 1. Rimuovi tutte le policy esistenti per user_profiles
DROP POLICY IF EXISTS "Allow profile creation" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;

-- 2. Crea solo le policy essenziali per la registrazione

-- Policy per permettere l'inserimento di nuovi profili (CRITICO)
CREATE POLICY "Allow profile creation" ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy per permettere agli utenti di vedere il proprio profilo
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy per permettere agli utenti di aggiornare il proprio profilo
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Verifica che RLS sia abilitato
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DOPO AVER ESEGUITO QUESTO SCRIPT:
-- 1. Testa la registrazione su https://calendarioc.netlify.app/
-- 2. Se funziona, rendi admin il primo utente con:
--    UPDATE public.user_profiles SET role = 'admin' WHERE email = 'tua-email@esempio.com';
-- =====================================================