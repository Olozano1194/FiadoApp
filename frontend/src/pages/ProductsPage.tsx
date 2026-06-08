import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import Table from '../components/layout/Table';
import ActionButtons from '../components/sections/table/ActionButton';
import { ProductImage } from '../components/ui/ProductImage';
import { useProductStore } from '../stores/productStore';
import type { Product } from '../models/product';
import type { ProductFormData } from '../models/product';
import { toast } from 'react-hot-toast';
import * as categoriesApi from '../api/categories.api';
import type { Category } from '../models/category';
// Modal
import ProductModal from '../components/ui/ProductModal';

const emptyForm: ProductFormData = {
  name: '',
  description: '',
  price: '',
  cost: '',
  stock: 0,
  min_stock: 0,
  category: null,
  barcode: '',
  image: '',
};

const ProductsPage = () => {
  const { products, loading, fetchProducts, createProduct, updateProduct, deleteProduct } = useProductStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]); 

  const editId = searchParams.get('edit');
  const isCreate = searchParams.has('create');
  const editingProduct = useMemo(() => {
    return editId
      ? products.find((p) => p.id === Number(editId))
      : null;
  }, [products, editId]);
  const isModalOpen = !!(editId || isCreate);

  useEffect(() => {
    fetchProducts();
    categoriesApi.getCategories().then(res => setCategories(res.data));
  }, [fetchProducts]);

  const closeModal = () => setSearchParams({});

  const handleSubmit = async (data: ProductFormData) => {
    try {
      if (editingProduct) {
        // ── PATCH: solo mandamos los campos que cambiaron ──
        const changedData: Partial<ProductFormData> = {};

        const keysToCheck: (keyof ProductFormData)[] = [
          'name', 'description', 'price', 'cost', 'stock',
          'min_stock', 'category', 'barcode', 'image',
        ];

        for (const key of keysToCheck) {
          const originalVal = (editingProduct as any)[key];
          const newVal = data[key];

          // Si el usuario seleccionó una imagen nueva, siempre mandarla
          if (key === 'image' && newVal instanceof File) {
            changedData.image = newVal;
            continue;
          }

          // Convertir ambos a string para comparar (normaliza null / undefined)
          const origStr = originalVal == null ? '' : String(originalVal);
          const newStr = newVal == null ? '' : String(newVal);

          if (origStr !== newStr) {
            (changedData as any)[key] = newVal;
          }
        }

        // Si hay cambios, mandamos el PATCH parcial
        if (Object.keys(changedData).length > 0) {
          await updateProduct(editingProduct.id, changedData);
        }

        toast.success('Producto Actualizado', {
          duration: 3000,
          position: 'bottom-right',
          style: { background: '#4b5563', color: '#fff', padding: '16px', borderRadius: '8px' },
        });
      } else {
        await createProduct(data);
        toast.success('Producto Creado', {
          duration: 3000,
          position: 'bottom-right',
          style: { background: '#4b5563', color: '#fff', padding: '16px', borderRadius: '8px' },
        });
      }
      closeModal();
    } catch (error: any) {
      // ── Mejor manejo de errores ──
      let detail = 'Error al guardar';

      if (error?.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          // Django devuelve HTML en errores 500 — mostramos algo legible
          detail = data.includes('<!DOCTYPE')
            ? `Error del servidor (${error.response.status || 500})`
            : data;
        } else {
          detail = data.detail
            || Object.values(data).flat().join(', ');
        }
      } else if (error?.message) {
        detail = error.message;
      }

      toast.error(detail);
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

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'index',
      header: 'N°',
      cell: info => info.row.index + 1,
    }),
    columnHelper.accessor('name', {
      header: 'Nombre',
      cell: info => (
        <div className="flex items-center gap-3">
          <ProductImage
            src={info.row.original.image}
            name={info.getValue()}
            categoryName={info.row.original.category_name}
            className="w-10 h-10 rounded-lg shrink-0"
            imgClassName="w-10 h-10 rounded-lg object-cover shrink-0"
          />
          <span className="truncate">{info.getValue()}</span>
        </div>
      ),
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
        <span className={info.row.original.is_low_stock ? 'text-text-error font-bold' : ''}>
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
  ] as ColumnDef<Product>[], []);

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
        <ProductModal
          key={editId ?? 'create'}              // esto es lo que resetea el form
          initialData={
            editingProduct
              ? {
                name: editingProduct.name,
                description: editingProduct.description || '',
                price: editingProduct.price,
                cost: editingProduct.cost || '',
                stock: editingProduct.stock,
                min_stock: editingProduct.min_stock,
                category: editingProduct.category ?? null,
                barcode: editingProduct.barcode || '',
                image: editingProduct.image || '',
              }
              : emptyForm
          }
          isEditing={!!editingProduct}
          categories={categories}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}
    </div>
  );
};
export default ProductsPage;