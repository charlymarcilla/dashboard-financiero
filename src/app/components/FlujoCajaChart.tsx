'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction } from '../page';

interface FlujoCajaChartProps {
  transacciones: Transaction[];
}

const FlujoCajaChart: React.FC<FlujoCajaChartProps> = ({ transacciones }) => {
  const data = useMemo(() => {
    const monthlyData: { [key: string]: { month: string; ingresos: number; gastos: number } } = {};
    const now = new Date();

    // Initialize data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
      monthlyData[monthKey] = { month: monthName, ingresos: 0, gastos: 0 };
    }

    transacciones.forEach(tx => {
      const txDate = new Date(tx.fecha);
      const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData[monthKey]) {
        if (tx.tipo === 'ingreso') {
          monthlyData[monthKey].ingresos += tx.monto;
        } else {
          monthlyData[monthKey].gastos += tx.monto;
        }
      }
    });

    return Object.values(monthlyData);
  }, [transacciones]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
        <XAxis dataKey="month" stroke="#A0AEC0" />
        <YAxis stroke="#A0AEC0" />
        <Tooltip
          contentStyle={{ backgroundColor: '#2D3748', border: 'none', color: '#E2E8F0' }}
          formatter={(value: number) => `$${value.toLocaleString('es-AR')}`}
        />
        <Legend wrapperStyle={{ color: '#E2E8F0' }} />
        <Bar dataKey="ingresos" fill="#48BB78" name="Ingresos" />
        <Bar dataKey="gastos" fill="#F56565" name="Gastos" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default FlujoCajaChart;
