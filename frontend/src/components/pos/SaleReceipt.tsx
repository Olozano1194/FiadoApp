import { useSaleStore } from '../../stores/saleStore';
import { formatCurrency } from '../../utils/format';

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const SaleReceipt = () => {
  const lastSale = useSaleStore(s => s.lastSale);
  const clearCart = useSaleStore(s => s.clearCart);

  if (!lastSale) return null;

  const handleNewSale = () => {
    clearCart();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20" onClick={handleNewSale}>
      <div
        className="bg-surface-container-lowest rounded-xl p-6 w-full max-w-md mx-4 shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Venta Completada</h2>
          <p className="text-sm text-on-surface-variant mt-1">#{lastSale.id} • {formatDate(lastSale.created_at)}</p>
        </div>

        <div className="bg-surface rounded-lg p-4 mb-4 space-y-2 border border-surface-border">
          {lastSale.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-text-primary flex-1">
                {item.product_name || `Producto #${item.product}`}
                <span className="text-on-surface-variant ml-1">x{item.quantity}</span>
              </span>
              <span className="font-medium text-text-primary">{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mb-4 pb-4 border-b border-surface-border">
          <span className="font-bold text-text-primary">Total</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(lastSale.total)}</span>
        </div>

        {lastSale.payment_method === 'CASH' && lastSale.cash_received && (
          <>
            <div className="flex justify-between text-sm text-on-surface-variant mb-2">
              <span>Monto recibido</span>
              <span className="font-medium text-text-primary">{formatCurrency(lastSale.cash_received)}</span>
            </div>
            <div className="flex justify-between text-sm text-on-surface-variant mb-2">
              <span>Cambio</span>
              <span className="font-medium text-success">{formatCurrency(lastSale.change_given ?? 0)}</span>
            </div>
          </>
        )}

        <div className="flex justify-between text-sm text-on-surface-variant mb-6">
          <span>Método de pago</span>
          <span className="font-medium text-text-primary">
            {lastSale.payment_method === 'CASH' ? 'Efectivo' : 'Crédito'}
          </span>
        </div>

        <button
          onClick={handleNewSale}
          className="w-full bg-primary text-on-surface py-3 rounded-lg font-bold text-base hover:opacity-90 transition-opacity cursor-pointer"
        >
          Nueva Venta
        </button>
      </div>
    </div>
  );
};
export default SaleReceipt;
