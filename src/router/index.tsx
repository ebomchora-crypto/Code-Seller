import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { PrivateRoute } from '@/router/PrivateRoute'
import { PublicRoute } from '@/router/PublicRoute'
import { RootRoute } from '@/router/RootRoute'
import { Spinner } from '@/components/ui/Spinner'
import { AppLayout } from '@/layouts/AppLayout'

const LoginPage = lazy(() => import('@/pages/auth/Login'))
const RegisterPage = lazy(() => import('@/pages/auth/Register'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPassword'))

const ProspectionPage = lazy(() => import('@/pages/prospection'))
const CrmPage = lazy(() => import('@/pages/crm'))
const ContactDetailPage = lazy(() => import('@/pages/crm/[id]'))
const DealsPage = lazy(() => import('@/pages/deals'))
const DealDetailPage = lazy(() => import('@/pages/deals/[id]'))
const FinancialPage = lazy(() => import('@/pages/financial'))
const TasksPage = lazy(() => import('@/pages/tasks'))
const CopilotPage = lazy(() => import('@/pages/autopilot'))
const SettingsPage = lazy(() => import('@/pages/settings'))
const SupportPage = lazy(() => import('@/pages/support'))
const ReportsPage = lazy(() => import('@/pages/reports'))
const PortfolioPage = lazy(() => import('@/pages/portfolio'))
const AcademyPage = lazy(() => import('@/pages/academy'))
const AcademyLessonPage = lazy(() => import('@/pages/academy/lesson'))
const AcademyKitPage = lazy(() => import('@/pages/academy/kit'))
const PublicPortfolioPage = lazy(() => import('@/pages/public-portfolio'))
const RevenueRoomPage = lazy(() => import('@/pages/revenue-room'))

function RouteFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner size="lg" className="text-purple-600" />
    </div>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />

          <Route path="/" element={<RootRoute />} />

          {/* Página pública do Sellers Portfolio — abre com ou sem login. */}
          <Route path="/p/:slug" element={<PublicPortfolioPage />} />

          <Route
            path="/sala-de-receita"
            element={
              <PrivateRoute>
                <RevenueRoomPage />
              </PrivateRoute>
            }
          />

          <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route path="/aluno" element={<AcademyPage />} />
            <Route path="/aluno/licao/:id" element={<AcademyLessonPage />} />
            <Route path="/aluno/kit" element={<AcademyKitPage />} />
            <Route path="/prospection" element={<ProspectionPage />} />
            <Route path="/crm" element={<CrmPage />} />
            <Route path="/crm/:id" element={<ContactDetailPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/deals/:id" element={<DealDetailPage />} />
            <Route path="/financial" element={<FinancialPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/relatorios" element={<ReportsPage />} />
            <Route path="/copilot" element={<CopilotPage />} />
            <Route path="/autopilot" element={<Navigate to="/copilot" replace />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/support" element={<SupportPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
