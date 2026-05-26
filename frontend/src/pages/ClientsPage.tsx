import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import Table from '../components/layout/Table';
import ActionButtons from '../components/sections/table/ActionButton';
import { useClientStore } from '../stores/clientStore';
import type { Client } from '../models/client';
import { toast } from 'react-hot-toast';
// Modals
import ClientsModal from '../components/ui/ClientsModal';
// Models
import type { ClientFormData } from '../models/client';

const defaultForm: ClientFormData = {
  name: '',
  phone: '',
  email: '',
  address: '',
  credit_limit: '',
};

const ClientsPage = () => {
  const { clients, loading, fetchClients, createClient, updateClient, deleteClient } = useClientStore();
  const [searchParams, setSearchParams] = useSearchParams();
  // const [formData, ] = useState({ ...defaultForm });

  const editId = searchParams.get('edit');
  const isCreate = searchParams.has('create');
  const editingClient = useMemo(() => {
      return editId
        ? clients.find((c) => c.id === Number(editId))
        : null;
    }, [clients, editId]);
  const isModalOpen = !!(editId || isCreate);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // useEffect(() => {
  //   if (editingClient) {
  //     setFormData({
  //       name: editingClient.name,
  //       phone: editingClient.phone || '',
  //       email: editingClient.email || '',
  //       address: editingClient.address || '',
  //       credit_limit: editingClient.credit_limit,
  //     });
  //   } else if (isCreate) {
  //     setFormData({ ...defaultForm });
  //   }
  // }, [editId, isCreate, editingClient]);

  const closeModal = () => setSearchParams({});

  const handleSubmit = async (data: ClientFormData) => {
    try {
      if (editingClient) {
        await updateClient(editingClient.id, data);
        toast.success('Cliente Actualizado', {
          duration: 3000,
          position: 'bottom-right',
          style: { background: '#4b5563', color: '#fff', padding: '16px', borderRadius: '8px' },
        });
      } else {
        await createClient(data);
        toast.success('Cliente Creado', {
          duration: 3000,
          position: 'bottom-right',
          style: { background: '#4b5563', color: '#fff', padding: '16px', borderRadius: '8px' },
        });
      }
      closeModal();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteClient(id);
  };

  const formatCurrency = (amount: number | string): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const columnHelper = createColumnHelper<Client>();

  const columns = [
    columnHelper.display({
      id: 'index',
      header: 'N°',
      cell: info => info.row.index + 1,
    }),
    columnHelper.accessor('name', {
      header: 'Nombre',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('phone', {
      header: 'Teléfono',
      cell: info => info.getValue() || '—',
    }),
    columnHelper.accessor('credit_limit', {
      header: 'Límite Crédito',
      cell: info => (
        <div className="font-medium">
          {formatCurrency(info.getValue())}
        </div>
      ),
    }),
    columnHelper.accessor('current_debt', {
      header: 'Deuda Actual',
      cell: info => {
        const debt = parseFloat(info.getValue()) || 0;
        return (
          <div className={`font-medium ${debt > 0 ? 'text-text-error' : 'text-on-surface-variant'}`}>
            {debt > 0 && (
              <span className="inline-block bg-error-container text-text-error text-xs font-bold px-2 py-0.5 rounded-full mr-2">
                DEUDOR
              </span>
            )}
            {formatCurrency(debt)}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'acciones',
      header: 'Acciones',
      cell: info => (
        <ActionButtons
          id={info.row.original.id}
          editPath={`?edit=${info.row.original.id}`}
          onDelete={handleDelete}
          confirmMessage="¿Estás seguro de eliminar este cliente?"
        />
      ),
    }),
  ] as ColumnDef<Client>[];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-primary">Clientes / Fiados</h1>
        <button
          onClick={() => setSearchParams({ create: 'true' })}
          className="bg-primary text-on-surface px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity cursor-pointer"
        >
          + Nuevo Cliente
        </button>
      </div>

      {loading ? (
        <div className="bg-surface-container-lowest w-full flex flex-col justify-center items-center p-8 rounded-xl">
          <p className="text-on-surface-variant">Cargando clientes...</p>
        </div>
      ) : (
        <Table data={clients} columns={columns} />
      )}

      {isModalOpen && (
        <ClientsModal
          key={editId ?? 'create'}              // esto es lo que resetea el form
          initialData={
            editingClient
              ? {
                name: editingClient.name,
                phone: editingClient.phone || '',
                email: editingClient.email || '',
                address: editingClient.address || '',
                credit_limit: editingClient.credit_limit,
              }
              : defaultForm
          }
          isEditing={!!editingClient}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}
    </div>
  );
};
export default ClientsPage;