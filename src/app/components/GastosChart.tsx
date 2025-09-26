'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface GastosChartProps {
  data: ChartData[];
}

// Colores para los segmentos del gráfico
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943', '#19D4FF'];

export default function GastosChart({ data }: GastosChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-60 bg-gray-800 rounded-lg">
        <p className="text-gray-400">No hay datos de gastos para mostrar.</p>
      </div>
    );
  }

  return (
    // Usamos ResponsiveContainer para que el gráfico se ajuste al contenedor
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
            return (
              <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                {`${(percent * 100).toFixed(0)}%`}
              </text>
            );
          }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: '#2d3748', border: 'none', borderRadius: '0.5rem' }}
          formatter={(value: number) => [`${value.toLocaleString('es-AR')}`, 'Total']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}