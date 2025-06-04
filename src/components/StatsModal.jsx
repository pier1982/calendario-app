// src/components/StatsModal.jsx
import React, { useMemo } from "react";
import { parseISO } from "date-fns";

export default function StatsModal({
  assignments,
  operators,
  close,
  statsView,
  setStatsView
}) {
  // ===================== STATISTICHE MENSILI PER OPERATORE =====================
  const statsByOperator = useMemo(() => {
    const temp = {};
    Object.entries(assignments).forEach(([dateStr, roleMap]) => {
      const dateObj = parseISO(dateStr);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const ymKey = `${year}-${month}`;
      if (!temp[ymKey]) {
        temp[ymKey] = {};
        operators.forEach((op) => (temp[ymKey][op] = 0));
      }
      Object.values(roleMap).forEach((op) => {
        if (op) temp[ymKey][op] += 1;
      });
    });
    const keys = Object.keys(temp).sort();
    const result = {};
    keys.forEach((k) => (result[k] = temp[k]));
    return result;
  }, [assignments, operators]);

  const monthKeys = Object.keys(statsByOperator);

  // ===================== CLASSIFICHE MENSILI =====================
  const rankingByMonth = useMemo(() => {
    // Restituisce { "2025-04": { gold, silver, bronze, last }, ... }
    const result = {};
    monthKeys.forEach((m) => {
      const arr = operators.map((op) => [op, statsByOperator[m][op] || 0]);
      arr.sort((a, b) => b[1] - a[1]);
      const gold = arr[0]?.[0] || null;
      const silver = arr[1]?.[0] || null;
      const bronze = arr[2]?.[0] || null;
      const arrAsc = [...arr].sort((a, b) => a[1] - b[1]);
      const last = arrAsc[0]?.[0] || null;
      result[m] = { gold, silver, bronze, last };
    });
    return result;
  }, [monthKeys, operators, statsByOperator]);

  // ===================== STATISTICHE ANNUALI PER OPERATORE =====================
  const statsAnnual = useMemo(() => {
    const temp = {};
    Object.entries(statsByOperator).forEach(([ym, counts]) => {
      const [yearStr] = ym.split("-");
      if (!temp[yearStr]) temp[yearStr] = {};
      operators.forEach((op) => {
        temp[yearStr][op] = (temp[yearStr][op] || 0) + counts[op];
      });
    });
    const years = Object.keys(temp).sort((a, b) => b.localeCompare(a));
    const result = {};
    years.forEach((y) => (result[y] = temp[y]));
    return result;
  }, [statsByOperator, operators]);

  // ===================== CLASSIFICHE ANNUALI =====================
  const rankingByYear = useMemo(() => {
    // Restituisce { "2025": { gold, silver, bronze, last }, ... }
    const result = {};
    Object.entries(statsAnnual).forEach(([yr, counts]) => {
      const arr = operators.map((op) => [op, counts[op] || 0]);
      arr.sort((a, b) => b[1] - a[1]);
      const gold = arr[0]?.[0] || null;
      const silver = arr[1]?.[0] || null;
      const bronze = arr[2]?.[0] || null;
      const arrAsc = [...arr].sort((a, b) => a[1] - b[1]);
      const last = arrAsc[0]?.[0] || null;
      result[yr] = { gold, silver, bronze, last };
    });
    return result;
  }, [statsAnnual, operators]);

  // ===================== STATISTICHE PER OPERATORE E CATEGORIA =====================
  const statsByOpCategory = useMemo(() => {
    const temp = {};
    operators.forEach((op) => (temp[op] = { Sala: 0, Reparto: 0, Olieria: 0 }));
    Object.entries(assignments).forEach(([_, roleMap]) => {
      Object.entries(roleMap).forEach(([role, op]) => {
        if (!op) return;
        const lower = role.toLowerCase();
        if (lower.includes("sala")) temp[op].Sala += 1;
        else if (lower.includes("reparto")) temp[op].Reparto += 1;
        else temp[op].Olieria += 1;
      });
    });
    return temp;
  }, [assignments, operators]);

  // ===================== RANKING CATEGORIE PER OPERATORE =====================
  const rankingByOpCategories = useMemo(() => {
    // Per ogni operatore, restituisce { goldCat, silverCat, bronzeCat, lastCat }
    const result = {};
    operators.forEach((op) => {
      const counts = statsByOpCategory[op];
      const arr = Object.entries(counts);
      arr.sort((a, b) => b[1] - a[1]);
      const goldCat = arr[0]?.[0] || null;
      const silverCat = arr[1]?.[0] || null;
      const bronzeCat = arr[2]?.[0] || null;
      const arrAsc = [...arr].sort((a, b) => a[1] - b[1]);
      const lastCat = arrAsc[0]?.[0] || null;
      result[op] = { goldCat, silverCat, bronzeCat, lastCat };
    });
    return result;
  }, [statsByOpCategory, operators]);

  // ===================== RANKING GLOBALE PER OPERATORE =====================
  const totalByOperator = useMemo(() => {
    return operators.map((op) => {
      const counts = statsByOpCategory[op];
      const total = counts.Sala + counts.Reparto + counts.Olieria;
      return [op, total];
    });
  }, [statsByOpCategory, operators]);

  const rankingGlobal = useMemo(() => {
    // Restituisce { gold, silver, bronze, last } a livello globale
    const arr = [...totalByOperator];
    arr.sort((a, b) => b[1] - a[1]);
    const gold = arr[0]?.[0] || null;
    const silver = arr[1]?.[0] || null;
    const bronze = arr[2]?.[0] || null;
    const arrAsc = [...arr].sort((a, b) => a[1] - b[1]);
    const last = arrAsc[0]?.[0] || null;
    return { gold, silver, bronze, last };
  }, [totalByOperator]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/30 backdrop-blur-sm overflow-auto p-2">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-auto mt-8 mb-8">
        {/* Pulsante di chiusura */}
        <button
          onClick={close}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>
        <h3 className="text-xl font-semibold text-center pt-4 pb-2">
          Statistiche Operatori
        </h3>

        {/* Toggle tra le tre viste */}
        <div className="flex justify-center space-x-2 px-4 mb-4">
          <button
            onClick={() => setStatsView("monthly")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg ${
              statsView === "monthly"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Mensile
          </button>
          <button
            onClick={() => setStatsView("annual")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg ${
              statsView === "annual"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Annuale
          </button>
          <button
            onClick={() => setStatsView("byOperator")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg ${
              statsView === "byOperator"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Operatore
          </button>
        </div>

        <div className="px-2 pb-4">
          {/* ================= VISTA MENSILE CON CLASSIFICHE ================= */}
          {statsView === "monthly" && (
            <>
              <div className="relative overflow-x-auto px-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-indigo-100">
                      <th className="px-3 py-2 border text-[12px]">Operatore</th>
                      {monthKeys.map((m) => (
                        <th
                          key={m}
                          className="sticky top-0 px-3 py-2 border whitespace-nowrap text-[12px] min-w-[80px]"
                        >
                          {m}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {operators.map((op, idx) => (
                      <tr
                        key={op}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        {/* Colonna Operatore */}
                        <td className="px-3 py-2 border whitespace-nowrap text-[11px] font-medium">
                          {op}
                        </td>

                        {/* Una cella per ogni mese */}
                        {monthKeys.map((m) => {
                          const count = statsByOperator[m][op] || 0;
                          const { gold, silver, bronze, last } =
                            rankingByMonth[m];
                          let bgClass = "";
                          let icon = "";

                          if (op === gold) {
                            bgClass = "bg-yellow-200/75";
                            icon = "🏆";
                          } else if (op === silver) {
                            bgClass = "bg-gray-200/75";
                            icon = "🥈";
                          } else if (op === bronze) {
                            bgClass = "bg-orange-200/75";
                            icon = "🥉";
                          } else if (op === last) {
                            bgClass = "bg-red-100/75";
                            icon = "🥄";
                          }

                          return (
                            <td
                              key={m}
                              className={`
                                px-3 py-2 border text-center text-[11px]
                                ${bgClass}
                              `}
                            >
                              {icon && <span className="mr-1">{icon}</span>}
                              {count}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {monthKeys.length === 0 && (
                      <tr>
                        <td
                          className="px-3 py-4 border text-center text-[11px]"
                          colSpan={operators.length + 1}
                        >
                          Nessuna sostituzione registrata
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* <!-- LEGENDA MENSILE --> */}
              <div className="mt-4 mx-2 p-3 bg-gray-100 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold mb-2">Legenda Mensile</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-yellow-200/75 rounded mr-2 flex items-center justify-center">
                      🏆
                    </div>
                    <span>1° Classificato (più sostituzioni)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-gray-200/75 rounded mr-2 flex items-center justify-center">
                      🥈
                    </div>
                    <span>2° Classificato</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-orange-200/75 rounded mr-2 flex items-center justify-center">
                      🥉
                    </div>
                    <span>3° Classificato</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-red-100/75 rounded mr-2 flex items-center justify-center">
                      🥄
                    </div>
                    <span>“Cucchiaio di legno” (meno sostituzioni)</span>
                  </div>
                </div>
                <p className="mt-3 text-[10px] text-gray-600">
                  Questa tabella analizza le prestazioni mensili degli operatori,
                  mostrando il numero di sostituzioni completate in ogni mese.
                  Le icone e i colori indicano il primo (oro), il secondo (argento),
                  il terzo (bronzo) e chi ha effettuato meno sostituzioni (“cucchiaio di
                  legno”). Tutto ciò aiuta a individuare rapidamente i migliori e
                  i peggiori nello specifico periodo.
                </p>
              </div>
            </>
          )}

          {/* ================= VISTA ANNUALE CON CLASSIFICHE ================= */}
          {statsView === "annual" && (
            <>
              <div className="space-y-3 px-2">
                {Object.entries(statsAnnual).map(([yr, counts]) => {
                  const { gold, silver, bronze, last } = rankingByYear[yr];
                  const arr = operators
                    .map((op) => [op, counts[op] || 0])
                    .sort((a, b) => b[1] - a[1]);
                  return (
                    <div
                      key={yr}
                      className="bg-gray-50 rounded-lg shadow-sm overflow-hidden"
                    >
                      <div className="flex justify-between items-center bg-indigo-100 rounded-t-lg px-3 py-2">
                        <span className="text-sm font-semibold">{yr}</span>
                        <span className="text-xs text-gray-500">Totali</span>
                      </div>
                      <div>
                        {arr.map(([op, cnt]) => {
                          let bgClass = "";
                          let icon = "";
                          if (op === gold) {
                            bgClass = "bg-yellow-200/75";
                            icon = "🏆";
                          } else if (op === silver) {
                            bgClass = "bg-gray-200/75";
                            icon = "🥈";
                          } else if (op === bronze) {
                            bgClass = "bg-orange-200/75";
                            icon = "🥉";
                          } else if (op === last) {
                            bgClass = "bg-red-100/75";
                            icon = "🥄";
                          }
                          return (
                            <div
                              key={op}
                              className={`flex justify-between items-center text-[11px] border-t px-3 py-2 ${bgClass}`}
                            >
                              <div className="flex items-center">
                                {icon && (
                                  <span className="mr-2">{icon}</span>
                                )}
                                <span>{op}</span>
                              </div>
                              <span className="font-semibold">{cnt}</span>
                            </div>
                          );
                        })}
                        {operators.length === 0 && (
                          <div className="py-4 text-center text-[11px] text-gray-500">
                            Nessuna sostituzione registrata
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {Object.keys(statsAnnual).length === 0 && (
                  <div className="py-4 text-center text-[11px] text-gray-500">
                    Nessuna sostituzione registrata
                  </div>
                )}
              </div>

              {/* <!-- LEGENDA ANNUALE --> */}
              <div className="mt-4 mx-2 p-3 bg-gray-100 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold mb-2">Legenda Annuale</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-yellow-200/75 rounded mr-2 flex items-center justify-center">
                      🏆
                    </div>
                    <span>1° Classificato (più sostituzioni annue)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-gray-200/75 rounded mr-2 flex items-center justify-center">
                      🥈
                    </div>
                    <span>2° Classificato</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-orange-200/75 rounded mr-2 flex items-center justify-center">
                      🥉
                    </div>
                    <span>3° Classificato</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-red-100/75 rounded mr-2 flex items-center justify-center">
                      🥄
                    </div>
                    <span>“Cucchiaio di legno” (meno sostituzioni annue)</span>
                  </div>
                </div>
                <p className="mt-3 text-[10px] text-gray-600">
                  La modalità annuale aggrega il numero complessivo di sostituzioni di
                  ogni operatore per l’intero anno. Le icone e i colori segnalano chi
                  si è distinto maggiormente e chi è rimasto indietro a confronto con la
                  totalità delle performance annuali.
                </p>
              </div>
            </>
          )}

          {/* ================ VISTA PER OPERATORE CON CLASSIFICHE GLOBALI ================= */}
          {statsView === "byOperator" && (
            <>
              <div className="space-y-2 px-2">
                {operators.map((op, idx) => {
                  const counts = statsByOpCategory[op]; // {Sala, Reparto, Olieria}
                  const total = counts.Sala + counts.Reparto + counts.Olieria;
                  const { goldCat, silverCat, bronzeCat, lastCat } =
                    rankingByOpCategories[op];
                  let globalBg = "";
                  let globalIcon = "";
                  const { gold, silver, bronze, last } = rankingGlobal;
                  if (op === gold) {
                    globalBg = "bg-yellow-200/75";
                    globalIcon = "🏆";
                  } else if (op === silver) {
                    globalBg = "bg-gray-200/75";
                    globalIcon = "🥈";
                  } else if (op === bronze) {
                    globalBg = "bg-orange-200/75";
                    globalIcon = "🥉";
                  } else if (op === last) {
                    globalBg = "bg-red-100/75";
                    globalIcon = "🥄";
                  }
                  return (
                    <div
                      key={op}
                      className={`bg-gray-50 rounded-lg shadow-sm p-3 border ${globalBg}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center text-sm font-semibold">
                          {globalIcon && (
                            <span className="mr-2">{globalIcon}</span>
                          )}
                          <span>{op}</span>
                        </div>
                        <span className="text-[10px] text-gray-500">
                          Totale: <span className="font-semibold">{total}</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        {["Sala", "Reparto", "Olieria"].map((cat) => {
                          const cnt = counts[cat];
                          let bgClass = "";
                          let icon = "";
                          if (cat === goldCat) {
                            bgClass = "bg-yellow-200/75";
                            icon = "🏆";
                          } else if (cat === silverCat) {
                            bgClass = "bg-gray-200/75";
                            icon = "🥈";
                          } else if (cat === bronzeCat) {
                            bgClass = "bg-orange-200/75";
                            icon = "🥉";
                          } else if (cat === lastCat) {
                            bgClass = "bg-red-100/75";
                            icon = "🥄";
                          }
                          return (
                            <div
                              key={cat}
                              className={`bg-white rounded py-1 text-center ${bgClass}`}
                            >
                              {icon && <div className="mb-1">{icon}</div>}
                              <span className="font-medium">{cat}</span>
                              <br />
                              <span className="font-semibold">{cnt}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {operators.every((op) => {
                  const c = statsByOpCategory[op];
                  return c.Sala === 0 && c.Reparto === 0 && c.Olieria === 0;
                }) && (
                  <div className="py-4 text-center text-[10px] text-gray-500">
                    Nessuna sostituzione registrata
                  </div>
                )}
              </div>

              {/* <!-- LEGENDA PER OPERATORE --> */}
              <div className="mt-4 mx-2 p-3 bg-gray-100 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold mb-2">
                  Legenda per Operatore
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-yellow-200/75 rounded mr-2 flex items-center justify-center">
                      🏆
                    </div>
                    <span>Operatore con più sostituzioni totali</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-gray-200/75 rounded mr-2 flex items-center justify-center">
                      🥈
                    </div>
                    <span>Secondo operatore</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-orange-200/75 rounded mr-2 flex items-center justify-center">
                      🥉
                    </div>
                    <span>Terzo operatore</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-red-100/75 rounded mr-2 flex items-center justify-center">
                      🥄
                    </div>
                    <span>Operatore con meno sostituzioni totali</span>
                  </div>
                </div>
                <p className="mt-3 text-[10px] text-gray-600">
                  In questa sezione, ogni scheda rappresenta un singolo operatore con:
                  <ul className="list-disc pl-5 mt-1">
                    <li><span className="font-medium">Icona e sfondo colorato</span>: premiato in base al totale di sostituzioni (🏆, 🥈, 🥉, 🥄).</li>
                    <li><span className="font-medium">Totale sostituzioni</span>: indicato a fianco del nome.</li>
                    <li><span className="font-medium">Ripartizione per categoria</span>: mostra quante sostituzioni ha effettuato in Sala, Reparto e Olieria, con icone che indicano la categoria primaria (oro), seconda (argento), terza (bronzo) e ultima (cucchiaio di legno).</li>
                  </ul>
                </p>
              </div>
            </>
          )}

          {/* ================= DESCRIZIONE GLOBALE DELLA TABELLA ================= */}
          <div className="mt-6 mx-2 p-3 bg-white rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold mb-2">Descrizione della Tabella</h4>
            <p className="text-[11px] text-gray-700">
              Questo report offre una panoramica completa delle sostituzioni, suddivise in tre prospettive:
            </p>
            <ul className="list-disc pl-5 mt-2 text-[11px] text-gray-700 space-y-1">
              <li>
                <span className="font-semibold">Mensile</span>: confronta le performance di ogni operatore mese per mese, 
                evidenziando con icone e colori chi ha effettuato il maggior numero di sostituzioni (🏆, 🥈, 🥉) e chi ha avuto 
                il numero minore (🥄). Questo permette di monitorare l’andamento nel breve termine.
              </li>
              <li>
                <span className="font-semibold">Annuale</span>: aggrega i dati su base annua e li ordina in classifica, 
                usando lo stesso sistema di icone per premiare i migliori e penalizzare chi ha sostituito di meno nell’anno. 
                Utile per valutazioni strategiche a lungo termine.
              </li>
              <li>
                <span className="font-semibold">Per Operatore</span>: mostra, per ciascun operatore, il totale delle sostituzioni 
                e la suddivisione tra Sala, Reparto e Olieria. Le icone e i colori indicano:
                <ul className="list-inside list-disc mt-1">
                  <li><span className="font-semibold">Icona globale</span> (🏆, 🥈, 🥉, 🥄) in base al totale complessivo di sostituzioni.</li>
                  <li><span className="font-semibold">Icone per categoria</span> in base al numero di sostituzioni in Sala, Reparto e Olieria.</li>
                </ul>
              </li>
            </ul>
            <p className="mt-3 text-[11px] text-gray-700">
              L’obiettivo è fornire uno strumento chiaro e immediato per analizzare le attività di sostituzione, 
              consentendo di identificare velocemente chi si distingue per produttività e chi necessita di supporto o 
              attenzione, sia nel breve che nel lungo periodo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
