import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { OfflineBanner } from '@/components/OfflineBanner'
import { PwaUpdatePrompt } from '@/components/PwaUpdatePrompt'

// Layouts
import { DashboardLayout } from '@/components/layout/DashboardLayout'

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'

// HNI Investor Pages
import InvestorDashboard from '@/pages/investor/InvestorDashboard'
import PropertyDiscovery from '@/pages/properties/PropertyDiscovery'
import InvestorPortfolio from '@/pages/investor/InvestorPortfolio'
import MarketIntelligence from '@/pages/market/MarketIntelligence'

// Agency Admin Pages
import AgencyDashboard from '@/pages/agency/AgencyDashboard'
import AgencyProperties from '@/pages/agency/AgencyProperties'
import AgencyAgents from '@/pages/agency/AgencyAgents'

// Compliance Pages
import ComplianceDashboard from '@/pages/compliance/ComplianceDashboard'
import ComplianceRecords from '@/pages/compliance/ComplianceRecords'
import ComplianceReports from '@/pages/compliance/ComplianceReports'

// Product Manager Pages
import AdminDashboard from '@/pages/admin/AdminDashboard'

// Shared Pages
import InquiryManagement from '@/pages/inquiries/InquiryManagement'
import PropertyDetails from '@/pages/properties/PropertyDetails'
import ClientCompare from '@/pages/client/ClientCompare'

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

// Role-based Route Component
const RoleRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode
  allowedRoles: string[]
}) => {
  const { user, isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      <PwaUpdatePrompt />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* HNI Investor Routes */}
          <Route
            path="/investor/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['hni_investor']}>
                  <DashboardLayout>
                    <InvestorDashboard />
                  </DashboardLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/investor/portfolio"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['hni_investor']}>
                  <DashboardLayout>
                    <InvestorPortfolio />
                  </DashboardLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Property Discovery (All authenticated users) */}
          <Route
            path="/properties"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PropertyDiscovery />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/properties/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PropertyDetails />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Market Intelligence (All authenticated users) */}
          <Route
            path="/market"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MarketIntelligence />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Agency Admin Routes */}
          <Route
            path="/agency/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['agency_admin']}>
                  <DashboardLayout>
                    <AgencyDashboard />
                  </DashboardLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agency/properties"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['agency_admin']}>
                  <DashboardLayout>
                    <AgencyProperties />
                  </DashboardLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agency/agents"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['agency_admin']}>
                  <DashboardLayout>
                    <AgencyAgents />
                  </DashboardLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Compliance Officer Routes */}
          <Route
            path="/compliance/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['compliance_officer', 'product_manager']}>
                  <DashboardLayout>
                    <ComplianceDashboard />
                  </DashboardLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/compliance/records"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['compliance_officer', 'product_manager']}>
                  <DashboardLayout>
                    <ComplianceRecords />
                  </DashboardLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/compliance/reports"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['compliance_officer', 'product_manager']}>
                  <DashboardLayout>
                    <ComplianceReports />
                  </DashboardLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Product Manager Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['product_manager']}>
                  <DashboardLayout>
                    <AdminDashboard />
                  </DashboardLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Inquiry Management (All authenticated users) */}
          <Route
            path="/inquiries"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <InquiryManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Compare (all authenticated users) */}
          <Route
            path="/compare"
            element={
              <ProtectedRoute>
                <ClientCompare />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
