// src/App.jsx
import React from "react";

// Import da react-router-dom: Routes e Route servono per definire le pagine
import { Routes, Route } from "react-router-dom";

// Import dei componenti per le pagine
import CalendarApp from "./components/CalendarApp.jsx";
import SettingsPage from "./components/SettingsPage.jsx";

// Import del sistema di autenticazione
import { AuthProvider } from "./components/AuthProvider.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ----------------------------------------------------
            1) Rotta principale "/" → mostra il tuo calendario
        ----------------------------------------------------- */}
        <Route path="/" element={<CalendarApp />} />

        {/* ----------------------------------------------------
            2) Rotta "/settings" → mostra la pagina di impostazioni
            - Controlla bene che il nome del componente e il path 
              combacino con il file fisico SettingsPage.jsx
        ----------------------------------------------------- */}
        <Route
          path="/settings"
          element={
            <SettingsPage
              initialRoles={[
                "Sala 1",
                "Sala 2",
                "Sala 3",
                "Olieria",
                "Reparto1",
                "Reparto2"
              ]}
              initialOperators={[
                "Pestarino",
                "Maccioni",
                "Imelio",
                "Martinelli",
                "Poidomani",
                "Marmorato",
                "Pasquero",
                "Gigliotti",
                "Gemme"
              ]}
              // Queste callback possono essere "no‐op" o passate dal genitore
              onSaveSettings={(settings) => {
                console.log("Impostazioni salvate:", settings);
              }}
              onImportAssignments={(newAssignments) => {
                console.log("Assignments importati:", newAssignments);
              }}
            />
          }
        />
      </Routes>
    </AuthProvider>
  );
}
