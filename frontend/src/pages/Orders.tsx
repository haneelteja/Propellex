import React, { useCallback, useState } from 'react';
import { useOrders, useUpdateOrder } from '@/hooks/useOrders';
import { useFilterStore } from '@/store';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 20 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  heading: { fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 },
  filters: { display: 'flex', gap: 10, flexWrap: 'wrap' as const },
  select: {
    padding: '7px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 14,
    background: '#fff',
  },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 14, background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' },
  th: { textAlign: 'left' as const, padding: '10px 16px', color: '#6b7280', fontWeight: 600, background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 13 },
  td: { padding: '12px 16px', borderBottom: '1px solid #f3f4f6', color: '#374151', verticalAlign: 'middle' as const },
  badge: (status: string): React.CSSProperties => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
    background: `${ORDER_STATUS_COLORS[status]}22`, color: ORDER_STATUS_COLORS[status],
  }),
};

export default function Orders() {
  const { orderFilters, setOrderFilters, resetOrderFilters } = useFilterStore();
  const { data, isLoading, error, refetch } = useOrders(orderFilters);
  const updateOrder = useUpdateOrder();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusFilter = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      setOrderFilters({ status: (e.target.value as OrderStatus) || undefined }),
    [setOrderFilters],
  );

  const handleStatusUpdate = useCallback(
    async (order: Order, status: OrderStatus) => {
      setUpdatingId(order.id);
      try {
        await updateOrder.mutateAsync({ id: order.id, body: { status } });
      } finally {
        setUpdatingId(null);
      }
    },
    [updateOrder],
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.heading}>Orders</h1>
        <div style={styles.filters}>
          <select style={styles.select} value={orderFilters.status ?? ''} onChange={handleStatusFilter}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Button variant="ghost" size="sm" onClick={resetOrderFilters}>
            Reset
          </Button>
        </div>
      </div>

      {error && <ErrorBanner message={(error as Error).message} onRetry={refetch} />}

      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              {['Order ID', 'Customer', 'Status', 'Amount', 'Date', 'Actions'].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.data?.map((order: Order) => (
              <tr key={order.id}>
                <td style={styles.td}><code>{order.id.slice(0, 8)}…</code></td>
                <td style={styles.td}>{order.customer_id.slice(0, 8)}…</td>
                <td style={styles.td}><span style={styles.badge(order.status)}>{order.status}</span></td>
                <td style={styles.td}>{formatCurrency(order.total_amount)}</td>
                <td style={styles.td}>{formatDate(order.created_at)}</td>
                <td style={styles.td}>
                  <select
                    style={{ ...styles.select, fontSize: 12 }}
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) => handleStatusUpdate(order, e.target.value as OrderStatus)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data?.count === 0 && !isLoading && (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>No orders found.</p>
      )}
    </div>
  );
}
