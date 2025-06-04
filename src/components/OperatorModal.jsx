import React from "react";

export default function OperatorModal({
  operators,
  tempAssignments,
  selectedRole,
  selectOperator,
  close
}) {
  const isUsed = (op) => Object.values(tempAssignments).includes(op);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-2">
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xs p-6">
        <button
          onClick={close}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>
        <h3 className="text-lg font-semibold text-center mb-4">
          Seleziona Operatore per {selectedRole}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {operators.map((op, idx) => {
            const used = isUsed(op);
            const selected = tempAssignments[selectedRole] === op;
            return (
              <button
                key={idx}
                onClick={() => !used && selectOperator(op)}
                disabled={used}
                className={`py-3 rounded-xl text-center text-[10px] font-medium transition 
                  ${
                    selected
                      ? "bg-blue-600 text-white"
                      : used
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-green-100 text-green-800 hover:bg-green-200"
                  }`}
              >
                {op}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
