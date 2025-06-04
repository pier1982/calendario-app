# Configurazione Supabase per Calendario App

## Passo 1: Crea progetto Supabase

1. Vai su [supabase.com](https://supabase.com)
2. Crea un account se non ce l'hai
3. Clicca "New Project"
4. Scegli un nome per il progetto (es. "calendario-app")
5. Imposta una password per il database
6. Seleziona una regione (preferibilmente Europe per l'Italia)
7. Clicca "Create new project"

## Passo 2: Ottieni le credenziali

1. Una volta creato il progetto, vai nella sezione **Settings** > **API**
2. Copia i seguenti valori:
   - **Project URL** (es. `https://xxxxx.supabase.co`)
   - **anon public key** (una lunga stringa che inizia con `eyJ...`)

## Passo 3: Configura le variabili d'ambiente

1. Apri il file `.env.local` nella root del progetto
2. Sostituisci i placeholder con i tuoi valori:

```env
VITE_SUPABASE_URL=https://tuoprogetto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Passo 4: Crea la tabella nel database

1. Nel dashboard Supabase, vai nella sezione **SQL Editor**
2. Clicca "New query"
3. Copia e incolla tutto il contenuto del file `supabase-setup.sql`
4. Clicca "Run" per eseguire lo script

## Passo 5: Verifica la configurazione

1. Avvia l'app con `npm run dev`
2. Apri la console del browser (F12)
3. Prova ad assegnare un operatore a una data
4. Dovresti vedere nei log della console:
   - "Assegnazioni salvate su Supabase: [...]"
5. Nel dashboard Supabase, vai in **Table Editor** > **assignments**
6. Dovresti vedere i dati salvati

## Struttura della tabella `assignments`

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | SERIAL | Chiave primaria auto-incrementale |
| date_key | VARCHAR(10) | Data in formato "YYYY-MM-DD" |
| role | VARCHAR(50) | Nome del reparto ("Sala 1", "Olieria", etc.) |
| operator | VARCHAR(50) | Nome dell'operatore |
| created_at | TIMESTAMP | Data di creazione |
| updated_at | TIMESTAMP | Data ultimo aggiornamento |

## Troubleshooting

### Errore "Invalid API key"
- Verifica che le credenziali in `.env.local` siano corrette
- Riavvia il server di sviluppo (`npm run dev`)

### Errore "relation assignments does not exist"
- Assicurati di aver eseguito lo script SQL nel database
- Verifica nella sezione Table Editor che la tabella sia stata creata

### Errore "Row Level Security"
- Lo script SQL include già le policy RLS necessarie
- Se hai problemi, puoi temporaneamente disabilitare RLS dalla tabella

### I dati non si salvano
- Controlla la console del browser per errori
- Verifica che le credenziali siano corrette
- Assicurati che la tabella esista nel database

## Funzionalità implementate

✅ **Salvataggio automatico**: Ogni volta che salvi un'assegnazione, viene salvata su Supabase
✅ **Caricamento automatico**: All'avvio dell'app, i dati vengono caricati da Supabase
✅ **Persistenza**: I dati rimangono salvati anche dopo refresh della pagina
✅ **Sincronizzazione**: Più utenti possono vedere gli stessi dati (se condividono il database)
✅ **Gestione errori**: Log dettagliati in console per debugging

## Prossimi passi (opzionali)

- **Autenticazione**: Aggiungere login utenti per sicurezza
- **Real-time**: Sincronizzazione in tempo reale tra più utenti
- **Backup**: Export/import dati
- **Audit log**: Tracciamento modifiche