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
const CodeMakerPage = lazyPage(() => import('@/pages/code-maker'))
const CodeMakerEditorPage = lazyPage(() => import('@/pages/code-maker/[id]'))
const SettingsPage = lazyPage(() => import('@/pages/settings'))
const SupportPage = lazyPage(() => import('@/pages/support'))
const ReportsPage = lazyPage(() => import('@/pages/reports'))
const PortfolioPage = lazyPage(() => import('@/pages/portfolio'))
const AcademyPage = lazyPage(() => import('@/pages/academy'))
const AcademyLessonPage = lazyPage(() => import('@/pages/academy/lesson'))
const AcademyKitPage = lazyPage(() => import('@/pages/academy/kit'))
const CommercialLibraryPage = lazyPage(() => import('@/pages/academy/library'))
const PublicPortfolioPage = lazyPage(() => import('@/pages/public-portfolio'))
const PublicLeadFormPage = lazyPage(() => import('@/pages/public-lead-form'))
const PublicProposalPage = lazyPage(() => import('@/pages/public-proposal'))
const PublicSitePage = lazyPage(() => import('@/pages/public-site'))
const RevenueRoomPage = lazyPage(() => import('@/pages/revenue-room'))
const TermsPage = lazyPage(() => import('@/pages/legal/terms'))
const PrivacyPage = lazyPage(() => import('@/pages/legal/privacy'))
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
          <Route path="/f/:slug" element={<PublicLeadFormPage />} />
          <Route path="/proposta/:token" element={<PublicProposalPage />} />
          {/* Sites criados no Code Maker. */}
          <Route path="/s/:slug" element={<PublicSitePage />} />
          <Route path="/termos" element={<TermsPage />} />
          <Route path="/privacidade" element={<PrivacyPage />} />

          <Route
            path="/sala-de-receita"
            element={
              <PrivateRoute>
                <RevenueRoomPage />
              </PrivateRoute>
            }
          />

          {/* CS Copilot em tela cheia, fora do painel do sistema. */}
          <Route
            path="/copilot"
            element={
              <PrivateRoute>
                <CopilotPage />
              </PrivateRoute>
            }
          />

          <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route path="/aluno" element={<AcademyPage />} />
            <Route path="/aluno/licao/:id" element={<AcademyLessonPage />} />
            <Route path="/aluno/kit" element={<AcademyKitPage />} />
            <Route path="/aluno/biblioteca" element={<CommercialLibraryPage />} />
            <Route path="/prospection" element={<ProspectionPage />} />
            <Route path="/crm" element={<CrmPage />} />
            <Route path="/crm/:id" element={<ContactDetailPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/deals/:id" element={<DealDetailPage />} />
            <Route path="/financial" element={<FinancialPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/relatorios" element={<ReportsPage />} />
            <Route path="/autopilot" element={<Navigate to="/copilot" replace />} />
            <Route path="/code-maker" element={<CodeMakerPage />} />
            <Route path="/code-maker/:id" element={<CodeMakerEditorPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/support" element={<SupportPage />} />
          </Route>

          {/* Link curto dos sites do Code Maker (/apelido). As telas acima têm prioridade. */}
          <Route path="/:slug" element={<PublicSitePage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
