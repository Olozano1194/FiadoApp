import { useState } from "react";
import { useProductStore } from "../../stores/productStore";
import { IoClose } from "react-icons/io5";

interface StockOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const StockOrderModal = ({ isOpen, onClose }: StockOrderModalProps) => {
    const { lowStockProducts } = useProductStore();
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const getDefaultQty = (product: { stock: number; min_stock: number }) =>
        Math.max(product.min_stock * 2 - product.stock, 1);

    const generateOrderText = () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "2-digit",
        });
        const lines = [`📋 PEDIDO DE STOCK - ${dateStr}\n`];
        lowStockProducts.forEach((p) => {
            const input = document.getElementById(`qty-${p.id}`) as HTMLInputElement;
            const qty = input ? parseInt(input.value, 10) : getDefaultQty(p);
            lines.push(`${p.name}: ${qty} uni.`);
        });
        return lines.join("\n");
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generateOrderText());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback silencioso si el navegador no soporta clipboard API
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-lg max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-xl text-on-bg">Generar pedido de stock</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                    >
                        <IoClose className="text-2xl" />
                    </button>
                </div>

                {/* Lista de productos */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                    {lowStockProducts.length === 0 ? (
                        <p className="text-center text-on-surface-variant py-4">
                            No hay productos con stock bajo
                        </p>
                    ) : (
                        lowStockProducts.map((p) => {
                            const defaultQty = getDefaultQty(p);
                            return (
                                <div
                                    key={p.id}
                                    className="flex items-center gap-3 bg-gray-50 rounded-lg p-3"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-nav truncate">{p.name}</p>
                                        <p className="text-sm text-on-surface-variant">
                                            Stock: {p.stock} uni. · Mín: {p.min_stock} uni.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <label className="text-sm text-on-surface-variant">
                                            Pedir:
                                        </label>
                                        <input
                                            id={`qty-${p.id}`}
                                            type="number"
                                            min={1}
                                            defaultValue={defaultQty}
                                            className="w-20 text-center border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-nav focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Vista previa del texto + botón copiar */}
                {lowStockProducts.length > 0 && (
                    <>
                        <div className="mt-4 bg-gray-100 rounded-lg p-3 text-sm font-mono text-gray-600 max-h-32 overflow-y-auto">
                            <pre className="whitespace-pre-wrap">{generateOrderText()}</pre>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="mt-3 bg-primary text-on-surface font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                            {copied
                                ? "✅ ¡Copiado al portapapeles!"
                                : "📋 Copiar pedido al portapapeles"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default StockOrderModal;
