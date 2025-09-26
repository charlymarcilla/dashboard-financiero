'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Trash2, PlusCircle } from 'lucide-react';
import { User } from '@supabase/supabase-js';

export type Deuda = {
  id: string;
  user_id: string;
  descripcion: string;
  monto_total: number;
  monto_pagado: number;
  cuotas_totales: number;
  cuotas_pagadas: number;
  tipo_deuda: string;
  fecha_inicio: string;
};

// Prop para pre-rellenar el formulario
export interface InitialDeudaData {
  descripcion: string;
  monto_total: number;
  cuotas_totales: number;
}

interface GestionarDeudasProps {
  user: User;
  onDeudasChange: () => void;
  initialData?: InitialDeudaData | null;
  onClose: () => void; // Para cerrar el modal después de añadir una deuda desde el formulario de gastos
}

const GestionarDeudas: React.FC<GestionarDeudasProps> = ({ user, onDeudasChange, initialData, onClose }) => {
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [cuotasTotales, setCuotasTotales] = useState('1');
  const [tipoDeuda, setTipoDeuda] = useState('Compra a Cuotas');
  const [isLoading, setIsLoading] = useState(true);

  // Efecto para pre-rellenar el formulario si se proporcionan datos iniciales
  useEffect(() => {
    if (initialData) {
      setDescripcion(initialData.descripcion);
      setMontoTotal(initialData.monto_total.toString());
      setCuotasTotales(initialData.cuotas_totales.toString());
      setTipoDeuda('Compra a Cuotas');
    }
  }, [initialData]);

  const fetchDeudas = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('deudas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeudas(data || []);
    } catch (error) {
      toast.error((error as Error).message || 'Error al cargar las deudas.');
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchDeudas();
  }, [fetchDeudas]);

  const handleAddDeuda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim() || !montoTotal.trim() || !cuotasTotales.trim()) {
      toast.warning('Por favor, completa todos los campos.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('deudas')
        .insert({
          descripcion: descripcion.trim(),
          monto_total: parseFloat(montoTotal),
          cuotas_totales: parseInt(cuotasTotales, 10),
          tipo_deuda: tipoDeuda,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;

      if (data) {
        fetchDeudas();
        setDescripcion('');
        setMontoTotal('');
        setCuotasTotales('1');
        toast.success(`Deuda "${data.descripcion}" añadida.`);
        onDeudasChange();
        // Si venimos del formulario de gastos, cerramos el modal
        if (initialData) {
          onClose();
        }
      }

    } catch (error) {
      toast.error((error as Error).message || 'Error al añadir la deuda.');
    }
  };

  const handleDeleteDeuda = async (id: string) => {
    if (window.confirm("¿Seguro que quieres eliminar esta deuda? Esta acción no se puede deshacer.")) {
      try {
        const { error } = await supabase.from('deudas').delete().eq('id', id);
        if (error) throw error;
        fetchDeudas();
        toast.success(`Deuda eliminada.`);
        onDeudasChange();
      } catch (error) {
        toast.error((error as Error).message || 'Error al eliminar la deuda.');
      }
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg text-white">
      <h3 className="text-xl font-bold mb-4">Gestionar Deudas</h3>
      
      <form onSubmit={handleAddDeuda} className="space-y-4 mb-6">
        <input 
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción (ej. Préstamo, TV 8K)"
          className="w-full bg-gray-700 border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="number"
            value={montoTotal}
            onChange={(e) => setMontoTotal(e.target.value)}
            placeholder="Monto Total"
            className="bg-gray-700 border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="number"
            value={cuotasTotales}
            onChange={(e) => setCuotasTotales(e.target.value)}
            placeholder="Cuotas Totales"
            min="1"
            className="bg-gray-700 border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <select 
            value={tipoDeuda} 
            onChange={e => setTipoDeuda(e.target.value)}
            className="bg-gray-700 border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Compra a Cuotas</option>
            <option>Préstamo</option>
            <option>Otro</option>
          </select>
        </div>
        <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-semibold">
          <PlusCircle size={18} />
          Añadir Deuda
        </button>
      </form>

      <h4 className="text-lg font-semibold mb-2">Deudas Activas</h4>
      {isLoading ? (
        <p>Cargando deudas...</p>
      ) : (
        <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {deudas.length > 0 ? deudas.map(deuda => (
            <li key={deuda.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-md gap-4">
              <div className="flex-grow">
                <p className="font-semibold">{deuda.descripcion}</p>
                <p className="text-sm text-gray-400">{deuda.tipo_deuda} - ${deuda.monto_total.toLocaleString('es-AR')}</p>
              </div>
              <div className="text-right">
                 <p className="font-semibold">{deuda.cuotas_pagadas} / {deuda.cuotas_totales}</p>
                 <p className="text-sm text-gray-400">cuotas</p>
              </div>
              <button onClick={() => handleDeleteDeuda(deuda.id)} className="text-gray-400 hover:text-red-500" aria-label="Eliminar deuda">
                  <Trash2 size={18} />
              </button>
            </li>
          )) : <p className="text-center text-gray-500">No hay deudas registradas.</p>}
        </ul>
      )}
    </div>
  );
};

export default GestionarDeudas;