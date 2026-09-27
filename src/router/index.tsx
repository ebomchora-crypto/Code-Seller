import { Suspense } from 'react'
import { lazyPage } from '@/utils/lazyPage'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { PrivateRoute } from '@/router/PrivateRoute'
import { PublicRoute } from '@/router/PublicRoute'
import { RootRoute } from '@/router/RootRoute'
import { Spinner } from '@/components/ui/Spinner'
import { AppLayout } from '@/layouts/AppLayout'
import { DesktopIntegration } from '@/components/desktop/DesktopIntegration'

const LoginPage = lazyPage(() => import('@/pages/auth/Login'))
const RegisterPage = lazyPage(() => import('@/pages/auth/Register'))
const ForgotPasswordPage = lazyPage(() => import('@/pages/auth/ForgotPassword'))

const ProspectionPage = lazyPage(() => import('@/pages/prospection'))
const CrmPage = lazyPage(() => import('@/pages/crm'))
const ContactDetailPage = lazyPage(() => import('@/pages/crm/[id]'))
const DealsPage = lazyPage(() => import('@/pages/deals'))
const DealDetailPage = lazyPage(() => import('@/pages/deals/[id]'))
const FinancialPage = lazyPage(() => import('@/pages/financial'))
const TasksPage = lazyPage(() => import('@/pages/tasks'))
const CopilotPage = lazyPage(() => import('@/pages/autopilot'))
const SettingsPage = lazyPage(() => import('@/pages/settings'))
const SupportPage = lazyPage(() => import('@/pages/support'))
const ReportsPage = lazyPage(() => import('@/pages/reports'))
const PortfolioPage = lazyPage(() => import('@/pages/portfolio'))
const AcademyPage = lazyPage(() => import('@/pages/academy'))
const AcademyLessonPage = lazyPage(() => import('@/pages/academy/lesson'))
const AcademyKitPage = lazyPage(() => import('@/pages/academy/kit'))
const PublicPortfolioPage = lazyPage(() => import('@/pages/public-portfolio'))
const PublicProposalPage = lazyPage(() => import('@/pages/public-proposal'))
const RevenueRoomPage = lazyPage(() => import('@/pages/revenue-room'))
const NotFoundPage = lazyPage(() => import('@/pages/not-found'))

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
      <DesktopIntegration />
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
          <Route path="/proposta/:token" element={<PublicProposalPage />} />

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

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
