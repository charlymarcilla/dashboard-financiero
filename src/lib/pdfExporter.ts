import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../app/page'; // Importamos el tipo Transaction

// Función para formatear la fecha, similar a la de la página principal
const formatDate = (dateString: string) => {
  if (!dateString) return 'Sin fecha';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
};

/**
 * Exporta una lista de transacciones a un archivo PDF.
 * @param transactions - Los datos de las transacciones a exportar.
 * @param title - El título del documento (ej. "Reporte de Ingresos").
 * @param filename - El nombre del archivo a generar.
 */
export const exportToPdf = (transactions: Transaction[], title: string, filename: string) => {
  const doc = new jsPDF();

  // Título del documento
  doc.text(title, 14, 20);
  doc.setFontSize(12);
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 14, 28);

  // Definir las columnas de la tabla
  const head = [['Fecha', 'Descripción', 'Categoría', 'Cuenta', 'Monto']];

  // Mapear los datos de las transacciones al formato de la tabla
  const body = transactions.map(tx => [
    formatDate(tx.fecha),
    tx.descripcion,
    tx.categorias?.nombre || 'N/A',
    tx.cuentas?.nombre || 'N/A',
    `$${tx.monto.toLocaleString('es-AR')}`
  ]);

  // Usar autoTable para crear la tabla en el PDF
  autoTable(doc, {
    head: head,
    body: body,
    startY: 35, // Empezar la tabla después de los títulos
    headStyles: { fillColor: [41, 128, 185] }, // Color azul para la cabecera
    styles: { halign: 'right' }, // Alinear montos a la derecha
    columnStyles: {
      1: { halign: 'left' }, // Alinear descripción a la izquierda
      2: { halign: 'left' }, // Alinear categoría a la izquierda
      3: { halign: 'left' }, // Alinear cuenta a la izquierda
    }
  });

  // Guardar el archivo
  doc.save(filename);
};
