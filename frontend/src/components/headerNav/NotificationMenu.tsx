import { useEffect, useState, useMemo } from "react";
import { RiInboxLine } from 'react-icons/ri';
import { IoMdNotifications } from "react-icons/io";
import { Link } from "react-router-dom";
import { Menu, MenuButton, MenuItems } from '@headlessui/react';
import { useProductStore } from "../../stores/productStore";
import { useClientStore } from "../../stores/clientStore";
import { useDashboardStore } from "../../stores/dashboardStore";

const currency = (value: string | number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(Number(value));

const NotificationMenu = () => {
  const { lowStockProducts, fetchLowStock } = useProductStore();
  const { debtors, fetchDebtors } = useClientStore();
  const { stats, fetchStats } = useDashboardStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      fetchLowStock(),
      fetchDebtors(),
      fetchStats(),
    ]).finally(() => setLoading(false));
  }, [fetchLowStock, fetchDebtors, fetchStats]);

  const totalNotifications = lowStockProducts.length + debtors.length;
  const hasNotifications = totalNotifications > 0 || stats;

  const totalDebt = useMemo(
    () => debtors.reduce((sum, d) => sum + Number(d.current_debt), 0),
    [debtors]
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8 gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-secondary border-t-transparent" />
          <span className="text-sm text-nav">Cargando notificaciones...</span>
        </div>
      );
    }

    if (!hasNotifications) {
      return (
        <div className="text-center py-4">
          <RiInboxLine className="mx-auto text-3xl text-nav/30 mb-2" />
          <p className="text-nav">No hay notificaciones</p>
        </div>
      );
    }

    return (
      <>
        {lowStockProducts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-4 py-2">
              <span className="text-lg">📦</span>
              <span className="font-medium text-sm text-title">Stock Bajo</span>
              <span className="ml-auto bg-text-error text-white text-[10px] font-bold rounded-full px-2 py-0.5">{lowStockProducts.length}</span>
            </div>
            {lowStockProducts.slice(0, 5).map(product => (
              <div key={product.id} className="flex items-center gap-3 px-4 py-1.5 text-sm">
                <span>⚠️</span>
                <span className="flex-1 text-title">{product.name}</span>
                <span className="text-nav text-xs">quedan {product.stock}</span>
              </div>
            ))}
            <Link
              to="/inventario"
              className="block px-4 py-2 text-sm text-secondary font-medium hover:underline"
            >
              Ver inventario →
            </Link>
          </div>
        )}

        {lowStockProducts.length > 0 && debtors.length > 0 && <hr className="my-3 border-nav/30" />}

        {debtors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-4 py-2">
              <span className="text-lg">💰</span>
              <span className="font-medium text-sm text-title">Fiados Pendientes</span>
              <span className="ml-auto bg-text-error text-white text-[10px] font-bold rounded-full px-2 py-0.5">{debtors.length}</span>
            </div>
            <div className="px-4 py-2 text-sm">
              <span className="text-nav">Total deuda: </span>
              <span className="font-medium text-title">{currency(totalDebt)}</span>
            </div>
            <Link
              to="/clientes"
              className="block px-4 py-2 text-sm text-secondary font-medium hover:underline"
            >
              Ver clientes →
            </Link>
          </div>
        )}

        {(lowStockProducts.length > 0 || debtors.length > 0) && stats && <hr className="my-3 border-nav/30" />}

        {stats && (
          <div>
            <div className="flex items-center gap-2 px-4 py-2">
              <span className="text-lg">📊</span>
              <span className="font-medium text-sm text-title">Resumen del Día</span>
            </div>
            <div className="px-4 py-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-nav">Ventas del día</span>
                <span className="font-medium text-title">{currency(stats.ventas_dia)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-nav">vs. ayer</span>
                <span className={`font-medium ${Number(stats.cambio_vs_ayer) >= 0 ? 'text-green-600' : 'text-text-error'}`}>
                  {stats.cambio_vs_ayer}
                </span>
              </div>
            </div>
            <Link
              to="/reportes"
              className="block px-4 py-2 text-sm text-secondary font-medium hover:underline"
            >
              Ver reportes →
            </Link>
          </div>
        )}
      </>
    );
  };

  return (
    <Menu>
      <MenuButton className="cursor-pointer text-nav relative hover:text-title p-2 transition-colors">
        <IoMdNotifications className="text-2xl text-surface-variant" />
        {totalNotifications > 0 && (
          <span className="absolute -top-1 -right-1 bg-text-error text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {totalNotifications > 9 ? '9+' : totalNotifications}
          </span>
        )}
      </MenuButton>
      <MenuItems anchor='bottom end' className='bg-surface-container-lowest mt-1 p-4 rounded-lg max-h-[70vh] overflow-y-auto w-96'>
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-title font-medium">Notificaciones</h1>
        </div>
        <hr className="my-3 border-nav/30" />
        {renderContent()}
        <hr className="my-3 border-nav/30" />
      </MenuItems>
    </Menu>
  );
};

export default NotificationMenu;
