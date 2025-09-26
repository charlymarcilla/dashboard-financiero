'use client';

import React, { useState, useEffect } from 'react';
import { MetaAhorro } from './MetasAhorro'; // This type will be defined in MetasAhorro.tsx

export interface MetaAhorroFormData {
  nombre: string;
  monto_objetivo: number;
  fecha_limite: string | null;
}

interface MetaAhorroFormProps {
  onSubmit: (data: MetaAhorroFormData) => void;
  initialData?: MetaAhorro | null;
}

const MetaAhorroForm: React.FC<MetaAhorroFormProps> = ({ onSubmit, initialData }) => {
  const [nombre, setNombre] = useState('');
  const [montoObjetivo, setMontoObjetivo] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre);
      setMontoObjetivo(initialData.monto_objetivo.toString());
      setFechaLimite(initialData.fecha_limite ? new Date(initialData.fecha_limite).toISOString().split('T')[0] : '');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !montoObjetivo) {
      alert('Por favor, completa el nombre y el monto objetivo.');
      return;
    }

    onSubmit({
      nombre,
      monto_objetivo: parseFloat(montoObjetivo),
      fecha_limite: fechaLimite || null,
    });

    // Reset form if not editing
    if (!initialData) {
      setNombre('');
      setMontoObjetivo('');
      setFechaLimite('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="meta-nombre" className="block text-sm font-medium text-gray-300">Nombre de la Meta</label>
        <input
          id="meta-nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="meta-monto" className="block text-sm font-medium text-gray-300">Monto Objetivo</label>
          <input
            id="meta-monto"
            type="number"
            value={montoObjetivo}
            onChange={(e) => setMontoObjetivo(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="meta-fecha" className="block text-sm font-medium text-gray-300">Fecha Límite (Opcional)</label>
          <input
            id="meta-fecha"
            type="date"
            value={fechaLimite}
            onChange={(e) => setFechaLimite(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          {initialData ? 'Actualizar Meta' : 'Crear Meta'}
        </button>
      </div>
    </form>
  );
};

export default MetaAhorroForm;
