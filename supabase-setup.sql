-- Script SQL per creare la tabella assignments in Supabase
-- Esegui questo script nel SQL Editor del tuo progetto Supabase

-- Rimuovi la tabella se esiste già
DROP TABLE IF EXISTS assignments;

CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  date_key VARCHAR(10) NOT NULL, -- formato "2025-01-15"
  role VARCHAR(50) NOT NULL,     -- "Sala 1", "Olieria", etc.
  operator VARCHAR(50) NOT NULL, -- "Maccioni", "Pestarino", etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date_key, role)
);

-- Abilita Row Level Security (RLS)
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Policy per permettere lettura a tutti
DROP POLICY IF EXISTS "Enable read access for all users" ON assignments;
CREATE POLICY "Enable read access for all users" ON assignments
  FOR SELECT USING (true);

-- Policy per permettere inserimento a tutti
DROP POLICY IF EXISTS "Enable insert for all users" ON assignments;
CREATE POLICY "Enable insert for all users" ON assignments
  FOR INSERT WITH CHECK (true);

-- Policy per permettere aggiornamento a tutti
DROP POLICY IF EXISTS "Enable update for all users" ON assignments;
CREATE POLICY "Enable update for all users" ON assignments
  FOR UPDATE USING (true);

-- Policy per permettere eliminazione a tutti
DROP POLICY IF EXISTS "Enable delete for all users" ON assignments;
CREATE POLICY "Enable delete for all users" ON assignments
  FOR DELETE USING (true);

-- Trigger per aggiornare automaticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();