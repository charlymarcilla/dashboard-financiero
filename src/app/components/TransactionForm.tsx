'use client';

import React, { useState, useEffect } from 'react';
import { Categoria } from './GestionarCategorias';
import { Cuenta } from './GestionarCuentas';

export interface TransactionFormData {
  monto: number;
  descripcion: string;
  cuenta_id: string;
  categoria_id: string | null;
  fecha: string;
  tipo: 'ingreso' | 'gasto';
  forma_de_pago?: string;
  cuotas?: number;
}

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => void;
  transactionType: 'ingreso' | 'gasto';
  categorias: Categoria[];
  cuentas: Cuenta[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, transactionType, categorias, cuentas }) => {
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cuentaId, setCuentaId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  
  // Nuevos estados para forma de pago y cuotas
  const [formaDePago, setFormaDePago] = useState('Efectivo');
  const [cuotas, setCuotas] = useState(1);

  useEffect(() => {
    if (cuentas.length > 0) {
      setCuentaId(cuentas[0].id);
    }
  }, [cuentas]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || !descripcion || !cuentaId || (transactionType === 'gasto' && !categoriaId)) {
      toast.error('Por favor completa todos los campos obligatorios.');
      return;
    }

    onSubmit({
      monto: parseFloat(monto),
      descripcion,
      cuenta_id: cuentaId,
      categoria_id: transactionType === 'gasto' ? categoriaId : null,
      fecha,
      tipo: transactionType,
      forma_de_pago: transactionType === 'gasto' ? formaDePago : undefined,
      cuotas: transactionType === 'gasto' && formaDePago === 'Tarjeta de Crédito' ? cuotas : 1,
    });

    // Resetear formulario
    setMonto('');
    setDescripcion('');
    setCategoriaId('');
    setFecha(new Date().toISOString().split('T')[0]);
    setFormaDePago('Efectivo');
    setCuotas(1);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción" className="bg-gray-700 p-2 rounded-md w-full" required />
        <input type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="Monto" className="bg-gray-700 p-2 rounded-md w-full" required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="bg-gray-700 p-2 rounded-md w-full" required />
        <select value={cuentaId} onChange={e => setCuentaId(e.target.value)} className="bg-gray-700 p-2 rounded-md w-full" required>
          <option value="" disabled>Selecciona una cuenta</option>
          {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>
      {transactionType === 'gasto' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} className="bg-gray-700 p-2 rounded-md w-full md:col-span-1" required>
            <option value="" disabled>Selecciona una categoría</option>
            {categorias.filter(c => c.user_id).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select value={formaDePago} onChange={e => setFormaDePago(e.target.value)} className="bg-gray-700 p-2 rounded-md w-full md:col-span-1">
            <option>Efectivo</option>
            <option>Débito</option>
            <option>Tarjeta de Crédito</option>
            <option>Transferencia</option>
          </select>
          {formaDePago === 'Tarjeta de Crédito' && (
            <input type="number" value={cuotas} onChange={e => setCuotas(parseInt(e.target.value, 10) || 1)} placeholder="Cuotas" min="1" className="bg-gray-700 p-2 rounded-md w-full md:col-span-1" />
          )}
        </div>
      )}
      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md">
        Añadir {transactionType === 'ingreso' ? 'Ingreso' : 'Gasto'}
      </button>
    </form>
  );
};

export default TransactionForm;
