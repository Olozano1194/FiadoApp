import { useState } from 'react';
import { useSaleStore } from '../../stores/saleStore';
import ClientSelect from './ClientSelect';
import { toast } from 'react-hot-toast';

const formatCurrency = (amount: number | string): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

const PaymentBar = () => {
  const [clientSelectOpen, setClientSelectOpen] = useState(false);
  const cart = useSaleStore(s => s.cart);
  const selectedPaymentMethod = useSaleStore(s => s.selectedPaymentMethod);
  const selectedClient = useSaleStore(s => s.selectedClient);
  const isSubmitting = useSaleStore(s => s.isSubmitting);
  const getCartTotal = useSaleStore(s => s.getCartTotal);
  const setPaymentMethod = useSaleStore(s => s.setPaymentMethod);
  const completeSale = useSaleStore(s => s.completeSale);
  const error = useSaleStore(s => s.error);

  const total = getCartTotal();
  const cartEmpty = cart.length === 0;
  const canSubmit = !cartEmpty && !(selectedPaymentMethod === 'CREDIT' && !selectedClient);

  const handleCompleteSale = async () => {
    await completeSale();
    if (!useSaleStore.getState().error) {
      toast.success('Venta completada con éxito', {
        duration: 3000,
        position: 'bottom-right',
        style: { background: '#4b5563', color: '#fff', padding: '16px', borderRadius: '8px' },
      });
    } else {
      toast.error(error || 'Error al procesar la venta', {
        duration: 3000,
        position: 'bottom-right',
        style: { background: '#4b5563', color: '#fff', padding: '16px', borderRadius: '8px' },
      });
    }
  };

  return (
    <>
      <div className="bg-surface-container-lowest border border-surface-border rounded-xl shadow-sm mt-4 p-4 flex items-center gap-4">
        <div className="flex items-center gap-2 bg-surface rounded-lg p-1 border border-surface-border">
          <button
            onClick={() => setPaymentMethod('CASH')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer ${
              selectedPaymentMethod === 'CASH'
                ? 'bg-primary text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-text-primary'
            }`}
          >
            Efectivo
          </button>
          <button
            onClick={() => setPaymentMethod('CREDIT')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer ${
              selectedPaymentMethod === 'CREDIT'
                ? 'bg-primary text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-text-primary'
            }`}
          >
            Crédito
          </button>
        </div>

        {selectedPaymentMethod === 'CREDIT' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setClientSelectOpen(true)}
              className="bg-surface text-primary border border-primary/30 rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface-alt transition-colors cursor-pointer"
            >
              {selectedClient ? selectedClient.name : 'Seleccionar Cliente'}
            </button>
            {selectedClient && (
              <button
                onClick={() => useSaleStore.getState().setSelectedClient(null)}
                className="text-error hover:text-error/80 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        <div className="flex-1 text-right">
          <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
        </div>

        <button
          onClick={handleCompleteSale}
          disabled={!canSubmit || isSubmitting}
          className="bg-primary text-on-surface px-8 py-3 rounded-lg font-bold text-base hover:opacity-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Procesando...
            </span>
          ) : (
            'Completar Venta'
          )}
        </button>
      </div>

      <ClientSelect
        isOpen={clientSelectOpen}
        onClose={() => setClientSelectOpen(false)}
      />
    </>
  );
};

export default PaymentBar;