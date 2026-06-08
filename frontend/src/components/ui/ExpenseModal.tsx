import { useState } from "react";
import type { ExpenseFormData, ExpenseCategory } from "../../models/expense";
import { EXPENSE_CATEGORIES } from "../../models/expense";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  initialData?: ExpenseFormData;
  isEditing?: boolean;
}

const defaultFormData: ExpenseFormData = {
  amount: "",
  description: "",
  category: "OTHER" as ExpenseCategory,
  date: new Date().toISOString().split("T")[0],
};

const ExpenseModal = ({ isOpen, onClose, onSubmit, initialData, isEditing }: ExpenseModalProps) => {
  const [formData, setFormData] = useState<ExpenseFormData>(initialData ?? defaultFormData);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
      if (!initialData) setFormData(defaultFormData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-lg max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-text-primary mb-4">
          {isEditing ? "Editar Gasto" : "Nuevo Gasto"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Monto *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm text-outline focus:ring-2 focus:ring-secondary"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Descripción *</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm text-outline focus:ring-2 focus:ring-secondary"
              placeholder="Ej: Pago de luz"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Categoría *</label>
            <select
              required
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
              className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm text-outline focus:ring-2 focus:ring-secondary"
            >
              {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Fecha *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm text-outline focus:ring-2 focus:ring-secondary"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-on-surface-variant font-semibold hover:opacity-80 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-on-surface px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
