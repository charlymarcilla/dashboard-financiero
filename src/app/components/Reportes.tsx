'use client';

import React from 'react';
import { Transaction } from '../page';
import FlujoCajaChart from './FlujoCajaChart';
import GastosChart from './GastosChart';
import EvolucionChart from './EvolucionChart';

interface ReportesProps {
  transacciones: Transaction[];
}

const Reportes: React.FC<ReportesProps> = ({ transacciones }) => {
  const gastosData = React.useMemo(() => {
    const dataAgrupada = transacciones
      .filter(tx => tx.tipo === 'gasto')
      .reduce((acc, gasto) => {
        const categoriaNombre = gasto.categorias?.nombre || 'Sin Categoría';
        if (!acc[categoriaNombre]) {
          acc[categoriaNombre] = 0;
        }
        acc[categoriaNombre] += gasto.monto;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(dataAgrupada).map(([name, value]) => ({ name, value }));
  }, [transacciones]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      <section className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-center text-gray-100">Flujo de Caja Mensual (Últimos 6 meses)</h2>
        <FlujoCajaChart transacciones={transacciones} />
      </section>
      <section className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-center text-gray-100">Distribución de Gastos</h2>
        <GastosChart data={gastosData} />
      </section>
      <section className="bg-gray-800 p-6 rounded-lg lg:col-span-2">
        <h2 className="text-2xl font-semibold mb-4 text-center text-gray-100">Evolución del Balance</h2>
        <EvolucionChart transacciones={transacciones} />
      </section>
    </div>
  );
};

export default Reportes;
