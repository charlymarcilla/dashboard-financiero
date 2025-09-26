'use client';

import React from 'react';
import { Deuda } from './GestionarDeudas'; // Reutilizamos el tipo
import { CreditCard } from 'lucide-react';

interface DeudasProps {
  deudas: Deuda[];
  onPayInstallment: (deuda: Deuda) => void;
}

const Deudas: React.FC<DeudasProps> = ({ deudas, onPayInstallment }) => {

  const calcularProgreso = (pagado: number, total: number) => {
    if (total === 0) return 0;
    return Math.min((pagado / total) * 100, 100);
  };

  const deudaTotal = deudas.reduce((acc, deuda) => acc + (deuda.monto_total - deuda.monto_pagado), 0);

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-gray-400">Deuda Pendiente Total</p>
        <p className="text-3xl font-bold text-red-400">${deudaTotal.toLocaleString('es-AR')}</p>
      </div>

      {deudas.length === 0 ? (
        <p className="text-center text-gray-500">¡Felicidades! No tienes deudas registradas.</p>
      ) : (
        deudas.map(deuda => (
          <div key={deuda.id} className="bg-gray-900 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-amber-400">{deuda.descripcion}</h3>
                <p className="text-sm text-gray-300">
                  ${deuda.monto_pagado.toLocaleString('es-AR')} / ${deuda.monto_total.toLocaleString('es-AR')}
                </p>
                <p className="text-xs text-gray-500">
                  {deuda.tipo_deuda}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold">{deuda.cuotas_pagadas} / {deuda.cuotas_totales}</p>
                  <p className="text-sm text-gray-400">cuotas</p>
                </div>
                {deuda.cuotas_pagadas < deuda.cuotas_totales && (
                  <button 
                    onClick={() => onPayInstallment(deuda)}
                    className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700"
                    title="Pagar siguiente cuota"
                  >
                    <CreditCard size={20} />
                  </button>
                )}
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-3">
              <div
                className="bg-amber-600 h-2.5 rounded-full"
                style={{ width: `${calcularProgreso(deuda.monto_pagado, deuda.monto_total)}%` }}
              ></div>
            </div>
            <p className="text-right text-xs mt-1 text-gray-400">{calcularProgreso(deuda.monto_pagado, deuda.monto_total).toFixed(2)}%</p>
          </div>
        ))
      )}
    </div>
  );
};

export default Deudas;