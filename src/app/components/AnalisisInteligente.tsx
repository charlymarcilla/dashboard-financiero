'use client';

import React, { useMemo } from 'react';
import { Transaction } from '../page';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle } from 'lucide-react';

interface AnalisisInteligenteProps {
  transacciones: Transaction[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

const AnalisisInteligente: React.FC<AnalisisInteligenteProps> = ({ transacciones }) => {

  const { monthlyComparison, topCategories, unusualSpending } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const gastos = transacciones.filter(t => t.tipo === 'gasto');

    // 1. Comparación Mes Actual vs Anterior (ya existente)
    const currentMonthSpending = gastos
      .filter(t => {
        const date = new Date(t.fecha);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((acc, t) => acc + t.monto, 0);

    const prevMonthSpending = gastos
      .filter(t => {
        const date = new Date(t.fecha);
        return date.getMonth() === prevMonth && date.getFullYear() === prevMonthYear;
      })
      .reduce((acc, t) => acc + t.monto, 0);

    let percentageDiff = 0;
    if (prevMonthSpending > 0) {
      percentageDiff = ((currentMonthSpending - prevMonthSpending) / prevMonthSpending) * 100;
    }

    // 2. Top Categorías (ya existente)
    const categorySpendingCurrentMonth: { [key: string]: number } = {};
    gastos
        .filter(t => {
            const date = new Date(t.fecha);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .forEach(t => {
            const categoryName = t.categorias?.nombre || 'Sin Categoría';
            if (categorySpendingCurrentMonth[categoryName]) {
                categorySpendingCurrentMonth[categoryName] += t.monto;
            } else {
                categorySpendingCurrentMonth[categoryName] = t.monto;
            }
        });

    const sortedCategories = Object.entries(categorySpendingCurrentMonth)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    // 3. Detección de Gastos Inusuales (NUEVO)
    const sixMonthsAgo = new Date(currentYear, currentMonth - 6, 1);
    const historicalSpending: { [category: string]: { total: number; months: Set<string> } } = {};

    gastos
      .filter(t => new Date(t.fecha) >= sixMonthsAgo && new Date(t.fecha) < new Date(currentYear, currentMonth, 1))
      .forEach(t => {
        const categoryName = t.categorias?.nombre || 'Sin Categoría';
        const monthYear = `${new Date(t.fecha).getFullYear()}-${new Date(t.fecha).getMonth()}`;
        if (!historicalSpending[categoryName]) {
          historicalSpending[categoryName] = { total: 0, months: new Set() };
        }
        historicalSpending[categoryName].total += t.monto;
        historicalSpending[categoryName].months.add(monthYear);
      });

    const categoryAverages: { [key: string]: number } = {};
    for (const category in historicalSpending) {
      const numMonths = historicalSpending[category].months.size;
      if (numMonths > 0) {
        categoryAverages[category] = historicalSpending[category].total / numMonths;
      }
    }

    const unusualSpending: { name: string; percentage: number }[] = [];
    for (const category in categorySpendingCurrentMonth) {
      const currentSpending = categorySpendingCurrentMonth[category];
      const avgSpending = categoryAverages[category];
      if (avgSpending && currentSpending > avgSpending * 1.5) { // Umbral: 50% más que el promedio
        const increase = ((currentSpending - avgSpending) / avgSpending) * 100;
        unusualSpending.push({ name: category, percentage: Math.round(increase) });
      }
    }

    return {
      monthlyComparison: {
        currentMonthSpending,
        prevMonthSpending,
        percentageDiff
      },
      topCategories: sortedCategories,
      unusualSpending: unusualSpending.sort((a, b) => b.percentage - a.percentage)
    };
  }, [transacciones]);

  const comparisonText = () => {
    if (monthlyComparison.percentageDiff === 0) {
      return "Tus gastos se mantienen igual que el mes pasado.";
    }
    const diff = Math.abs(monthlyComparison.percentageDiff).toFixed(1);
    if (monthlyComparison.percentageDiff > 0) {
      return <span className="text-red-400">Has gastado un {diff}% más que el mes pasado.</span>;
    }
    return <span className="text-green-400">Has gastado un {diff}% menos que el mes pasado. ¡Buen trabajo!</span>;
  };

  return (
    <section className="mb-12 bg-gray-800 p-6 rounded-lg">
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-100">Análisis Inteligente</h2>
      
      {unusualSpending.length > 0 && (
        <div className="mb-8 bg-gray-900/50 border border-amber-500/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-center mb-3 text-amber-400">Gastos Inusuales Detectados</h3>
            <div className="space-y-2">
                {unusualSpending.map(item => (
                    <div key={item.name} className="flex items-center gap-3 text-amber-200/90">
                        <AlertCircle size={20} className="text-amber-400"/>
                        <p>Gasto en <span className="font-bold">{item.name}</span> es un <span className="font-bold">{item.percentage}%</span> mayor al promedio.</p>
                    </div>
                ))}
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        <div className="text-center">
            <p className="text-lg text-gray-300 mb-2">Comparativa de Gastos Mensuales</p>
            <p className="text-4xl font-bold">${monthlyComparison.currentMonthSpending.toLocaleString('es-AR')}</p>
            <p className="text-md text-gray-400 mb-4">este mes</p>
            <p className="text-sm text-gray-500">Mes anterior: ${monthlyComparison.prevMonthSpending.toLocaleString('es-AR')}</p>
            <p className="mt-3 text-lg">{comparisonText()}</p>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-center mb-4 text-gray-300">Top 5 Categorías de Gasto (Mes Actual)</h3>
            {topCategories.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topCategories} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#A0AEC0' }} tickLine={false} axisLine={false} />
                        <Tooltip 
                            cursor={{fill: 'rgba(100,116,139,0.1)'}}
                            contentStyle={{ backgroundColor: '#2D3748', border: 'none', borderRadius: '0.5rem'}} 
                            labelStyle={{ color: '#E2E8F0' }}
                        />
                        <Bar dataKey="value" name="Gasto" fill="#8884d8" radius={[0, 10, 10, 0]}>
                            {topCategories.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-center text-gray-500">No hay suficientes datos de gastos para este mes.</p>
            )}
        </div>

      </div>
    </section>
  );
};

export default AnalisisInteligente;
