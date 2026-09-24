import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/ui/ErrorState'
import { Drawer } from '@/components/ui/Drawer'
import { DealDetail } from '@/components/deals/DealDetail'
import { DealForm } from '@/components/deals/DealForm'
import { ActivityList } from '@/components/deals/ActivityList'
import { ActivityForm } from '@/components/deals/ActivityForm'
import { LinkedTasksSection } from '@/components/tasks/LinkedTasksSection'
import { useDeal } from '@/hooks/useDeal'
import { useAuthContext } from '@/stores/AuthContext'

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
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-purple-700"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
          </svg>
          Voltar para Negócios
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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
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
              />
              <div className="mt-6">
                <LinkedTasksSection dealId={deal.id} dealTitle={deal.title} />
              </div>
            </div>

            <div className="lg:col-span-3">
              <p className="label-caps mb-3">Histórico de atividades</p>
              <div className="mb-4">
                <ActivityForm
                  onSubmit={async (data) => {
                    await addActivity(data)
                  }}
                />
              </div>
              <ActivityList activities={deal.activities ?? []} onDelete={deleteActivity} />
            </div>
          </div>
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
