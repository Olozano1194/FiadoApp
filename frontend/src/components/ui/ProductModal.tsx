import { useState } from "react";
import type { ProductFormData } from "../../models/product";
import type { Category } from "../../models/category";

interface ProductModalProps {
  initialData: ProductFormData;
  isEditing: boolean;
  categories: Category[];
  onSubmit: (data: ProductFormData) => Promise<void>;
  onClose: () => void;
}

const ProductModal = ({ initialData, isEditing, categories, onSubmit, onClose }: ProductModalProps) => {
  const [formData, setFormData ] = useState<ProductFormData>(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-lg max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-text-primary mb-4">
          {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm text-outline focus:ring-2 focus:ring-secondary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Descripción</label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm text-outline focus:ring-2 focus:ring-secondary"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Precio *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm text-outline focus:ring-2 focus:ring-secondary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Costo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost || ''}
                    onChange={e => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm text-outline focus:ring-2 focus:ring-secondary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Stock *</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm text-outline focus:ring-2 focus:ring-secondary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Stock Mínimo *</label>
                  <input
                    type="number"
                    required
                    value={formData.min_stock}
                    onChange={e => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                    className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm text-outline focus:ring-2 focus:ring-secondary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Categoría</label>
                <select
                  value={formData.category ?? ''}
                  onChange={e => setFormData({ ...formData, category: e.target.value ? Number(e.target.value) : null })}
                  className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm text-outline focus:ring-2 focus:ring-secondary"
                >
                  <option value="">Sin categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Código de Barras</label>
                <input
                  type="text"
                  value={formData.barcode || ''}
                  onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm text-outline focus:ring-2 focus:ring-secondary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">URL de Imagen</label>
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="url"
                      value={formData.image || ''}
                      onChange={e => setFormData({ ...formData, image: e.target.value })}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm text-outline focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                  {formData.image && (
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-outline-variant">
                      <img
                        src={formData.image}
                        alt="preview"
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  Pegá una URL de internet o dejalo vacío si no tenés imagen
                </p>
              </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-on-surface-variant font-semibold hover:opacity-80 cursor-pointer">
              Cancelar
            </button>
            <button type="submit" className="bg-primary text-on-surface px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity cursor-pointer">
              {isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ProductModal;