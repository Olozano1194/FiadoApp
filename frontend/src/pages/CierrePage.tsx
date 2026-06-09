import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useClosureStore } from "../stores/closureStore";
import { MdOutlineInfo } from "react-icons/md";

const formatCurrency = (amount: string | number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

const CierrePage = () => {
  const navigate = useNavigate();
  const { preview, loading, creating, error, isAlreadyClosed, fetchPreview, createClosure } =
    useClosureStore();

  const [countedCash, setCountedCash] = useState<string>("");

  const expectedCash = useMemo(
    () => Math.round(Number(preview?.expected_cash ?? 0)),
    [preview]
  );

  const countedValue = useMemo(() => {
    const raw = countedCash.replace(/[^0-9]/g, "");
    return raw ? parseInt(raw, 10) : 0;
  }, [countedCash]);

  const discrepancy = useMemo(
    () => countedValue - expectedCash,
    [countedValue, expectedCash]
  );

  const discrepancyColor = discrepancy === 0 ? "text-green-600" : "text-red-600";
  const discrepancyIcon = discrepancy === 0 ? "✅" : "⚠️";

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  const handleSubmit = async () => {
    try {
      await createClosure(countedValue);
      toast.success(isAlreadyClosed ? "Cierre actualizado exitosamente" : "Cierre registrado exitosamente");
      navigate("/");
    } catch {
      toast.error("Error de conexión");
    }
  };

  if (loading) {
    return (
      <section className="max-w-3xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-surface-container-low rounded-lg" />
          <div className="h-40 bg-surface-container-low rounded-xl" />
          <div className="h-12 bg-surface-container-low rounded-lg" />
          <div className="h-12 bg-surface-container-low rounded-lg" />
        </div>
      </section>
    );
  }

  if (error && !preview) {
    return (
      <section className="max-w-3xl mx-auto space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-semibold">{error}</p>
          <button
            onClick={() => fetchPreview()}
            className="mt-4 bg-primary text-on-surface px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-on-bg">Cierre de Caja</h2>
        <p className="text-sm text-on-surface-variant">
          {preview?.date
            ? new Date(preview.date + "T00:00:00").toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : ""}
        </p>
      </div>

      {isAlreadyClosed && preview?.last_closure && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-amber-600 text-lg mt-0.5">⚠️</span>
          <div>
            <p className="text-amber-800 font-semibold text-sm">
              Ya hay un cierre registrado hoy a las {new Date(preview.last_closure).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}. Al cerrar de nuevo se actualizará.
            </p>
          </div>
        </div>
      )}

      {/* Resumen del día */}
      <div className="bg-white border border-outline-variant rounded-xl p-6">
        <h3 className="text-lg font-bold text-on-bg mb-4">Resumen del Día</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SummaryRow label="💵 Ventas Efectivo" value={formatCurrency(preview?.cash_sales ?? 0)} />
          <SummaryRow label="💳 Ventas Crédito" value={formatCurrency(preview?.credit_sales ?? 0)} />
          <SummaryRow
            label="📊 Total Ventas"
            value={`${formatCurrency(preview?.total_sales ?? 0)} (${preview?.sales_count ?? 0} ventas)`}
          />
          <SummaryRow label="💰 Pagos Fiado Recibidos" value={formatCurrency(preview?.fiado_payments ?? 0)} />
          <SummaryRow
            label={
              <span className="flex items-center gap-1">
                🏷️ Gastos del día
                <span className="relative group">
                  <MdOutlineInfo className="text-outline cursor-help text-sm" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs font-normal text-white bg-gray-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    Gastos asumidos en efectivo
                  </span>
                </span>
              </span>
            }
            value={formatCurrency(preview?.expenses ?? 0)}
          />
          <SummaryRow label="📈 Ganancia Neta" value={formatCurrency(preview?.net_profit ?? 0)} />
        </div>

        <div className="mt-6 pt-4 border-t border-outline-variant">
          <div className="bg-primary/5 rounded-lg p-4 text-center">
            <p className="text-sm text-on-surface-variant font-medium">
              💵 Efectivo Esperado
            </p>
            <p className="text-3xl font-bold text-text-primary">
              {formatCurrency(expectedCash)}
            </p>
          </div>
        </div>
      </div>

      {/* Input de efectivo contado */}
      <div className="bg-white border border-outline-variant rounded-xl p-6">
        <h3 className="text-lg font-bold text-on-bg mb-4">Efectivo Contado</h3>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold">
            $
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={countedCash}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^0-9]/g, "");
              setCountedCash(cleaned);
            }}
            placeholder="0"
            className="w-full pl-8 pr-4 py-3 text-2xl font-bold text-on-bg bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-right"
          />
        </div>

        {/* Discrepancia en tiempo real */}
        <div className={`mt-4 p-4 rounded-lg font-semibold text-center text-lg ${discrepancyColor} ${discrepancy !== 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          {discrepancyIcon} Discrepancia:{" "}
          {discrepancy >= 0 ? "+" : ""}
          {formatCurrency(Math.abs(discrepancy))}
          {discrepancy === 0 ? " — Todo en orden" : discrepancy > 0 ? " — Sobrante" : " — Faltante"}
        </div>
      </div>

      {/* Botón de cierre */}
      <button
        onClick={handleSubmit}
        disabled={creating}
        className="w-full bg-primary text-on-surface py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {creating ? "Cerrando caja..." : isAlreadyClosed ? "Actualizar Cierre" : "Cerrar Caja"}
      </button>
    </section>
  );
};

interface SummaryRowProps {
  label: React.ReactNode;
  value: string;
}

const SummaryRow = ({ label, value }: SummaryRowProps) => (
  <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
    <span className="text-sm font-medium text-on-surface-variant">{label}</span>
    <span className="text-sm font-bold text-on-bg">{value}</span>
  </div>
);

export default CierrePage;
