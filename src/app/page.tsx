'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { Trash2, Pencil, FilterX, Search, FileDown, Settings, Landmark, PiggyBank, GripVertical, Wallet } from 'lucide-react';
import { CSVLink } from 'react-csv';
import TransactionForm, { TransactionFormData } from './components/TransactionForm';
import EditModal, { EditableTransaction } from './components/EditModal';
import Modal from './components/Modal';
import GestionarCategorias, { Categoria } from './components/GestionarCategorias';
import GestionarCuentas, { Cuenta } from './components/GestionarCuentas';
import RecurringTransactionForm from './components/RecurringTransactionForm';
import MetasAhorro, { MetaAhorro } from './components/MetasAhorro';
import MetaAhorroForm, { MetaAhorroFormData } from './components/MetaAhorroForm';
import DepositarEnMetaModal from './components/DepositarEnMetaModal';
import PagarCuotaModal from './components/PagarCuotaModal';
import Reportes from './components/Reportes';
import AnalisisInteligente from './components/AnalisisInteligente';
import Notificaciones from './components/Notificaciones';
import Deudas from './components/Deudas';
import GestionarDeudas, { Deuda, InitialDeudaData } from './components/GestionarDeudas';
import { supabase } from '../lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { Theme } from '@supabase/auth-ui-shared';
import { User } from '@supabase/supabase-js';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { checkCompletedGoals, checkUpcomingTransactions, checkExceededBudgets, Notification as AppNotification, RecurringTransaction } from '../lib/notificationService';
import { exportToPdf } from '../lib/pdfExporter';

import { RecurringTransactionFormData } from './components/RecurringTransactionForm';

// --- Tipos Corregidos ---
export type Transaction = {
  id: string; // UUID
  cuenta_id: string; // UUID
  categoria_id: string | null; // UUID
  monto: number;
  tipo: 'ingreso' | 'gasto';
  descripcion: string;
  fecha: string;
  user_id: string;
  forma_de_pago?: string | null;
  // Campos expandidos de Supabase
  categorias: { nombre: string } | null;
  cuentas: { nombre: string } | null;
};

// --- Helpers ---
const getTodayString = () => new Date().toISOString().split('T')[0];
const formatDate = (dateString: string) => {
  if (!dateString) return 'Sin fecha';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
};

// --- Componente Draggable ---
const SortableItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative border border-transparent">
      {children}
      <button {...attributes} {...listeners} className="absolute top-2 right-2 p-2 bg-gray-700/50 hover:bg-gray-600 rounded-md text-blue-400 hover:text-white cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-blue-500">
        <GripVertical size={24} />
      </button>
    </div>
  );
};


// --- Componente de Paginación ---
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-4 mt-4">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
      <span className="text-gray-400">Página {currentPage} de {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
    </div>
  );
}

const DEFAULT_LAYOUT = ['balance', 'deudas', 'analisis', 'reportes', 'metas', 'transacciones', 'recurrente'];
const WIDGET_NAMES: { [key: string]: string } = {
  balance: 'Balance General',
  deudas: 'Gestión de Deudas',
  analisis: 'Análisis Inteligente',
  reportes: 'Reportes y Gráficos',
  metas: 'Metas de Ahorro',
  transacciones: 'Ingresos y Gastos',
  recurrente: 'Añadir Transacción Recurrente',
};

export default function DashboardPage() {
  // --- Estados de Autenticación y Datos Maestros ---
  const [user, setUser] = useState<User | null>(null);
  const [transacciones, setTransacciones] = useState<Transaction[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [metas, setMetas] = useState<MetaAhorro[]>([]);
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // --- Estado del Layout ---
  const [layout, setLayout] = useState<string[]>([]);
  const [widgetVisibility, setWidgetVisibility] = useState<{ [key: string]: boolean }>({});

  // --- Estados de UI y Filtros ---
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [isDeudasModalOpen, setIsDeudasModalOpen] = useState(false);
  const [isPagarCuotaModalOpen, setIsPagarCuotaModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<EditableTransaction | null>(null);
  const [editingMeta, setEditingMeta] = useState<MetaAhorro | null>(null);
  const [payingDeuda, setPayingDeuda] = useState<Deuda | null>(null);
  const [newDeudaFromTx, setNewDeudaFromTx] = useState<InitialDeudaData | null>(null);
  const [depositingMeta, setDepositingMeta] = useState<MetaAhorro | null>(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);
  const [filtroCuenta, setFiltroCuenta] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);

  // --- Estados de Paginación ---
  const [ingresosPage, setIngresosPage] = useState(1);
  const [gastosPage, setGastosPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // --- FUNCIÓN DE CARGA DE DATOS ---
  const fetchData = useCallback(async (currentUser: User) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const [cuentasRes, categoriasRes, transaccionesRes, metasRes, recurringRes, deudasRes] = await Promise.all([
        supabase.from('cuentas').select('id, nombre, saldo_inicial').eq('user_id', currentUser.id),
        supabase.from('categorias').select('id, nombre, user_id, presupuesto').or(`user_id.eq.${currentUser.id},user_id.is.null`),
        supabase.from('transacciones').select('*, categorias(nombre), cuentas(nombre)').eq('user_id', currentUser.id),
        supabase.from('metas_ahorro').select('*').eq('user_id', currentUser.id),
        supabase.from('transacciones_recurrentes').select('*').eq('user_id', currentUser.id),
        supabase.from('deudas').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false })
      ]);

      if (cuentasRes.error) throw new Error(`Error al cargar cuentas: ${cuentasRes.error.message}`);
      setCuentas(cuentasRes.data || []);

      if (categoriasRes.error) throw new Error(`Error al cargar categorías: ${categoriasRes.error.message}`);
      setCategorias(categoriasRes.data || []);

      if (transaccionesRes.error) throw new Error(`Error al cargar transacciones: ${transaccionesRes.error.message}`);
      setTransacciones(transaccionesRes.data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
      
      if (metasRes.error) throw new Error(`Error al cargar metas de ahorro: ${metasRes.error.message}`);
      setMetas(metasRes.data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || []);

      if (recurringRes.error) throw new Error(`Error al cargar transacciones recurrentes: ${recurringRes.error.message}`);
      setRecurringTransactions(recurringRes.data || []);

      if (deudasRes.error) throw new Error(`Error al cargar deudas: ${deudasRes.error.message}`);
      setDeudas(deudasRes.data || []);

    } catch (err) {
      toast.error((err as Error).message || 'Ocurrió un error desconocido al cargar los datos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- Efecto para generar notificaciones ---
  useEffect(() => {
    const goalNotifications = checkCompletedGoals(metas);
    const upcomingTransactionsNotifications = checkUpcomingTransactions(recurringTransactions);
    const budgetNotifications = checkExceededBudgets(categorias, transacciones);
    
    setNotifications([...goalNotifications, ...upcomingTransactionsNotifications, ...budgetNotifications]);
  }, [metas, recurringTransactions, categorias, transacciones]);


  // --- Efecto para gestionar la sesión y el layout ---
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchData(session.user);
      }
      setIsLoading(false);
    }
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchData(currentUser);
      }
    });

    // Cargar layout y visibilidad desde localStorage
    try {
      const savedLayout = localStorage.getItem('dashboard-layout');
      if (savedLayout) {
        setLayout(JSON.parse(savedLayout));
      } else {
        setLayout(DEFAULT_LAYOUT);
      }

      const savedVisibility = localStorage.getItem('dashboard-visibility');
      if (savedVisibility) {
        setWidgetVisibility(JSON.parse(savedVisibility));
      } else {
        const defaultVisibility = DEFAULT_LAYOUT.reduce((acc, id) => ({ ...acc, [id]: true }), {});
        setWidgetVisibility(defaultVisibility);
      }
    } catch {
      setLayout(DEFAULT_LAYOUT);
      const defaultVisibility = DEFAULT_LAYOUT.reduce((acc, id) => ({ ...acc, [id]: true }), {});
      setWidgetVisibility(defaultVisibility);
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchData]);

  // --- Lógica de Filtrado ---
  const filteredTransacciones = useMemo(() => {
    return transacciones.filter(item => {
      const fechaItem = new Date(item.fecha);
      const desde = fechaDesde ? new Date(fechaDesde) : null;
      const hasta = fechaHasta ? new Date(fechaHasta) : null;
      
      if(desde) desde.setUTCHours(0,0,0,0);
      if(hasta) hasta.setUTCHours(23,59,59,999);

      const dateMatch = (!desde || fechaItem >= desde) && (!hasta || fechaItem <= hasta);
      const searchMatch = searchTerm ? item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      const cuentaMatch = !filtroCuenta || item.cuenta_id === filtroCuenta;
      const categoryMatch = !filtroCategoria || item.categorias?.nombre === filtroCategoria;
      const tipoMatch = !filtroTipo || item.tipo === filtroTipo;

      return dateMatch && searchMatch && cuentaMatch && categoryMatch && tipoMatch;
    });
  }, [transacciones, fechaDesde, fechaHasta, searchTerm, filtroCategoria, filtroCuenta, filtroTipo]);

  const ingresos = useMemo(() => filteredTransacciones.filter(t => t.tipo === 'ingreso'), [filteredTransacciones]);
  const gastos = useMemo(() => filteredTransacciones.filter(t => t.tipo === 'gasto'), [filteredTransacciones]);

  // --- Reset de Paginación en Filtro ---
  useEffect(() => { setIngresosPage(1); setGastosPage(1); }, [filteredTransacciones]);

  // --- Lógica de Paginación (Corregida) ---
  const paginatedIngresos = useMemo(() => ingresos.slice((ingresosPage - 1) * ITEMS_PER_PAGE, ingresosPage * ITEMS_PER_PAGE), [ingresos, ingresosPage]);
  const paginatedGastos = useMemo(() => gastos.slice((gastosPage - 1) * ITEMS_PER_PAGE, gastosPage * ITEMS_PER_PAGE), [gastos, gastosPage]);
  const totalPagesIngresos = Math.ceil(ingresos.length / ITEMS_PER_PAGE);
  const totalPagesGastos = Math.ceil(gastos.length / ITEMS_PER_PAGE);

  // --- Handlers CRUD Transacciones ---
  const handleAddTransaction = async (data: TransactionFormData) => {
    if (!user) { toast.error('Debes iniciar sesión.'); return; }

    // Si es una compra a crédito con cuotas, se convierte en una deuda
    if (data.tipo === 'gasto' && data.forma_de_pago === 'Tarjeta de Crédito' && data.cuotas && data.cuotas > 1) {
      setNewDeudaFromTx({
        descripcion: data.descripcion,
        monto_total: data.monto,
        cuotas_totales: data.cuotas,
      });
      setIsDeudasModalOpen(true);
      toast.info('Estás añadiendo una compra en cuotas. Por favor, confirma los detalles de la nueva deuda.');
      return;
    }

    // Para todo lo demás, se crea una transacción simple
    try {
      const { error } = await supabase.from('transacciones').insert({
        monto: data.monto,
        descripcion: data.descripcion,
        cuenta_id: data.cuenta_id,
        categoria_id: data.categoria_id,
        fecha: data.fecha,
        tipo: data.tipo,
        forma_de_pago: data.forma_de_pago,
        user_id: user.id
      });
      if (error) throw error;
      toast.success(`${data.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'} añadido`);
      fetchData(user);
    } catch (err) { toast.error((err as Error).message); }
  };

  const handleAddRecurringTransaction = async (data: RecurringTransactionFormData) => {
    if (!user) { toast.error('Debes iniciar sesión.'); return; }
    try {
      const { error } = await supabase.from('transacciones_recurrentes').insert({ ...data, user_id: user.id });
      if (error) throw error;
      toast.success('Transacción recurrente guardada');
      fetchData(user);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDeleteTransaction = async (idToDelete: string) => {
    if (!user) return;
    if (window.confirm("¿Estás seguro de que quieres eliminar esta transacción?")) {
      try {
        const { error } = await supabase.from('transacciones').delete().eq('id', idToDelete);
        if (error) throw error;
        toast.success('Transacción eliminada');
        fetchData(user);
      } catch (err) { toast.error((err as Error).message); }
    }
  };

  const handleSaveTransaction = async (updated: EditableTransaction) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('transacciones').update(updated.data).eq('id', updated.data.id);
      if (error) throw error;
      toast.success('Transacción actualizada');
      fetchData(user);
      handleCloseEditModal();
    } catch (err) { toast.error((err as Error).message); }
  };

  // --- Handlers CRUD Metas de Ahorro ---
  const handleSaveMeta = async (formData: MetaAhorroFormData) => {
    if (!user) { toast.error('Debes iniciar sesión.'); return; }
    try {
      const dataToSave = { ...formData, user_id: user.id };
      let error;
      if (editingMeta) {
        ({ error } = await supabase.from('metas_ahorro').update(dataToSave).eq('id', editingMeta.id));
      } else {
        ({ error } = await supabase.from('metas_ahorro').insert(dataToSave));
      }
      if (error) throw error;
      toast.success(`Meta de ahorro ${editingMeta ? 'actualizada' : 'creada'}`);      fetchData(user);
      handleCloseMetaModal();
    } catch (err) { toast.error((err as Error).message); }
  };

  const handleDeleteMeta = async (id: string) => {
    if (!user) return;
    if (window.confirm("¿Estás seguro de que quieres eliminar esta meta de ahorro?")) {
      try {
        const { error } = await supabase.from('metas_ahorro').delete().eq('id', id);
        if (error) throw error;
        toast.success('Meta de ahorro eliminada');
        fetchData(user);
      } catch (err) { toast.error((err as Error).message); }
    }
  };

  const handleDepositToMeta = async (metaId: string, monto: number, cuentaId: string) => {
    if (!user) { toast.error('Debes iniciar sesión.'); return; }
    try {
      const { error } = await supabase.rpc('depositar_en_meta', {
        meta_id_param: metaId,
        monto_param: monto,
        cuenta_id_param: cuentaId
      });
      if (error) throw error;
      toast.success('Depósito realizado con éxito');
      fetchData(user);
      handleCloseDepositModal();
    } catch (err) { toast.error((err as Error).message); }
  };

  // --- Handlers CRUD Deudas ---
  const handleConfirmPagarCuota = async (deudaId: string, monto: number, cuentaId: string) => {
    if (!user) { toast.error('Debes iniciar sesión.'); return; }
    try {
      const { error } = await supabase.rpc('pagar_cuota', {
        deuda_id_param: deudaId,
        monto_pago: monto,
        cuenta_gasto_id: cuentaId
      });
      if (error) throw error;
      toast.success('Cuota pagada con éxito');
      fetchData(user);
      setIsPagarCuotaModalOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // --- Handlers UI ---
  const handleOpenEditModal = (tx: Transaction) => { setEditingTransaction({ type: tx.tipo, data: { id: tx.id, descripcion: tx.descripcion, monto: tx.monto, fecha: tx.fecha.split('T')[0], categoria_id: tx.categoria_id, cuenta_id: tx.cuenta_id } }); setIsEditModalOpen(true); };
  const handleCloseEditModal = () => { setIsEditModalOpen(false); setEditingTransaction(null); };
  const handleOpenMetaModal = (meta: MetaAhorro | null = null) => { setEditingMeta(meta); setIsMetaModalOpen(true); };
  const handleCloseMetaModal = () => { setIsMetaModalOpen(false); setEditingMeta(null); };
  const handleOpenDepositModal = (meta: MetaAhorro) => { setDepositingMeta(meta); setIsDepositModalOpen(true); };
  const handleCloseDepositModal = () => { setIsDepositModalOpen(false); setDepositingMeta(null); };
  const handleOpenPagarCuotaModal = (deuda: Deuda) => { setPayingDeuda(deuda); setIsPagarCuotaModalOpen(true); };
  const handleCloseDeudasModal = () => { setIsDeudasModalOpen(false); setNewDeudaFromTx(null); };
  const clearFilters = () => { setFechaDesde(''); setFechaHasta(''); setSearchTerm(''); setFiltroCategoria(null); setFiltroCuenta(null); setFiltroTipo(null); };

  // --- Handlers de Personalización y Exportación ---
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setLayout((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over!.id as string);
        const newLayout = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('dashboard-layout', JSON.stringify(newLayout));
        return newLayout;
      });
    }
  };

  const handleVisibilityChange = (id: string, isVisible: boolean) => {
    const newVisibility = { ...widgetVisibility, [id]: isVisible };
    setWidgetVisibility(newVisibility);
    localStorage.setItem('dashboard-visibility', JSON.stringify(newVisibility));
  };

  const handleExportPdf = (data: Transaction[], type: 'ingresos' | 'gastos') => {
    toast.info('Generando PDF...');
    try {
      const title = `Reporte de ${type.charAt(0).toUpperCase() + type.slice(1)}`;
      const filename = `${type}-${getTodayString()}.pdf`;
      exportToPdf(data, title, filename);
    } catch (error) {
      toast.error('No se pudo generar el PDF.');
      console.error(error);
    }
  };

  const sensors = useSensors(useSensor(PointerSensor));

  // --- Cálculos y Derivaciones ---
  const totalIngresos = ingresos.reduce((acc, item) => acc + item.monto, 0);
  const totalGastos = gastos.reduce((acc, item) => acc + item.monto, 0);
  const balance = totalIngresos - totalGastos;

  // --- CSV Export ---
  const csvHeaders = [ { label: "Descripcion", key: "descripcion" }, { label: "Monto", key: "monto" }, { label: "Tipo", key: "tipo" }, { label: "Fecha", key: "fecha" }, { label: "Categoria", key: "categorias.nombre" }, { label: "Cuenta", key: "cuentas.nombre" }, ];

  // --- Componentes del Dashboard ---
  const dashboardComponents: { [key: string]: React.ReactNode } = {
    balance: (
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gray-800 p-6 rounded-lg"><div><p>Ingresos</p><p className="text-2xl sm:text-3xl font-bold text-green-400">+${totalIngresos.toLocaleString('es-AR')}</p></div></div>
        <div className="bg-gray-800 p-6 rounded-lg"><div><p>Gastos</p><p className="text-2xl sm:text-3xl font-bold text-red-400">-${totalGastos.toLocaleString('es-AR')}</p></div></div>
        <div className="bg-gray-700 p-6 rounded-lg"><div><p>Balance</p><p className={`text-2xl sm:text-3xl font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>${balance.toLocaleString('es-AR')}</p></div></div>
      </section>
    ),
    deudas: (
      <section className="mb-12 bg-gray-800 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-center text-gray-100">Gestión de Deudas</h2>
        </div>
        <Deudas deudas={deudas} onPayInstallment={handleOpenPagarCuotaModal} />
      </section>
    ),
    analisis: <AnalisisInteligente transacciones={transacciones} />,
    reportes: <Reportes transacciones={filteredTransacciones} />,
    metas: (
      <section className="mb-12 bg-gray-800 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-center text-gray-100">Metas de Ahorro</h2>
          <button onClick={() => handleOpenMetaModal()} className="flex items-center gap-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-md text-sm"><PiggyBank size={16}/>Crear Meta</button>
        </div>
        <MetasAhorro metas={metas} onDeposit={handleOpenDepositModal} onEdit={handleOpenMetaModal} onDelete={handleDeleteMeta} />
      </section>
    ),
    recurrente: (
        <section className="mb-12 bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-center text-gray-100">Añadir Transacción Recurrente</h2>
            <RecurringTransactionForm onSubmit={handleAddRecurringTransaction} cuentas={cuentas} categorias={categorias} />
        </section>
    ),
    transacciones: (
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-green-400">Ingresos</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => handleExportPdf(ingresos, 'ingresos')} className="flex items-center gap-2 px-3 py-1 bg-red-800 hover:bg-red-900 rounded-md text-sm"><FileDown size={16}/>PDF</button>
              <CSVLink data={ingresos} headers={csvHeaders} filename={`ingresos-${getTodayString()}.csv`} className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-sm"><FileDown size={16}/>CSV</CSVLink>
            </div>
          </div>
          <TransactionForm onSubmit={handleAddTransaction} transactionType="ingreso" categorias={[]} cuentas={cuentas} />
          <ul className="space-y-3 mt-6">{paginatedIngresos.map((item) => (
            <li key={item.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-md">
              <div>
                <span className="font-semibold">{item.descripcion}</span>
                <span className="block text-xs text-gray-400">{formatDate(item.fecha)} en &apos;{item.cuentas?.nombre || 'N/A'}&apos;</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-green-300">+${item.monto.toLocaleString('es-AR')}</span>
                <button onClick={() => handleOpenEditModal(item)} className="text-gray-500 hover:text-blue-400"><Pencil className="w-5 h-5" /></button>
                <button onClick={() => handleDeleteTransaction(item.id)} className="text-gray-500 hover:text-red-400"><Trash2 className="w-5 h-5" /></button>
              </div>
            </li>
          ))}</ul>
          <PaginationControls currentPage={ingresosPage} totalPages={totalPagesIngresos} onPageChange={setIngresosPage} />
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-red-400">Gastos</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsCategoriesModalOpen(true)} className="flex items-center gap-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded-md text-sm"><Settings size={16}/>Categorías</button>
              <button onClick={() => handleExportPdf(gastos, 'gastos')} className="flex items-center gap-2 px-3 py-1 bg-red-800 hover:bg-red-900 rounded-md text-sm"><FileDown size={16}/>PDF</button>
              <CSVLink data={gastos} headers={csvHeaders} filename={`gastos-${getTodayString()}.csv`} className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-sm"><FileDown size={16}/>CSV</CSVLink>
            </div>
          </div>
          <TransactionForm onSubmit={handleAddTransaction} transactionType="gasto" categorias={categorias} cuentas={cuentas} />
          <ul className="space-y-3 mt-6">{paginatedGastos.map((item) => (
            <li key={item.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-md">
              <div>
                <span className="font-semibold">{item.descripcion}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded-full">{item.categorias?.nombre || 'N/A'}</span>
                  <span className="text-xs text-purple-400 bg-purple-900/50 px-2 py-0.5 rounded-full">en &apos;{item.cuentas?.nombre || 'N/A'}&apos;</span>
                  <span className="text-xs text-gray-400">{formatDate(item.fecha)}</span>
                  {item.forma_de_pago && <span className="text-xs text-gray-400 bg-gray-600 px-2 py-0.5 rounded-full">{item.forma_de_pago}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-red-300">-${item.monto.toLocaleString('es-AR')}</span>
                <button onClick={() => handleOpenEditModal(item)} className="text-gray-500 hover:text-blue-400"><Pencil className="w-5 h-5" /></button>
                <button onClick={() => handleDeleteTransaction(item.id)} className="text-gray-500 hover:text-red-400"><Trash2 className="w-5 h-5" /></button>
              </div>
            </li>
          ))}</ul>
          <PaginationControls currentPage={gastosPage} totalPages={totalPagesGastos} onPageChange={setGastosPage} />
        </div>
      </section>
    ),
  };


  // --- Renderizado Condicional ---
  if (isLoading && !user) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center"><p className="text-lg">Cargando...</p></div>;
  }

  if (!user) {
    const customTheme: Theme = {
      default: {
        colors: {
          brand: '#4f46e5',
          brandAccent: '#4338ca',
          brandButtonText: 'white',
          defaultButtonBackground: '#374151',
          defaultButtonBackgroundHover: '#4b5563',
          defaultButtonBorder: '#374151',
          defaultButtonText: 'white',
          dividerBackground: '#4b5563',
          inputBackground: 'transparent',
          inputBorder: '#4b5563',
          inputBorderHover: '#6b7280',
          inputBorderFocus: '#4f46e5',
          inputText: 'white',
          inputLabelText: '#9ca3af',
          anchorTextColor: '#6366f1',
          anchorTextHoverColor: '#818cf8',
        },
      },
      dark: {
        colors: {
          brand: '#4f46e5',
          brandAccent: '#4338ca',
          brandButtonText: 'white',
          defaultButtonBackground: '#374151',
          defaultButtonBackgroundHover: '#4b5563',
          defaultButtonBorder: '#374151',
          defaultButtonText: 'white',
          dividerBackground: '#4b5563',
          inputBackground: 'transparent',
          inputBorder: '#4b5563',
          inputBorderHover: '#6b7280',
          inputBorderFocus: '#4f46e5',
          inputText: 'white',
          inputLabelText: '#9ca3af',
          anchorTextColor: '#6366f1',
          anchorTextHoverColor: '#818cf8',
        },
      },
    };

    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-6">Dashboard Financiero</h1>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: customTheme }}
            theme="dark"
            providers={[]}
            localization={{variables: { sign_in: { email_label: 'Email', password_label: 'Contraseña', button_label: 'Iniciar Sesión' }, sign_up: { email_label: 'Email', password_label: 'Contraseña', button_label: 'Registrarse' }}}}
          />
        </div>
      </div>
    );
  }

  // --- Renderizado del Dashboard ---
  // --- prueba nueva ---
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <header className="mb-8 flex justify-between items-start sm:items-center flex-col sm:flex-row">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100">Dashboard</h1>
          {user && <p className="text-sm text-gray-400 mt-1">{user.email}</p>}
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button onClick={() => setIsDeudasModalOpen(true)} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-md h-fit flex items-center gap-2"><Wallet size={16}/>Deudas</button>
          <button onClick={() => setIsAccountsModalOpen(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md h-fit flex items-center gap-2"><Landmark size={16}/>Cuentas</button>
          <button onClick={() => setIsSettingsModalOpen(true)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md h-fit flex items-center gap-2"><Settings size={16}/>Personalizar</button>
          <button onClick={() => supabase.auth.signOut()} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md h-fit">Cerrar Sesión</button>
        </div>
      </header>

      <Notificaciones notifications={notifications} />

      <section className="mb-8 p-4 bg-gray-800 rounded-lg flex flex-wrap items-center justify-center gap-4">
        <select value={filtroCuenta || ''} onChange={(e) => setFiltroCuenta(e.target.value || null)} className="bg-gray-700 border-gray-600 rounded px-2 py-1">
          <option value="">Todas las cuentas</option>
          {cuentas.map(cuenta => (<option key={cuenta.id} value={cuenta.id}>{cuenta.nombre}</option>))}
        </select>
        <select value={filtroTipo || ''} onChange={(e) => setFiltroTipo(e.target.value || null)} className="bg-gray-700 border-gray-600 rounded px-2 py-1">
          <option value="">Todos los tipos</option>
          <option value="ingreso">Ingreso</option>
          <option value="gasto">Gasto</option>
        </select>
        <select value={filtroCategoria || ''} onChange={(e) => setFiltroCategoria(e.target.value || null)} className="bg-gray-700 border-gray-600 rounded px-2 py-1">
          <option value="">Todas las categorías</option>
          {categorias.filter(c => c.user_id !== null).map(cat => (<option key={cat.id} value={cat.nombre}>{cat.nombre}</option>))}
        </select>
        <label className="flex items-center gap-2"><span className="font-medium">Desde:</span><input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="bg-gray-700 border-gray-600 rounded px-2 py-1" /></label>
        <label className="flex items-center gap-2"><span className="font-medium">Hasta:</span><input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="bg-gray-700 border-gray-600 rounded px-2 py-1" /></label>
        <div className="relative w-full sm:w-auto"><input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-gray-700 border-gray-600 rounded px-2 py-1 pl-8 w-full" /><Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /></div>
        <button onClick={clearFilters} className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md text-sm"><FilterX size={16}/>Limpiar</button>
      </section>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={layout} strategy={verticalListSortingStrategy}>
          <div className="space-y-8">
            {layout
              .filter(id => widgetVisibility[id])
              .map(id => (
                <SortableItem key={id} id={id}>
                  {dashboardComponents[id]}
                </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>


      {isEditModalOpen && <EditModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} transaction={editingTransaction} onSave={handleSaveTransaction} categories={categorias} cuentas={cuentas} />}
      
      {user && (
        <>
          <Modal isOpen={isCategoriesModalOpen} onClose={() => setIsCategoriesModalOpen(false)} title="Gestionar Categorías">
            <GestionarCategorias user={user} onCategoriesChange={() => fetchData(user)} />
          </Modal>
          <Modal isOpen={isAccountsModalOpen} onClose={() => setIsAccountsModalOpen(false)} title="Gestionar Cuentas">
            <GestionarCuentas user={user} onAccountsChange={() => fetchData(user)} />
          </Modal>
          <Modal isOpen={isDeudasModalOpen} onClose={handleCloseDeudasModal} title="Gestionar Deudas">
            <GestionarDeudas user={user} onDeudasChange={() => fetchData(user)} initialData={newDeudaFromTx} onClose={handleCloseDeudasModal} />
          </Modal>
          <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="Personalizar Dashboard">
            <div className="grid grid-cols-2 gap-4">
              {DEFAULT_LAYOUT.map(id => (
                <label key={id} className="flex items-center gap-3 bg-gray-700 p-3 rounded-md">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded bg-gray-800 border-gray-600 text-indigo-500 focus:ring-indigo-600"
                    checked={widgetVisibility[id] ?? true}
                    onChange={(e) => handleVisibilityChange(id, e.target.checked)}
                  />
                  <span className="font-medium">{WIDGET_NAMES[id] || id}</span>
                </label>
              ))}
            </div>
          </Modal>
          <Modal isOpen={isMetaModalOpen} onClose={handleCloseMetaModal} title={editingMeta ? 'Editar Meta de Ahorro' : 'Crear Meta de Ahorro'}>
            <MetaAhorroForm onSubmit={handleSaveMeta} initialData={editingMeta} />
          </Modal>
          <DepositarEnMetaModal isOpen={isDepositModalOpen} onClose={handleCloseDepositModal} meta={depositingMeta} cuentas={cuentas} onDeposit={handleDepositToMeta} />
          <PagarCuotaModal isOpen={isPagarCuotaModalOpen} onClose={() => setIsPagarCuotaModalOpen(false)} deuda={payingDeuda} cuentas={cuentas} onConfirm={handleConfirmPagarCuota} />
        </>
      )}
    </div>
  );
}