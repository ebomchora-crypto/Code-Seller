import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/ui/ErrorState'
import { Drawer } from '@/components/ui/Drawer'
import { Card } from '@/components/ui/Card'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { DealDetail } from '@/components/deals/DealDetail'
import { DealForm } from '@/components/deals/DealForm'
import { ActivityList } from '@/components/deals/ActivityList'
import { ActivityForm } from '@/components/deals/ActivityForm'
import { LinkedTasksSection } from '@/components/tasks/LinkedTasksSection'
import { useDeal } from '@/hooks/useDeal'
import { useAuthContext } from '@/stores/AuthContext'
import { SendMessageButton } from '@/components/messages/SendMessageButton'
import { ContractButton } from '@/components/contracts/ContractButton'

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthContext()
  const {
    deal,
    loading,
    error,
    refetch,
    updateDeal,
    addActivity,
    deleteActivity,
    uploadProposal,
    uploadingProposal,
    deleteProposal,
    generateProposal,
    generatingProposal,
  } = useDeal(id)
  const [editOpen, setEditOpen] = useState(false)

  const userName = user?.name ?? user?.email ?? 'Freelancer'

  return (
    <PageWrapper>
        <Link
          to="/deals"
          className="mb-5 inline-flex items-center gap-1.5 rounded-full py-1 pr-3 text-[13.5px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          <ChevronLeft className="size-4" />
          Negócios
        </Link>

        {loading && (
          <div className="flex justify-center py-24">
            <Spinner size="lg" className="text-purple-600" />
          </div>
        )}

        {!loading && error && <ErrorState message={error} onRetry={refetch} />}

        {!loading && !error && !deal && (
          <ErrorState title="Negócio não encontrado" message="Este negócio não existe ou foi removido." />
        )}

        {!loading && deal && (
          <DealDetail
            deal={deal}
            userName={userName}
            onUpdate={updateDeal}
            onEdit={() => setEditOpen(true)}
            uploadProposal={uploadProposal}
            uploadingProposal={uploadingProposal}
            deleteProposal={deleteProposal}
            generateProposal={generateProposal}
            generatingProposal={generatingProposal}
            actions={(buttonClass) => (
              <>
                <SendMessageButton
                  className={buttonClass}
                  target={{
                    contact: deal.contact ? { id: deal.contact.id, name: deal.contact.name, phone: deal.contact.phone } : null,
                    deal: { id: deal.id, title: deal.title, value: deal.value },
                  }}
                  onSent={() => void refetch()}
                />
                <ContractButton className={buttonClass} deal={deal} />
              </>
            )}
            extra={<LinkedTasksSection dealId={deal.id} dealTitle={deal.title} />}
            history={
              <Card>
                <PanelHeader
                  title="Histórico"
                  subtitle={`${deal.activities?.length ?? 0} ${deal.activities?.length === 1 ? 'registro' : 'registros'}`}
                />
                <ActivityForm
                  onSubmit={async (data) => {
                    await addActivity(data)
                  }}
                />
                <div className="mt-6">
                  <ActivityList activities={deal.activities ?? []} onDelete={deleteActivity} />
                </div>
              </Card>
            }
          />
        )}

        <Drawer open={editOpen} onClose={() => setEditOpen(false)} title="Editar negócio">
          {deal && (
            <DealForm
              deal={deal}
              onCancel={() => setEditOpen(false)}
              onSuccess={() => {
                setEditOpen(false)
                void refetch()
              }}
            />
          )}
        </Drawer>
    </PageWrapper>
  )
}
