import React from 'react';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { formatCurrency, formatRelativeTime, ORDER_STATUS_COLORS } from '@/lib/utils';
import type { Order } from '@/types';

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 24 },
  heading: { fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 },
  statCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: 20,
  },
  statLabel: { fontSize: 13, color: '#6b7280', fontWeight: 500 },
  statValue: { fontSize: 28, fontWeight: 700, color: '#111827', marginTop: 6 },
  section: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 14 },
  th: { textAlign: 'left' as const, padding: '8px 12px', color: '#6b7280', fontWeight: 500, borderBottom: '1px solid #f3f4f6' },
  td: { padding: '10px 12px', borderBottom: '1px solid #f9fafb', color: '#374151' },
  badge: (status: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 500,
    background: `${ORDER_STATUS_COLORS[status]}22`,
    color: ORDER_STATUS_COLORS[status],
  }),
};

function StatCard({ label, value, loading }: { label: string; value: string | number; loading?: boolean }) {
  if (loading) return <CardSkeleton />;
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const orders = useOrders({ limit: 10 });
  const products = useProducts({ limit: 1, in_stock: false });
  const customers = useCustomers({ limit: 1 });

  const revenue = orders.data?.data?.reduce((sum, o) => sum + o.total_amount, 0) ?? 0;

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Dashboard</h1>

      {orders.error && (
        <ErrorBanner message={(orders.error as Error).message} onRetry={orders.refetch} />
      )}

      <div style={styles.statsGrid}>
        <StatCard label="Recent Orders" value={orders.data?.count ?? 0} loading={orders.isLoading} />
        <StatCard label="Recent Revenue" value={formatCurrency(revenue)} loading={orders.isLoading} />
        <StatCard label="Total Customers" value={customers.data?.count ?? 0} loading={customers.isLoading} />
        <StatCard label="Total Products" value={products.data?.count ?? 0} loading={products.isLoading} />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Recent Orders</div>
        {orders.isLoading ? (
          <CardSkeleton />
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {['Order ID', 'Status', 'Amount', 'Date'].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.data?.data?.map((order: Order) => (
                <tr key={order.id}>
                  <td style={styles.td}>{order.id.slice(0, 8)}…</td>
                  <td style={styles.td}>
                    <span style={styles.badge(order.status)}>{order.status}</span>
                  </td>
                  <td style={styles.td}>{formatCurrency(order.total_amount)}</td>
                  <td style={styles.td}>{formatRelativeTime(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
