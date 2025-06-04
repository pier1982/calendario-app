import React, { useState, useEffect } from 'react';
import { testWhatsAppConfig, validatePhoneNumber } from '../lib/whatsapp.js';

export default function WhatsAppSettings({ onSave, onClose }) {
  // ─── STATO COMPONENTE ────────────────────────────────────────
  const [settings, setSettings] = useState({
    enabled: false,
    provider: 'twilio', // 'twilio' | 'wati' | 'aisensy'
    notifications: {
      newAssignment: true,
      reminderTomorrow: true,
      changeAssignment: true
    },
    // Configurazioni provider
    twilio: {
      accountSid: '',
      authToken: '',
      whatsappNumber: ''
    },
    wati: {
      apiKey: '',
      instanceId: ''
    },
    aisensy: {
      apiKey: ''
    }
  });
  
  const [operators, setOperators] = useState([
    { name: 'Pestarino', phone: '', enabled: false },
    { name: 'Maccioni', phone: '', enabled: false },
    { name: 'Imelio', phone: '', enabled: false },
    { name: 'Martinelli', phone: '', enabled: false },
    { name: 'Poidomani', phone: '', enabled: false },
    { name: 'Marmorato', phone: '', enabled: false },
    { name: 'Pasquero', phone: '', enabled: false },
    { name: 'Gigliotti', phone: '', enabled: false },
    { name: 'Gemme', phone: '', enabled: false }
  ]);
  
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'operators' | 'test'

  // ─── CARICAMENTO IMPOSTAZIONI ───────────────────────────────
  useEffect(() => {
    const savedSettings = localStorage.getItem('whatsappSettings');
    const savedOperators = localStorage.getItem('whatsappOperators');
    
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Errore caricamento impostazioni WhatsApp:', error);
      }
    }
    
    if (savedOperators) {
      try {
        setOperators(JSON.parse(savedOperators));
      } catch (error) {
        console.error('Errore caricamento operatori WhatsApp:', error);
      }
    }
  }, []);

  // ─── GESTIONE CAMBIAMENTI ───────────────────────────────────
  const handleSettingChange = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };
  
  const handleOperatorChange = (index, field, value) => {
    setOperators(prev => {
      const newOperators = [...prev];
      newOperators[index] = { ...newOperators[index], [field]: value };
      return newOperators;
    });
  };

  // ─── SALVATAGGIO ────────────────────────────────────────────
  const handleSave = () => {
    // Valida numeri di telefono
    const invalidPhones = operators.filter(op => 
      op.enabled && op.phone && !validatePhoneNumber(op.phone)
    );
    
    if (invalidPhones.length > 0) {
      alert(`Numeri di telefono non validi per: ${invalidPhones.map(op => op.name).join(', ')}\n\nFormato richiesto: +393331234567`);
      return;
    }
    
    // Salva in localStorage
    localStorage.setItem('whatsappSettings', JSON.stringify(settings));
    localStorage.setItem('whatsappOperators', JSON.stringify(operators));
    
    // Callback al componente padre
    if (onSave) {
      onSave({ settings, operators });
    }
    
    alert('✅ Impostazioni WhatsApp salvate!');
  };

  // ─── TEST CONFIGURAZIONE ────────────────────────────────────
  const handleTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const result = await testWhatsAppConfig();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* ─── HEADER ─────────────────────────────────────────── */}
        <div className="bg-green-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📱</span>
            <h2 className="text-xl font-bold">Impostazioni WhatsApp</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* ─── TABS ──────────────────────────────────────────── */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4">
            {[
              { id: 'general', label: 'Generale', icon: '⚙️' },
              { id: 'operators', label: 'Operatori', icon: '👥' },
              { id: 'test', label: 'Test', icon: '🧪' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* ─── CONTENUTO ─────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* TAB GENERALE */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Abilitazione WhatsApp */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Abilita Notifiche WhatsApp</h3>
                  <p className="text-sm text-gray-600">Attiva l'invio automatico di notifiche via WhatsApp</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {/* Selezione Provider */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Provider WhatsApp</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'twilio', name: 'Twilio', desc: 'Soluzione enterprise affidabile' },
                    { id: 'wati', name: 'WATI', desc: 'Facile da configurare' },
                    { id: 'aisensy', name: 'AiSensy', desc: 'Economico per piccole aziende' }
                  ].map(provider => (
                    <label key={provider.id} className="cursor-pointer">
                      <input
                        type="radio"
                        name="provider"
                        value={provider.id}
                        checked={settings.provider === provider.id}
                        onChange={(e) => handleSettingChange('provider', e.target.value)}
                        className="sr-only peer"
                      />
                      <div className="p-4 border-2 border-gray-200 rounded-lg peer-checked:border-green-500 peer-checked:bg-green-50 hover:border-gray-300">
                        <h4 className="font-medium text-gray-900">{provider.name}</h4>
                        <p className="text-sm text-gray-600">{provider.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Configurazione Provider Selezionato */}
              {settings.provider === 'twilio' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3">Configurazione Twilio</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account SID</label>
                      <input
                        type="text"
                        value={settings.twilio.accountSid}
                        onChange={(e) => handleSettingChange('twilio.accountSid', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Auth Token</label>
                      <input
                        type="password"
                        value={settings.twilio.authToken}
                        onChange={(e) => handleSettingChange('twilio.authToken', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Token di autenticazione"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Numero WhatsApp</label>
                      <input
                        type="text"
                        value={settings.twilio.whatsappNumber}
                        onChange={(e) => handleSettingChange('twilio.whatsappNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="whatsapp:+14155238886"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tipi di Notifiche */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Tipi di Notifiche</h3>
                <div className="space-y-3">
                  {[
                    { key: 'newAssignment', label: 'Nuovo Assignment', desc: 'Quando viene assegnato un nuovo turno' },
                    { key: 'reminderTomorrow', label: 'Promemoria Giorno Prima', desc: 'Ricorda il turno del giorno successivo' },
                    { key: 'changeAssignment', label: 'Cambio Turno', desc: 'Quando viene modificato un assignment esistente' }
                  ].map(notif => (
                    <label key={notif.key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={settings.notifications[notif.key]}
                        onChange={(e) => handleSettingChange(`notifications.${notif.key}`, e.target.checked)}
                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{notif.label}</div>
                        <div className="text-sm text-gray-600">{notif.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB OPERATORI */}
          {activeTab === 'operators' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Numeri WhatsApp Operatori</h3>
              <div className="space-y-3">
                {operators.map((operator, index) => (
                  <div key={operator.name} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={operator.enabled}
                      onChange={(e) => handleOperatorChange(index, 'enabled', e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                    />
                    <div className="w-24 font-medium text-gray-900">{operator.name}</div>
                    <input
                      type="tel"
                      value={operator.phone}
                      onChange={(e) => handleOperatorChange(index, 'phone', e.target.value)}
                      placeholder="+393331234567"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={!operator.enabled}
                    />
                    {operator.enabled && operator.phone && !validatePhoneNumber(operator.phone) && (
                      <span className="text-red-500 text-sm">❌ Formato non valido</span>
                    )}
                    {operator.enabled && operator.phone && validatePhoneNumber(operator.phone) && (
                      <span className="text-green-500 text-sm">✅ Valido</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Formato numero:</strong> Inserisci il numero completo con prefisso internazionale (es: +393331234567)
                </p>
              </div>
            </div>
          )}

          {/* TAB TEST */}
          {activeTab === 'test' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Test Configurazione</h3>
                <p className="text-gray-600 mb-4">Verifica che la configurazione WhatsApp funzioni correttamente</p>
                
                <button
                  onClick={handleTest}
                  disabled={isLoading || !settings.enabled}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <span>🧪</span>
                      <span>Avvia Test</span>
                    </>
                  )}
                </button>
              </div>

              {testResult && (
                <div className={`p-4 rounded-lg ${
                  testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className={`font-semibold ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.success ? '✅ Test Completato con Successo!' : '❌ Test Fallito'}
                  </div>
                  {testResult.error && (
                    <div className="text-red-700 mt-2">
                      <strong>Errore:</strong> {testResult.error}
                    </div>
                  )}
                  {testResult.messageId && (
                    <div className="text-green-700 mt-2">
                      <strong>Message ID:</strong> {testResult.messageId}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Nota Importante</h4>
                <p className="text-yellow-700 text-sm">
                  Il test invierà un messaggio WhatsApp reale al numero configurato. 
                  Assicurati di aver configurato correttamente le credenziali del provider prima di procedere.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ─── FOOTER ────────────────────────────────────────── */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Salva Impostazioni
          </button>
        </div>
      </div>
    </div>
  );
}