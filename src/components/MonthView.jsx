// src/components/MonthView.jsx
import React from "react";
import {
  startOfMonth,
  endOfMonth,
  getDay,
  format,
  isSameDay,
  differenceInCalendarDays
} from "date-fns";

const baseDate = new Date(2025, 3, 1);

/**
 * getShiftInfo(date):
 *   - restituisce `color` (sfondo cella) e `showRoles` (true = giornata attiva)
 */
function getShiftInfo(date) {
  const diff = differenceInCalendarDays(date, baseDate);
  const idx = ((diff % 8) + 8) % 8;
  switch (idx) {
    case 0:
    case 1:
      return { color: "bg-red-300/60", showRoles: true };   // Pomeriggio
    case 2:
      return { color: "", showRoles: false };               // Riposo
    case 3:
    case 4:
      return { color: "bg-yellow-300/60", showRoles: true }; // Mattino
    case 5:
    case 6:
      return { color: "bg-blue-300/60", showRoles: true };   // Notte
    case 7:
      return { color: "", showRoles: false };               // Smonto
    default:
      return { color: "", showRoles: false };
  }
}

export default function MonthView({
  currentMonth,
  assignments,
  openShiftModal,
  roles
}) {
  // Creazione dell’array di celle 7x6
  const cells = [];
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lead = (getDay(firstDayOfMonth) + 6) % 7; // Lun=0
  const daysInMonth = endOfMonth(currentMonth).getDate();

  // Celle “vuote” iniziali
  for (let i = 0; i < lead; i++) {
    cells.push(null);
  }
  // Celle “vere” del mese
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
  }
  // Celle “vuote” finali per completare la griglia 7x6
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const today = new Date();

  return (
    <div className="flex-1 flex flex-col">
      {/* Intestazione giorni della settimana */}
      <div className="grid grid-cols-7 text-center text-[10px] font-medium text-indigo-600 mb-1">
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      {/* Griglia mese (7 colonne x 6 righe) */}
      <div
        className="grid grid-cols-7 grid-rows-6 gap-[1px] px-1"
        style={{ gridAutoRows: `calc((100vh - 160px) / 6)` }}
      >
        {cells.map((date, idx) => {
          if (!date) {
            // Celle “null” (riempitive)
            return (
              <div
                key={idx}
                className="bg-transparent"
                onClick={() => openShiftModal(date)}
              />
            );
          }

          const { color, showRoles } = getShiftInfo(date);
          const isToday = isSameDay(date, today);
          const key = format(date, "yyyy-MM-dd");
          const dayAssign = assignments[key] || {};

          if (!showRoles) {
            // Giornata NON attiva (riposo / smonto)
            return (
              <div
                key={idx}
                onClick={() => openShiftModal(date)}
                className={`bg-transparent flex flex-col ${isToday ? "ring-2 ring-indigo-500" : ""}`}
              >
                <span className="text-[10px] font-semibold text-right text-gray-200 px-1">
                  {format(date, "d")}
                </span>
                <div className="flex-1" />
              </div>
            );
          }

          // Giornata “attiva”: mostro i ruoli
          return (
            <div
              key={idx}
              onClick={() => openShiftModal(date)}
              className={`${color} rounded-md flex flex-col shadow hover:shadow-lg cursor-pointer ${isToday ? "ring-2 ring-indigo-500" : ""}`}
            >
              {/* Numero giorno */}
              <span className="text-[10px] font-semibold text-right text-gray-700 px-1 pt-1">
                {format(date, "d")}
              </span>
              {/* Lista ruoli in griglia righe=6 */}
              <div className="grid grid-rows-6 flex-1 gap-1 overflow-auto px-1 py-1 text-[7px] leading-tight">
                {roles.map((role, i) => {
                  const isAssigned = !!dayAssign[role];
                  return (
                    <div
                      key={i}
                      className={`w-full rounded text-center py-0.5 ${
                        isAssigned
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-300 text-gray-800"
                      }`}
                    >
                      {role}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
