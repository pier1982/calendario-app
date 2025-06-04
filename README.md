# 📅 Calendario Turni con Notifiche WhatsApp

Un'applicazione web moderna per la gestione dei turni di lavoro con sistema di notifiche WhatsApp integrato.

## ✨ Caratteristiche principali

- 📅 **Gestione turni**: Assegnazione operatori per turni mattina/pomeriggio/notte
- 👥 **Gestione operatori**: Configurazione ruoli e competenze
- 📊 **Statistiche avanzate**: Analisi ore lavorate e distribuzione turni
- 📱 **Notifiche WhatsApp**: Sistema automatico di notifiche per operatori
- 💾 **Persistenza dati**: Salvataggio su Supabase con backup locale
- 🎨 **UI moderna**: Interfaccia responsive con Tailwind CSS

## 🚀 Avvio rapido

1. **Clona il repository**
   ```bash
   git clone <repository-url>
   cd calendario-app
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Configura Supabase**
   - Copia `.env.local.example` in `.env.local`
   - Inserisci le tue credenziali Supabase
   - Esegui lo script SQL per creare le tabelle

4. **Configura WhatsApp (Opzionale)**
   - Scegli un provider (Twilio, WATI, o AiSensy)
   - Aggiungi le credenziali nel file `.env.local`
   - Configura i template di messaggio nell'app

5. **Avvia l'applicazione**
   ```bash
   npm run dev
   ```

## 📱 Sistema Notifiche WhatsApp

### Provider supportati

#### 🔵 Twilio (Raccomandato per aziende)
- **Pro**: Affidabilità elevata, supporto completo
- **Contro**: Costo più alto
- **Setup**: Registrazione su [Twilio](https://www.twilio.com)

#### 🟢 WATI (Buon compromesso)
- **Pro**: Prezzo competitivo, facile da usare
- **Contro**: Funzionalità limitate rispetto a Twilio
- **Setup**: Registrazione su [WATI](https://www.wati.io)

#### 🟡 AiSensy (Economico)
- **Pro**: Costo basso, ideale per piccole aziende
- **Contro**: Meno funzionalità avanzate
- **Setup**: Registrazione su [AiSensy](https://aisensy.com)

### Tipi di notifiche

- ✅ **Assegnazione turno**: Notifica quando viene assegnato un turno
- 🔄 **Modifica turno**: Notifica per cambi di turno
- ❌ **Rimozione turno**: Notifica per rimozione da un turno
- ⏰ **Promemoria**: Notifiche automatiche il giorno prima del turno

### Configurazione

1. **Accedi alle impostazioni WhatsApp** tramite il pulsante 📱 nell'app
2. **Seleziona il provider** e inserisci le credenziali
3. **Configura i numeri** degli operatori
4. **Testa la configurazione** con il pulsante di test
5. **Attiva le notifiche** desiderate

## 🛠️ Configurazione ambiente

### File .env.local

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# WhatsApp - Twilio
VITE_TWILIO_ACCOUNT_SID=your_account_sid
VITE_TWILIO_AUTH_TOKEN=your_auth_token
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# WhatsApp - WATI (alternativo)
# VITE_WATI_API_KEY=your_wati_key
# VITE_WATI_INSTANCE_ID=your_instance_id

# WhatsApp - AiSensy (alternativo)
# VITE_AISENSY_API_KEY=your_aisensy_key
```

### Database Supabase

Esegui il contenuto di `supabase-setup.sql` nel SQL Editor di Supabase per creare la tabella `assignments`.

## 📋 Utilizzo

### Gestione turni
1. Clicca su una data nel calendario
2. Seleziona operatori per mattina/pomeriggio/notte
3. Salva - le notifiche WhatsApp vengono inviate automaticamente

### Configurazione operatori
1. Vai in "Impostazioni" (⚙️)
2. Aggiungi operatori con nome e ruolo
3. Configura i numeri WhatsApp nella sezione dedicata

### Statistiche
1. Clicca su "Statistiche" (📊)
2. Visualizza ore lavorate per operatore
3. Analizza la distribuzione dei turni

## 🔧 Tecnologie utilizzate

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Routing**: React Router DOM
- **Date**: date-fns
- **Notifiche**: WhatsApp Business API

## 📁 Struttura progetto

```
src/
├── components/
│   ├── CalendarApp.jsx      # Componente principale
│   ├── MonthView.jsx        # Vista calendario
│   ├── ShiftModal.jsx       # Modale assegnazione turni
│   ├── OperatorModal.jsx    # Modale gestione operatori
│   ├── StatsModal.jsx       # Modale statistiche
│   ├── SettingsPage.jsx     # Pagina impostazioni
│   └── WhatsAppSettings.jsx # Configurazione WhatsApp
├── lib/
│   ├── supabase.js          # Client Supabase
│   └── whatsapp.js          # Gestione notifiche WhatsApp
└── App.jsx                  # Router principale
```

## 🚨 Note importanti

### Sicurezza
- Non committare mai file `.env.local` con credenziali reali
- Usa variabili d'ambiente per la produzione
- Testa sempre con numeri limitati prima del deploy

### Costi WhatsApp
- Verifica i costi del provider scelto
- Monitora l'uso per evitare sorprese
- Usa numeri di test durante lo sviluppo

### Limitazioni
- WhatsApp Business API richiede approvazione per uso commerciale
- Alcuni provider hanno limiti sui messaggi giornalieri
- I template di messaggio potrebbero richiedere approvazione

## 🤝 Contribuire

1. Fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push del branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

## 📞 Supporto

Per problemi o domande:
- Apri una issue su GitHub
- Controlla la documentazione dei provider WhatsApp
- Verifica la configurazione Supabase

---

**Sviluppato con ❤️ per semplificare la gestione dei turni di lavoro**