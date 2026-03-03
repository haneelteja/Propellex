import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { AppShell } from '@/components/layout/AppShell';
import { TableSkeleton } from '@/components/ui/Skeleton';

// Route-level code splitting — each page is a separate chunk
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Orders    = lazy(() => import('@/pages/Orders'));
const Products  = lazy(() => import('@/pages/Products'));
const Customers = lazy(() => import('@/pages/Customers'));

function PageFallback() {
  return (
    <div style={{ padding: 24 }}>
      <TableSkeleton rows={6} cols={4} />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="products" element={<Products />} />
              <Route path="customers" element={<Customers />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
