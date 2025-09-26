import type { MetaAhorro } from '../app/components/MetasAhorro';
import type { Categoria } from '../app/components/GestionarCategorias';
import type { Transaction } from '../app/page';

// Definición de la estructura de una notificación para toda la app
export interface Notification {
  id: string; // Usaremos IDs únicos como 'meta-123'
  message: string;
  type: 'alert' | 'success' | 'info';
}

// Asumimos la estructura de la tabla de la base de datos
export interface RecurringTransaction {
  id: string;
  descripcion: string;
  monto: number;
  proxima_fecha_pago: string; // La fecha del siguiente evento
}

/**
 * Calcula la diferencia en días entre dos fechas.
 */
function differenceInDays(date1: Date, date2: Date): number {
  const differenceInTime = date1.getTime() - date2.getTime();
  return Math.ceil(differenceInTime / (1000 * 3600 * 24));
}

/**
 * Comprueba las metas de ahorro y devuelve notificaciones para las que se han completado.
 */
export function checkCompletedGoals(metas: MetaAhorro[]): Notification[] {
  return metas
    .filter(meta => meta.monto_actual >= meta.monto_objetivo)
    .map(meta => ({
      id: `meta-${meta.id}`,
      message: `¡Felicidades! Has alcanzado tu meta de ahorro "${meta.nombre}".`,
      type: 'success',
    }));
}

/**
 * Comprueba transacciones recurrentes y devuelve notificaciones para las que están próximas a vencer.
 */
export function checkUpcomingTransactions(transactions: RecurringTransaction[], daysThreshold: number = 7): Notification[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalizar a la medianoche

  return transactions
    .map(tx => {
      const nextPaymentDate = new Date(tx.proxima_fecha_pago);
      const daysUntilPayment = differenceInDays(nextPaymentDate, today);

      if (daysUntilPayment >= 0 && daysUntilPayment <= daysThreshold) {
        let message = `Recordatorio: El pago de "${tx.descripcion}" `;
        if (daysUntilPayment === 0) message += 'vence hoy.';
        else if (daysUntilPayment === 1) message += 'vence mañana.';
        else message += `vence en ${daysUntilPayment} días.`;
        
        return {
          id: `recurring-${tx.id}`,
          message,
          type: 'alert' as const,
        };
      }
      return null;
    })
    .filter((n): n is Notification => n !== null);
}

/**
 * Comprueba si se han excedido los presupuestos mensuales para las categorías.
 * @param categories - Un array de todas las categorías, algunas con presupuestos.
 * @param transactions - Un array de todas las transacciones.
 * @returns Un array de notificaciones para presupuestos excedidos.
 */
export function checkExceededBudgets(categories: Categoria[], transactions: Transaction[]): Notification[] {
  const notifications: Notification[] = [];
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  // 1. Filtrar categorías que tienen un presupuesto definido y mayor a 0
  const budgetedCategories = categories.filter(c => c.presupuesto && c.presupuesto > 0);

  if (budgetedCategories.length === 0) {
    return [];
  }

  // 2. Calcular el gasto total para cada categoría en el mes actual
  const expensesByCat: { [key: string]: number } = {};
  transactions.forEach(t => {
    const transactionDate = new Date(t.fecha);
    if (t.tipo === 'gasto' && t.categoria_id && transactionDate.getMonth() === thisMonth && transactionDate.getFullYear() === thisYear) {
      if (!expensesByCat[t.categoria_id]) {
        expensesByCat[t.categoria_id] = 0;
      }
      expensesByCat[t.categoria_id] += t.monto;
    }
  });

  // 3. Comparar gasto con presupuesto
  budgetedCategories.forEach(cat => {
    const totalSpent = expensesByCat[cat.id] || 0;
    if (totalSpent > cat.presupuesto!) {
      notifications.push({
        id: `budget-${cat.id}`,
        message: `Has excedido tu presupuesto de "${cat.nombre}" este mes. (Gastado: $${totalSpent.toLocaleString('es-AR')} / Límite: $${cat.presupuesto!.toLocaleString('es-AR')})`,
        type: 'alert',
      });
    }
  });

  return notifications;
}
