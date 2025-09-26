'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Trash2, PlusCircle, Save } from 'lucide-react';
import { User } from '@supabase/supabase-js';

export type Categoria = {
  id: string;
  nombre: string;
  user_id: string | null;
  presupuesto?: number | null; // Presupuesto es opcional
};

interface GestionarCategoriasProps {
  user: User;
  onCategoriesChange: () => void;
}

const GestionarCategorias: React.FC<GestionarCategoriasProps> = ({ user, onCategoriesChange }) => {
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nombre, user_id, presupuesto')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('nombre', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      toast.error((error as Error).message || 'Error al cargar las categorías.');
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.warning('El nombre de la categoría no puede estar vacío.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categorias')
        .insert({ 
            nombre: newCategoryName.trim(), 
            user_id: user.id,
            presupuesto: newCategoryBudget ? parseFloat(newCategoryBudget) : null,
        })
        .select()
        .single();
      
      if (error) throw error;

      if (data) {
        fetchCategories();
        setNewCategoryName('');
        setNewCategoryBudget('');
        toast.success(`Categoría "${data.nombre}" añadida.`);
        onCategoriesChange();
      }

    } catch (error) {
      const supabaseError = error as { code?: string; message: string };
      if (supabaseError.code === '23505') {
        toast.error(`La categoría "${newCategoryName.trim()}" ya existe.`);
      } else {
        toast.error(supabaseError.message || 'Error al añadir la categoría.');
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm("¿Seguro que quieres eliminar esta categoría? Las transacciones asociadas no se eliminarán, pero quedarán sin categoría.")) {
      try {
        const { error } = await supabase.from('categorias').delete().eq('id', id);
        if (error) throw error;
        fetchCategories();
        toast.success(`Categoría eliminada.`);
        onCategoriesChange();
      } catch (error) {
        toast.error((error as Error).message || 'Error al eliminar la categoría.');
      }
    }
  };

  const handleBudgetChange = (id: string, value: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, presupuesto: value ? parseFloat(value) : null } : c));
  };

  const handleSaveBudget = async (id: string) => {
    const category = categories.find(c => c.id === id);
    if (!category) return;

    try {
      const { error } = await supabase
        .from('categorias')
        .update({ presupuesto: category.presupuesto })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Presupuesto para "${category.nombre}" actualizado.`);
      onCategoriesChange();
    } catch (error) {
      toast.error((error as Error).message || 'Error al actualizar el presupuesto.');
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg text-white">
      <h3 className="text-xl font-bold mb-4">Gestionar Categorías y Presupuestos</h3>
      
      <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6">
        <input 
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Nueva categoría"
          className="md:col-span-2 bg-gray-700 border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          value={newCategoryBudget}
          onChange={(e) => setNewCategoryBudget(e.target.value)}
          placeholder="Presupuesto (opcional)"
          className="bg-gray-700 border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="md:col-span-3 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-semibold">
          <PlusCircle size={18} />
          Añadir Categoría
        </button>
      </form>

      {isLoading ? (
        <p>Cargando categorías...</p>
      ) : (
        <ul className="space-y-2 max-h-72 overflow-y-auto pr-2">
          {categories.map(cat => (
            <li key={cat.id} className="flex justify-between items-center bg-gray-700 p-2 rounded-md gap-2">
              <span className="font-semibold flex-grow">{cat.nombre}</span>
              {cat.user_id && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Presup."
                      value={cat.presupuesto || ''}
                      onChange={(e) => handleBudgetChange(cat.id, e.target.value)}
                      className="w-28 bg-gray-600 border-gray-500 rounded px-2 py-1 text-white text-sm"
                    />
                    <button onClick={() => handleSaveBudget(cat.id)} className="text-gray-400 hover:text-green-400" aria-label="Guardar presupuesto">
                      <Save size={18} />
                    </button>
                  </div>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-500" aria-label="Eliminar categoría">
                      <Trash2 size={18} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GestionarCategorias;
