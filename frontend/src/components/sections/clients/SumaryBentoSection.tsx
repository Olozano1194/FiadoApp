import { useEffect, useState } from "react";
import { IoIosTrendingUp } from "react-icons/io";
import { GoCheckCircle } from "react-icons/go";
import { useClientStore } from "../../../stores/clientStore";
import { getTodayPayments } from "../../../api/fiado-payments.api";
import { formatCurrency } from '../../../utils/format';


const SkeletonCard = () => (
  <article className="bg-white border border-outline-variant flex flex-col justify-between p-6 rounded-xl shadow-sm animate-pulse">
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-32" />
      <div className="h-8 bg-gray-200 rounded w-28" />
    </div>
    <div className="h-6 bg-gray-200 rounded w-24 mt-4" />
  </article>
);

const SumaryBentoSection = () => {
  const { clients, loading } = useClientStore();
  const [todayTotal, setTodayTotal] = useState("0.00");
  const [todayCount, setTodayCount] = useState(0);
  const [todayLoading, setTodayLoading] = useState(true);

  useEffect(() => {
    getTodayPayments()
      .then(res => {
        setTodayTotal(res.data.total);
        setTodayCount(res.data.count);
      })
      .catch(() => {})
      .finally(() => setTodayLoading(false));
  }, []);

  const totalDebt = clients.reduce(
    (sum, client) => sum + parseFloat(client.current_debt || "0"),
    0,
  );
  const debtorsCount = clients.filter(
    (client) => parseFloat(client.current_debt) > 0,
  ).length;

  if (loading) {
    return (
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <article className="bg-white border border-outline-variant flex flex-col justify-between p-6 rounded-xl shadow-sm">
        <div>
          <p className="font-bold text-lg text-outline tracking-wider uppercase">
            Total por cobrar
          </p>
          <h3 className="font-semibold mt-2 text-2xl text-text-error">
            {formatCurrency(totalDebt)}
          </h3>
        </div>
        <div className="bg-error-container/20 flex items-center px-2 py-1 rounded-md self-start text-text-error">
          <span className="text-[16px] mr-1">
            <IoIosTrendingUp />
          </span>
          <span className="font-medium text-sm">
            {clients.length} {clients.length === 1 ? "cliente" : "clientes"}{" "}
            registrado{clients.length !== 1 ? "s" : ""}
          </span>
        </div>
      </article>
      <article className="bg-white border border-outline-variant flex flex-col justify-between p-6 rounded-xl shadow-sm">
        <div>
          <p className="font-bold text-lg text-outline tracking-wider uppercase">
            Clientes con deuda
          </p>
          <h3 className="font-semibold mt-2 text-2xl text-primary">
            {debtorsCount}
          </h3>
        </div>
        <p className="flex font-medium items-center px-2 py-1 rounded-md self-start text-on-surface-variant text-medium">
          {debtorsCount > 0
            ? `${debtorsCount} ${debtorsCount === 1 ? "cliente tiene" : "clientes tienen"} deuda pendiente`
            : "Ningún cliente con deuda"}
        </p>
      </article>
      <article className="bg-secondary-container border border-outline-variant flex flex-col justify-between p-6 rounded-xl shadow-sm">
        <div>
          <p className="font-bold text-lg text-outline tracking-wider uppercase">
            Cobros de hoy
          </p>
          <h3 className="font-semibold mt-2 text-2xl text-primary">
            {todayLoading ? "..." : formatCurrency(parseFloat(todayTotal))}
          </h3>
        </div>
        <div className="bg-white/40 flex items-center mt-4 px-2 py-1 rounded-md self-start text-secondary-container">
          <span className="text-[16px] mr-1 text-secondary">
            <GoCheckCircle />
          </span>
          <span className="font-medium text-sm text-secondary">
            {todayCount === 0
              ? "Sin cobros registrados hoy"
              : `${todayCount} ${todayCount === 1 ? "pago" : "pagos"} registrado${todayCount !== 1 ? "s" : ""} hoy`}
          </span>
        </div>
      </article>
    </section>
  );
};
export default SumaryBentoSection;