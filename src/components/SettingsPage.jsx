// src/components/SettingsPage.jsx

import React, { useState, useEffect } from "react";

// ─── Import di useNavigate da react-router-dom ───────────────
import { useNavigate } from "react-router-dom";

export default function SettingsPage({
  initialRoles = [],
  initialOperators = [],
  onSaveSettings,
  initialAssignments = {},
  onImportAssignments
}) {
  // ─── Hook per navigazione programmatica ───────────────────────
  const navigate = useNavigate();

  // ─── STATO: Ruoli e Operatori ─────────────────────────────────
  const [roles, setRoles] = useState([...initialRoles]);
  const [operators, setOperators] = useState([...initialOperators]);
  const [newRole, setNewRole] = useState("");
  const [newOperator, setNewOperator] = useState("");

  // ─── STATO: Notifiche e Promemoria ────────────────────────────
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [reminderTime, setReminderTime] = useState(60);

  // ─── Caricamento da localStorage al montaggio ─────────────────
  useEffect(() => {
    const saved = localStorage.getItem("calendarSettings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed.roles)) setRoles(parsed.roles);
        if (Array.isArray(parsed.operators)) setOperators(parsed.operators);
        if (typeof parsed.emailNotifications === "boolean")
          setEmailNotifications(parsed.emailNotifications);
        if (typeof parsed.pushNotifications === "boolean")
          setPushNotifications(parsed.pushNotifications);
        if (typeof parsed.reminderTime === "number")
          setReminderTime(parsed.reminderTime);
      } catch {
        console.warn("Impossibile leggere le impostazioni dal localStorage");
      }
    }
  }, []);

  // ─── Funzione di salvataggio delle impostazioni ───────────────
  const handleSave = () => {
    const settings = {
      roles,
      operators,
      emailNotifications,
      pushNotifications,
      reminderTime
    };

    if (onSaveSettings) {
      onSaveSettings(settings);
    }
    localStorage.setItem("calendarSettings", JSON.stringify(settings));
    alert("Impostazioni salvate con successo.");
  };

  // ─── Funzione di ripristino valori di default ─────────────────
  const handleReset = () => {
    setRoles([...initialRoles]);
    setOperators([...initialOperators]);
    setEmailNotifications(false);
    setPushNotifications(false);
    setReminderTime(60);
    localStorage.removeItem("calendarSettings");
    alert("Impostazioni ripristinate ai valori di default.");
  };

  // ─── Esportazione in JSON (settings + assignments) ────────────
  const handleExport = () => {
    const data = {
      settings: {
        roles,
        operators,
        emailNotifications,
        pushNotifications,
        reminderTime
      },
      assignments: initialAssignments
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup_calendario.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Importazione da JSON (settings + assignments) ────────────
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);

        // Import settings
        if (imported.settings) {
          const s = imported.settings;
          if (Array.isArray(s.roles)) setRoles(s.roles);
          if (Array.isArray(s.operators)) setOperators(s.operators);
          if (typeof s.emailNotifications === "boolean")
            setEmailNotifications(s.emailNotifications);
          if (typeof s.pushNotifications === "boolean")
            setPushNotifications(s.pushNotifications);
          if (typeof s.reminderTime === "number")
            setReminderTime(s.reminderTime);

          localStorage.setItem("calendarSettings", JSON.stringify(s));
        }

        // Import assignments se c’è callback
        if (imported.assignments && onImportAssignments) {
          onImportAssignments(imported.assignments);
        }

        alert("Importazione completata con successo.");
      } catch (error) {
        console.error("Errore durante l'importazione:", error);
        alert("File di importazione non valido.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      {/* ── Bottone “Torna indietro” ───────────────────────────── */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate("/")}
          className="text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          {/* Puoi usare un’icona “←” o testo “Indietro” */}
          <span className="text-xl mr-2">←</span>
          <span className="text-sm font-medium">Torna al Calendario</span>
        </button>
      </div>

      {/* Titolo Pagina */}
      <h2 className="text-2xl font-bold text-center">Impostazioni</h2>

      {/* ── SEZIONE 5: RUOLI E OPERATORI ───────────────────────────── */}
      <section className="border rounded-lg p-4">
        <h3 className="text-xl font-semibold mb-3">Ruoli e Operatori</h3>

        {/* Lista Ruoli */}
        <div className="mb-6">
          <label className="block font-medium mb-1">Ruoli</label>
          <ul className="max-h-32 overflow-auto border rounded p-2 space-y-1">
            {roles.map((r, idx) => (
              <li
                key={idx}
                className="flex justify-between items-center text-sm"
              >
                <span>{r}</span>
                {/* Bottone per rimuovere il ruolo */}
                <button
                  onClick={() =>
                    setRoles((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="text-red-500 hover:text-red-700"
                  title="Rimuovi ruolo"
                >
                  ✕
                </button>
              </li>
            ))}
            {roles.length === 0 && (
              <li className="text-gray-500 text-sm">Nessun ruolo impostato</li>
            )}
          </ul>
          <div className="mt-2 flex space-x-2">
            <input
              type="text"
              placeholder="Nuovo ruolo"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="flex-1 border rounded px-2 py-1 text-sm"
            />
            <button
              onClick={() => {
                const trimmed = newRole.trim();
                if (trimmed && !roles.includes(trimmed)) {
                  setRoles((prev) => [...prev, trimmed]);
                  setNewRole("");
                }
              }}
              className="bg-green-500 text-white px-4 py-1 rounded text-sm hover:bg-green-600"
            >
              Aggiungi
            </button>
          </div>
        </div>

        {/* Lista Operatori */}
        <div>
          <label className="block font-medium mb-1">Operatori</label>
          <ul className="max-h-32 overflow-auto border rounded p-2 space-y-1">
            {operators.map((o, idx) => (
              <li
                key={idx}
                className="flex justify-between items-center text-sm"
              >
                <span>{o}</span>
                {/* Bottone per rimuovere l'operatore */}
                <button
                  onClick={() =>
                    setOperators((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="text-red-500 hover:text-red-700"
                  title="Rimuovi operatore"
                >
                  ✕
                </button>
              </li>
            ))}
            {operators.length === 0 && (
              <li className="text-gray-500 text-sm">Nessun operatore impostato</li>
            )}
          </ul>
          <div className="mt-2 flex space-x-2">
            <input
              type="text"
              placeholder="Nuovo operatore"
              value={newOperator}
              onChange={(e) => setNewOperator(e.target.value)}
              className="border rounded px-2 py-1 flex-1 text-sm"
            />
            <button
              onClick={() => {
                const trimmed = newOperator.trim();
                if (trimmed && !operators.includes(trimmed)) {
                  setOperators((prev) => [...prev, trimmed]);
                  setNewOperator("");
                }
              }}
              className="bg-green-500 text-white px-4 py-1 rounded text-sm hover:bg-green-600"
            >
              Aggiungi
            </button>
          </div>
        </div>
      </section>

      {/* ── SEZIONE 6: NOTIFICHE E PROMEMORIA ─────────────────────── */}
      <section className="border rounded-lg p-4">
        <h3 className="text-xl font-semibold mb-3">Notifiche e Promemoria</h3>

        {/* Toggle Email Notifications */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <label className="font-medium">Email Notifications</label>
            <p className="text-xs text-gray-500">
              Ricevi avvisi via email per i turni assegnati.
            </p>
          </div>
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.target.checked)}
            className="h-5 w-5"
          />
        </div>

        {/* Toggle Push Notifications */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <label className="font-medium">Push Notifications</label>
            <p className="text-xs text-gray-500">
              Ricevi notifiche sul browser per i turni imminenti.
            </p>
          </div>
          <input
            type="checkbox"
            checked={pushNotifications}
            onChange={(e) => setPushNotifications(e.target.checked)}
            className="h-5 w-5"
          />
        </div>

        {/* Reminder Time */}
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium">Tempo Promemoria (minuti)</label>
            <p className="text-xs text-gray-500">
              Imposta quanti minuti prima di un turno desideri ricevere un avviso.
            </p>
          </div>
          <input
            type="number"
            min="0"
            value={reminderTime}
            onChange={(e) => setReminderTime(Number(e.target.value))}
            className="w-20 border rounded px-2 py-1 text-right text-sm"
          />
        </div>
      </section>

      {/* ── SEZIONE 8: BACKUP & RESTORE ───────────────────────────── */}
      <section className="border rounded-lg p-4">
        <h3 className="text-xl font-semibold mb-3">Backup &amp; Restore</h3>

        {/* Esporta Dati */}
        <div className="mb-4">
          <button
            onClick={handleExport}
            className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
          >
            Esporta Dati (JSON)
          </button>
        </div>

        {/* Importa Dati */}
        <div className="mb-4">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="border rounded p-1 text-sm"
          />
        </div>

        {/* Pulsante Reset */}
        <div>
          <button
            onClick={handleReset}
            className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600"
          >
            Ripristina impostazioni di default
          </button>
        </div>
      </section>

      {/* ── PULSANTE SALVA IMPOSTAZIONI ─────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 text-sm"
        >
          Salva Tutte le Impostazioni
        </button>
      </div>
    </div>
  );
}
