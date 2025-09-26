'use client';

import { useMemo } from 'react';
import { Categoria } from './GestionarCategorias';

// El tipo 'Gasto' debe coincidir con la estructura de transacciones que se le pasa
interface Gasto {
  monto: number;
  fecha: string;
  categorias: { nombre: string } | null;
}

interface PresupuestosProps {
  categorias: Categoria[];
  gastos: Gasto[];
  onCategoriaClick: (categoria: string) => void;
  selectedCategoria: string | null;
}

const Presupuestos: React.FC<PresupuestosProps> = ({ categorias, gastos, onCategoriaClick, selectedCategoria }) => {

  const datosCategorias = useMemo(() => {
    const mesActual = new Date().getUTCMonth();
    const anioActual = new Date().getUTCFullYear();

    // 1. Filtrar gastos del mes actual
    const gastosDelMes = gastos.filter(g => {
      const fechaGasto = new Date(g.fecha);
      return fechaGasto.getUTCMonth() === mesActual && fechaGasto.getUTCFullYear() === anioActual;
    });

    // 2. Agrupar gastos por categoría
    const gastosAgrupados = gastosDelMes.reduce((acc, gasto) => {
      const nombreCat = gasto.categorias?.nombre || 'Sin Categoría';
      if (!acc[nombreCat]) {
        acc[nombreCat] = 0;
      }
      acc[nombreCat] += gasto.monto;
      return acc;
    }, {} as Record<string, number>);

    // 3. Mapear todas las categorías (incluidas las que no tienen gastos este mes)
    return categorias
      .map(cat => ({
        id: cat.id,
        nombre: cat.nombre,
        gastado: gastosAgrupados[cat.nombre] || 0,
      }))
      .sort((a, b) => b.gastado - a.gastado); // Ordenar por la que más se gastó

  }, [categorias, gastos]);

  if (datosCategorias.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p>No hay categorías definidas.</p>
        <p className="text-sm text-gray-500">Ve a &quot;Gestionar Categorías&quot; para empezar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {datosCategorias.map(item => (
        <div 
          key={item.id} 
          onClick={() => onCategoriaClick(item.nombre)}
          className={`p-3 rounded-md cursor-pointer transition-all duration-200 ${selectedCategoria === item.nombre ? 'bg-gray-600 ring-2 ring-blue-500' : 'bg-gray-700/50 hover:bg-gray-700'}`}>
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-gray-200">{item.nombre}</span>
            <span className="font-medium text-gray-300">
              ${item.gastado.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Presupuestos;