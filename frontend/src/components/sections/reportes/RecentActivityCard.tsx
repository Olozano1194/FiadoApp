import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { MdOutlineShoppingCart, MdOutlinePayments } from 'react-icons/md';
import Table from '../../layout/Table';
import type { RecentActivity } from '../../../models/report';
import { useReportStore } from '../../../stores/reportStore';

const TablePage = () => {
  const { recentActivity, loading, error, fetchRecentActivity } = useReportStore();

  useEffect(() => {
    fetchRecentActivity();
  }, [fetchRecentActivity]);

  const columnHelper = createColumnHelper<RecentActivity>();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statusBadge = (status: string) => {
    const isComplete = status === 'Completado' || status === 'Registrado';
    const isPending = status === 'Pendiente';
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

    if (isComplete) {
      return (
        <span className={`${base} bg-green-100 text-green-800`}>
          {status}
        </span>
      );
    }

    if (isPending) {
      return (
        <span className={`${base} bg-amber-100 text-amber-800`}>
          {status}
        </span>
      );
    }

    return (
      <span className={`${base} bg-red-100 text-red-800`}>
        {status}
      </span>
    );
  };

  const conceptIcon = (concept: string) => {
    const isSale = concept === 'Venta';
    const Icon = isSale ? MdOutlineShoppingCart : MdOutlinePayments;

    return (
      <div className="flex items-center gap-2">
        <span className="text-lg text-outline">
          <Icon />
        </span>
        <span>{concept}</span>
      </div>
    );
  };

  const columns = [
    columnHelper.display({
      id: 'index',
      header: 'N°',
      cell: info => info.row.index + 1,
    }),
    columnHelper.accessor('concept', {
      id: 'concepto',
      header: 'Concepto',
      cell: info => conceptIcon(info.getValue()),
    }),
    columnHelper.accessor('client_name', {
      id: 'cliente',
      header: 'Cliente',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('amount', {
      id: 'monto',
      header: 'Monto',
      cell: info => (
        <div className="font-medium">
          {formatCurrency(info.getValue())}
        </div>
      ),
    }),
    columnHelper.accessor('status', {
      id: 'estado',
      header: 'Estado',
      cell: info => statusBadge(info.getValue()),
    }),
  ] as ColumnDef<RecentActivity>[];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="font-bold text-xl text-on-bg">Últimos Movimientos</h5>
        <Link
          to="/ventas/historial"
          className="font-semibold text-lg text-primary hover:underline"
        >
          Ver todo el historial
        </Link>
      </div>
      {loading ? (
        <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-surface-container-highest rounded w-1/4" />
            <div className="h-4 bg-surface-container-highest rounded w-3/4" />
            <div className="h-4 bg-surface-container-highest rounded w-1/2" />
            <div className="h-4 bg-surface-container-highest rounded w-2/3" />
            <div className="h-4 bg-surface-container-highest rounded w-1/3" />
          </div>
        </div>
      ) : error ? (
        <div className="bg-white border border-outline-variant rounded-xl p-6 text-center py-8 text-text-error">
          <p className="text-lg font-medium">{error}</p>
          <button
            onClick={() => fetchRecentActivity()}
            className="mt-2 text-primary hover:underline cursor-pointer"
          >
            Intentar de nuevo
          </button>
        </div>
      ) : recentActivity.length === 0 ? (
        <div className="bg-white border border-outline-variant rounded-xl p-6 text-center py-8 text-on-surface-variant">
          <p className="text-lg">No hay movimientos recientes</p>
          <p className="text-sm mt-1">Los movimientos aparecerán aquí cuando se registren</p>
        </div>
      ) : (
        <Table
          data={recentActivity}
          columns={columns}
        />
      )}
    </section>
  );
};

export default TablePage;
