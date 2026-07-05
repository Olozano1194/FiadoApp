import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useClientStore } from '../stores/clientStore';
import { getSalesHistory } from '../api/sales.api';
import { getPayments } from '../api/fiado-payments.api';
import { formatCurrency } from '../utils/format';
import type { SaleHistoryItem } from '../models/sale';
import type { FiadoPayment } from '../models/fiado-payment';

type TimelineEntry = {
  id: number;
  date: Date;
  type: 'Venta' | 'Abono';
  description: string;
  amount: string;
  payment_method?: string;
  status?: string;
};

const ClientHistoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const clientId = Number(id);
  const { clients, fetchClients } = useClientStore();

  const [clientName, setClientName] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [currentDebt, setCurrentDebt] = useState('');
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId || isNaN(clientId)) {
      setError('Cliente inválido');
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // Find client from store, or fetch if not loaded
        if (clients.length === 0) {
          await fetchClients();
        }

        const client = useClientStore.getState().clients.find(c => c.id === clientId);
        if (!client) {
          setError('Cliente no encontrado');
          setLoading(false);
          return;
        }

        setClientName(client.name);
        setCreditLimit(client.credit_limit);
        setCurrentDebt(client.current_debt);

        // Fetch sales and payments in parallel
        const [salesRes, paymentsRes] = await Promise.all([
          getSalesHistory(1, 100, clientId),
          getPayments(clientId),
        ]);

        const sales: SaleHistoryItem[] = salesRes.data.results ?? [];
        const payments: FiadoPayment[] = Array.isArray(paymentsRes.data)
          ? paymentsRes.data
          : (paymentsRes.data as { results?: FiadoPayment[] }).results ?? [];

        // Merge into timeline
        const entries: TimelineEntry[] = [
          ...sales.map(s => ({
            id: s.id,
            date: new Date(s.created_at),
            type: 'Venta' as const,
            description: `Venta #${s.id}`,
            amount: s.total,
            payment_method: s.payment_method === 'CREDIT' ? 'Fiado' : 'Efectivo',
            status: s.status,
          })),
          ...payments.map(p => ({
            id: p.id,
            date: new Date(p.date),
            type: 'Abono' as const,
            description: p.notes || `Abono #${p.id}`,
            amount: p.amount,
          })),
        ];

        // Sort by date descending
        entries.sort((a, b) => b.date.getTime() - a.date.getTime());

        setTimeline(entries);
      } catch {
        setError('Error al cargar el historial');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [clientId, fetchClients, clients.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-on-surface-variant animate-pulse">Cargando historial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/clientes" className="text-primary hover:underline text-sm font-medium">
          &larr; Volver a Clientes
        </Link>
        <div className="bg-surface-container-lowest rounded-xl p-8 text-center">
          <p className="text-text-error font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const debtNum = parseFloat(currentDebt) || 0;
  const limitNum = parseFloat(creditLimit) || 0;

  return (
    <div className="space-y-6">
      {/* Navegación */}
      <Link to="/clientes" className="text-primary hover:underline text-sm font-medium inline-block">
        &larr; Volver a Clientes
      </Link>

      {/* Header del cliente */}
      <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">{clientName}</h2>
            <p className="text-sm text-on-surface-variant mt-1">Historial completo de ventas y abonos</p>
          </div>
          <div className="flex gap-6">
            <div className="text-right">
              <p className="text-xs text-on-surface-variant">Límite de crédito</p>
              <p className="text-lg font-bold text-text-primary">{formatCurrency(limitNum)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-on-surface-variant">Deuda actual</p>
              <p className={`text-lg font-bold ${debtNum > 0 ? 'text-text-error' : 'text-green-600'}`}>
                {formatCurrency(debtNum)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {timeline.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-8 text-center">
          <p className="text-on-surface-variant">No hay movimientos registrados para este cliente</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-6">
          <div className="space-y-1">
            {timeline.map((entry, index) => (
              <div
                key={`${entry.type}-${entry.id}-${index}`}
                className="flex items-center gap-4 py-3 px-2 rounded-lg hover:bg-surface-alt transition-colors"
              >
                {/* Indicador visual */}
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full ${entry.type === 'Venta' ? 'bg-primary' : 'bg-green-500'}`} />
                  {index < timeline.length - 1 && (
                    <div className="w-px h-6 bg-surface-border" />
                  )}
                </div>

                {/* Fecha */}
                <div className="w-24 shrink-0">
                  <p className="text-xs text-on-surface-variant">
                    {entry.date.toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-[10px] text-on-surface-variant/60">
                    {entry.date.toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Tipo + descripción */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      entry.type === 'Venta'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {entry.type}
                    </span>
                    {entry.payment_method && (
                      <span className="text-xs text-on-surface-variant/60">
                        {entry.payment_method}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-on-surface-variant truncate mt-0.5">
                    {entry.description}
                  </p>
                </div>

                {/* Monto */}
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${
                    entry.type === 'Venta'
                      ? 'text-text-error'
                      : 'text-green-600'
                  }`}>
                    {entry.type === 'Venta' ? '+ ' : '- '}
                    {formatCurrency(parseFloat(entry.amount) || 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default ClientHistoryPage;