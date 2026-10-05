import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Briefcase, PanelRight, X } from 'lucide-react'
import { ConversationSidebar } from '@/components/autopilot/ConversationSidebar'
import { ChatInterface } from '@/components/autopilot/ChatInterface'
import { LeadPanel, leadPrompts } from '@/components/autopilot/LeadPanel'
import { useAutoPilot } from '@/hooks/useAutoPilot'
import { commercialMaterialPrompt, getCommercialMaterial } from '@/data/commercial-library'
import { readCopilotSidebarCollapsed, writeCopilotSidebarCollapsed } from '@/utils/copilotLayout'
import { toast } from 'sonner'

const PROFILE_NOTICE_KEY = 'cs-copilot-profile-notice-hidden'

function CopilotWorkspace({ contactId }: { contactId?: string }) {
  const copilot = useAutoPilot(contactId)
  const [params, setParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== 'undefined' && readCopilotSidebarCollapsed(window.localStorage))
  const [leadOpen, setLeadOpen] = useState(false)
  // Fechou o aviso do Perfil comercial uma vez: não mostra mais (some sozinho
  // também quando o perfil é preenchido).
  const [profileNoticeHidden, setProfileNoticeHidden] = useState(() => {
    try { return window.localStorage.getItem(PROFILE_NOTICE_KEY) === '1' } catch { return false }
  })
  function hideProfileNotice() {
    setProfileNoticeHidden(true)
    try { window.localStorage.setItem(PROFILE_NOTICE_KEY, '1') } catch { /* sem armazenamento: só nesta visita */ }
  }
  const intentStarted = useRef(false)
  const materialStarted = useRef(false)
  const lead = copilot.context?.selected_lead
  const analysis = [...copilot.messages].reverse().find((message) => message.analysis)?.analysis ?? lead?.previous_analysis ?? null
  const intent = params.get('intent')
  const materialId = params.get('material')
  const { sendMessage, preferences, loading, sending, error } = copilot
  function toggleSidebarCollapsed() {
    setSidebarCollapsed((current) => {
      const next = !current
      writeCopilotSidebarCollapsed(window.localStorage, next)
      return next
    })
  }
  useEffect(() => {
    if (!intent || materialId || !lead || loading || sending || error || intentStarted.current) return
    const prompt = leadPrompts[intent as keyof typeof leadPrompts]
    if (!prompt) return
    intentStarted.current = true
    void sendMessage(prompt, preferences)
    setParams((current) => { const next = new URLSearchParams(current); next.delete('intent'); return next }, { replace: true })
  }, [intent, materialId, lead, loading, sending, error, sendMessage, preferences, setParams])
  useEffect(() => {
    if (!materialId || loading || sending || error || !copilot.context || materialStarted.current) return
    if (contactId && !lead) return
    materialStarted.current = true
    const material = getCommercialMaterial(materialId)
    if (material && material.category !== 'estudos') void sendMessage(commercialMaterialPrompt(material), preferences)
    else toast.error('Material da Biblioteca não encontrado.')
    setParams((current) => { const next = new URLSearchParams(current); next.delete('material'); return next }, { replace: true })
  }, [materialId, loading, sending, error, copilot.context, contactId, lead, sendMessage, preferences, setParams])
  return <div className="relative flex min-h-0 flex-1 flex-col">
    {copilot.error && <div role="alert" className="flex flex-wrap items-center gap-3 border-b border-red-500/20 px-4 py-3 text-sm text-red-500">
      <span>{copilot.error}</span><button className="underline" onClick={() => void (copilot.activeConversation ? copilot.selectConversation(copilot.activeConversation.id) : copilot.loadConversations())}>Tentar novamente</button>
    </div>}
    {copilot.commercialProfileMissing && !profileNoticeHidden && <div className="flex shrink-0 items-center gap-3 border-b border-[var(--accent-ring)] bg-[var(--accent-tint)] px-4 py-2.5 text-[13px] text-[var(--text-secondary)]">
      <Briefcase className="size-4 shrink-0 text-[var(--accent-text)]" />
      <span className="min-w-0 flex-1">Preencha seu <b className="font-medium text-[var(--text-primary)]">Perfil comercial</b> para o CS Copilot usar sua oferta, seus preços e o seu jeito de escrever.</span>
      <Link to="/settings#perfil-comercial" className="shrink-0 font-medium text-[var(--accent-text)] hover:underline">Preencher</Link>
      <button onClick={hideProfileNotice} aria-label="Fechar aviso" className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"><X className="size-3.5" /></button>
    </div>}
    {contactId && <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-4 py-2">
      <span className="flex min-w-0 items-center gap-3">
        <Link to={'/crm/' + contactId} title="Voltar ao contato" aria-label="Voltar ao contato" className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"><ArrowLeft className="size-4" /></Link>
        <Link className="min-w-0 truncate text-sm font-medium" to={'/crm/' + contactId}>{lead?.contact.name ?? 'Carregando lead…'}</Link>
        <Link to="/copilot" className="hidden shrink-0 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] sm:inline">Conversa geral</Link>
      </span>
      <button className="inline-flex shrink-0 items-center gap-2 rounded-lg p-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]" onClick={() => setLeadOpen(!leadOpen)} aria-expanded={leadOpen}><PanelRight className="size-4" />{leadOpen ? 'Fechar painel' : 'Lead e ações'}</button>
    </div>}
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      {!contactId && <div className={'absolute inset-y-0 left-0 z-30 w-[270px] bg-[var(--bg-card)] transition-[width,transform] duration-200 lg:static lg:translate-x-0 ' + (sidebarOpen ? 'translate-x-0 ' : '-translate-x-full ') + (sidebarCollapsed ? 'lg:w-16' : 'lg:w-[270px]')}>
        <ConversationSidebar conversations={copilot.conversations} activeConversationId={copilot.activeConversation?.id ?? null}
          collapsed={sidebarCollapsed && !sidebarOpen} onToggleCollapsed={toggleSidebarCollapsed}
          loading={copilot.loading} onSelect={(id) => { void copilot.selectConversation(id); setSidebarOpen(false) }}
          onCreate={() => { void copilot.createNewConversation(); setSidebarOpen(false) }} onDelete={(id) => void copilot.deleteConversation(id)} />
      </div>}
      {sidebarOpen && !contactId && <button aria-label="Fechar conversas" onClick={() => setSidebarOpen(false)} className="absolute inset-0 z-20 bg-black/40 lg:hidden" />}
      <ChatInterface conversation={copilot.activeConversation} messages={copilot.messages} context={copilot.context}
        sending={copilot.sending || copilot.loading || !copilot.context}
        generating={copilot.sending} liveText={copilot.liveText} liveStatus={copilot.liveStatus} hasOlder={copilot.hasOlder} retryAvailable={copilot.retryAvailable}
        onLoadOlder={() => void copilot.loadOlder()} onRetry={copilot.retryLast} onCancel={copilot.cancelGeneration}
        onSendMessage={(content, attachments) => void copilot.sendMessage(content, copilot.preferences, false, attachments)}
        onConfirmAction={(messageId, actionIndex) => void copilot.confirmAction(messageId, actionIndex)}
        onRejectAction={(messageId, actionIndex) => void copilot.rejectAction(messageId, actionIndex)}
        onRefreshContext={copilot.refreshContext}
        onRenameConversation={(title) => { if (copilot.activeConversation) void copilot.renameConversation(copilot.activeConversation.id, title) }}
        onOpenSidebar={() => contactId ? setLeadOpen(true) : setSidebarOpen(true)} />
      {lead && <>
        {leadOpen && <button aria-label="Fechar painel do lead" className="absolute inset-0 z-20 bg-black/40 xl:hidden" onClick={() => setLeadOpen(false)} />}
        <div className={'absolute inset-y-0 right-0 z-30 w-[min(340px,92vw)] shrink-0 bg-[var(--bg-card)] xl:static xl:w-[300px] ' + (leadOpen ? 'block' : 'hidden')}>
          <button className="absolute right-2 top-1 z-10 rounded-lg bg-[var(--bg-card)] p-2 xl:hidden" title="Fechar painel" aria-label="Fechar painel" onClick={() => setLeadOpen(false)}><X className="size-4" /></button>
          <LeadPanel key={lead.contact.id} lead={lead} analysis={analysis} sending={copilot.sending || copilot.loading}
            onPrompt={(prompt) => { void copilot.sendMessage(prompt, copilot.preferences); setLeadOpen(false) }} onChanged={copilot.refreshContext} />
        </div>
      </>}
    </div>
  </div>
}

// O CS Copilot abre em tela cheia, fora do painel do sistema (como um app de
// chat): conversas à esquerda, mensagens largas no centro.
export default function CopilotPage() {
  const [params] = useSearchParams()
  const contactId = params.get('contact') || undefined
  return <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[var(--panel-bg)] text-[var(--text-primary)]">
    <CopilotWorkspace key={contactId ?? 'general'} contactId={contactId} />
  </div>
}
