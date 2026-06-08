import { useNavigate } from "react-router-dom";
import { MdOutlinePayments, MdTrendingUp, MdTrendingDown, MdPendingActions, MdOutlineGroup, MdOutlineAccountBalanceWallet } from "react-icons/md";
import { FaRegStar } from "react-icons/fa";
import { useReportStore } from "../../../stores/reportStore";
import WeeklyChartCard from "./WeeklyChartCard";
import { ProductImage } from "../../ui/ProductImage";

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const MetricsSection = () => {
    const navigate = useNavigate();
    const { stats, loading } = useReportStore();

    if (loading && !stats) {
        return (
            <section className="grid grid-cols-1 gap-6 md:grid-cols-12 animate-pulse">
                <section className="bg-white border border-outline-variant flex flex-col p-6 rounded-xl md:col-span-7">
                    <div className="h-5 bg-surface-container-low rounded w-40 mb-4" />
                    <div className="h-10 bg-surface-container-low rounded w-64 mb-4" />
                    <div className="h-5 bg-surface-container-low rounded w-56" />
                </section>
                <section className="flex flex-col gap-6 md:col-span-5">
                    <div className="bg-white border border-outline-variant rounded-xl p-6">
                        <div className="h-5 bg-surface-container-low rounded w-44 mb-4" />
                        <div className="h-8 bg-surface-container-low rounded w-48 mb-2" />
                        <div className="h-5 bg-surface-container-low rounded w-36" />
                    </div>
                    <div className="bg-tertiary-fixed border border-outline-variant p-6 rounded-xl">
                        <div className="h-5 bg-surface-container-low rounded w-36 mb-4" />
                        <div className="h-10 bg-surface-container-low rounded w-48 mb-2" />
                        <div className="h-5 bg-surface-container-low rounded w-44" />
                    </div>
                </section>
            </section>
        );
    }

    const changeValue = stats?.summary?.change_vs_last_week ?? 0;
    const totalWeek = stats?.summary?.total_week ?? 0;

    // Determinar qué mostrar en la línea de tendencia
    const renderTrend = () => {
        // Caso 1: No hay ventas esta semana
        if (totalWeek === 0) {
            return (
                <div className="flex items-center mt-1 text-on-surface-variant">
                    <span className="text-sm italic">Sin ventas esta semana</span>
                </div>
            );
        }

        // Caso 2: Cambio muy grande (+500% o más) — mostrar como multiplicador
        if (Math.abs(changeValue) >= 500) {
            const factor = Math.round(changeValue / 100);
            const isUp = changeValue > 0;
            return (
                <div className={`flex items-center mt-1 ${isUp ? "text-green-600" : "text-text-error"}`}>
                    <span className="mr-1 text-[18px]">{isUp ? <MdTrendingUp /> : <MdTrendingDown />}</span>
                    <span>×{factor} {isUp ? "más" : "menos"} que la semana pasada</span>
                </div>
            );
        }

        // Caso 3: Cambio normal — mostrar porcentaje
        const changeColor = changeValue >= 0 ? "text-green-600" : "text-text-error";
        const changeSign = changeValue >= 0 ? "+" : "";
        const changeFormatted = changeValue.toFixed(1);
        return (
            <div className={`flex items-center mt-1 ${changeColor}`}>
                <span className="mr-1 text-[18px]">{changeValue >= 0 ? <MdTrendingUp /> : <MdTrendingDown />}</span>
                <span>{changeSign}{changeFormatted}% que la semana pasada</span>
            </div>
        );
    };

    return (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-12">
            {/* Left - Ventas */}
            <section className="bg-white border border-outline-variant flex flex-col p-6 rounded-xl md:col-span-7">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <p className="mb-1 text-lg text-outline tracking-wider uppercase">Ventas de la semana</p>
                        <h4 className="font-bold text-primary text-2xl">
                            {stats ? formatCurrency(stats.summary.total_week) : "$0"}
                        </h4>
                        {stats && renderTrend()}
                    </div>
                    <span className="bg-surface-container p-2 rounded-full text-outline text-xl">
                        <MdOutlinePayments />
                    </span>
                </div>

                {stats && <WeeklyChartCard />}

                {stats && (
                    <div className="mt-auto text-on-surface-variant space-y-1">
                        <p className="text-sm">Promedio diario: {formatCurrency(stats.summary.avg_per_day)}</p>
                    </div>
                )}

                {stats && stats.profit !== undefined && (
                    <div className="border-t border-outline-variant mt-4 pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-outline tracking-wider uppercase">Utilidad Bruta</p>
                                <h4 className="font-bold text-green-600 text-xl">
                                    {formatCurrency(stats.profit)}
                                </h4>
                                <p className="text-xs text-on-surface-variant">
                                    Margen: {stats.profit_margin.toFixed(1)}%
                                </p>
                            </div>
                            <span className="bg-green-50 p-2 rounded-full text-green-600 text-xl">
                                <MdOutlineAccountBalanceWallet />
                            </span>
                        </div>
                    </div>
                )}
            </section>

            {/* Right Column */}
            <section className="flex flex-col gap-6 md:col-span-5">
                {/* Producto estrella */}
                <div className="bg-white border border-outline-variant rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <p className="font-semibold text-lg text-outline tracking-wider uppercase">Tu Producto estrella</p>
                        <span className="text-tertiary-container text-2xl"><FaRegStar /></span>
                    </div>
                    {stats?.top_product ? (
                        <div className="flex gap-4 items-center">
                            <div className="bg-surface-container h-20 overflow-hidden rounded-lg relative w-20 flex-shrink-0">
                                {stats.top_product.image ? (
                                    <img
                                        src={stats.top_product.image}
                                        alt={stats.top_product.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const img = e.currentTarget;
                                            img.onerror = null;
                                            img.style.display = 'none';
                                            const parent = img.parentElement;
                                            if (parent) {
                                                const star = parent.querySelector('.fallback-star');
                                                if (star) star.classList.remove('hidden');
                                            }
                                        }}
                                    />
                                ) : (
                                    <ProductImage
                                        src={null}
                                        name={stats.top_product.name}
                                        className="w-full h-full"
                                    />
                                )}
                                <div className={`fallback-star flex items-center justify-center w-full h-full text-outline hidden`}>
                                    <FaRegStar className="text-3xl" />
                                </div>
                            </div>
                            <div>
                                <h5 className="font-bold text-lg text-on-bg md:text-xl">{stats.top_product.name}</h5>
                                <p className="font-semibold text-on-surface-variant">{stats.top_product.units_sold} unidades vendidas</p>
                                <p className="font-semibold mt-1 text-secondary">Generó {formatCurrency(stats.top_product.revenue)} esta semana</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-on-surface-variant">No hay datos suficientes</p>
                    )}
                </div>

                {/* Fiado */}
                <div className="bg-tertiary-fixed border border-outline-variant p-6 rounded-xl shadow-sm overflow-hidden relative text-tertiary-container">
                    <div className="relative z-10">
                        <p className="font-semibold mb-1 opacity-80 text-lg text-on-surface-variant tracking-wider uppercase">Dinero por cobrar (Fiados)</p>
                        <h4 className="font-bold text-2xl text-primary md:text-4xl">
                            {stats ? formatCurrency(stats.fiado_pending.total) : "$0"}
                        </h4>
                        <p className="font-medium flex items-center mt-2 text-on-surface-variant">
                            <span className="mr-2 text-[20px]"><MdOutlineGroup /></span>
                            {stats ? stats.fiado_pending.client_count : 0} clientes tienen cuentas pendientes
                        </p>
                        <button
                            onClick={() => navigate('/clientes')}
                            className="bg-tertiary-container cursor-pointer font-semibold mt-4 px-4 py-2 rounded-lg text-tertiary-fixed text-lg transition-opacity hover:opacity-90"
                        >
                            Ver quién me debe
                        </button>
                    </div>
                    <span className="absolute -bottom-4 -right-4 opacity-10 rotate-12 text-[120px] text-tertiary"><MdPendingActions /></span>
                </div>
            </section>
        </section>
    );
};
export default MetricsSection;
