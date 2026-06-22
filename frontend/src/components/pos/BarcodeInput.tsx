import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { lookupByBarcode } from '../../api/products.api';
import { useSaleStore } from '../../stores/saleStore';
import { FiSearch } from 'react-icons/fi';

const BarcodeInput = () => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addToCart = useSaleStore(s => s.addToCart);

  const handleSubmit = async () => {
    const code = value.trim();
    if (!code) return;

    setLoading(true);
    try {
      const res = await lookupByBarcode(code);
      addToCart(res.data);
      toast.success(`${res.data.name} agregado al carrito`);
      setValue('');
    } catch {
      toast.error('Producto no encontrado');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // Auto-focus on mount and after any cart change
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Escanear código de barras..."
            disabled={loading}
            className="w-full bg-surface-container text-on-surface border border-outline-variant rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none placeholder:text-on-surface-variant/60 disabled:opacity-50"
          />
        </div>
        {loading && (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
};

export default BarcodeInput;