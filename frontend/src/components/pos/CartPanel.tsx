import { useSaleStore } from '../../stores/saleStore';

const formatCurrency = (amount: number | string): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

const CartPanel = () => {
  const cart = useSaleStore(s => s.cart);
  const removeFromCart = useSaleStore(s => s.removeFromCart);
  const updateQuantity = useSaleStore(s => s.updateQuantity);
  const getCartTotal = useSaleStore(s => s.getCartTotal);

  if (cart.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-border p-6 h-full flex flex-col items-center justify-center">
        <svg className="w-16 h-16 text-surface-border mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
        <p className="text-on-surface-variant font-medium">Carrito vacío</p>
        <p className="text-on-surface-variant text-sm mt-1">Seleccioná productos para comenzar</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-border p-6 h-full flex flex-col">
      <h3 className="font-bold text-text-primary mb-4 pb-2 border-b border-surface-border flex justify-between">
        <span>Carrito</span>
        <span className="text-sm font-normal text-on-surface-variant">{cart.length} items</span>
      </h3>
      <div className="flex-1 overflow-y-auto space-y-3">
        {cart.map(item => (
          <div key={item.product.id} className="bg-surface rounded-lg p-3 border border-surface-border">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-text-primary text-sm truncate flex-1 pr-2">{item.product.name}</h4>
              <button
                onClick={() => removeFromCart(item.product.id)}
                className="text-error hover:text-error/80 transition-colors cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="w-7 h-7 flex items-center justify-center bg-surface-alt text-primary rounded-md hover:bg-surface-alt-hover transition-colors cursor-pointer text-sm font-bold"
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold text-text-primary text-sm">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.stock}
                  className="w-7 h-7 flex items-center justify-center bg-surface-alt text-primary rounded-md hover:bg-surface-alt-hover transition-colors cursor-pointer text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              <div className="text-right">
                <p className="text-xs text-on-surface-variant">{formatCurrency(item.product.price)} c/u</p>
                <p className="font-bold text-text-primary text-sm">{formatCurrency(item.subtotal)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-surface-border">
        <div className="flex justify-between items-center text-lg">
          <span className="font-semibold text-text-primary">Total</span>
          <span className="font-bold text-primary">{formatCurrency(getCartTotal())}</span>
        </div>
      </div>
    </div>
  );
};

export default CartPanel;
