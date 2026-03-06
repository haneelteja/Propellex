import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Navbar } from '@/components/layout/Navbar';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { ChatWidget } from '@/components/chatbot/ChatWidget';
import { Skeleton } from '@/components/shared/Skeleton';
import { useAuthStore } from '@/store/authStore';

// Lazy-loaded pages
const Login = lazy(() => import('@/pages/Login'));
const Home = lazy(() => import('@/pages/Home'));
const Search = lazy(() => import('@/pages/Search'));
const PropertyDetail = lazy(() => import('@/pages/PropertyDetail'));
const Shortlist = lazy(() => import('@/pages/Shortlist'));
const Profile = lazy(() => import('@/pages/Profile'));
const AgencyDashboard = lazy(() => import('@/pages/AgencyDashboard'));
const ManagerDashboard = lazy(() => import('@/pages/ManagerDashboard'));

function PageLoader() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-64 w-full" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    </div>
  );
}

function AppContent() {
  const token = useAuthStore((s) => s.token);

  return (
    <div className="min-h-screen bg-surface font-sans">
      <Navbar />
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/login"
              element={token ? <Navigate to="/" replace /> : <Login />}
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <Search />
                </ProtectedRoute>
              }
            />
            <Route
              path="/property/:id"
              element={
                <ProtectedRoute>
                  <PropertyDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shortlist"
              element={
                <ProtectedRoute>
                  <Shortlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agency"
              element={
                <ProtectedRoute>
                  <AgencyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager"
              element={
                <ProtectedRoute>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      {token && <ChatWidget />}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
