'use client';
import { useState, useEffect, FormEvent, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

// Interfaz alinedada con el schema de DB (sin 'tipo')
export interface Cuenta {
  id: string; // UUID
  nombre: string;
  saldo_inicial: number;
}

interface GestionarCuentasProps {
  user: User;
  onAccountsChange: () => void;
}

const GestionarCuentas: React.FC<GestionarCuentasProps> = ({ user, onAccountsChange }) => {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [nombre, setNombre] = useState('');
  const [saldo, setSaldo] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCuentas = useCallback(async () => {
    setLoading(true);
    // El select ya no incluye 'tipo'
    const { data, error } = await supabase
      .from('cuentas')
      .select('id, nombre, saldo_inicial')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching cuentas:', error);
      toast.error('No se pudieron cargar las cuentas.');
    } else {
      setCuentas(data || []);
    }
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    fetchCuentas();
  }, [fetchCuentas]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre || !saldo) {
      toast.error("Nombre y saldo inicial son requeridos.");
      return;
    }

    // El insert ya no incluye 'tipo'
    const { error } = await supabase
      .from('cuentas')
      .insert([{ 
        nombre, 
        saldo_inicial: parseFloat(saldo),
        user_id: user.id 
      }]);

    if (error) {
      console.error('Error creating cuenta:', error);
      toast.error(`No se pudo crear la cuenta: ${error.message}`);
    } else {
      toast.success('Cuenta creada exitosamente.');
      setNombre('');
      setSaldo('');
      fetchCuentas(); // Refresh the list
      onAccountsChange(); // Notify parent component
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro? Eliminar una cuenta también eliminará TODAS sus transacciones asociadas (configurado en la base de datos con ON DELETE CASCADE).")) {
        const { error } = await supabase.from('cuentas').delete().eq('id', id);
        if (error) {
            toast.error('Error al eliminar la cuenta.');
            console.error(error);
        } else {
            toast.success('Cuenta eliminada.');
            fetchCuentas();
            onAccountsChange();
        }
    }
  }

  if (loading) {
    return <p className="text-gray-300">Cargando cuentas...</p>;
  }

  return (
    <div className="p-1">
      <form onSubmit={handleSubmit} className="mb-6">
        {/* Formulario simplificado sin 'tipo' */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nombre (ej. Banco Principal)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="bg-gray-700 p-2 rounded-md text-white"
            required
          />
          <input
            type="number"
            placeholder="Saldo Inicial"
            value={saldo}
            onChange={(e) => setSaldo(e.target.value)}
            className="bg-gray-700 p-2 rounded-md text-white"
            required
            step="0.01"
          />
        </div>
        <button type="submit" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
          Añadir Cuenta
        </button>
      </form>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Cuentas Existentes:</h3>
        {cuentas.length > 0 ? (
          cuentas.map((cuenta) => (
            <div key={cuenta.id} className="bg-gray-700 p-3 rounded-md flex justify-between items-center">
              <div>
                {/* Display simplificado sin 'tipo' */}
                <p className="font-semibold">{cuenta.nombre}</p>
                <p className="text-sm text-gray-300">Saldo inicial: ${parseFloat(String(cuenta.saldo_inicial)).toLocaleString('es-AR')}</p>
              </div>
              <button onClick={() => handleDelete(cuenta.id)} className="text-gray-400 hover:text-red-500 p-1">
                <Trash2 size={18} />
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-400">No has añadido ninguna cuenta todavía.</p>
        )}
      </div>
    </div>
  );
};

export default GestionarCuentas;