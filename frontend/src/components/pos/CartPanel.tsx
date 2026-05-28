import { useSaleStore } from '../../stores/saleStore';
// icons
import { RiDeleteBin6Line } from "react-icons/ri";

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
  const clearCart = useSaleStore(s => s.clearCart);
  const getCartTotal = useSaleStore(s => s.getCartTotal);

  if (cart.length === 0) {
    return (
      <aside className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-border p-6 h-full flex flex-col items-center justify-center">        
        <svg className="w-16 h-16 text-surface-container-high mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
        <p className="text-on-surface-variant font-medium">Carrito vacío</p>
        <p className="text-on-surface-variant text-sm mt-1">Seleccioná productos para comenzar</p>
      </aside>
    );
  }

  return (
    <aside className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-border p-6 h-full flex flex-col">
      <div className='bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between'>
          <div className='flex gap-2 items-center'>
            <svg className="w-8 h-8 text-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <h2 className='font-bold text-lg text-on-bg md:text-xl'>Carrito Actual</h2>
          </div>
          <span className="text-sm font-normal text-on-surface-variant">{cart.length} items</span>
          <button
            onClick={clearCart}
            className='cursor-pointer font-medium flex gap-1 items-center p-1 px-2 rounded-lg transition-colors text-text-error text-lg hover:bg-error-container/20'
          >
            <span className='text-[18px]'><RiDeleteBin6Line /></span>
            Vaciar
          </button>
      </div>      
      <div className="flex-1 overflow-y-auto space-y-3">
        {cart.map(item => (
          <div key={item.product.id} className="bg-surface rounded-lg p-3 border border-surface-border flex gap-3">
            {/* Imagen del producto */}
            <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-surface-container">
              {item.product.image ? (
                <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/10 to-secondary/10">
                  <svg className="w-6 h-6 text-on-surface-variant/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              )}
            </div>
            {/* Info del producto */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <h4 className="font-medium text-text-primary text-sm truncate flex-1">{item.product.name}</h4>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="shrink-0 p-1.5 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors cursor-pointer"
                    title="Eliminar producto"
                  >
                    <RiDeleteBin6Line className="w-4 h-4 text-text-error" />
                  </button>
              </div>
              <div className="flex items-center justify-between gap-2 mt-2">
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
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-surface-border">
        <div className="flex justify-between items-center text-lg">
          <span className="font-semibold text-text-primary">Total</span>
          <span className="font-bold text-primary">{formatCurrency(getCartTotal())}</span>
        </div>
      </div>
    </aside>
  );
};
export default CartPanel;