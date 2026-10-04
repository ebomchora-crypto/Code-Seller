import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { createConversation, deleteConversation as removeConversation, getConversationById, getConversations,
  saveMessage, updateActionStatus, updateConversationTitle, claimAction, getOlderConversationMessages,
  updateCommercialMemory, updateConversationPreferences } from '@/services/supabase/autopilot'
import { buildAutoPilotContext } from '@/services/supabase/autopilotContext'
import { getCommercialProfile } from '@/services/supabase/commercialProfile'
import type { CommercialProfile } from '@/types/commercialProfile'
import { isCommercialProfileEmpty } from '@/utils/commercialProfile'
import { executeAction } from '@/services/autopilot/actionExecutor'
import { sendAutoPilotMessage, summarizeCommercialMemory } from '@/integrations/ai'
import { generateConversationTitle, parseAutoPilotResponse } from '@/utils/autopilot'
import { useAuthContext } from '@/stores/AuthContext'
import { attachmentsPromptBlock, storedAttachment, type PreparedAttachment } from '@/utils/copilotAttachments'
import { DEFAULT_COPILOT_PREFERENCES, type AutoPilotContext, type AutoPilotConversation, type AutoPilotMessage, type CopilotPreferences, type ActionStatus } from '@/types'

export function useAutoPilot(contactId?: string) {
  const { user } = useAuthContext()
  const [conversations, setConversations] = useState<AutoPilotConversation[]>([])
  const [activeConversation, setActiveConversation] = useState<AutoPilotConversation | null>(null)
  const [messages, setMessages] = useState<AutoPilotMessage[]>([])
  const [context, setContext] = useState<AutoPilotContext | null>(null)
  const [preferences, setPreferences] = useState<CopilotPreferences>(DEFAULT_COPILOT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [hasOlder, setHasOlder] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [commercialProfile, setCommercialProfile] = useState<CommercialProfile | null>(null)
  // Texto da resposta chegando ao vivo (vazio enquanto a IA ainda não começou a escrever).
  const [liveText, setLiveText] = useState('')
  const [liveStatus, setLiveStatus] = useState<string | null>(null)
  const epoch = useRef(0)
  const sendLock = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const actionLocks = useRef(new Set<string>())
  // Imagens inteiras da última mensagem enviada (no banco fica só a miniatura), para "tentar de novo".
  const lastImages = useRef<{ messageId: string; images: string[] } | null>(null)
  const refreshContext = useCallback(async () => {
    const scope = epoch.current
    try {
      const result = await buildAutoPilotContext(contactId)
      if (scope === epoch.current) setContext(result)
    } catch (err) { if (scope === epoch.current) toast.error(err instanceof Error ? err.message : 'Falha ao atualizar contexto.') }
  }, [contactId])
  // Perfil comercial: lido a cada envio, para valer o que acabou de ser salvo nas Configurações.
  const loadCommercialProfile = useCallback(async () => {
    try {
      const profile = await getCommercialProfile()
      setCommercialProfile(profile)
      return profile
    } catch { return null }
  }, [])
  useEffect(() => { if (user) void loadCommercialProfile() }, [user, loadCommercialProfile])
  const loadConversations = useCallback(async () => {
    const scope = ++epoch.current
    setLoading(true); setError(null); setContext(null); setMessages([]); setActiveConversation(null); setHasOlder(false); setPreferences(DEFAULT_COPILOT_PREFERENCES)
    if (!user) { setConversations([]); setLoading(false); return }
    try {
      const [list, snapshot] = await Promise.all([getConversations(contactId), buildAutoPilotContext(contactId)])
      const conversation = contactId && list[0] ? await getConversationById(list[0].id) : null
      if (scope !== epoch.current) return
      setConversations(list); setContext(snapshot); setActiveConversation(conversation); setMessages(conversation?.messages ?? [])
      setPreferences(DEFAULT_COPILOT_PREFERENCES)
      setHasOlder((conversation?.messages?.length ?? 0) === 100)
    } catch (err) { if (scope === epoch.current) setError(err instanceof Error ? err.message : 'Não foi possível abrir o CS Copilot.') }
    finally { if (scope === epoch.current) setLoading(false) }
  }, [contactId, user?.id])
  useEffect(() => { void loadConversations(); return () => { epoch.current++ } }, [loadConversations])
  const selectConversation = useCallback(async (id: string) => {
    if (sendLock.current) return
    const scope = ++epoch.current
    setLoading(true); setError(null)
    try {
      const conversation = await getConversationById(id)
      if (scope !== epoch.current) return
      if (!conversation || (conversation.contact_id ?? undefined) !== contactId) throw new Error('Conversa indisponível neste contexto.')
      setActiveConversation(conversation); setMessages(conversation.messages ?? [])
      setPreferences(DEFAULT_COPILOT_PREFERENCES)
      setHasOlder((conversation.messages?.length ?? 0) === 100)
    } catch (err) { if (scope === epoch.current) setError(err instanceof Error ? err.message : 'Falha ao abrir conversa.') }
    finally { if (scope === epoch.current) setLoading(false) }
  }, [contactId])
  const createNewConversation = useCallback(async () => {
    if (sendLock.current || contactId) return
    epoch.current++; setActiveConversation(null); setMessages([]); setError(null); setHasOlder(false); setPreferences(DEFAULT_COPILOT_PREFERENCES)
  }, [contactId])
  const loadOlder = useCallback(async () => {
    if (!activeConversation || !messages[0] || !hasOlder) return
    try {
      const older = await getOlderConversationMessages(activeConversation.id, messages[0])
      setMessages((current) => [...older, ...current])
      setHasOlder(older.length === 100)
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Falha ao carregar histórico anterior.') }
  }, [activeConversation, messages, hasOlder])
  const changePreferences = useCallback(async (preferences: CopilotPreferences) => {
    setPreferences(preferences)
    if (!activeConversation) return
    try {
      await updateConversationPreferences(activeConversation.id, preferences)
      setActiveConversation((current) => current?.id === activeConversation.id ? { ...current, preferences } : current)
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Falha ao salvar preferências da conversa.') }
  }, [activeConversation])
  const deleteConversation = useCallback(async (id: string) => {
    if (sendLock.current) return
    try {
      await removeConversation(id)
      setConversations((current) => current.filter((item) => item.id !== id))
      if (activeConversation?.id === id) { setActiveConversation(null); setMessages([]); setPreferences(DEFAULT_COPILOT_PREFERENCES) }
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Falha ao excluir conversa.') }
  }, [activeConversation])
  const renameConversation = useCallback(async (id: string, title: string) => {
    try {
      await updateConversationTitle(id, title)
      setActiveConversation((current) => current?.id === id ? { ...current, title } : current)
      setConversations((current) => current.map((item) => item.id === id ? { ...item, title } : item))
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Falha ao renomear conversa.') }
  }, [])
  const sendMessage = useCallback(async (content: string, selectedPreferences: CopilotPreferences = preferences, retry = false,
    files: PreparedAttachment[] = []) => {
    if (!user || !content.trim() || loading || sendLock.current) return
    sendLock.current = true; setSending(true); setError(null); setLiveText(''); setLiveStatus(null)
    const controller = new AbortController()
    abortRef.current = controller
    const scope = epoch.current
    const trimmed = content.trim()
    try {
      const [snapshot, profile] = await Promise.all([buildAutoPilotContext(contactId), loadCommercialProfile()])
      let conversation = activeConversation
      let history = messages
      if (!conversation) {
        conversation = await createConversation(contactId ? snapshot.selected_lead!.contact.name : 'Nova conversa', contactId, selectedPreferences)
        history = (await getConversationById(conversation.id))?.messages ?? []
      }
      const currentConversation = conversation
      if (scope === epoch.current) {
        setContext(snapshot); setActiveConversation(conversation); setMessages(history)
        setConversations((current) => current.some((item) => item.id === currentConversation.id) ? current : [currentConversation, ...current])
      }
      let attachments = files.map(storedAttachment)
      let images = files.flatMap((file) => file.images)
      if (retry) {
        const pending = history.at(-1)
        if (pending?.role !== 'user' || pending.content !== trimmed) throw new Error('Não há mensagem pendente para tentar novamente.')
        attachments = pending.attachments ?? []
        images = lastImages.current?.messageId === pending.id ? lastImages.current.images
          : attachments.flatMap((file) => (file.thumb ? [file.thumb] : []))
        history = history.slice(0, -1)
      } else {
        const saved = await saveMessage({ conversation_id: conversation.id, user_id: user.id, role: 'user', content: trimmed, actions: [],
          ...(attachments.length ? { attachments } : {}) })
        lastImages.current = images.length ? { messageId: saved.id, images } : null
        if (scope === epoch.current) setMessages((current) => [...current, saved])
      }
      if (contactId && !conversation.commercial_memory && history.length) {
        let completeHistory = [...history]
        let moreHistory = hasOlder
        while (completeHistory.length && moreHistory) {
          const older = await getOlderConversationMessages(conversation.id, completeHistory[0])
          if (!older.length) break
          completeHistory = [...older, ...completeHistory]
          moreHistory = older.length === 100
        }
        const memory = await summarizeCommercialMemory(null,
          completeHistory.map((message) => `${message.role}: ${message.content}`).join('\n\n'), '',
          snapshot.selected_lead?.previous_analysis?.summary, controller.signal)
        await updateCommercialMemory(conversation.id, memory)
        conversation = { ...conversation, commercial_memory: memory }
        if (snapshot.selected_lead) snapshot.selected_lead.commercial_memory = memory
        if (scope === epoch.current) setActiveConversation(conversation)
      }
      const response = await sendAutoPilotMessage(history.map((message) => ({
        role: message.role,
        content: message.content + attachmentsPromptBlock(message.attachments, 'history')
          + (message.actions.length ? '\nAções registradas: ' + JSON.stringify(message.actions) : ''),
      })), snapshot, trimmed, selectedPreferences, controller.signal,
      attachments.length ? { text: attachmentsPromptBlock(attachments, 'current'), images } : undefined, profile,
      {
        onText: (text) => { if (scope === epoch.current) { setLiveText(text); setLiveStatus(null) } },
        onStatus: (status) => { if (scope === epoch.current) setLiveStatus(status) },
      })
      const parsed = parseAutoPilotResponse(response)
      const answer = await saveMessage({ conversation_id: conversation.id, user_id: user.id, role: 'assistant',
        content: parsed.text, analysis: parsed.analysis, actions: parsed.actions.map((action) => ({ ...action, status: 'pending' })) })
      if (scope === epoch.current) { setMessages((current) => [...current, answer]); setLiveText(''); setLiveStatus(null) }
      if (contactId && !controller.signal.aborted) {
        try {
          const memory = await summarizeCommercialMemory(snapshot.selected_lead?.commercial_memory ?? null,
            trimmed, response, snapshot.selected_lead?.previous_analysis?.summary, controller.signal)
          await updateCommercialMemory(conversation.id, memory)
          if (scope === epoch.current) {
            setActiveConversation((current) => current?.id === conversation.id ? { ...current, commercial_memory: memory } : current)
            setContext((current) => current?.selected_lead
              ? { ...current, selected_lead: { ...current.selected_lead, commercial_memory: memory } } : current)
          }
        } catch (memoryError) {
          if (!controller.signal.aborted) toast.error(memoryError instanceof Error ? memoryError.message : 'Falha ao atualizar memória comercial.')
        }
      }
      if (!contactId && conversation.title === 'Nova conversa') await renameConversation(conversation.id, generateConversationTitle(trimmed))
    } catch (err) { if (scope === epoch.current && !controller.signal.aborted) setError(err instanceof Error ? err.message : 'Falha ao consultar o CS Copilot.') }
    finally { if (abortRef.current === controller) abortRef.current = null; sendLock.current = false; setSending(false); setLiveText(''); setLiveStatus(null) }
  }, [user, loading, contactId, activeConversation, messages, hasOlder, preferences, renameConversation, loadCommercialProfile])
  const cancelGeneration = () => abortRef.current?.abort()
  const retryAvailable = messages.at(-1)?.role === 'user' && Boolean(activeConversation)
  const retryLast = () => {
    if (retryAvailable) void sendMessage(messages.at(-1)!.content, preferences, true)
  }
  const setActionState = (id: string, index: number, status: ActionStatus) => {
    setMessages((current) => current.map((message) => message.id === id
      ? { ...message, actions: message.actions.map((action, i) => i === index ? { ...action, status } : action) } : message))
  }
  const confirmAction = async (messageId: string, actionIndex: number) => {
    const action = messages.find((message) => message.id === messageId)?.actions[actionIndex]
    const key = messageId + ':' + actionIndex
    if (!action || !['pending', 'failed'].includes(action.status) || actionLocks.current.has(key)) return
    actionLocks.current.add(key)
    let executed = false
    let claimed = false
    try {
      const lead = context?.selected_lead
      if (lead && !action.payload.contact_id && !action.payload.deal_id) throw new Error('A ação precisa identificar o lead ou negócio aberto.')
      if (lead && ((action.payload.contact_id && action.payload.contact_id !== lead.contact.id)
        || (action.payload.deal_id && !lead.deals.some((deal) => deal.id === action.payload.deal_id)))) throw new Error('A ação não pertence ao lead aberto.')
      claimed = await claimAction(messageId, actionIndex)
      if (!claimed) throw new Error('Esta ação já foi confirmada. Atualize a conversa.')
      setActionState(messageId, actionIndex, 'confirmed')
      await executeAction(action)
      executed = true
      await updateActionStatus(messageId, actionIndex, 'executed')
      setActionState(messageId, actionIndex, 'executed')
      toast.success('Ação executada.')
      await refreshContext()
    } catch (err) {
      if (claimed && !executed) {
        await updateActionStatus(messageId, actionIndex, 'failed').catch(() => undefined)
        setActionState(messageId, actionIndex, 'failed')
      }
      toast.error(executed ? 'A ação foi realizada, mas o histórico não foi atualizado. Confira o CRM antes de repetir.' : err instanceof Error ? err.message : 'Falha ao executar ação.')
    } finally { actionLocks.current.delete(key) }
  }
  const rejectAction = async (messageId: string, actionIndex: number) => {
    const action = messages.find((message) => message.id === messageId)?.actions[actionIndex]
    if (!action || !['pending', 'failed'].includes(action.status) || actionLocks.current.has(messageId + ':' + actionIndex)) return
    try { await updateActionStatus(messageId, actionIndex, 'rejected'); setActionState(messageId, actionIndex, 'rejected') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Falha ao recusar ação.') }
  }
  // null enquanto carrega: o aviso de perfil vazio só aparece depois de conferir.
  const commercialProfileMissing = commercialProfile !== null && isCommercialProfileEmpty(commercialProfile)
  return { conversations, activeConversation, messages, context, preferences, loading, sending, error, hasOlder, retryAvailable,
    commercialProfileMissing, liveText, liveStatus,
    loadConversations, loadOlder, selectConversation, createNewConversation, deleteConversation, renameConversation,
    changePreferences, sendMessage, retryLast, cancelGeneration, confirmAction, rejectAction, refreshContext }
}
