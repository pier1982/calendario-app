// src/components/CalendarApp.jsx

import React, { useState, useEffect } from "react";

// ─── Nuovo: import di Link da react-router-dom ─────────────
import { Link } from "react-router-dom";

// ─── Import Supabase ─────────────────────────────────────
import { supabase } from '../lib/supabase.js';

// ─── Import WhatsApp ─────────────────────────────────────
import { sendWhatsAppNotification, formatDateForMessage } from '../lib/whatsapp.js';

// ─── Import Autenticazione ─────────────────────────────────
import { useAuth } from './AuthProvider.jsx';
import AuthModal from './AuthModal.jsx';
import UserManagement from './UserManagement.jsx';
import FeatureSettings from './FeatureSettings.jsx';

import MonthView from "./MonthView.jsx";
import ShiftModal from "./ShiftModal.jsx";
import OperatorModal from "./OperatorModal.jsx";
import StatsModal from "./StatsModal.jsx";
import WhatsAppSettings from "./WhatsAppSettings.jsx";

import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function CalendarApp() {
  // ─── AUTENTICAZIONE ──────────────────────────────────────────
  const { user, userProfile, loading, signOut, canModifyAssignments, canManageUsers, canHideFeatures, isPendingAdmin } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showFeatureSettings, setShowFeatureSettings] = useState(false);
  
  // ─── IMPOSTAZIONI VISIBILITÀ FUNZIONALITÀ ───────────────────
  const [featureSettings, setFeatureSettings] = useState({
    showWhatsApp: true,
    showSettings: true,
    showStats: true
  });

  // Carica impostazioni di visibilità
  useEffect(() => {
    const savedSettings = localStorage.getItem('featureSettings');
    if (savedSettings) {
      setFeatureSettings(JSON.parse(savedSettings));
    }
  }, []);

  // ─── STATO COMPONENTE ────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isM1Open, setIsM1Open] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isM2Open, setIsM2Open] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [tempAssignments, setTempAssignments] = useState({});
  const [assignments, setAssignments] = useState({});
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [statsView, setStatsView] = useState("monthly"); // "monthly" | "annual" | "byOperator"
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  // ─── COSTANTI ────────────────────────────────────────────────
  const operators = [
    "Pestarino",
    "Maccioni",
    "Imelio",
    "Martinelli",
    "Poidomani",
    "Marmorato",
    "Pasquero",
    "Gigliotti",
    "Gemme"
  ];

  const roles = [
    "Sala 1",
    "Sala 2",
    "Sala 3",
    "Olieria",
    "Reparto1",
    "Reparto2"
  ];

  // ─── FUNZIONI SUPABASE ────────────────────────────────────
  // Carica assegnazioni da Supabase
  const loadAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*');
      
      if (error) {
        console.error('Errore caricamento da Supabase:', error);
        return;
      }
      
      // Converte da formato DB a formato app
      const converted = {};
      data.forEach(row => {
        if (!converted[row.date_key]) {
          converted[row.date_key] = {};
        }
        converted[row.date_key][row.role] = row.operator;
      });
      
      setAssignments(converted);
      console.log('Assegnazioni caricate da Supabase:', converted);
    } catch (err) {
      console.error('Errore durante il caricamento:', err);
    }
  };

  // Salva assegnazioni su Supabase
  const saveAssignmentsToSupabase = async (dateKey, assignmentsForDate) => {
    try {
      // Prima elimina assegnazioni esistenti per quella data
      const { error: deleteError } = await supabase
        .from('assignments')
        .delete()
        .eq('date_key', dateKey);
      
      if (deleteError) {
        console.error('Errore eliminazione:', deleteError);
        return;
      }
      
      // Poi inserisce le nuove assegnazioni
      const rows = Object.entries(assignmentsForDate).map(([role, operator]) => ({
        date_key: dateKey,
        role,
        operator
      }));
      
      if (rows.length > 0) {
        const { error: insertError } = await supabase
          .from('assignments')
          .insert(rows);
        
        if (insertError) {
          console.error('Errore inserimento:', insertError);
        } else {
          console.log('Assegnazioni salvate su Supabase:', rows);
        }
      }
    } catch (err) {
      console.error('Errore durante il salvataggio:', err);
    }
  };

  // ─── NAVIGAZIONE MESE ─────────────────────────────────────────
  const nextMonth = () =>
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const prevMonth = () =>
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToday = () => setCurrentMonth(new Date());

  // ─── HANDLER MODALE M1 (ShiftModal) ───────────────────────────
  const openM1 = (date) => {
    if (!date) return;
    
    // Verifica autenticazione
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    // Verifica permessi di modifica
    if (!canModifyAssignments()) {
      alert('Non hai i permessi per modificare gli assegnamenti.');
      return;
    }
    
    setSelectedDate(date);
    const key = format(date, "yyyy-MM-dd");
    setTempAssignments(assignments[key] ? { ...assignments[key] } : {});
    setIsM1Open(true);
  };
  const closeM1 = () => setIsM1Open(false);

  // ─── HANDLER MODALE M2 (OperatorModal) ────────────────────────
  const openM2 = (role) => {
    setSelectedRole(role);
    setIsM2Open(true);
  };
  const closeM2 = () => setIsM2Open(false);

  const selectOperator = (op) => {
    setTempAssignments((prev) => ({ ...prev, [selectedRole]: op }));
    setIsM2Open(false);
  };

  const saveM1 = async () => {
    if (!selectedDate) return;
    const key = format(selectedDate, "yyyy-MM-dd");
    
    // Ottieni gli assignment precedenti per confronto
    const oldAssignments = assignments[key] || {};
    
    // Salva localmente
    setAssignments((prev) => ({ ...prev, [key]: { ...tempAssignments } }));
    
    // Salva su Supabase
    await saveAssignmentsToSupabase(key, tempAssignments);
    
    // Invia notifiche WhatsApp
    await sendWhatsAppNotifications(key, tempAssignments, oldAssignments);
    
    setIsM1Open(false);
  };

  // ─── HANDLER MODALE STATISTICHE ────────────────────────────────
  const openStats = () => {
    setStatsView("monthly");
    setIsStatsOpen(true);
  };
  const closeStats = () => setIsStatsOpen(false);

  // ─── HANDLER WHATSAPP SETTINGS ──────────────────────────────────
  const openWhatsApp = () => setIsWhatsAppOpen(true);
  const closeWhatsApp = () => setIsWhatsAppOpen(false);

  // ─── FUNZIONI NOTIFICHE WHATSAPP ────────────────────────────────
  const sendWhatsAppNotifications = async (dateKey, newAssignments, oldAssignments = {}) => {
    try {
      // Carica impostazioni WhatsApp
      const whatsappSettings = JSON.parse(localStorage.getItem('whatsappSettings') || '{}');
      const whatsappOperators = JSON.parse(localStorage.getItem('whatsappOperators') || '[]');
      
      if (!whatsappSettings.enabled) {
        console.log('📱 Notifiche WhatsApp disabilitate');
        return;
      }
      
      const formattedDate = formatDateForMessage(dateKey);
      
      // Controlla ogni ruolo per cambiamenti
      Object.entries(newAssignments).forEach(async ([role, newOperator]) => {
        const oldOperator = oldAssignments[role];
        const operatorData = whatsappOperators.find(op => op.name === newOperator && op.enabled && op.phone);
        
        if (!operatorData) {
          console.log(`📱 Operatore ${newOperator} non ha WhatsApp configurato`);
          return;
        }
        
        // Nuovo assignment
        if (!oldOperator && whatsappSettings.notifications.newAssignment) {
          console.log(`📱 Invio notifica nuovo assignment a ${newOperator}`);
          await sendWhatsAppNotification(operatorData.phone, 'newAssignment', {
            operator: newOperator,
            role: role,
            date: formattedDate
          });
        }
        // Cambio assignment
        else if (oldOperator && oldOperator !== newOperator && whatsappSettings.notifications.changeAssignment) {
          console.log(`📱 Invio notifica cambio assignment a ${newOperator}`);
          await sendWhatsAppNotification(operatorData.phone, 'changeAssignment', {
            operator: newOperator,
            role: role,
            date: formattedDate
          });
        }
      });
      
    } catch (error) {
      console.error('❌ Errore invio notifiche WhatsApp:', error);
    }
  };
  
  const scheduleReminderNotifications = async () => {
    try {
      const whatsappSettings = JSON.parse(localStorage.getItem('whatsappSettings') || '{}');
      const whatsappOperators = JSON.parse(localStorage.getItem('whatsappOperators') || '[]');
      
      if (!whatsappSettings.enabled || !whatsappSettings.notifications.reminderTomorrow) {
        return;
      }
      
      // Calcola la data di domani
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowKey = format(tomorrow, 'yyyy-MM-dd');
      
      const tomorrowAssignments = assignments[tomorrowKey];
      if (!tomorrowAssignments) return;
      
      const formattedDate = formatDateForMessage(tomorrowKey);
      
      // Invia promemoria per ogni operatore assegnato domani
      Object.entries(tomorrowAssignments).forEach(async ([role, operator]) => {
        const operatorData = whatsappOperators.find(op => op.name === operator && op.enabled && op.phone);
        
        if (operatorData) {
          console.log(`📱 Invio promemoria a ${operator} per domani`);
          await sendWhatsAppNotification(operatorData.phone, 'reminderTomorrow', {
            operator: operator,
            role: role,
            date: formattedDate
          });
        }
      });
      
    } catch (error) {
      console.error('❌ Errore invio promemoria WhatsApp:', error);
    }
  };

  // ─── CARICAMENTO DATI ALL'AVVIO ──────────────────────────────
  useEffect(() => {
    loadAssignments();
  }, []);

  // Mostra loading durante l'autenticazione
  if (loading) {
    return (
      <div className="p-4 max-w-md mx-auto bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto bg-gray-50 min-h-screen">
      {/* ─── HEADER UTENTE ──────────────────────────────────── */}
      <div className="mb-4 bg-white p-3 rounded-md shadow-sm">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {userProfile?.full_name ? 
                    userProfile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 
                    user.email.charAt(0).toUpperCase()
                  }
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {userProfile?.full_name || user.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {isPendingAdmin() ? 'Admin in attesa di approvazione' : (userProfile?.role || 'utente')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {canHideFeatures() && (
                <button
                  onClick={() => setShowFeatureSettings(true)}
                  className="text-purple-600 hover:text-purple-800 text-sm"
                  title="Gestione Funzionalità"
                >
                  🎛️
                </button>
              )}
              {canManageUsers() && (
                <button
                  onClick={() => setShowUserManagement(true)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                  title="Gestione Utenti"
                >
                  👥
                </button>
              )}
              <button
                onClick={signOut}
                className="text-red-600 hover:text-red-800 text-sm"
                title="Logout"
              >
                🚪
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Accedi
            </button>
          </div>
        )}
      </div>

      {/* ─── HEADER NAVIGAZIONE MESE ─────────────────────────── */}
      <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-md shadow-sm">
        <button
          onClick={prevMonth}
          className="text-indigo-600 hover:text-indigo-800 text-xl font-bold"
        >
          ‹
        </button>
        <h1 className="text-lg font-semibold text-gray-800">
          {format(currentMonth, "MMMM yyyy", { locale: it })}
        </h1>
        <button
          onClick={nextMonth}
          className="text-indigo-600 hover:text-indigo-800 text-xl font-bold"
        >
          ›
        </button>
      </div>

      {/* ─── VISTA MESE ──────────────────────────────────────────── */}
      <MonthView
        currentMonth={currentMonth}
        assignments={assignments}
        openShiftModal={openM1}
        roles={roles}                 // passiamo anche la lista dei ruoli
      />

      {/* ─── TOOLBAR INFERIORE ──────────────────────────────────── */}
      <div className="flex justify-around bg-white py-2 rounded-md shadow-sm mt-2">
        {featureSettings.showSettings && (
          <Link
            to="/settings"
            className="flex flex-col items-center text-indigo-600 hover:text-indigo-800"
          >
            <span className="text-xl">⚙️</span>
            <span className="mt-0.5 text-[10px]">Impostazioni</span>
          </Link>
        )}

        {/* ─── Pulsante "Oggi" ─────────────────────────────────── */}
        <button onClick={goToday} className="flex flex-col items-center text-indigo-600">
          <span className="text-xl">⏰</span>
          <span className="mt-0.5 text-[10px]">Oggi</span>
        </button>

        {featureSettings.showStats && (
          <button onClick={openStats} className="flex flex-col items-center text-indigo-600">
            <span className="text-xl">📊</span>
            <span className="mt-0.5 text-[10px]">Statistiche</span>
          </button>
        )}

        {featureSettings.showWhatsApp && (
          <button onClick={openWhatsApp} className="flex flex-col items-center text-green-600">
            <span className="text-xl">📱</span>
            <span className="mt-0.5 text-[10px]">WhatsApp</span>
          </button>
        )}
      </div>

      {/* ─── MODALE SELEZIONE REPARTO (ShiftModal) ─────────────── */}
      {isM1Open && (
        <ShiftModal
          selectedDate={selectedDate}
          tempAssignments={tempAssignments}
          setTempAssignments={setTempAssignments}
          save={saveM1}
          close={closeM1}
          openOperatorModal={openM2}
        />
      )}

      {/* ─── MODALE SELEZIONE OPERATORE (OperatorModal) ───────── */}
      {isM2Open && (
        <OperatorModal
          operators={operators}
          tempAssignments={tempAssignments}
          selectedRole={selectedRole}
          selectOperator={selectOperator}
          close={closeM2}
        />
      )}

      {/* ─── MODALE STATISTICHE (StatsModal) ─────────────────── */}
      {isStatsOpen && (
        <StatsModal
          assignments={assignments}
          operators={operators}
          close={closeStats}
          statsView={statsView}
          setStatsView={setStatsView}
          roles={roles} // non strettamente necessario qui, ma tenuto per coerenza
        />
      )}

      {/* ─── MODALE WHATSAPP SETTINGS ──────────────────────── */}
      {isWhatsAppOpen && (
        <WhatsAppSettings
          onSave={(data) => {
            console.log('✅ Impostazioni WhatsApp salvate:', data);
            // Qui potresti aggiungere logica aggiuntiva se necessario
          }}
          onClose={closeWhatsApp}
        />
      )}

      {/* ─── MODALE AUTENTICAZIONE ──────────────────────────── */}
      {showAuthModal && (
        <AuthModal
          isOpen={true}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* ─── MODALE GESTIONE UTENTI ─────────────────────────── */}
      {showUserManagement && (
        <UserManagement
          onClose={() => setShowUserManagement(false)}
        />
      )}

      {/* ─── MODALE IMPOSTAZIONI FUNZIONALITÀ ──────────────── */}
      {showFeatureSettings && (
        <FeatureSettings
          onClose={() => setShowFeatureSettings(false)}
        />
      )}
    </div>
  );
}
