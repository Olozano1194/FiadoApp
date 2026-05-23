import { useEffect } from "react";
import { MdOutlineInventory } from "react-icons/md";
import { useProductStore } from "../../../../stores/productStore";

const placeholderColors = [
  "bg-primary",
  "bg-tertiary",
  "bg-error-container",
  "bg-secondary",
  "bg-on-surface-variant",
];

const LowStockSection = () => {
  const { lowStockProducts, loading, fetchLowStock } = useProductStore();

  useEffect(() => {
    fetchLowStock();
  }, []);

  return (
    <section className="space-y-4 md:col-span-4">
      <div className="flex items-center justify-between px-2">
        <h5 className="font-semibold text-primary text-lg md:text-xl">Stock Bajo</h5>
        <span className="text-text-error text-xl"><MdOutlineInventory /></span>
      </div>
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-4 text-on-surface-variant">Cargando...</div>
        ) : lowStockProducts.length === 0 ? (
          <div className="text-center py-4 text-on-surface-variant">No hay productos con stock bajo</div>
        ) : (
          lowStockProducts.map((product, index) => (
            <article key={product.id} className="bg-white border border-outline-variant flex gap-4 group items-center p-4 rounded-xl transition-all hover:shadow-sm">
              <div className={`${placeholderColors[index % placeholderColors.length]} flex h-12 items-center justify-center overflow-hidden rounded-lg shrink-0 w-12`}>
                {product.image ? (
                  <img src={product.image} className="h-full object-cover w-full" alt={product.name} />
                ) : (
                  <span className="text-white font-bold text-lg">{product.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-on-bg text-lg lg:text-xl">{product.name}</p>
                <p className="font-mono text-on-surface-variant lg:text-lg">{product.category_name || 'Sin categoría'}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-text-error text-lg lg:text-xl">{product.stock} uni.</p>
                <p className="font-mono text-on-surface-variant lg:text-lg">min: {product.min_stock}</p>
              </div>
            </article>
          ))
        )}
        <button className="border border-dashed border-outline-variant cursor-pointer font-semibold py-3 rounded-xl text-outline-variant transition-colors w-full hover:bg-surface-container-high">
          Generar pedido de stock
        </button>
      </div>
    </section>
  );
};

export default LowStockSection;
