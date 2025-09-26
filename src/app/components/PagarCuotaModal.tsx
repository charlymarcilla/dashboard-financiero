'use client';

import React, { useState, useEffect } from 'react';
import { Deuda } from './GestionarDeudas';
import { Cuenta } from './GestionarCuentas';
import Modal from './Modal';

interface PagarCuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  deuda: Deuda | null;
  cuentas: Cuenta[];
  onConfirm: (deudaId: string, monto: number, cuentaId: string) => void;
}

const PagarCuotaModal: React.FC<PagarCuotaModalProps> = ({ isOpen, onClose, deuda, cuentas, onConfirm }) => {
  const [monto, setMonto] = useState('');
  const [cuentaId, setCuentaId] = useState('');

  useEffect(() => {
    if (deuda) {
      // Calcula el monto de la cuota y lo pre-rellena
      const montoCuota = deuda.monto_total / deuda.cuotas_totales;
      setMonto(montoCuota.toFixed(2));
      // Selecciona la primera cuenta por defecto si existe
      if (cuentas.length > 0) {
        setCuentaId(cuentas[0].id);
      }
    }
  }, [deuda, cuentas]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deuda || !monto || !cuentaId) {
      alert('Por favor, completa todos los campos.');
      return;
    }
    onConfirm(deuda.id, parseFloat(monto), cuentaId);
  };

  if (!deuda) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Pagar Cuota de ${deuda.descripcion}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="monto-pago" className="block text-sm font-medium text-gray-300">Monto a Pagar</label>
          <input
            id="monto-pago"
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="cuenta-pago" className="block text-sm font-medium text-gray-300">Pagar desde la cuenta</label>
          <select
            id="cuenta-pago"
            value={cuentaId}
            onChange={(e) => setCuentaId(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            {cuentas.length > 0 ? (
              cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)
            ) : (
              <option disabled>No hay cuentas disponibles</option>
            )}
          </select>
        </div>
        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
            Confirmar Pago
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PagarCuotaModal;
