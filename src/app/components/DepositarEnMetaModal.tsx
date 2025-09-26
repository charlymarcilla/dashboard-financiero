'use client';

import React, { useState } from 'react';
import Modal from './Modal';
import { MetaAhorro } from './MetasAhorro';
import { Cuenta } from './GestionarCuentas';

interface DepositarEnMetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  meta: MetaAhorro | null;
  cuentas: Cuenta[];
  onDeposit: (metaId: string, monto: number, cuentaId: string) => void;
}

const DepositarEnMetaModal: React.FC<DepositarEnMetaModalProps> = ({ isOpen, onClose, meta, cuentas, onDeposit }) => {
  const [monto, setMonto] = useState('');
  const [cuentaId, setCuentaId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meta || !monto || !cuentaId) {
      alert('Por favor, completa todos los campos.');
      return;
    }
    onDeposit(meta.id, parseFloat(monto), cuentaId);
    setMonto('');
    setCuentaId('');
  };

  if (!meta) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Depositar en: ${meta.nombre}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="deposito-monto" className="block text-sm font-medium text-gray-300">Monto a Depositar</label>
          <input
            id="deposito-monto"
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="deposito-cuenta" className="block text-sm font-medium text-gray-300">Desde la Cuenta</label>
          <select
            id="deposito-cuenta"
            value={cuentaId}
            onChange={(e) => setCuentaId(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="">Selecciona una cuenta</option>
            {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-4">
          <button type="button" onClick={onClose} className="inline-flex justify-center rounded-md border border-gray-500 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-700">
            Cancelar
          </button>
          <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
            Depositar
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DepositarEnMetaModal;
