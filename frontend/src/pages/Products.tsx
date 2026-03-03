import React, { useCallback, useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useCartStore, useFilterStore } from '@/store';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Product } from '@/types';

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 20 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 12 },
  heading: { fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 },
  filters: { display: 'flex', gap: 10, flexWrap: 'wrap' as const },
  input: { padding: '7px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 14, background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb' },
  th: { textAlign: 'left' as const, padding: '10px 16px', color: '#6b7280', fontWeight: 600, background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 13 },
  td: { padding: '12px 16px', borderBottom: '1px solid #f3f4f6', color: '#374151', verticalAlign: 'middle' as const },
  stockBadge: (qty: number): React.CSSProperties => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 600,
    background: qty > 0 ? '#d1fae5' : '#fee2e2', color: qty > 0 ? '#065f46' : '#991b1b',
  }),
};

export default function Products() {
  const { productFilters, setProductFilters, resetProductFilters } = useFilterStore();
  const { data, isLoading, error, refetch } = useProducts(productFilters);
  const addItem = useCartStore((s) => s.addItem);
  const [search, setSearch] = useState('');

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setProductFilters({ search: e.target.value || undefined });
    },
    [setProductFilters],
  );

  const handleAddToCart = useCallback(
    (product: Product) => {
      addItem({ product_id: product.id, name: product.name, price: product.price, quantity: 1 });
    },
    [addItem],
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.heading}>Products</h1>
        <div style={styles.filters}>
          <input
            style={styles.input}
            placeholder="Search name or SKU…"
            value={search}
            onChange={handleSearch}
          />
          <Button variant="ghost" size="sm" onClick={resetProductFilters}>
            Reset
          </Button>
        </div>
      </div>

      {error && <ErrorBanner message={(error as Error).message} onRetry={refetch} />}

      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              {['Name', 'SKU', 'Category', 'Price', 'Stock', 'Updated', ''].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.data?.map((product: Product) => (
              <tr key={product.id}>
                <td style={styles.td}><strong>{product.name}</strong></td>
                <td style={styles.td}><code>{product.sku}</code></td>
                <td style={styles.td}>{product.category}</td>
                <td style={styles.td}>{formatCurrency(product.price)}</td>
                <td style={styles.td}>
                  <span style={styles.stockBadge(product.stock_quantity)}>
                    {product.stock_quantity > 0 ? product.stock_quantity : 'Out of stock'}
                  </span>
                </td>
                <td style={styles.td}>{formatDate(product.updated_at)}</td>
                <td style={styles.td}>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={product.stock_quantity === 0}
                    onClick={() => handleAddToCart(product)}
                  >
                    Add to cart
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data?.count === 0 && !isLoading && (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>No products found.</p>
      )}
    </div>
  );
}
