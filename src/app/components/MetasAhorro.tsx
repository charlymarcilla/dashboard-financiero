'use client';

import React from 'react';
import { Trash2, Edit, PlusCircle } from 'lucide-react';

export interface MetaAhorro {
  id: string;
  user_id: string;
  nombre: string;
  monto_objetivo: number;
  monto_actual: number;
  fecha_limite: string | null;
}

interface MetasAhorroProps {
  metas: MetaAhorro[];
  onDeposit: (meta: MetaAhorro) => void;
  onEdit: (meta: MetaAhorro) => void;
  onDelete: (id: string) => void;
}

const MetasAhorro: React.FC<MetasAhorroProps> = ({ metas, onDeposit, onEdit, onDelete }) => {
  const calcularProgreso = (actual: number, objetivo: number) => {
    if (objetivo === 0) return 0;
    return Math.min((actual / objetivo) * 100, 100);
  };

  return (
    <div className="space-y-4">
      {metas.length === 0 ? (
        <p className="text-center text-gray-400">No has definido ninguna meta de ahorro todavía.</p>
      ) : (
        metas.map(meta => (
          <div key={meta.id} className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-indigo-400">{meta.nombre}</h3>
                <p className="text-sm text-gray-300">
                  ${meta.monto_actual.toLocaleString('es-AR')} / ${meta.monto_objetivo.toLocaleString('es-AR')}
                </p>
                {meta.fecha_limite && (
                  <p className="text-xs text-gray-500">
                    Fecha límite: {new Date(meta.fecha_limite).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onDeposit(meta)} className="text-green-400 hover:text-green-300" title="Depositar dinero">
                  <PlusCircle size={20} />
                </button>
                <button onClick={() => onEdit(meta)} className="text-gray-400 hover:text-blue-400" title="Editar meta">
                  <Edit size={20} />
                </button>
                <button onClick={() => onDelete(meta.id)} className="text-gray-400 hover:text-red-400" title="Eliminar meta">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-3">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${calcularProgreso(meta.monto_actual, meta.monto_objetivo)}%` }}
              ></div>
            </div>
            <p className="text-right text-xs mt-1 text-gray-400">{calcularProgreso(meta.monto_actual, meta.monto_objetivo).toFixed(2)}%</p>
          </div>
        ))
      )}
    </div>
  );
};

export default MetasAhorro;
