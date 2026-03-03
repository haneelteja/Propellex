import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '@/hooks/useCustomers';
import { useFilterStore } from '@/store';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Customer } from '@/types';

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 20 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 12 },
  heading: { fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 },
  filters: { display: 'flex', gap: 10 },
  input: { padding: '7px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 14, background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb' },
  th: { textAlign: 'left' as const, padding: '10px 16px', color: '#6b7280', fontWeight: 600, background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 13 },
  td: { padding: '12px 16px', borderBottom: '1px solid #f3f4f6', color: '#374151', verticalAlign: 'middle' as const },
  avatar: {
    width: 32, height: 32, borderRadius: '50%', background: '#2563eb', color: '#fff',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, marginRight: 10,
  },
};

export default function Customers() {
  const { setOrderFilters } = useFilterStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data, isLoading, error, refetch } = useCustomers(search ? { search } : undefined);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const handleViewOrders = useCallback(
    (customerId: string) => {
      setOrderFilters({ customer_id: customerId });
      navigate('/orders');
    },
    [setOrderFilters, navigate],
  );

  const initials = (c: Customer) =>
    `${c.first_name[0] ?? ''}${c.last_name[0] ?? ''}`.toUpperCase();

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.heading}>Customers</h1>
        <div style={styles.filters}>
          <input
            style={styles.input}
            placeholder="Search name or email…"
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      {error && <ErrorBanner message={(error as Error).message} onRetry={refetch} />}

      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              {['Customer', 'Email', 'Phone', 'Orders', 'Total Spent', 'Joined', ''].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.data?.map((customer: Customer) => (
              <tr key={customer.id}>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={styles.avatar}>{initials(customer)}</span>
                    {customer.first_name} {customer.last_name}
                  </div>
                </td>
                <td style={styles.td}>{customer.email}</td>
                <td style={styles.td}>{customer.phone ?? '—'}</td>
                <td style={styles.td}>{customer.total_orders}</td>
                <td style={styles.td}>{formatCurrency(customer.total_spent)}</td>
                <td style={styles.td}>{formatDate(customer.created_at)}</td>
                <td style={styles.td}>
                  <Button size="sm" variant="ghost" onClick={() => handleViewOrders(customer.id)}>
                    View orders
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data?.count === 0 && !isLoading && (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>No customers found.</p>
      )}
    </div>
  );
}
