import { MdArrowBack, MdArrowForward } from "react-icons/md";
import { useReportStore } from "../../../stores/reportStore";

const DAY_LABELS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function getWeekRange(weekStart: string): string {
  const start = new Date(weekStart + "T12:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = MONTHS[start.getMonth()];
  const endMonth = MONTHS[end.getMonth()];

  if (start.getMonth() === end.getMonth()) {
    return `${startDay} - ${endDay} de ${startMonth}`;
  } else {
    return `${startDay} de ${startMonth} - ${endDay} de ${endMonth}`;
  }
}

const SkeletonBar = ({ height }: { height: number }) => (
  <div className="flex-1 flex flex-col justify-end items-center">
    <div className="w-full bg-surface-container-low rounded-t-lg" style={{ height: `${height}%` }} />
    <span className="h-3 bg-surface-container-low rounded w-6" />
  </div>
);

const WeeklyChartCard = () => {
  const { stats, selectedDay, setSelectedDay, navigateWeek, weekStart, loading, error, fetchStats } = useReportStore();

  const weekDays = stats?.week_days ?? [];
  const maxTotal = weekDays.length > 0
    ? Math.max(...weekDays.map((d) => d.total), 1)
    : 1;

  if (loading && !stats) {
    return (
      <div className="animate-pulse">
        <div className="flex gap-2 h-40 justify-between">
          {DAY_LABELS.map((_, i) => (
            <SkeletonBar key={i} height={(i + 1) * 12} />
          ))}
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-4 text-center">
        <p className="text-text-error font-semibold mb-2">Error al cargar los datos</p>
        <p className="text-on-surface-variant text-sm mb-4">{error}</p>
        <button
          onClick={() => fetchStats()}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!stats || weekDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-4 text-center">
        <p className="text-on-surface-variant font-semibold">Sin datos para esta semana</p>
        <p className="text-outline text-sm mt-1">No hay ventas registradas en este período</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={() => navigateWeek(-1)}
          className="p-2 rounded-lg hover:bg-surface-container transition-colors text-outline cursor-pointer"
        >
          <MdArrowBack className="text-xl" />
        </button>
        <span className="font-semibold text-on-surface-variant">
          {getWeekRange(weekStart)}
        </span>
        <button
          onClick={() => navigateWeek(1)}
          className="p-2 rounded-lg hover:bg-surface-container transition-colors text-outline cursor-pointer"
        >
          <MdArrowForward className="text-xl" />
        </button>
      </div>

      <div className="flex gap-1 sm:gap-2 h-48 justify-between mb-4">
        {weekDays.map((day) => {
          const isSelected = selectedDay?.date === day.date;
          const height = day.total > 0
            ? Math.max((day.total / maxTotal) * 100, 4)
            : 4;

          return (
            <div key={day.date} className="flex-1 flex flex-col justify-end items-center">
              <button
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`w-full rounded-t-lg transition-all cursor-pointer ${
                  isSelected
                    ? "bg-secondary"
                    : "bg-primary hover:opacity-80"
                }`}
                style={{ height: `${isSelected ? height + 8 : height}%` }}
                title={formatCurrency(day.total)}
              />
              <span className="font-medium text-xs text-on-surface-variant pt-0.5">
                {day.day_name}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-outline-variant pt-4 mt-2">
        {selectedDay ? (
          <div>
            <p className="font-semibold text-on-surface mb-2">
              📅 {formatFullDate(selectedDay.date)}
            </p>
            <div className="space-y-1 text-sm">
              <p className="text-on-surface-variant">
                💰 Total: <span className="font-bold text-on-surface">{formatCurrency(selectedDay.total)}</span>
              </p>
              <p className="text-on-surface-variant">
                📦 {selectedDay.count} {selectedDay.count === 1 ? "venta" : "ventas"}
              </p>
              {selectedDay.top_product ? (
                <p className="text-on-surface-variant">
                  🏆 Más vendido: <span className="truncate max-w-full inline-block align-bottom">{selectedDay.top_product.name}</span> ({selectedDay.top_product.units} unid. - {formatCurrency(selectedDay.top_product.revenue)})
                </p>
              ) : (
                <p className="text-outline italic">Sin ventas</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-outline italic">Seleccioná un día para ver detalles</p>
          </div>
        )}
      </div>
    </>
  );
};

export default WeeklyChartCard;
