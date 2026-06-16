import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getSalesHistory } from '../api/sales.api';
import type { SaleHistoryItem } from '../models/sale';
import { PaginationSection } from '../components/sections/table/section/PaginationSection';
import { formatCurrency } from '../utils/format';

const PAGE_SIZE = 15;

const SalesHistoryPage = () => {
  const [sales, setSales] = useState<SaleHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const fetchHistory = async () => {
      try {
        const res = await getSalesHistory(page, PAGE_SIZE);
        if (cancelledRef.current) return;
        setSales(res.data.results);
        setTotalPages(Math.max(1, Math.ceil(res.data.count / PAGE_SIZE)));
        setError(null);
      } catch {
        if (cancelledRef.current) return;
        setError('Error al cargar el historial de ventas');
      } finally {
        if (!cancelledRef.current) {
          setLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      cancelledRef.current = true;
    };
  }, [page]);

  const estadoBadge = (status: string) => {
    const isComplete = status === 'Completado' || status === 'Registrado';
    const isPending = status === 'Pendiente';
    const isCancelled = status === 'Anulado' || status === 'Cancelado';
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    if (isComplete) return <span className={`${base} bg-green-100 text-green-800`}>{status}</span>;
    if (isPending) return <span className={`${base} bg-yellow-100 text-yellow-800`}>{status}</span>;
    if (isCancelled) return <span className={`${base} bg-red-100 text-red-800`}>{status}</span>;
    return <span className={`${base} bg-gray-100 text-gray-800`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-bg">Historial de Ventas</h2>
          <p className="text-on-surface-variant text-sm">Todas las ventas registradas en el sistema</p>
        </div>
        <Link
          to="/ventas"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-surface rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
        >
          + Nueva Venta
        </Link>
      </div>

      {/* Tabla */}
      <section className="border border-outline-variant/10 rounded-xl shadow-sm overflow-hidden bg-surface-container-lowest">
        <div className="overflow-x-auto">
          <table className="border-collapse text-left w-full">
            <thead>
              <tr className="bg-surface-container-lowest/50">
                {['N°', 'Cliente', 'Fecha', 'Hora', 'Método de Pago', 'Estado', 'Total'].map((header) => (
                  <th
                    key={header}
                    className="border-b border-outline-variant/10 font-black px-3 py-4 text-[11px] text-secondary tracking-widest uppercase"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-sm lg:text-base">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-on-surface-variant animate-pulse">
                    Cargando ventas...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <p className="text-text-error font-medium">{error}</p>
                    <button
                      onClick={() => { setPage(1); }}
                      className="mt-2 text-primary hover:underline cursor-pointer"
                    >
                      Intentar de nuevo
                    </button>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-on-surface-variant">
                    <p className="text-lg">No hay ventas registradas</p>
                    <p className="text-sm mt-1">
                      Las ventas aparecerán aquí una vez que realices tu primera venta
                    </p>
                  </td>
                </tr>
              ) : (
                sales.map((sale, index) => (
                  <tr key={sale.id} className="group transition-colors hover:bg-nav/5">
                    <td className="px-3 py-4 text-outline">{(page - 1) * PAGE_SIZE + index + 1}</td>
                    <td className="px-3 py-4 text-outline font-medium">{sale.cliente}</td>
                    <td className="px-3 py-4 text-outline">{sale.fecha}</td>
                    <td className="px-3 py-4 text-outline">{sale.hora}</td>
                    <td className="px-3 py-4 text-outline">{sale.metodo_pago}</td>
                    <td className="px-3 py-4">{estadoBadge(sale.estado)}</td>
                    <td className="px-3 py-4 text-outline font-semibold">
                      {formatCurrency(parseFloat(sale.total) || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Paginación server-side */}
      {!loading && !error && totalPages > 1 && (
        <PaginationSection
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
        />
      )}
    </div>
  );
};
export default SalesHistoryPage;