import { useState } from 'react'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { Drawer } from '@/components/ui/Drawer'
import { ContactForm } from '@/components/crm/ContactForm'
import { DealForm } from '@/components/deals/DealForm'
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { MetricsGrid } from '@/components/dashboard/MetricsGrid'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { PipelineChart } from '@/components/dashboard/PipelineChart'
import { RecentDealsList } from '@/components/dashboard/RecentDealsList'
import { RecentContactsList } from '@/components/dashboard/RecentContactsList'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { useDashboard } from '@/hooks/useDashboard'
import { useAuthContext } from '@/stores/AuthContext'

export default function DashboardPage() {
  const { user } = useAuthContext()
  const { metrics, revenueChart, pipelineChart, recentDeals, recentContacts, activityFeed, lastUpdated, refetch } =
    useDashboard()

  const [contactFormOpen, setContactFormOpen] = useState(false)
  const [dealFormOpen, setDealFormOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const userName = (user?.name ?? user?.email ?? 'por aqui').split(' ')[0]
  const isInitialLoading = metrics.loading && !lastUpdated

  async function handleRefresh() {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  return (
    <PageWrapper>
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex-1">
              <WelcomeBanner
                userName={userName}
                lastUpdated={lastUpdated}
                onRefresh={handleRefresh}
                refreshing={refreshing}
                loading={isInitialLoading}
              />
            </div>
            {!isInitialLoading && (
              <QuickActions onNewContact={() => setContactFormOpen(true)} onNewDeal={() => setDealFormOpen(true)} />
            )}
          </div>

          <MetricsGrid metrics={metrics.data} loading={metrics.loading} error={metrics.error} onRetry={refetch} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <RevenueChart
                data={revenueChart.data}
                loading={revenueChart.loading}
                error={revenueChart.error}
                onRetry={refetch}
              />
            </div>
            <div className="lg:col-span-2">
              <PipelineChart
                data={pipelineChart.data}
                loading={pipelineChart.loading}
                error={pipelineChart.error}
                onRetry={refetch}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RecentDealsList
              deals={recentDeals.data}
              loading={recentDeals.loading}
              error={recentDeals.error}
              onRetry={refetch}
              onCreateDeal={() => setDealFormOpen(true)}
            />
            <RecentContactsList
              contacts={recentContacts.data}
              loading={recentContacts.loading}
              error={recentContacts.error}
              onRetry={refetch}
              onCreateContact={() => setContactFormOpen(true)}
            />
          </div>

          <ActivityFeed
            items={activityFeed.data}
            loading={activityFeed.loading}
            error={activityFeed.error}
            onRetry={refetch}
          />
        </div>

        <Drawer open={contactFormOpen} onClose={() => setContactFormOpen(false)} title="Novo contato">
          <ContactForm
            onCancel={() => setContactFormOpen(false)}
            onSuccess={() => {
              setContactFormOpen(false)
              void refetch()
            }}
          />
        </Drawer>

        <Drawer open={dealFormOpen} onClose={() => setDealFormOpen(false)} title="Novo negócio">
          <DealForm
            onCancel={() => setDealFormOpen(false)}
            onSuccess={() => {
              setDealFormOpen(false)
              void refetch()
            }}
          />
        </Drawer>
    </PageWrapper>
  )
}
