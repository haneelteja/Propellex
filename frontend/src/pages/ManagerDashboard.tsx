import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { manager } from '@/services/api';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import type { AdminUser } from '@/types';

type Tab = 'admins' | 'clients';

export default function ManagerDashboard() {
  const [tab, setTab] = useState<Tab>('admins');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const qc = useQueryClient();

  const { data: admins = [], isLoading: loadingAdmins } = useQuery({
    queryKey: ['manager-admins'],
    queryFn: () => manager.listAdmins(),
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['manager-clients', clientSearch],
    queryFn: () => manager.listClients(clientSearch || undefined),
    enabled: tab === 'clients',
  });

  const createMutation = useMutation({
    mutationFn: () => manager.createAdmin(email.trim(), name.trim() || undefined),
    onSuccess: () => {
      setEmail('');
      setName('');
      setSuccess('Admin created successfully');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
      qc.invalidateQueries({ queryKey: ['manager-admins'] });
    },
    onError: (err: Error) => {
      setError(err.message);
      setSuccess('');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => manager.deactivateAdmin(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manager-admins'] }),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => manager.reactivateAdmin(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manager-admins'] }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    setError('');
    createMutation.mutate();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-navy">Manager Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['admins', 'clients'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-500 hover:text-navy'
            }`}
          >
            {t === 'admins' ? 'Admin Users' : 'All Clients'}
          </button>
        ))}
      </div>

      {tab === 'admins' && (
        <div className="space-y-6">
          {/* Create admin form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-navy mb-4">Add Admin User</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Name (optional)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Display name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              {success && <p className="text-xs text-green-600">{success}</p>}
              <Button type="submit" size="sm" loading={createMutation.isPending}>
                Create Admin
              </Button>
            </form>
          </div>

          {/* Admin list */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-navy">Admin Users ({admins.length})</h2>
            </div>
            {loadingAdmins ? (
              <div className="p-6 text-sm text-gray-400">Loading...</div>
            ) : admins.length === 0 ? (
              <div className="p-6 text-sm text-gray-400">No admin users yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {admins.map((admin: AdminUser) => (
                  <div key={admin.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy truncate">{admin.name}</p>
                      <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                      {admin.last_login && (
                        <p className="text-xs text-gray-400">
                          Last login: {new Date(admin.last_login).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={admin.is_active ? 'success' : 'neutral'}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {admin.is_active ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={deactivateMutation.isPending}
                          onClick={() => deactivateMutation.mutate(admin.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={reactivateMutation.isPending}
                          onClick={() => reactivateMutation.mutate(admin.id)}
                          className="text-green-600 hover:text-green-800 text-xs"
                        >
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'clients' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <input
              type="text"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-navy">Clients ({clients.length})</h2>
            </div>
            {loadingClients ? (
              <div className="p-6 text-sm text-gray-400">Loading...</div>
            ) : clients.length === 0 ? (
              <div className="p-6 text-sm text-gray-400">No clients found.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {clients.map((client: AdminUser) => (
                  <div key={client.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy truncate">{client.name}</p>
                      <p className="text-xs text-gray-500 truncate">{client.email}</p>
                      {client.last_login && (
                        <p className="text-xs text-gray-400">
                          Last login: {new Date(client.last_login).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                    <Badge variant={client.is_active ? 'success' : 'neutral'}>
                      {client.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
