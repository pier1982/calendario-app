-- =====================================================
-- FIX PER ERRORE FOREIGN KEY CONSTRAINT
-- =====================================================
-- Questo script risolve l'errore: "Key (user_id) is not present in table "users""

-- Il problema è che la tabella user_profiles fa riferimento a auth.users
-- ma il trigger sta cercando di inserire prima che l'utente sia completamente creato

-- 1. Modifica il trigger per usare un approccio più robusto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Aggiungi un piccolo ritardo per assicurarsi che l'utente sia completamente creato
  PERFORM pg_sleep(0.5);
  
  -- Verifica che l'utente esista prima di inserire
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id) THEN
    INSERT INTO public.user_profiles (user_id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ricrea il trigger
DROP TRIGGER IF EXISTS trigger_on_auth_user_created ON auth.users;
CREATE TRIGGER trigger_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Soluzione alternativa: Disabilita temporaneamente il trigger e crea manualmente i profili
-- Se la soluzione sopra non funziona, esegui questo codice:

/*
-- Disabilita il trigger
DROP TRIGGER IF EXISTS trigger_on_auth_user_created ON auth.users;

-- Crea una funzione pubblica che l'utente può chiamare dopo la registrazione
CREATE OR REPLACE FUNCTION public.create_user_profile(user_email TEXT)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Ottieni l'ID utente dalla email
  SELECT id INTO v_user_id FROM auth.users WHERE email = user_email;
  
  -- Se l'utente esiste e non ha già un profilo, crealo
  IF v_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = v_user_id) THEN
    INSERT INTO public.user_profiles (user_id, email, full_name)
    VALUES (v_user_id, user_email, '');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Concedi i permessi per chiamare la funzione
GRANT EXECUTE ON FUNCTION public.create_user_profile(TEXT) TO authenticated;
*/

-- =====================================================
-- ISTRUZIONI PER L'USO
-- =====================================================
-- 1. Esegui questo script nel SQL Editor di Supabase
-- 2. Testa la registrazione su https://calendarioc.netlify.app/
-- 3. Se funziona, rendi admin il primo utente con:
--    UPDATE public.user_profiles SET role = 'admin' WHERE email = 'tua-email@esempio.com';

-- Se continui ad avere problemi, prova a disabilitare temporaneamente il trigger
-- e usa la funzione alternativa commentata sopra.