import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import ReportSection from "../components/sections/reportes/HeaderSection";
import MetricsSection from "../components/sections/reportes/MetricsSection";
import RecentActivityCard from "../components/sections/reportes/RecentActivityCard";
import ExpenseModal from "../components/ui/ExpenseModal";
import type { Expense, ExpenseFormData, ExpenseCategory } from "../models/expense";
import { EXPENSE_CATEGORIES } from "../models/expense";
import * as expensesApi from "../api/expenses.api";
import { MdEdit, MdDelete, MdAdd } from "react-icons/md";

const formatCurrency = (amount: string | number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  RENT: "bg-blue-100 text-blue-700",
  SERVICES: "bg-yellow-100 text-yellow-700",
  INVENTORY: "bg-purple-100 text-purple-700",
  SALARY: "bg-green-100 text-green-700",
  TAXES: "bg-red-100 text-red-700",
  MARKETING: "bg-pink-100 text-pink-700",
  MAINTENANCE: "bg-orange-100 text-orange-700",
  OTHER: "bg-gray-100 text-gray-700",
};

const ReportPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loadingExpenses, setLoadingExpenses] = useState(true);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await expensesApi.getExpenses();
      setExpenses(res.data);
    } catch {
      toast.error("Error al cargar gastos");
    } finally {
      setLoadingExpenses(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleCreate = async (data: ExpenseFormData) => {
    try {
      await expensesApi.createExpense(data);
      toast.success("Gasto registrado");
      setModalOpen(false);
      fetchExpenses();
    } catch {
      toast.error("Error al crear gasto");
    }
  };

  const handleUpdate = async (data: ExpenseFormData) => {
    if (!editingExpense) return;
    try {
      await expensesApi.updateExpense(editingExpense.id, data);
      toast.success("Gasto actualizado");
      setModalOpen(false);
      setEditingExpense(null);
      fetchExpenses();
    } catch {
      toast.error("Error al actualizar gasto");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este gasto?")) return;
    try {
      await expensesApi.deleteExpense(id);
      toast.success("Gasto eliminado");
      fetchExpenses();
    } catch {
      toast.error("Error al eliminar gasto");
    }
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditingExpense(null);
    setModalOpen(true);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <section className="max-w-7xl mx-auto space-y-8">
      <ReportSection />
      <MetricsSection />
      <RecentActivityCard />

      {/* Expenses Section */}
      <div className="bg-white border border-outline-variant rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-on-bg">Gastos</h3>
            <p className="text-sm text-on-surface-variant">
              Total: {formatCurrency(totalExpenses)}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="bg-primary text-on-surface px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <MdAdd className="text-lg" />
            Agregar Gasto
          </button>
        </div>

        {loadingExpenses ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-surface-container-low rounded-lg" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <p className="text-on-surface-variant text-center py-8">
            No hay gastos registrados
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant text-on-surface-variant">
                  <th className="text-left py-3 px-2 font-semibold">Fecha</th>
                  <th className="text-left py-3 px-2 font-semibold">Categoría</th>
                  <th className="text-left py-3 px-2 font-semibold">Descripción</th>
                  <th className="text-right py-3 px-2 font-semibold">Monto</th>
                  <th className="text-center py-3 px-2 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low/50">
                    <td className="py-3 px-2 text-on-bg">
                      {new Date(expense.date).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          CATEGORY_COLORS[expense.category as ExpenseCategory] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {EXPENSE_CATEGORIES[expense.category as ExpenseCategory] || expense.category}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-on-bg max-w-xs truncate">
                      {expense.description}
                    </td>
                    <td className="py-3 px-2 text-right font-semibold text-text-error">
                      -{formatCurrency(expense.amount)}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEdit(expense)}
                          className="p-1.5 rounded-lg hover:bg-surface-container-low text-outline cursor-pointer"
                          title="Editar"
                        >
                          <MdEdit className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer"
                          title="Eliminar"
                        >
                          <MdDelete className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold text-on-bg">
                  <td colSpan={3} className="py-3 px-2 text-right">Total Gastos</td>
                  <td className="py-3 px-2 text-right text-text-error">
                    -{formatCurrency(totalExpenses)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <ExpenseModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={editingExpense ? handleUpdate : handleCreate}
        initialData={
          editingExpense
            ? {
                amount: editingExpense.amount,
                description: editingExpense.description,
                category: editingExpense.category as ExpenseCategory,
                date: editingExpense.date,
              }
            : undefined
        }
        isEditing={!!editingExpense}
      />
    </section>
  );
};

export default ReportPage;
