import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import type { Category } from '../../../models/category';
import { getCategories } from '../../../api/categories.api';
// Components
import ProductsSection from "./ProductsSection";

interface CategoryFilterSectionProps {
    query: string;
}

const FEATURED_CATEGORIES = [
  "Granos y Abarrotes",
  "Bebidas",
  "Snacks y Confitería",
];

const CategoryFilterSection = ({ query }: CategoryFilterSectionProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    getCategories()
      .then(res => setCategories(res.data))
      .catch(() => toast.error('Error al cargar categorías'));
  }, []);

  const visibleCategories = !showAll
    ? categories.filter(cat => FEATURED_CATEGORIES.includes(cat.name))
    : categories;

  const hasMore = categories.length > FEATURED_CATEGORIES.length;

  const btnBase = "cursor-pointer font-medium px-4 py-2 rounded-full transition-colors";
  const btnActive = "bg-primary-container/60 text-on-surface";
  const btnInactive = "bg-surface-container-high text-on-surface-variant hover:bg-surface-container";
  const btnMore = "cursor-pointer font-medium px-4 py-2 rounded-full transition-colors bg-secondary-container text-on-surface hover:bg-secondary-container/80";

  return (
    <div>
      <div className="flex gap-2 lg:justify-end flex-wrap">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className={`${btnBase} ${selectedCategoryId === null ? btnActive : btnInactive}`}
        >
          Todo
        </button>
        {visibleCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`${btnBase} ${selectedCategoryId === cat.id ? btnActive : btnInactive}`}
          >
            {cat.name}
          </button>
        ))}
        {hasMore && (
          <button
            onClick={() => setShowAll(prev => !prev)}
            className={btnMore}
          >
            {showAll ? "Ver menos" : `+${categories.length - FEATURED_CATEGORIES.length} más`}
          </button>
        )}
      </div>

      <div className="mt-8">
        <ProductsSection query={query} categoryId={selectedCategoryId} />
      </div>
    </div>
  );
};
export default CategoryFilterSection;