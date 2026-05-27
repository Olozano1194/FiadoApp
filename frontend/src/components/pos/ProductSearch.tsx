import { useState, useEffect, useRef } from 'react';
import { useProductStore } from '../../stores/productStore';
import { useSaleStore } from '../../stores/saleStore';


const formatCurrency = (amount: number | string): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

const ProductSearch = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>| undefined>(undefined);
  const { products, fetchProducts } = useProductStore();
  const addToCart = useSaleStore(s => s.addToCart);
  const cart = useSaleStore(s => s.cart);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const filtered = debouncedQuery
    ? products.filter(p =>
        p.name.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : products;

  const getItemQtyInCart = (productId: number) => {
    const item = cart.find(i => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  if (products.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-border p-6 h-full flex flex-col">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-surface text-on-surface border border-surface-border rounded-lg px-4 py-3 text-sm mb-4 focus:ring-2 focus:ring-secondary outline-none"
          autoFocus
        />
        <div className="flex-1 flex items-center justify-center text-on-surface-variant">
          Cargando productos...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-border p-6 h-full flex flex-col">
      <input
        type="text"
        placeholder="Buscar productos..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full bg-surface text-on-surface border border-surface-border rounded-lg px-4 py-3 text-sm mb-4 focus:ring-2 focus:ring-secondary outline-none"
        autoFocus
      />
      <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 content-start">
        {filtered.map(product => {
          const inCartQty = getItemQtyInCart(product.id);
          return (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-surface rounded-xl border border-surface-border p-4 text-left hover:border-primary/40 hover:shadow-md transition-all cursor-pointer relative group"
            >
              {inCartQty > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-on-surface text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                  {inCartQty}
                </span>
              )}
              <h3 className="font-semibold text-text-primary text-sm truncate pr-2">{product.name}</h3>
              <p className="text-lg font-bold text-primary mt-1">{formatCurrency(product.price)}</p>
              <p className={`text-xs mt-1 ${product.stock <= product.min_stock ? 'text-error' : 'text-on-surface-variant'}`}>
                Stock: {product.stock} uni.
              </p>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-on-surface-variant py-8">
            No se encontraron productos
          </div>
        )}
      </div>
    </div>
  );
};
export default ProductSearch;