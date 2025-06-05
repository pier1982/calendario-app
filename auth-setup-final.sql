-- =====================================================
-- SETUP AUTENTICAZIONE SUPABASE - VERSIONE FINALE
-- =====================================================
-- Questo script risolve completamente i problemi di RLS per la registrazione utenti

-- ─── TABELLA PROFILI UTENTE ─────────────────────────
-- Estende la tabella auth.users di Supabase con informazioni aggiuntive
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'visualizzatore' CHECK (role IN ('admin', 'operatore', 'visualizzatore')),
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── INDICI PER PERFORMANCE ────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);

-- ─── TRIGGER PER AGGIORNAMENTO AUTOMATICO ──────────
-- Aggiorna automaticamente updated_at quando il record viene modificato
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─── FUNZIONE PER CREAZIONE AUTOMATICA PROFILO ─────
-- Crea automaticamente un profilo quando un utente si registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger che si attiva quando un nuovo utente si registra
DROP TRIGGER IF EXISTS trigger_on_auth_user_created ON auth.users;
CREATE TRIGGER trigger_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── FUNZIONI HELPER SICURE ───────────────────────────────
-- Funzione per ottenere il ruolo dell'utente corrente (SECURITY DEFINER per bypassare RLS)
CREATE OR REPLACE FUNCTION public.get_user_role_safe()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role 
  FROM public.user_profiles 
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(user_role, 'visualizzatore');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per verificare se l'utente è admin (SECURITY DEFINER per bypassare RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT public.get_user_role_safe() = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per verificare se l'utente è operatore o admin
CREATE OR REPLACE FUNCTION public.can_write()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT public.get_user_role_safe() IN ('admin', 'operatore'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── POLITICHE RLS (ROW LEVEL SECURITY) ────────────
-- Abilita RLS sulla tabella
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Permetti inserimento di nuovi profili (CRITICO per la registrazione)
DROP POLICY IF EXISTS "Allow profile creation" ON public.user_profiles;
CREATE POLICY "Allow profile creation" ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Gli utenti possono vedere il proprio profilo
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Gli utenti possono aggiornare il proprio profilo (eccetto il ruolo)
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Gli admin possono vedere tutti i profili (usa funzione sicura)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT
  USING (public.is_admin());

-- Policy: Gli admin possono aggiornare tutti i profili (usa funzione sicura)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE
  USING (public.is_admin());

-- Policy: Gli admin possono eliminare profili (eccetto il proprio)
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;
CREATE POLICY "Admins can delete profiles" ON public.user_profiles
  FOR DELETE
  USING (public.is_admin() AND user_id != auth.uid());

-- ─── TRIGGER PER PROTEZIONE RUOLO ─────────────────
-- Impedisce agli utenti di modificare il proprio ruolo (tranne agli admin)
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se l'utente sta tentando di modificare il proprio ruolo e non è admin
  IF OLD.user_id = auth.uid() AND OLD.role != NEW.role THEN
    -- Controlla se l'utente corrente è admin usando la funzione sicura
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Non puoi modificare il tuo ruolo';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_prevent_role_change ON public.user_profiles;
CREATE TRIGGER trigger_prevent_role_change
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- ─── AGGIORNAMENTO TABELLA ASSIGNMENTS ────────────
-- Aggiungi colonne per tracciare chi ha creato/modificato gli assignment
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Trigger per aggiornare updated_at negli assignments
DROP TRIGGER IF EXISTS trigger_assignments_updated_at ON public.assignments;
CREATE TRIGGER trigger_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─── POLITICHE RLS PER ASSIGNMENTS ─────────────────
-- Abilita RLS sulla tabella assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Tutti gli utenti autenticati possono leggere gli assignments
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON public.assignments;
CREATE POLICY "Authenticated users can view assignments" ON public.assignments
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Solo operatori e admin possono inserire assignments (usa funzione sicura)
DROP POLICY IF EXISTS "Operators and admins can insert assignments" ON public.assignments;
CREATE POLICY "Operators and admins can insert assignments" ON public.assignments
  FOR INSERT
  WITH CHECK (public.can_write());

-- Policy: Solo operatori e admin possono aggiornare assignments (usa funzione sicura)
DROP POLICY IF EXISTS "Operators and admins can update assignments" ON public.assignments;
CREATE POLICY "Operators and admins can update assignments" ON public.assignments
  FOR UPDATE
  USING (public.can_write());

-- Policy: Solo admin possono eliminare assignments (usa funzione sicura)
DROP POLICY IF EXISTS "Admins can delete assignments" ON public.assignments;
CREATE POLICY "Admins can delete assignments" ON public.assignments
  FOR DELETE
  USING (public.is_admin());

-- ─── FUNZIONI HELPER PUBBLICHE ───────────────────────────────

-- Funzione per ottenere il ruolo dell'utente corrente (per uso nell'app)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN public.get_user_role_safe();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per verificare se l'utente ha un permesso specifico
CREATE OR REPLACE FUNCTION public.has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := public.get_user_role_safe();
  
  CASE permission_name
    WHEN 'read' THEN
      RETURN user_role IN ('admin', 'operatore', 'visualizzatore');
    WHEN 'write' THEN
      RETURN user_role IN ('admin', 'operatore');
    WHEN 'delete' THEN
      RETURN user_role = 'admin';
    WHEN 'manage_users' THEN
      RETURN user_role = 'admin';
    WHEN 'manage_settings' THEN
      RETURN user_role = 'admin';
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── DATI INIZIALI ─────────────────────────────────

-- Crea una tabella per le notifiche admin (opzionale)
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Abilita RLS per admin_notifications
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policy per admin_notifications (solo admin possono vedere)
DROP POLICY IF EXISTS "Admin can view all notifications" ON admin_notifications;
CREATE POLICY "Admin can view all notifications" ON admin_notifications
  FOR ALL USING (public.is_admin());

-- ─── GRANT PERMISSIONS ─────────────────────────────
-- Assicurati che gli utenti autenticati possano accedere alle funzioni
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_write() TO authenticated;

-- ─── COMMENTI E DOCUMENTAZIONE ─────────────────────
COMMENT ON TABLE public.user_profiles IS 'Profili utente estesi con ruoli e permessi';
COMMENT ON COLUMN public.user_profiles.role IS 'Ruolo utente: admin, operatore, visualizzatore';
COMMENT ON COLUMN public.user_profiles.is_active IS 'Indica se l''utente è attivo nel sistema';

COMMENT ON FUNCTION public.get_user_role() IS 'Restituisce il ruolo dell''utente corrente';
COMMENT ON FUNCTION public.has_permission(TEXT) IS 'Verifica se l''utente corrente ha un permesso specifico';
COMMENT ON FUNCTION public.get_user_role_safe() IS 'Funzione sicura per ottenere il ruolo (bypassa RLS)';
COMMENT ON FUNCTION public.is_admin() IS 'Verifica se l''utente corrente è admin (bypassa RLS)';
COMMENT ON FUNCTION public.can_write() IS 'Verifica se l''utente può scrivere (bypassa RLS)';

-- =====================================================
-- FINE SETUP AUTENTICAZIONE - VERSIONE FINALE
-- =====================================================

/*
PER CREARE IL PRIMO UTENTE ADMIN:

1. Registra un nuovo utente tramite l'interfaccia dell'app
2. Esegui questa query per renderlo admin:

UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'tua-email@esempio.com';

3. Oppure, se vuoi creare direttamente un admin via SQL:

-- Prima crea l'utente in auth.users (questo di solito si fa tramite Supabase Auth)
-- Poi aggiorna il ruolo:
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE user_id = 'uuid-del-tuo-utente';
*/

-- Per verificare che tutto sia stato creato correttamente:
-- SELECT * FROM public.user_profiles;
-- SELECT public.get_user_role();
-- SELECT public.has_permission('write');

-- =====================================================
-- ISTRUZIONI PER RISOLVERE I PROBLEMI DI REGISTRAZIONE
-- =====================================================
/*
Se hai ancora problemi di registrazione:

1. DISABILITA TEMPORANEAMENTE RLS per testare:
   ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

2. Testa la registrazione

3. RIABILITA RLS:
   ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

4. Se funziona senza RLS, il problema è nelle politiche.
   In tal caso, ricrea le politiche una per una.
*/