import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import Table from '../components/layout/Table';
import ActionButtons from '../components/sections/table/ActionButton';
import { useProductStore } from '../stores/productStore';
import type { Product } from '../models/product';
import type { ProductFormData } from '../models/product';
import { toast } from 'react-hot-toast';
import * as categoriesApi from '../api/categories.api';
import type { Category } from '../models/category';

const ProductsPage = () => {
  const { products, loading, fetchProducts, createProduct, updateProduct, deleteProduct } = useProductStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    cost: '',
    stock: 0,
    min_stock: 0,
    category: null,
    barcode: '',
  });

  const editId = searchParams.get('edit');
  const isCreate = searchParams.has('create');
  const editingProduct = editId ? products.find(p => p.id === Number(editId)) : null;
  const isModalOpen = !!(editId || isCreate);

  useEffect(() => {
    fetchProducts();
    categoriesApi.getCategories().then(res => setCategories(res.data));
  }, []);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        description: editingProduct.description || '',
        price: editingProduct.price,
        cost: editingProduct.cost || '',
        stock: editingProduct.stock,
        min_stock: editingProduct.min_stock,
        category: editingProduct.category ?? null,
        barcode: editingProduct.barcode || '',
      });
    } else if (isCreate) {
      setFormData({
        name: '',
        description: '',
        price: '',
        cost: '',
        stock: 0,
        min_stock: 0,
        category: null,
        barcode: '',
      });
    }
  }, [editId, isCreate, editingProduct]);

  const closeModal = () => setSearchParams({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        toast.success('Producto Actualizado', {
          duration: 3000,
          position: 'bottom-right',
          style: { background: '#4b5563', color: '#fff', padding: '16px', borderRadius: '8px' },
        });
      } else {
        await createProduct(formData);
        toast.success('Producto Creado', {
          duration: 3000,
          position: 'bottom-right',
          style: { background: '#4b5563', color: '#fff', padding: '16px', borderRadius: '8px' },
        });
      }
      closeModal();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteProduct(id);
  };

  const formatCurrency = (amount: number | string): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const columnHelper = createColumnHelper<Product>();

  const columns = [
    columnHelper.display({
      id: 'index',
      header: 'N°',
      cell: info => info.row.index + 1,
    }),
    columnHelper.accessor('name', {
      header: 'Nombre',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('category_name', {
      id: 'category_name',
      header: 'Categoría',
      cell: info => info.getValue() || '—',
    }),
    columnHelper.accessor('price', {
      header: 'Precio',
      cell: info => (
        <div className="font-medium">
          {formatCurrency(info.getValue())}
        </div>
      ),
    }),
    columnHelper.accessor('stock', {
      header: 'Stock',
      cell: info => (
        <span className={info.getValue() <= info.row.original.min_stock ? 'text-text-error font-bold' : ''}>
          {info.getValue()} uni.
        </span>
      ),
    }),
    columnHelper.accessor('min_stock', {
      header: 'Stock Mín',
      cell: info => <span className="text-on-surface-variant">{info.getValue()} uni.</span>,
    }),
    columnHelper.display({
      id: 'acciones',
      header: 'Acciones',
      cell: info => (
        <ActionButtons
          id={info.row.original.id}
          editPath={`?edit=${info.row.original.id}`}
          onDelete={handleDelete}
          confirmMessage="¿Estás seguro de eliminar este producto?"
        />
      ),
    }),
  ] as ColumnDef<Product>[];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-primary">Inventario</h1>
        <button
          onClick={() => setSearchParams({ create: 'true' })}
          className="bg-primary text-on-surface px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity cursor-pointer"
        >
          + Nuevo Producto
        </button>
      </div>

      {loading ? (
        <div className="bg-surface-container-lowest w-full flex flex-col justify-center items-center p-8 rounded-xl">
          <p className="text-on-surface-variant">Cargando productos...</p>
        </div>
      ) : (
        <Table data={products} columns={columns} />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-lg max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-text-primary mb-4">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Descripción</label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary"
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
                    className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Costo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost || ''}
                    onChange={e => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary"
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
                    className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Stock Mínimo *</label>
                  <input
                    type="number"
                    required
                    value={formData.min_stock}
                    onChange={e => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                    className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Categoría</label>
                <select
                  value={formData.category ?? ''}
                  onChange={e => setFormData({ ...formData, category: e.target.value ? Number(e.target.value) : null })}
                  className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary"
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
                  className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-on-surface-variant font-semibold hover:opacity-80 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary text-on-surface px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
