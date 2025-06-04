-- =====================================================
-- SETUP AUTENTICAZIONE SUPABASE
-- =====================================================
-- Questo script crea le tabelle e le politiche RLS necessarie
-- per il sistema di autenticazione con ruoli utente

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
CREATE TRIGGER trigger_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── POLITICHE RLS (ROW LEVEL SECURITY) ────────────
-- Abilita RLS sulla tabella
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere il proprio profilo
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Gli utenti possono aggiornare il proprio profilo (eccetto il ruolo)
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND 
    -- Non permettere di cambiare il proprio ruolo
    role = (SELECT role FROM public.user_profiles WHERE user_id = auth.uid())
  );

-- Policy: Gli admin possono vedere tutti i profili
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Gli admin possono aggiornare tutti i profili
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Gli admin possono eliminare profili (eccetto il proprio)
CREATE POLICY "Admins can delete profiles" ON public.user_profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    ) AND user_id != auth.uid()
  );

-- ─── AGGIORNAMENTO TABELLA ASSIGNMENTS ────────────
-- Aggiungi colonne per tracciare chi ha creato/modificato gli assignment
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Trigger per aggiornare updated_at negli assignments
CREATE TRIGGER trigger_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─── POLITICHE RLS PER ASSIGNMENTS ─────────────────
-- Abilita RLS sulla tabella assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Tutti gli utenti autenticati possono leggere gli assignments
CREATE POLICY "Authenticated users can view assignments" ON public.assignments
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Solo operatori e admin possono inserire assignments
CREATE POLICY "Operators and admins can insert assignments" ON public.assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role IN ('operatore', 'admin')
    )
  );

-- Policy: Solo operatori e admin possono aggiornare assignments
CREATE POLICY "Operators and admins can update assignments" ON public.assignments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role IN ('operatore', 'admin')
    )
  );

-- Policy: Solo admin possono eliminare assignments
CREATE POLICY "Admins can delete assignments" ON public.assignments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ─── FUNZIONI HELPER ───────────────────────────────

-- Funzione per ottenere il ruolo dell'utente corrente
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.user_profiles
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per verificare se l'utente ha un permesso specifico
CREATE OR REPLACE FUNCTION public.has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.user_profiles WHERE user_id = auth.uid();
  
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

-- Crea un utente admin di default (opzionale)
-- NOTA: Questo sarà creato solo se non esiste già un admin
-- Dovrai cambiare email e password dopo la prima configurazione

-- Inserisci alcuni ruoli di esempio
INSERT INTO user_profiles (id, email, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'Admin User', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'operator@example.com', 'Operator User', 'operatore'),
  ('00000000-0000-0000-0000-000000000003', 'viewer@example.com', 'Viewer User', 'visualizzatore');

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
CREATE POLICY "Admin can view all notifications" ON admin_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Inserisci un commento con le istruzioni per creare il primo admin:
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

-- ─── GRANT PERMISSIONS ─────────────────────────────
-- Assicurati che gli utenti autenticati possano accedere alle funzioni
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(TEXT) TO authenticated;

-- ─── COMMENTI E DOCUMENTAZIONE ─────────────────────
COMMENT ON TABLE public.user_profiles IS 'Profili utente estesi con ruoli e permessi';
COMMENT ON COLUMN public.user_profiles.role IS 'Ruolo utente: admin, operatore, visualizzatore';
COMMENT ON COLUMN public.user_profiles.is_active IS 'Indica se l''utente è attivo nel sistema';

COMMENT ON FUNCTION public.get_user_role() IS 'Restituisce il ruolo dell''utente corrente';
COMMENT ON FUNCTION public.has_permission(TEXT) IS 'Verifica se l''utente corrente ha un permesso specifico';

-- =====================================================
-- FINE SETUP AUTENTICAZIONE
-- =====================================================

-- Per verificare che tutto sia stato creato correttamente:
-- SELECT * FROM public.user_profiles;
-- SELECT public.get_user_role();
-- SELECT public.has_permission('write');