import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import Table from '../components/layout/Table';
import ActionButtons from '../components/sections/table/ActionButton';
import { useClientStore } from '../stores/clientStore';
import type { Client } from '../models/client';
import { toast } from 'react-hot-toast';

const defaultForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  credit_limit: '',
};

const ClientsPage = () => {
  const { clients, loading, fetchClients, createClient, updateClient, deleteClient } = useClientStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formData, setFormData] = useState({ ...defaultForm });

  const editId = searchParams.get('edit');
  const isCreate = searchParams.has('create');
  const editingClient = editId ? clients.find(c => c.id === Number(editId)) : null;
  const isModalOpen = !!(editId || isCreate);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (editingClient) {
      setFormData({
        name: editingClient.name,
        phone: editingClient.phone || '',
        email: editingClient.email || '',
        address: editingClient.address || '',
        credit_limit: editingClient.credit_limit,
      });
    } else if (isCreate) {
      setFormData({ ...defaultForm });
    }
  }, [editId, isCreate, editingClient]);

  const closeModal = () => setSearchParams({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
        toast.success('Cliente Actualizado', {
          duration: 3000,
          position: 'bottom-right',
          style: { background: '#4b5563', color: '#fff', padding: '16px', borderRadius: '8px' },
        });
      } else {
        await createClient(formData);
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-lg">
            <h2 className="text-xl font-bold text-text-primary mb-4">
              {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Dirección</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary"
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
                  className="w-full bg-surface-container-low border-none outline-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-on-surface-variant font-semibold hover:opacity-80 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary text-on-surface px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {editingClient ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
