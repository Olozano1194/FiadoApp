import { useEffect, useState } from "react";
import { MdOutlineInventory } from "react-icons/md";
import { useProductStore } from "../../../../stores/productStore";
import StockOrderModal from "../../../ui/StockOrderModal";
import { ProductImage } from "../../../ui/ProductImage";

const INITIAL_SHOWN = 5;

const LowStockSection = () => {
  const { lowStockProducts, loading, fetchLowStock } = useProductStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  const visibleProducts = showAll
    ? lowStockProducts
    : lowStockProducts.slice(0, INITIAL_SHOWN);

  const hasMore = lowStockProducts.length > INITIAL_SHOWN;

  return (
    <section className="space-y-4 md:col-span-8 lg:col-span-4">
      <div className="flex items-center justify-between px-2">
        <h5 className="font-semibold text-primary text-lg md:text-xl">Stock Bajo</h5>
        <span className="text-text-error text-2xl"><MdOutlineInventory /></span>
      </div>
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-4 text-on-surface-variant">Cargando...</div>
        ) : lowStockProducts.length === 0 ? (
          <div className="text-center py-4 text-on-surface-variant">No hay productos con stock bajo</div>
        ) : (
          <>
            {visibleProducts.map((product) => (
              <article key={product.id} className="bg-white border border-outline-variant flex gap-4 group items-center p-4 rounded-xl transition-all hover:shadow-sm">
                <ProductImage
                  src={product.image}
                  name={product.name}
                  categoryName={product.category_name}
                  className="w-12 h-12 rounded-lg shrink-0"
                  imgClassName="w-full h-full object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold text-on-bg text-lg lg:text-xl">{product.name}</p>
                  <p className="font-mono text-on-surface-variant lg:text-lg">{product.category_name || 'Sin categoría'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-text-error text-lg lg:text-xl">{product.stock} uni.</p>
                  <p className="font-mono text-on-surface-variant lg:text-lg">min: {product.min_stock}</p>
                </div>
              </article>
            ))}
            {hasMore && (
              <button
                onClick={() => setShowAll(prev => !prev)}
                className="border border-dashed border-outline-variant cursor-pointer font-semibold py-2 rounded-xl text-primary transition-colors w-full hover:bg-surface-container-high"
              >
                {showAll
                  ? "Ver menos"
                  : `Ver todo (+${lowStockProducts.length - INITIAL_SHOWN} más)`}
              </button>
            )}
          </>
        )}
        <button
          onClick={() => setIsModalOpen(true)}
          className="border border-dashed border-outline-variant cursor-pointer font-semibold py-3 rounded-xl text-outline-variant transition-colors w-full hover:bg-surface-container-high"
        >
          Generar pedido de stock
        </button>
      </div>
      <StockOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
};

export default LowStockSection;
