'use client';

import React, { useState } from 'react';
import { Cuenta } from './GestionarCuentas';
import { Categoria } from './GestionarCategorias';

// Definimos el tipo para los datos del formulario
export interface RecurringTransactionFormData {
  descripcion: string;
  monto: number;
  tipo: 'ingreso' | 'gasto';
  cuenta_id: string | null;
  categoria_id: string | null;
  frecuencia: 'diaria' | 'semanal' | 'mensual' | 'anual';
  fecha_inicio: string;
  fecha_fin: string | null;
}

interface RecurringTransactionFormProps {
  cuentas: Cuenta[];
  categorias: Categoria[];
  onSubmit: (data: RecurringTransactionFormData) => void;
}

const RecurringTransactionForm: React.FC<RecurringTransactionFormProps> = ({ cuentas, categorias, onSubmit }) => {
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState<'ingreso' | 'gasto'>('gasto');
  const [cuentaId, setCuentaId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [frecuencia, setFrecuencia] = useState<'diaria' | 'semanal' | 'mensual' | 'anual'>('mensual');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion || !monto || !fechaInicio) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    onSubmit({
      descripcion,
      monto: parseFloat(monto),
      tipo,
      cuenta_id: cuentaId || null,
      categoria_id: tipo === 'gasto' ? categoriaId : null,
      frecuencia,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin || null,
    });

    // Resetear formulario
    setDescripcion('');
    setMonto('');
    setCuentaId('');
    setCategoriaId('');
    setFechaInicio(new Date().toISOString().split('T')[0]);
    setFechaFin('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="recurring-description" className="block text-sm font-medium text-gray-300">Descripción</label>
          <input
            id="recurring-description"
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="recurring-amount" className="block text-sm font-medium text-gray-300">Monto</label>
          <input
            id="recurring-amount"
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300">Tipo</label>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center">
              <input type="radio" name="tipo" value="gasto" checked={tipo === 'gasto'} onChange={() => setTipo('gasto')} className="form-radio text-red-500 bg-gray-700" />
              <span className="ml-2">Gasto</span>
            </label>
            <label className="flex items-center">
              <input type="radio" name="tipo" value="ingreso" checked={tipo === 'ingreso'} onChange={() => setTipo('ingreso')} className="form-radio text-green-500 bg-gray-700" />
              <span className="ml-2">Ingreso</span>
            </label>
          </div>
        </div>
        <div>
          <label htmlFor="recurring-cuenta" className="block text-sm font-medium text-gray-300">Cuenta</label>
          <select
            id="recurring-cuenta"
            value={cuentaId}
            onChange={(e) => setCuentaId(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Selecciona una cuenta</option>
            {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      {tipo === 'gasto' && (
        <div>
          <label htmlFor="recurring-categoria" className="block text-sm font-medium text-gray-300">Categoría</label>
          <select
            id="recurring-categoria"
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="">Selecciona una categoría</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div>
          <label htmlFor="recurring-frequency" className="block text-sm font-medium text-gray-300">Frecuencia</label>
          <select 
            id="recurring-frequency"
            value={frecuencia} 
            onChange={(e) => setFrecuencia(e.target.value as 'diaria' | 'semanal' | 'mensual' | 'anual')}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="diaria">Diaria</option>
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
            <option value="anual">Anual</option>
          </select>
        </div>
        <div>
          <label htmlFor="recurring-startDate" className="block text-sm font-medium text-gray-300">Fecha de Inicio</label>
          <input 
            id="recurring-startDate"
            type="date" 
            value={fechaInicio} 
            onChange={(e) => setFechaInicio(e.target.value)} 
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="recurring-endDate" className="block text-sm font-medium text-gray-300">Fecha de Fin (Opcional)</label>
          <input 
            id="recurring-endDate"
            type="date" 
            value={fechaFin} 
            onChange={(e) => setFechaFin(e.target.value)} 
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          Guardar Transacción Recurrente
        </button>
      </div>
    </form>
  );
};

export default RecurringTransactionForm;