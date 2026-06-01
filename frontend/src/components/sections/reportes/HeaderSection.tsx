import { useEffect } from "react";
import { useReportStore } from "../../../stores/reportStore";

const ReportSection = () => {
    const { period, setPeriod, fetchStats, fetchRecentActivity, loading } = useReportStore();

    useEffect(() => {
        fetchStats();
        fetchRecentActivity();
    }, [fetchStats, fetchRecentActivity]);

    const handlePeriodChange = (newPeriod: 'week' | 'month') => {
        setPeriod(newPeriod);
    };

    return (
        <section className="flex flex-col gap-4 justify-between md:flex-row md:items-end">
            <div>
                <h3 className="font-bold text-on-bg md:text-xl lg:text-2xl">¿Cómo va tu negocio hoy?</h3>
                <p className="text-on-surface-variant text-lg">
                    Aquí tienes un resumen de lo que ha pasado esta {period === 'week' ? 'semana' : 'mes'}.
                </p>
            </div>
            <div className="bg-white border border-outline-variant flex gap-2 items-center p-1 rounded-lg">
                <button
                    onClick={() => handlePeriodChange('week')}
                    disabled={loading}
                    className={`px-4 py-1.5 rounded-md transition-all ${
                        period === 'week'
                            ? 'bg-secondary-container font-lg text-secondary'
                            : 'text-on-surface-variant hover:bg-surface-container'
                    }`}
                >
                    Esta Semana
                </button>
                <button
                    onClick={() => handlePeriodChange('month')}
                    disabled={loading}
                    className={`px-4 py-1.5 rounded-md transition-all ${
                        period === 'month'
                            ? 'bg-secondary-container font-lg text-secondary'
                            : 'text-on-surface-variant hover:bg-surface-container'
                    }`}
                >
                    Mes Pasado
                </button>
            </div>
        </section>
    );
};
export default ReportSection;
