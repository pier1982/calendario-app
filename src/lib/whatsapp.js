// ─── CONFIGURAZIONE WHATSAPP BUSINESS API ─────────────────────
// Questo modulo gestisce l'invio di notifiche WhatsApp per l'app calendario

// Configurazione per diversi provider WhatsApp Business API
const WHATSAPP_CONFIG = {
  // Opzione 1: Twilio WhatsApp API
  twilio: {
    accountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID,
    authToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN,
    whatsappNumber: import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER, // es: 'whatsapp:+14155238886'
    apiUrl: 'https://api.twilio.com/2010-04-01/Accounts'
  },
  
  // Opzione 2: WATI (WhatsApp Business Solution Provider)
  wati: {
    apiKey: import.meta.env.VITE_WATI_API_KEY,
    apiUrl: 'https://live-server.wati.io/api/v1',
    instanceId: import.meta.env.VITE_WATI_INSTANCE_ID
  },
  
  // Opzione 3: AiSensy
  aisensy: {
    apiKey: import.meta.env.VITE_AISENSY_API_KEY,
    apiUrl: 'https://backend.aisensy.com/campaign/t1/api/v2'
  }
};

// Provider attivo (cambia questo per switchare tra provider)
const ACTIVE_PROVIDER = 'twilio'; // 'twilio' | 'wati' | 'aisensy'

// ─── TEMPLATE MESSAGGI WHATSAPP ──────────────────────────────
const MESSAGE_TEMPLATES = {
  // Notifica nuovo assignment
  newAssignment: {
    twilio: 'Ciao {{operator}}! Sei stato assegnato al ruolo {{role}} per il {{date}}. Calendario Turni App.',
    wati: 'Nuovo turno assegnato:\n👤 Operatore: {{operator}}\n🏢 Ruolo: {{role}}\n📅 Data: {{date}}\n\nCalendario Turni',
    aisensy: 'Nuovo Assignment\n\nOperatore: {{operator}}\nRuolo: {{role}}\nData: {{date}}\n\nGrazie!'
  },
  
  // Promemoria turno (giorno prima)
  reminderTomorrow: {
    twilio: 'Promemoria: Domani {{date}} sei assegnato al ruolo {{role}}. Buona giornata!',
    wati: '⏰ Promemoria Turno\n\n📅 Domani: {{date}}\n🏢 Ruolo: {{role}}\n👤 Operatore: {{operator}}\n\nNon dimenticare!',
    aisensy: 'Promemoria\n\nDomani {{date}} - {{role}}\n\nBuona giornata {{operator}}!'
  },
  
  // Notifica cambio turno
  changeAssignment: {
    twilio: 'Attenzione {{operator}}! Il tuo turno del {{date}} è cambiato. Nuovo ruolo: {{role}}.',
    wati: '🔄 Cambio Turno\n\n📅 Data: {{date}}\n👤 Operatore: {{operator}}\n🏢 Nuovo Ruolo: {{role}}\n\nVerifica il calendario!',
    aisensy: 'Cambio Turno\n\nData: {{date}}\nNuovo ruolo: {{role}}\n\nOperatore: {{operator}}'
  }
};

// ─── FUNZIONI INVIO MESSAGGI ─────────────────────────────────

/**
 * Invia messaggio WhatsApp tramite Twilio
 */
async function sendViaTwilio(phoneNumber, message) {
  const config = WHATSAPP_CONFIG.twilio;
  
  try {
    const response = await fetch(`${config.apiUrl}/${config.accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${config.accountSid}:${config.authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: config.whatsappNumber,
        To: `whatsapp:${phoneNumber}`,
        Body: message
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Messaggio WhatsApp inviato via Twilio:', result.sid);
      return { success: true, messageId: result.sid };
    } else {
      console.error('❌ Errore Twilio:', result);
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error('❌ Errore connessione Twilio:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Invia messaggio WhatsApp tramite WATI
 */
async function sendViaWati(phoneNumber, message) {
  const config = WHATSAPP_CONFIG.wati;
  
  try {
    const response = await fetch(`${config.apiUrl}/sendSessionMessage/${phoneNumber}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messageText: message
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Messaggio WhatsApp inviato via WATI:', result);
      return { success: true, messageId: result.id };
    } else {
      console.error('❌ Errore WATI:', result);
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error('❌ Errore connessione WATI:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Invia messaggio WhatsApp tramite AiSensy
 */
async function sendViaAiSensy(phoneNumber, message) {
  const config = WHATSAPP_CONFIG.aisensy;
  
  try {
    const response = await fetch(`${config.apiUrl}/send-message`, {
      method: 'POST',
      headers: {
        'X-AiSensy-API-Key': config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apikey: config.apiKey,
        mobile: phoneNumber,
        msg: message,
        priority: 1
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.status === 'success') {
      console.log('✅ Messaggio WhatsApp inviato via AiSensy:', result);
      return { success: true, messageId: result.id };
    } else {
      console.error('❌ Errore AiSensy:', result);
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error('❌ Errore connessione AiSensy:', error);
    return { success: false, error: error.message };
  }
}

// ─── FUNZIONE PRINCIPALE INVIO ───────────────────────────────

/**
 * Invia notifica WhatsApp
 * @param {string} phoneNumber - Numero di telefono (formato: +393331234567)
 * @param {string} templateType - Tipo di template ('newAssignment', 'reminderTomorrow', 'changeAssignment')
 * @param {object} variables - Variabili per il template {operator, role, date}
 */
export async function sendWhatsAppNotification(phoneNumber, templateType, variables) {
  // Verifica che il provider sia configurato
  if (!WHATSAPP_CONFIG[ACTIVE_PROVIDER]) {
    console.error('❌ Provider WhatsApp non configurato:', ACTIVE_PROVIDER);
    return { success: false, error: 'Provider non configurato' };
  }
  
  // Ottieni il template del messaggio
  const template = MESSAGE_TEMPLATES[templateType]?.[ACTIVE_PROVIDER];
  if (!template) {
    console.error('❌ Template non trovato:', templateType, ACTIVE_PROVIDER);
    return { success: false, error: 'Template non trovato' };
  }
  
  // Sostituisci le variabili nel template
  let message = template;
  Object.entries(variables).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  
  console.log(`📱 Invio WhatsApp a ${phoneNumber}:`, message);
  
  // Invia tramite il provider attivo
  switch (ACTIVE_PROVIDER) {
    case 'twilio':
      return await sendViaTwilio(phoneNumber, message);
    case 'wati':
      return await sendViaWati(phoneNumber, message);
    case 'aisensy':
      return await sendViaAiSensy(phoneNumber, message);
    default:
      return { success: false, error: 'Provider non supportato' };
  }
}

// ─── FUNZIONI HELPER ─────────────────────────────────────────

/**
 * Valida formato numero di telefono
 */
export function validatePhoneNumber(phoneNumber) {
  // Formato accettato: +393331234567
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
}

/**
 * Formatta data per i messaggi
 */
export function formatDateForMessage(date) {
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}

/**
 * Testa la configurazione WhatsApp
 */
export async function testWhatsAppConfig() {
  const testNumber = '+393331234567'; // Sostituisci con un numero di test
  const testMessage = 'Test configurazione WhatsApp - Calendario Turni App';
  
  console.log('🧪 Test configurazione WhatsApp...');
  
  try {
    const result = await sendWhatsAppNotification(testNumber, 'newAssignment', {
      operator: 'Test User',
      role: 'Test Role',
      date: formatDateForMessage(new Date())
    });
    
    if (result.success) {
      console.log('✅ Test WhatsApp completato con successo!');
    } else {
      console.log('❌ Test WhatsApp fallito:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Errore durante il test:', error);
    return { success: false, error: error.message };
  }
}

export default {
  sendWhatsAppNotification,
  validatePhoneNumber,
  formatDateForMessage,
  testWhatsAppConfig
};