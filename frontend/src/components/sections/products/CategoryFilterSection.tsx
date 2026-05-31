import { useEffect, useState } from 'react';
import type { Category } from '../../../models/category';
import { getCategories } from '../../../api/categories.api';
// Components
import ProductsSection from "./ProductsSection";

interface CategoryFilterSectionProps {
    query: string;
}

const CategoryFilterSection = ({ query }: CategoryFilterSectionProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  useEffect(() => {
    getCategories()
      .then(res => setCategories(res.data))
      .catch(() => {});
  }, []);

  const btnBase = "cursor-pointer font-medium px-4 py-2 rounded-full transition-colors";
  const btnActive = "bg-primary-container/60 text-on-surface";
  const btnInactive = "bg-surface-container-high text-on-surface-variant hover:bg-surface-container";

  return (
    <div>
      <div className="flex gap-2 lg:justify-end flex-wrap">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className={`${btnBase} ${selectedCategoryId === null ? btnActive : btnInactive}`}
        >
          Todo
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`${btnBase} ${selectedCategoryId === cat.id ? btnActive : btnInactive}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <ProductsSection query={query} categoryId={selectedCategoryId} />
      </div>
    </div>
  );
};
export default CategoryFilterSection;