import { useState, useEffect } from 'react';
import { useClientStore } from '../../stores/clientStore';
import { useSaleStore } from '../../stores/saleStore';
import type { Client } from '../../models/client';

const formatCurrency = (amount: number | string): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

interface ClientSelectProps {
  isOpen: boolean;
  onClose: () => void;
}

const ClientSelect = ({ isOpen, onClose }: ClientSelectProps) => {
  const [query, setQuery] = useState('');
  const { clients, fetchClients } = useClientStore();
  const setSelectedClient = useSaleStore(s => s.setSelectedClient);

  useEffect(() => {
    if (isOpen) fetchClients();
  }, [isOpen, fetchClients]);

  const filtered = query
    ? clients.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.phone && c.phone.includes(query))
      )
    : clients;

  const handleSelect = (client: Client) => {
    setSelectedClient(client);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div
        className="bg-surface-container-lowest rounded-xl p-6 w-full max-w-lg mx-4 shadow-lg max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-text-primary mb-4">Seleccionar Cliente</h3>
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-surface text-outline border border-surface-border rounded-lg px-4 py-2.5 text-sm mb-4 focus:ring-2 focus:ring-secondary outline-none"
          autoFocus
        />
        <div className="flex-1 overflow-y-auto space-y-2">
          <button
            onClick={() => {
              setSelectedClient(null);
              onClose();
              setQuery('');
            }}
            className="w-full bg-surface rounded-lg p-3 text-left hover:bg-surface-alt transition-colors cursor-pointer border border-surface-border"
          >
            <span className="font-medium text-text-primary">Consumidor Final</span>
            <span className="text-on-surface-variant text-sm ml-2">(sin registro)</span>
          </button>
          {filtered.map(client => {
            const debt = parseFloat(client.current_debt);
            const limit = parseFloat(client.credit_limit);
            const isOverLimit = limit > 0 && debt >= limit;
            return (
              <button
                key={client.id}
                onClick={() => handleSelect(client)}
                className="w-full bg-surface rounded-lg p-3 text-left hover:bg-surface-alt transition-colors cursor-pointer border border-surface-border"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-text-primary">{client.name}</span>
                  {client.phone && <span className="text-sm text-on-surface-variant">{client.phone}</span>}
                </div>
                <div className="flex justify-between items-center mt-1">
                  {debt > 0 && (
                    <span className={`text-sm text-outline ${isOverLimit ? 'text-text-error font-bold' : 'text-error-container'}`}>
                      Deuda: {formatCurrency(debt)}
                    </span>
                  )}
                  {limit > 0 && (
                    <span className={`text-xs text-outline ${isOverLimit ? 'text-text-error' : 'text-on-surface-variant'}`}>
                      Límite: {formatCurrency(limit)}
                    </span>
                  )}
                </div>
                {isOverLimit && (
                  <p className="text-xs text-error mt-1 font-medium">Este cliente ha excedido su límite de crédito</p>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-on-surface-variant py-4">No se encontraron clientes</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-on-surface-variant font-semibold hover:opacity-80 transition-opacity cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default ClientSelect;