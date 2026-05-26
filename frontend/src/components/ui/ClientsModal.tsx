import { useState } from "react";
import type { ClientFormData } from "../../models/client";

interface ClientsModalProps {
    initialData: ClientFormData;
    isEditing: boolean;
    onSubmit: (data: ClientFormData) => Promise<void>;
    onClose: () => void;
}

const ClientsModal = ({ initialData, isEditing, onSubmit, onClose }: ClientsModalProps) => {
    const [formData, setFormData] = useState<ClientFormData>(initialData);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-lg max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-text-primary mb-4">
                    {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1">Teléfono</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm text-outline focus:ring-2 focus:ring-secondary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm text-outline focus:ring-2 focus:ring-secondary"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-on-surface-variant mb-1">Dirección</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm text-outline focus:ring-2 focus:ring-secondary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-on-surface-variant mb-1">Límite de Crédito *</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={formData.credit_limit}
                            onChange={e => setFormData({ ...formData, credit_limit: e.target.value })}
                            className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm text-outline focus:ring-2 focus:ring-secondary"
                        />
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
export default ClientsModal;