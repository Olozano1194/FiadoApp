import { useEffect, useDeferredValue } from 'react';
import { useProductStore } from "../../../stores/productStore";
import { useSaleStore } from '../../../stores/saleStore';
import { ProductImage } from '../../ui/ProductImage';

const formatCurrency = (amount: number | string): string => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

interface ProductsSectionProps {
    query: string;
    categoryId?: number | null;
}

const ProductsSection = ({ query, categoryId }: ProductsSectionProps) => {
    const { products, fetchProducts } = useProductStore();
    const addToCart = useSaleStore(s => s.addToCart);
    const cart = useSaleStore(s => s.cart);
    const deferredQuery = useDeferredValue(query);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const filtered = products.filter(p => {
        const matchesQuery = !deferredQuery ||
            p.name.toLowerCase().includes(deferredQuery.toLowerCase());
        const matchesCategory = !categoryId || p.category === categoryId;
        return matchesQuery && matchesCategory;
    });

    const getItemQtyInCart = (productId: number) => {
        const item = cart.find(i => i.product.id === productId);
        return item ? item.quantity : 0;
    };

    return (
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 content-start">
            {filtered.map(product => {
                const inCartQty = getItemQtyInCart(product.id);
                return (
                    <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="bg-surface-container-lowest rounded-xl border border-outline-variant flex flex-col gap-3 p-4 text-left hover:border-primary/40 hover:shadow-md transition-all cursor-pointer relative group active:scale-95"
                    >
                        {inCartQty > 0 && (
                            <span className="absolute -top-2 -right-2 bg-primary text-on-surface text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center z-10">
                                {inCartQty}
                            </span>
                        )}
                        {/* Stock */}
                        <div className={`absolute bg-secondary-container font-bold px-2 py-0.5 left-3 rounded-full top-3 text-[10px] uppercase z-10 ${product.stock <= product.min_stock ? 'text-text-error' : 'text-on-surface-variant'}`}>
                            Stock: {product.stock} uni.
                        </div>
                        <picture className='aspect-square bg-surface-container overflow-hidden rounded-lg w-full'>
                            <ProductImage
                                src={product.image}
                                name={product.name}
                                categoryName={product.category_name}
                                className="w-full h-full"
                                imgClassName="h-full object-cover w-full group-hover:scale-105 transition-transform"
                            />
                        </picture>
                        <div className='pt-2'>
                            <h3 className="font-semibold text-text-primary text-sm truncate pr-2">{product.name}</h3>
                            <p className="text-lg font-bold text-primary mt-1">{formatCurrency(product.price)}</p>
                        </div>
                    </button>
                );
            })}
            {filtered.length === 0 && (
                <div className="col-span-full text-center text-on-surface-variant py-8">
                    No se encontraron productos
                </div>
            )}
        </div>
    );
};
export default ProductsSection;