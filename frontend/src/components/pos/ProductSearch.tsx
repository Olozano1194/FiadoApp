import { useState } from 'react';
// Components
import CategoryFilterSection from '../sections/products/CategoryFilterSection';


const ProductSearch = () => {
  const [query, setQuery] = useState('');

  return (
    <section className="bg-surface-container-lowest/30 rounded-xl shadow-sm border border-surface-border overflow-y-auto p-6 h-full flex flex-col">
      <input
        type="text"
        placeholder="Buscar productos..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full bg-surface text-secondary border border-surface-border rounded-lg px-4 py-3 text-sm mb-4 focus:ring-2 focus:ring-secondary outline-none"
        autoFocus
      />
      <div className='flex items-center justify-between mb-6 md:flex-col md:gap-2 md:items-start'>
        <h2 className='font-bold text-xl text-on-bg lg:text-3xl'>Productos más vendidos</h2>
        <p className='font-medium text-on-surface-variant'>Selección rápida de inventario frecuente</p>
      </div>
      <CategoryFilterSection query={query} />
    </section>
  );
};
export default ProductSearch;