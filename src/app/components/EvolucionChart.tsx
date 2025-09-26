'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction } from '../page'; // Importar el tipo principal

interface EvolucionChartProps {
  transacciones: Transaction[];
}

const EvolucionChart: React.FC<EvolucionChartProps> = ({ transacciones }) => {
  const chartData = useMemo(() => {
    const dataByMonth: { [key: string]: { month: string; ingresos: number; gastos: number } } = {};

    // Guard Clause: Si no hay transacciones, devuelve un array vacío.
    if (!transacciones || transacciones.length === 0) {
      return [];
    }

    transacciones.forEach(t => {
      if (!t.fecha) return;
      const month = t.fecha.substring(0, 7); // Agrupar por YYYY-MM
      
      if (!dataByMonth[month]) {
        dataByMonth[month] = { month, ingresos: 0, gastos: 0 };
      }

      if (t.tipo === 'ingreso') {
        dataByMonth[month].ingresos += t.monto;
      } else if (t.tipo === 'gasto') {
        dataByMonth[month].gastos += t.monto;
      }
    });

    return Object.values(dataByMonth)
      .sort((a, b) => a.month.localeCompare(b.month));

  }, [transacciones]);

  if (chartData.length === 0) {
    return <div className="text-center text-gray-400 py-10">No hay datos suficientes para mostrar la evolución.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="month" stroke="#9CA3AF" />
        <YAxis 
          stroke="#9CA3AF" 
          tickFormatter={(value) => `${Number(value).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
          width={80}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
          labelStyle={{ color: '#F9FAFB' }}
          formatter={(value: number, name: string) => [`${value.toLocaleString('es-AR')}`, name.charAt(0).toUpperCase() + name.slice(1)]}
        />
        <Legend wrapperStyle={{ color: '#D1D5DB' }} />
        <Line type="monotone" dataKey="ingresos" stroke="#4ADE80" strokeWidth={2} name="Ingresos" />
        <Line type="monotone" dataKey="gastos" stroke="#F87171" strokeWidth={2} name="Gastos" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default EvolucionChart;