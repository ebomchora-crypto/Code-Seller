import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import { Check, ChevronLeft, Copy, Download, Eye, MessageSquarePlus } from 'lucide-react'
import { PageHeader, PageWrapper } from '@/components/ui/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { FilterChips } from '@/components/ui/FilterChips'
import { createTemplate } from '@/services/supabase/templates'
import { markdownToHtml, openPrintWindow } from '@/utils/printDocument'
import { KIT_PROMPTS, KIT_PROPOSALS, KIT_SCRIPTS, type KitPromptCategory, type KitProposal, type KitScript } from '@/data/academy'

type KitTab = 'prompts' | 'scripts' | 'propostas'

const TABS: { value: KitTab; label: string }[] = [
  { value: 'prompts', label: `Prompts (${KIT_PROMPTS.length})` },
  { value: 'scripts', label: `Scripts de mensagem (${KIT_SCRIPTS.length})` },
  { value: 'propostas', label: `Modelos de proposta (${KIT_PROPOSALS.length})` },
]

const PROMPT_CATEGORY_LABELS: Record<KitPromptCategory, string> = {
  site: 'Site',
  landing: 'Landing page',
  sistema: 'Sistema',
  revisao: 'Revisão',
  vendas: 'Vendas',
}

const SCRIPT_CATEGORY_LABELS: Record<KitScript['category'], string> = {
  abordagem: 'Primeira abordagem',
  follow_up: 'Follow-up',
  proposta: 'Proposta e fechamento',
  cobranca: 'Cobrança',
  outro: 'Pós-venda',
}

function categoryOptions<K extends string>(labels: Record<K, string>, items: { category: K }[]) {
  return [
    { value: 'todos' as const, label: 'Todos' },
    ...(Object.keys(labels) as K[])
      .filter((key) => items.some((item) => item.category === key))
      .map((key) => ({ value: key, label: labels[key] })),
  ]
}

const PROMPT_FILTERS = categoryOptions(PROMPT_CATEGORY_LABELS, KIT_PROMPTS)
const SCRIPT_FILTERS = categoryOptions(SCRIPT_CATEGORY_LABELS, KIT_SCRIPTS)

function isTab(value: string | null): value is KitTab {
  return value === 'prompts' || value === 'scripts' || value === 'propostas'
}

function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copiado')
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.')
    }
  }

  return (
    <Button variant="secondary" size="sm" className="rounded-full" onClick={() => void handleCopy()}>
      {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
      {copied ? 'Copiado' : label}
    </Button>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="self-start rounded-full bg-[var(--accent-tint)] px-2.5 py-0.5 text-[11.5px] font-semibold text-[var(--accent-text)]">{children}</span>
  )
}

// Kit de execução: prompts, scripts de mensagem e modelos de proposta.
export default function AcademyKitPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const tab: KitTab = isTab(params.get('aba')) ? (params.get('aba') as KitTab) : 'prompts'
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [preview, setPreview] = useState<KitProposal | null>(null)
  const [promptFilter, setPromptFilter] = useState<KitPromptCategory | 'todos'>('todos')
  const [scriptFilter, setScriptFilter] = useState<KitScript['category'] | 'todos'>('todos')
  const prompts = promptFilter === 'todos' ? KIT_PROMPTS : KIT_PROMPTS.filter((prompt) => prompt.category === promptFilter)
  const scripts = scriptFilter === 'todos' ? KIT_SCRIPTS : KIT_SCRIPTS.filter((script) => script.category === scriptFilter)

  function changeTab(next: KitTab) {
    setParams({ aba: next }, { replace: true })
  }

  async function saveAsTemplate(script: KitScript) {
    setSaving(script.id)
    try {
      await createTemplate({ name: script.title, category: script.category, body: script.text, position: 999 })
      setSaved((current) => new Set(current).add(script.id))
      toast.success('Modelo de mensagem criado', {
        description: 'Ele já aparece em "Mensagem pronta" nos contatos e negócios.',
        action: { label: 'Ver modelos', onClick: () => navigate('/settings#modelos') },
      })
    } catch {
      toast.error('Não foi possível criar o modelo. Tente novamente.')
    } finally {
      setSaving(null)
    }
  }

  function downloadPdf(proposal: KitProposal) {
    const opened = openPrintWindow(proposal.title, markdownToHtml(proposal.body))
    if (!opened) toast.error('Permita pop-ups para baixar o PDF.')
  }

  return (
    <PageWrapper>
      <Link
        to="/aluno"
        className="mb-4 inline-flex items-center gap-1.5 rounded-full py-1 pr-3 text-[13.5px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
      >
        <ChevronLeft className="size-4" />
        Área do aluno
      </Link>
      <PageHeader title="Kit de execução" subtitle="Prompts, mensagens e propostas prontos para usar no mesmo dia." />

      <div className="mt-6">
        <FilterChips label="Seção do kit" options={TABS} value={tab} onChange={changeTab} />
      </div>

      {tab === 'prompts' && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
            <p className="text-[13.5px] text-[var(--text-muted)]">
              Cole em qualquer IA. Ela mesma pergunta o que precisa saber sobre o cliente antes de começar.
            </p>
            <FilterChips label="Categoria dos prompts" options={PROMPT_FILTERS} value={promptFilter} onChange={setPromptFilter} />
          </div>
          {prompts.map((prompt) => (
            <Card key={prompt.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Chip>{PROMPT_CATEGORY_LABELS[prompt.category]}</Chip>
                  <h3 className="mt-2 text-[15.5px] font-semibold text-[var(--text-primary)]">{prompt.title}</h3>
                  <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">{prompt.description}</p>
                </div>
                <CopyButton text={prompt.text} />
              </div>
              <pre
                data-lenis-prevent
                className="mt-4 max-h-56 flex-1 overflow-auto whitespace-pre-wrap rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4 font-sans text-[13px] leading-6 text-[var(--text-secondary)]"
              >
                {prompt.text}
              </pre>
            </Card>
          ))}
        </div>
      )}

      {tab === 'scripts' && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
            <p className="text-[13.5px] text-[var(--text-muted)]">
              Mensagens prontas para enviar. Salve as suas favoritas como modelo e use em "Mensagem pronta" nos contatos.
            </p>
            <FilterChips label="Categoria das mensagens" options={SCRIPT_FILTERS} value={scriptFilter} onChange={setScriptFilter} />
          </div>
          {scripts.map((script) => {
            const isSaved = saved.has(script.id)
            return (
              <Card key={script.id} className="flex flex-col">
                <Chip>{SCRIPT_CATEGORY_LABELS[script.category]}</Chip>
                <h3 className="mt-2 text-[15.5px] font-semibold text-[var(--text-primary)]">{script.title}</h3>
                <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">
                  <span className="font-medium text-[var(--text-secondary)]">Quando usar:</span> {script.whenToUse}
                </p>
                <p className="mt-4 flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4 text-[13.5px] leading-6 text-[var(--text-secondary)]">
                  {script.text}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <CopyButton text={script.text} />
                  <Button
                    size="sm"
                    className="rounded-full"
                    variant={isSaved ? 'secondary' : 'primary'}
                    disabled={isSaved || saving === script.id}
                    onClick={() => void saveAsTemplate(script)}
                  >
                    {isSaved ? <Check className="size-4 text-emerald-500" /> : <MessageSquarePlus className="size-4" />}
                    {isSaved ? 'Adicionado aos modelos' : saving === script.id ? 'Salvando…' : 'Usar como modelo de mensagem'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'propostas' && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <p className="text-[13.5px] text-[var(--text-muted)] sm:col-span-2 lg:col-span-3">
            Propostas completas, prontas para enviar em PDF. Os valores e prazos são sugestões: ajuste ao seu trabalho antes de enviar.
          </p>
          {KIT_PROPOSALS.map((proposal) => (
            <Card key={proposal.id} className="flex flex-col">
              <h3 className="text-[15.5px] font-semibold text-[var(--text-primary)]">{proposal.title}</h3>
              <p className="mt-1 flex-1 text-[13px] text-[var(--text-muted)]">{proposal.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" className="rounded-full" onClick={() => setPreview(proposal)}>
                  <Eye className="size-4" />
                  Ver
                </Button>
                <CopyButton text={proposal.body} />
                <Button variant="secondary" size="sm" className="rounded-full" onClick={() => downloadPdf(proposal)}>
                  <Download className="size-4" />
                  PDF
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={preview !== null} onClose={() => setPreview(null)} title={preview?.title ?? ''} size="lg">
        {preview && (
          <>
            <div data-lenis-prevent className="academy-markdown max-h-[60vh] overflow-y-auto pr-2">
              <ReactMarkdown>{preview.body}</ReactMarkdown>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
              <CopyButton text={preview.body} label="Copiar texto" />
              <Button size="sm" className="rounded-full" onClick={() => downloadPdf(preview)}>
                <Download className="size-4" />
                Baixar PDF
              </Button>
            </div>
          </>
        )}
      </Modal>
    </PageWrapper>
  )
}
