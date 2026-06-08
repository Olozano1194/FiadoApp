// Componente compartido para mostrar imagen de producto con fallback
// Muestra la imagen si existe, sino la inicial del nombre con color según categoría

interface ProductImageProps {
  src?: string | null;
  name: string;
  categoryName?: string;
  /** Clases para el contenedor (sizing, border-radius, etc.) */
  className?: string;
  /** Clases extra SOLO para la etiqueta <img> (object-fit, hover effects) */
  imgClassName?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Granos y Abarrotes': 'bg-amber-600',
  'Huevos': 'bg-yellow-600',
  'Panadería': 'bg-orange-600',
  'Bebidas': 'bg-sky-600',
  'Snacks y Confitería': 'bg-rose-500',
  'Aseo Personal': 'bg-teal-600',
  'Aseo Hogar': 'bg-cyan-600',
  'Condimentos y Salsas': 'bg-red-600',
  'Embutidos': 'bg-pink-600',
  'Enlatados': 'bg-blue-600',
  'Cigarrillos': 'bg-stone-600',
  'Verduras': 'bg-green-600',
  'Lácteos': 'bg-indigo-600',
  'Otros': 'bg-gray-600',
};

const DEFAULT_BG = 'bg-surface-container';

export function ProductImage({ src, name, categoryName, className = '', imgClassName = '' }: ProductImageProps) {
  const initial = name?.charAt(0).toUpperCase() || '?';

  if (src) {
    return <img src={src} alt={name} className={`${className} ${imgClassName}`} />;
  }

  const bgColor = CATEGORY_COLORS[categoryName || ''] || DEFAULT_BG;

  return (
    <div className={`${bgColor} flex items-center justify-center text-white font-bold ${className}`}>
      <span className="text-sm md:text-base leading-none select-none">{initial}</span>
    </div>
  );
}
