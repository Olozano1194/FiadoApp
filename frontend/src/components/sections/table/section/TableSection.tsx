import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import Table from '../../../layout/Table';
import type { RecentSale } from '../../../../models/sale';
import { useSaleStore } from '../../../../stores/saleStore';

interface TotalRow {
  id: string;
  cliente: string;
  hora: string;
  estado: string;
  total: string;
}

const TablePage = () => {
  const { recentSales, loading, error, fetchRecentSales } = useSaleStore();

  useEffect(() => {
    fetchRecentSales();
  }, [fetchRecentSales]);

  const columnHelper = createColumnHelper<RecentSale | TotalRow>();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalAmount = recentSales.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);

  const totalRow: TotalRow = {
    id: 'total',
    cliente: 'Total',
    hora: '',
    estado: '',
    total: formatCurrency(totalAmount),
  };

  const columns = [
    columnHelper.display({
      id: 'index',
      header: 'N°',
      cell: info => info.row.index + 1,
    }),
    columnHelper.accessor('cliente' as keyof (RecentSale | TotalRow), {
      id: 'cliente',
      header: 'Cliente',
      cell: info => info.getValue() as string,
    }),
    columnHelper.accessor('hora' as keyof (RecentSale | TotalRow), {
      id: 'hora',
      header: 'Hora',
      cell: info => info.getValue() as string,
    }),
    columnHelper.accessor('estado' as keyof (RecentSale | TotalRow), {
      id: 'estado',
      header: 'Estado',
      cell: info => info.getValue() as string,
    }),
    columnHelper.accessor('total' as keyof (RecentSale | TotalRow), {
      id: 'total',
      header: 'Total',
      cell: info => {
        const value = info.getValue() as string;
        const priceNum = parseFloat(value) || 0;
        return (
          <div className="font-medium">
            {formatCurrency(priceNum)}
          </div>
        );
      },
    }),
  ] as ColumnDef<RecentSale | TotalRow>[];

  return (
    <main className="space-y-4 lg:col-span-8">
      <div className='flex items-center justify-between'>
        <h5 className='font-bold text-xl text-on-bg'>Ventas Recientes</h5>
        <Link to='/ventas/historial' className='font-semibold text-lg text-primary hover:underline'>Ver todas</Link>
      </div>
      {loading ? (
        <div className="text-center py-8 text-on-surface-variant animate-pulse">
          <div className="text-lg">Cargando ventas...</div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-text-error">
          <p className="text-lg font-medium">{error}</p>
          <button
            onClick={() => fetchRecentSales()}
            className="mt-2 text-primary hover:underline cursor-pointer"
          >
            Intentar de nuevo
          </button>
        </div>
      ) : recentSales.length === 0 ? (
        <div className="text-center py-8 text-on-surface-variant">
          <p className="text-lg">No hay ventas recientes</p>
          <p className="text-sm mt-1">Las ventas completadas aparecerán aquí</p>
        </div>
      ) : (
        <Table
          data={recentSales}
          columns={columns}
          totalRow={totalRow}
        />
      )}
    </main>
  );
};
export default TablePage;
