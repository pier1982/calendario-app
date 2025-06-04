import React, { useState } from 'react';
import { useAuth } from './AuthProvider.jsx';

const AuthModal = ({ isOpen, onClose, mode: initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'forgot'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'visualizzatore'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const { signIn, signUp, resetPassword, error, setError } = useAuth();

  // Reset form quando cambia modalità
  const switchMode = (newMode) => {
    setMode(newMode);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      role: 'visualizzatore'
    });
    setMessage({ type: '', text: '' });
    setError(null);
  };

  // Gestione input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validazione form
  const validateForm = () => {
    if (!formData.email || !formData.email.includes('@')) {
      setMessage({ type: 'error', text: 'Inserisci un email valida' });
      return false;
    }

    if (mode === 'login' || mode === 'register') {
      if (!formData.password || formData.password.length < 6) {
        setMessage({ type: 'error', text: 'La password deve essere di almeno 6 caratteri' });
        return false;
      }
    }

    if (mode === 'register') {
      if (!formData.fullName.trim()) {
        setMessage({ type: 'error', text: 'Inserisci il nome completo' });
        return false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'Le password non coincidono' });
        return false;
      }
    }

    return true;
  };

  // Gestione submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    setError(null);

    try {
      if (mode === 'login') {
        const { data, error } = await signIn(formData.email, formData.password);
        if (error) {
          setMessage({ type: 'error', text: error });
        } else {
          setMessage({ type: 'success', text: 'Login effettuato con successo!' });
          setTimeout(() => onClose(), 1000);
        }
      } else if (mode === 'register') {
        const { data, error } = await signUp(formData.email, formData.password, {
          full_name: formData.fullName,
          role: formData.role
        });
        if (error) {
          setMessage({ type: 'error', text: error });
        } else {
          setMessage({ 
            type: 'success', 
            text: 'Registrazione completata! Controlla la tua email per confermare l\'account.' 
          });
          setTimeout(() => switchMode('login'), 2000);
        }
      } else if (mode === 'forgot') {
        const { data, error } = await resetPassword(formData.email);
        if (error) {
          setMessage({ type: 'error', text: error });
        } else {
          setMessage({ 
            type: 'success', 
            text: 'Email di reset inviata! Controlla la tua casella di posta.' 
          });
          setTimeout(() => switchMode('login'), 2000);
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Si è verificato un errore. Riprova.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {mode === 'login' && '🔐 Accedi'}
            {mode === 'register' && '📝 Registrati'}
            {mode === 'forgot' && '🔑 Reset Password'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="inserisci@email.com"
              required
            />
          </div>

          {/* Password (non mostrata in modalità forgot) */}
          {mode !== 'forgot' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          )}

          {/* Campi aggiuntivi per registrazione */}
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conferma Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mario Rossi"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ruolo
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="visualizzatore">👁️ Visualizzatore (solo lettura)</option>
                  <option value="operatore">✏️ Operatore (può modificare turni)</option>
                  <option value="admin">👑 Amministratore (controllo completo)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Il ruolo determina i permessi nell'applicazione
                </p>
              </div>
            </>
          )}

          {/* Messaggi */}
          {message.text && (
            <div className={`p-3 rounded-md text-sm ${
              message.type === 'error' 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message.text}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-md text-sm bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Caricamento...
              </span>
            ) : (
              <>
                {mode === 'login' && '🔐 Accedi'}
                {mode === 'register' && '📝 Registrati'}
                {mode === 'forgot' && '📧 Invia Reset'}
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="px-6 pb-6 space-y-2 text-center text-sm">
          {mode === 'login' && (
            <>
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Password dimenticata?
              </button>
              <div className="text-gray-600">
                Non hai un account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Registrati
                </button>
              </div>
            </>
          )}

          {mode === 'register' && (
            <div className="text-gray-600">
              Hai già un account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Accedi
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="text-gray-600">
              Ricordi la password?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Torna al login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;