import { useEffect } from 'react';
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
  const { recentSales, loading, fetchRecentSales } = useSaleStore();

  useEffect(() => {
    fetchRecentSales();
  }, []);

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
    <main className="bg-surface-container-lowest w-full flex flex-col justify-center items-center gap-y-4 p-4 rounded-xl">
      {loading ? (
        <div className="text-center py-4 text-on-surface-variant">Cargando ventas...</div>
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
