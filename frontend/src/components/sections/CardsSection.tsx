import { useEffect } from "react";
import { MdOutlinePayments, MdOutlineAssignmentLate, MdTrendingUp } from "react-icons/md";
import { CiWarning } from "react-icons/ci";
import { useDashboardStore } from "../../stores/dashboardStore";

const formatCurrency = (amount: number | string): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(typeof amount === "string" ? parseFloat(amount) : amount);
};

const CardsSection = () => {
  const { stats, loading, fetchStats } = useDashboardStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <section id="servicios" className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <article key={i} className="bg-white border border-outline-variant p-4 rounded-xl lg:p-6 animate-pulse">
            <div className="h-16 bg-surface-container-low rounded mb-2" />
          </article>
        ))}
      </section>
    );
  }

  const cambio = stats?.cambio_vs_ayer ? parseFloat(stats.cambio_vs_ayer) : 0;
  const cambioColor = cambio >= 0 ? "text-green-600" : "text-text-error";
  const cambioSigno = cambio >= 0 ? "+" : "";

  return (
    <section id="servicios" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <article className="bg-white border border-outline-variant p-4 rounded-xl transition-shadow hover:shadow-md lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="bg-secondary-container p-2 rounded-lg text-secondary text-xl lg:text-2xl">
            <MdOutlinePayments />
          </span>
          <span className={`font-medium text-xs lg:text-lg 2xl:text-xl ${cambioColor}`}>
            {cambioSigno}{cambio}% vs ayer
          </span>
        </div>
        <p className="font-medium text-on-surface-variant">Ventas del Día</p>
        <h4 className="font-black mt-1 text-title text-2xl">
          {stats ? formatCurrency(stats.ventas_dia) : "$0"}
        </h4>
      </article>
      <article className="bg-white border border-outline-variant p-4 rounded-xl transition-shadow hover:shadow-md lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="bg-primary-container p-2 rounded-lg text-primary text-xl lg:text-2xl">
            <MdTrendingUp />
          </span>
          <span className={`font-medium text-xs lg:text-lg 2xl:text-xl ${stats && stats.margen_dia >= 0 ? 'text-green-600' : 'text-text-error'}`}>
            {stats?.margen_dia != null && stats.margen_dia >= 0 ? `${stats.margen_dia.toFixed(1)}% margen` : '—'}
          </span>
        </div>
        <p className="font-medium text-on-surface-variant">Ganancia del Día</p>
        <h4 className="font-black mt-1 text-title text-2xl">
          {stats ? formatCurrency(stats.ganancia_dia) : "$0"}
        </h4>
        <p className="text-xs text-on-surface-variant mt-1">
          Gastos: {stats ? formatCurrency(stats.gastos_hoy) : "$0"}
        </p>
      </article>
      <article className="bg-white border border-outline-variant p-4 rounded-xl transition-shadow hover:shadow-md lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="bg-tertiary p-2 rounded-lg text-tertiary-container text-xl lg:text-2xl">
            <MdOutlineAssignmentLate />
          </span>
          <span className="font-medium text-text-error text-xs lg:text-lg 2xl:text-xl">
            {stats ? `${stats.clientes_fiado_pendiente} clientes pendientes` : "0 clientes pendientes"}
          </span>
        </div>
        <p className="font-medium text-on-surface-variant">Total Fiado Pendiente</p>
        <h4 className="font-black mt-1 text-title text-2xl">
          {stats ? formatCurrency(stats.fiado_pendiente_total) : "$0"}
        </h4>
      </article>
      <article className="bg-white border border-outline-variant p-4 rounded-xl transition-shadow hover:shadow-md lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="bg-error-container p-2 rounded-lg text-text-error text-xl lg:text-2xl">
            <CiWarning />
          </span>
          <span className="font-medium text-text-error text-xs lg:text-lg 2xl:text-xl">
            {stats ? `${stats.productos_stock_bajo} productos` : "0 productos"}
          </span>
        </div>
        <p className="font-medium text-on-surface-variant">Stock Bajo</p>
        <h4 className="font-black mt-1 text-title text-2xl">Atención Requerida</h4>
      </article>
    </section>
  );
};
export default CardsSection;