import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider.jsx';

const FeatureSettings = ({ onClose }) => {
  const { canHideFeatures } = useAuth();
  const [settings, setSettings] = useState({
    showWhatsApp: true,
    showSettings: true,
    showStats: true
  });
  const [isSaving, setIsSaving] = useState(false);

  // Carica impostazioni salvate
  useEffect(() => {
    const savedSettings = localStorage.getItem('featureSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Salva impostazioni
  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('featureSettings', JSON.stringify(settings));
      // Chiudi il modal invece di ricaricare la pagina
      onClose();
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (feature) => {
    setSettings(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  if (!canHideFeatures()) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Impostazioni Funzionalità</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-800">WhatsApp</h3>
              <p className="text-sm text-gray-600">Mostra/nascondi funzionalità WhatsApp</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showWhatsApp}
                onChange={() => handleToggle('showWhatsApp')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-800">Impostazioni</h3>
              <p className="text-sm text-gray-600">Mostra/nascondi pulsante impostazioni</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showSettings}
                onChange={() => handleToggle('showSettings')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-800">Statistiche</h3>
              <p className="text-sm text-gray-600">Mostra/nascondi pulsante statistiche</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showStats}
                onChange={() => handleToggle('showStats')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureSettings;