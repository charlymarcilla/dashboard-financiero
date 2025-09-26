'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Categoria } from './GestionarCategorias';
import { Cuenta } from './GestionarCuentas';



export type EditableTransaction = {
  type: 'ingreso' | 'gasto';
  data: {
    id: string;
    descripcion: string;
    monto: number;
    fecha: string;
    categoria_id: string | null;
    cuenta_id: string;
  };
};

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: EditableTransaction | null;
  onSave: (updatedTransaction: EditableTransaction) => void;
  categories: Categoria[];
  cuentas: Cuenta[];
}

export default function EditModal({ isOpen, onClose, transaction, onSave, categories, cuentas }: EditModalProps) {
  const [formData, setFormData] = useState(transaction?.data);

  useEffect(() => {
    setFormData(transaction?.data);
  }, [transaction]);

  if (!isOpen || !transaction || !formData) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev!, [name]: name === 'monto' ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(formData) {
      onSave({ ...transaction, data: formData });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md m-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-white">Editar Transacción</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
              <input id="nombre" name="descripcion" type="text" value={formData.descripcion} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="monto" className="block text-sm font-medium text-gray-300 mb-1">Monto</label>
              <input id="valor" name="monto" type="number" value={formData.monto} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="fecha" className="block text-sm font-medium text-gray-300 mb-1">Fecha</label>
              <input id="fecha" name="fecha" type="date" value={formData.fecha} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="cuenta_id" className="block text-sm font-medium text-gray-300 mb-1">Cuenta</label>
              <select id="cuenta_id" name="cuenta_id" value={formData.cuenta_id} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {cuentas.map(cuenta => <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre}</option>)}
              </select>
            </div>
            {transaction.type === 'gasto' && (
              <>
                <div>
                  <label htmlFor="categoria_id" className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
                  <select id="categoria" name="categoria_id" value={formData.categoria_id || ''} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Selecciona una categoría</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>
          <div className="mt-8 flex justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-md mr-3">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-white font-semibold bg-blue-600 hover:bg-blue-700 rounded-md">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}
