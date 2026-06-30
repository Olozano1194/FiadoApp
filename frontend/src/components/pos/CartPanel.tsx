import { useSaleStore } from '../../stores/saleStore';
import { ProductImage } from '../ui/ProductImage';
// icons
import { RiDeleteBin6Line } from "react-icons/ri";
import { formatCurrency } from '../../utils/format';


function calcItemProfit(subtotal: number, cost: string | undefined, qty: number): number {
  return subtotal - (parseFloat(cost || '0') * qty);
}

function calcTotalProfit(cart: { product: { cost?: string }; quantity: number; subtotal: number }[]): number {
  return cart.reduce((sum, item) => sum + calcItemProfit(item.subtotal, item.product.cost, item.quantity), 0);
}


const CartPanel = () => {
  const cart = useSaleStore(s => s.cart);
  const removeFromCart = useSaleStore(s => s.removeFromCart);
  const updateQuantity = useSaleStore(s => s.updateQuantity);
  const clearCart = useSaleStore(s => s.clearCart);
  const getCartTotal = useSaleStore(s => s.getCartTotal);

  const cartTotal = getCartTotal();
  const totalProfit = calcTotalProfit(cart);
  const totalMargin = cartTotal > 0 ? (totalProfit / cartTotal) * 100 : 0;

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
              <ProductImage
                src={item.product.image}
                name={item.product.name}
                categoryName={item.product.category_name}
                className="w-full h-full"
                imgClassName="w-full h-full object-cover"
              />
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
                  {(() => {
                    const profit = calcItemProfit(item.subtotal, item.product.cost, item.quantity);
                    const margin = item.subtotal > 0 ? (profit / item.subtotal) * 100 : 0;
                    const isPositive = profit >= 0;
                    return (
                      <p className={`text-xs mt-0.5 ${isPositive ? 'text-green-600' : 'text-text-error'}`}>
                        {isPositive ? '💰 ' : '📉 '}{formatCurrency(profit)} <span className="opacity-70">({margin.toFixed(1)}%)</span>
                      </p>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-surface-border space-y-2">
        <div className="flex justify-between items-center text-lg">
          <span className="font-semibold text-text-primary">Total Venta</span>
          <span className="font-bold text-primary">{formatCurrency(cartTotal)}</span>
        </div>
        <div className="flex justify-between items-center text-base">
          <span className="text-on-surface-variant">Ganancia Total</span>
          <span className={`font-semibold ${totalProfit >= 0 ? 'text-green-600' : 'text-text-error'}`}>
            {formatCurrency(totalProfit)}
          </span>
        </div>
        {cartTotal > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-on-surface-variant">Margen</span>
            <span className={`font-medium ${totalProfit >= 0 ? 'text-green-600' : 'text-text-error'}`}>
              {totalMargin.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
export default CartPanel;