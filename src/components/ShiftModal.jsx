// src/components/ShiftModal.jsx

import React from "react";
import { format } from "date-fns";

/**
 * ShiftModal: primo modale per selezionare il reparto in una data specifica.
 *
 * Props:
 * - selectedDate: oggetto Date selezionato nella vista calendario.
 * - tempAssignments: oggetto con le assegnazioni temporanee correnti per la data selezionata.
 * - setTempAssignments: funzione per aggiornare le assegnazioni temporanee.
 * - save: callback che salva definitivamente le assegnazioni (passato da CalendarApp).
 * - close: callback che chiude questo modale.
 * - openOperatorModal: callback per aprire il secondo modale (OperatorModal) per scegliere l’operatore.
 */
export default function ShiftModal({
  selectedDate,
  tempAssignments,
  setTempAssignments,
  save,
  close,
  openOperatorModal
}) {
  // Elenco dei reparti (ruoli) disponibili per l’assegnazione
  const roles = [
    "Sala 1",
    "Sala 2",
    "Sala 3",
    "Olieria",
    "Reparto1",
    "Reparto2"
  ];

  return (
    // Overlay: sfondo semitrasparente e sfocato
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-2">
      {/* Contenitore del modale */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
        {/* Pulsante di chiusura in alto a destra */}
        <button
          onClick={close} 
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
          aria-label="Chiudi modale"
        >
          {/* Icona "X" testuale, può essere sostituita con un SVG se si preferisce */}
          ✕
        </button>

        {/* Titolo con la data selezionata, formattata come "dd MMM yyyy" */}
        <h3 className="text-lg font-semibold text-center mb-4">
          {format(selectedDate, "dd MMM yyyy")}
        </h3>

        {/* Corpo del modale: elenco dei reparti con eventuali assegnazioni */}
        <div className="space-y-3 max-h-[60vh] overflow-auto">
          {roles.map((role, idx) => (
            // Riga per ogni reparto: mostra nome reparto e, se presente, nome dell’operatore assegnato
            <div
              key={idx}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow-md transition"
            >
              {/* Parte sinistra: testo con “Reparto” oppure “Reparto → Operatore” */}
              <span className="text-gray-700">
                {tempAssignments[role]
                  ? `${role} → ${tempAssignments[role]}`
                  : role}
              </span>

              {/* Icona di modifica: al clic, apre il modale OperatorModal per scegliere l’operatore */}
              <button
                onClick={() => openOperatorModal(role)}
                className="p-1 bg-white rounded-full shadow hover:bg-gray-100 transition"
                aria-label={`Modifica ${role}`}
              >
                {/* Nuova icona "input matita" (SVG Pencil Alt da Heroicons) */}
                <svg
                  className="w-5 h-5 text-indigo-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5h2m-2 0h2l7 7-9 9H5v-7l9-9z"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Pulsante Salva in fondo al modale */}
        <button
          onClick={save} 
          className="mt-5 w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Salva
        </button>
      </div>
    </div>
  );
}
