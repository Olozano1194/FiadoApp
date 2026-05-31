import { useState } from "react";
import type { Client } from "../../models/client";
import * as paymentsApi from "../../api/fiado-payments.api";

interface PaymentModalProps {
    client: Client;
    onClose: () => void;
    onSuccess: () => void;
}

const formatCurrency = (amount: number | string): string => {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
};

const PaymentModal = ({ client, onClose, onSuccess }: PaymentModalProps) => {
    const debt = parseFloat(client.current_debt) || 0;
    const [amount, setAmount] = useState(debt.toString());
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);
        if (!parsedAmount || parsedAmount <= 0) return;

        setLoading(true);
        try {
            await paymentsApi.createPayment({
                client: client.id,
                amount: parsedAmount.toFixed(2),
                notes: notes || undefined,
            });
            onSuccess();
        } catch {
            // error handled by axios interceptor
        } finally {
            setLoading(false);
        }
    };

    const remaining = Math.max(debt - (parseFloat(amount) || 0), 0);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-lg">
                <h2 className="text-xl font-bold text-text-primary mb-1">Registrar Pago</h2>
                <p className="text-on-surface-variant text-sm mb-4">
                    Cobro de deuda de <span className="font-semibold text-text-primary">{client.name}</span>
                </p>

                {/* Resumen de deuda */}
                <div className="bg-error-container/20 rounded-lg p-4 mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-on-surface-variant">Deuda actual</p>
                        <p className="text-2xl font-black text-text-error">{formatCurrency(debt)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-on-surface-variant">Después del pago</p>
                        <p className={`text-2xl font-black ${remaining > 0 ? 'text-text-error' : 'text-green-600'}`}>
                            {formatCurrency(remaining)}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-on-surface-variant mb-1">
                            Monto del pago *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={debt}
                            required
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm text-outline focus:ring-2 focus:ring-secondary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-on-surface-variant mb-1">
                            Nota (opcional)
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Ej: Abono a cuenta"
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
                            disabled={loading}
                            className="bg-primary text-on-surface px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                        >
                            {loading ? "Registrando..." : "Registrar Pago"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
