import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  createConversation,
  deleteConversation as deleteConversationService,
  getConversationById,
  getConversations,
  saveMessage,
  updateActionStatus,
  updateConversationTitle,
} from '@/services/supabase/autopilot'
import { buildAutoPilotContext } from '@/services/supabase/autopilotContext'
import { executeAction } from '@/services/autopilot/actionExecutor'
import { sendAutoPilotMessage } from '@/integrations/anthropic'
import { generateConversationTitle, parseAutoPilotResponse } from '@/utils/autopilot'
import { useAuthContext } from '@/stores/AuthContext'
import type { AutoPilotContext, AutoPilotConversation, AutoPilotMessage } from '@/types'

const MAX_HISTORY_MESSAGES = 20
const DEFAULT_TITLE = 'Nova conversa'

export function useAutoPilot() {
  const { user } = useAuthContext()
  const [conversations, setConversations] = useState<AutoPilotConversation[]>([])
  const [activeConversation, setActiveConversation] = useState<AutoPilotConversation | null>(null)
  const [messages, setMessages] = useState<AutoPilotMessage[]>([])
  const [context, setContext] = useState<AutoPilotContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadConversations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getConversations()
      setConversations(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as conversas.')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshContext = useCallback(async () => {
    try {
      const result = await buildAutoPilotContext()
      setContext(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível carregar o contexto do AutoPilot.')
    }
  }, [])

  useEffect(() => {
    void loadConversations()
    void refreshContext()
  }, [loadConversations, refreshContext])

  const selectConversation = useCallback(async (id: string) => {
    try {
      const conversation = await getConversationById(id)
      if (!conversation) {
        toast.error('Conversa não encontrada.')
        return
      }
      setActiveConversation(conversation)
      setMessages(conversation.messages ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível abrir a conversa.')
    }
  }, [])

  const createNewConversation = useCallback(async () => {
    try {
      const conversation = await createConversation(DEFAULT_TITLE)
      setConversations((current) => [conversation, ...current])
      setActiveConversation(conversation)
      setMessages([])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível criar uma nova conversa.')
    }
  }, [])

  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await deleteConversationService(id)
        setConversations((current) => current.filter((conversation) => conversation.id !== id))
        if (activeConversation?.id === id) {
          setActiveConversation(null)
          setMessages([])
        }
        toast.success('Conversa excluída.')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível excluir a conversa.')
      }
    },
    [activeConversation],
  )

  const renameConversation = useCallback(async (id: string, title: string) => {
    try {
      await updateConversationTitle(id, title)
      setActiveConversation((current) => (current?.id === id ? { ...current, title } : current))
      setConversations((current) => current.map((item) => (item.id === id ? { ...item, title } : item)))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível renomear a conversa.')
    }
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user) return
      const trimmed = content.trim()
      if (!trimmed) return

      let conversation = activeConversation
      if (!conversation) {
        try {
          conversation = await createConversation(DEFAULT_TITLE)
          setConversations((current) => [conversation!, ...current])
          setActiveConversation(conversation)
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Não foi possível iniciar a conversa.')
          return
        }
      }

      const isFirstMessage = messages.length === 0

      const optimisticUserMessage: AutoPilotMessage = {
        id: `temp-user-${Date.now()}`,
        conversation_id: conversation.id,
        user_id: user.id,
        role: 'user',
        content: trimmed,
        actions: [],
        created_at: new Date().toISOString(),
      }
      setMessages((current) => [...current, optimisticUserMessage])
      setSending(true)
      setError(null)

      try {
        const savedUserMessage = await saveMessage({
          conversation_id: conversation.id,
          user_id: user.id,
          role: 'user',
          content: trimmed,
          actions: [],
        })
        setMessages((current) =>
          current.map((message) => (message.id === optimisticUserMessage.id ? savedUserMessage : message)),
        )

        const history = messages
          .slice(-MAX_HISTORY_MESSAGES)
          .map((message) => ({ role: message.role, content: message.content }))

        const activeContext = context ?? (await buildAutoPilotContext())
        if (!context) setContext(activeContext)

        const rawResponse = await sendAutoPilotMessage(history, activeContext, trimmed)
        const { text, actions } = parseAutoPilotResponse(rawResponse)

        const assistantMessage = await saveMessage({
          conversation_id: conversation.id,
          user_id: user.id,
          role: 'assistant',
          content: text,
          actions: actions.map((action) => ({ ...action, status: 'pending' as const })),
        })
        setMessages((current) => [...current, assistantMessage])

        if (isFirstMessage && conversation.title === DEFAULT_TITLE) {
          const title = generateConversationTitle(trimmed)
          await updateConversationTitle(conversation.id, title)
          setActiveConversation((current) => (current ? { ...current, title } : current))
          setConversations((current) =>
            current.map((item) => (item.id === conversation!.id ? { ...item, title } : item)),
          )
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Não foi possível obter resposta do AutoPilot.'
        setError(message)
        toast.error(message)
      } finally {
        setSending(false)
      }
    },
    [activeConversation, context, messages, user],
  )

  const confirmAction = useCallback(
    async (messageId: string, actionIndex: number) => {
      const message = messages.find((item) => item.id === messageId)
      const action = message?.actions[actionIndex]
      if (!action) return

      try {
        await executeAction(action)
        await updateActionStatus(messageId, actionIndex, 'executed')
        setMessages((current) =>
          current.map((item) =>
            item.id === messageId
              ? { ...item, actions: item.actions.map((a, i) => (i === actionIndex ? { ...a, status: 'executed' } : a)) }
              : item,
          ),
        )
        toast.success(`Ação executada: ${action.label}`)
        void refreshContext()
      } catch (err) {
        await updateActionStatus(messageId, actionIndex, 'failed').catch(() => undefined)
        setMessages((current) =>
          current.map((item) =>
            item.id === messageId
              ? { ...item, actions: item.actions.map((a, i) => (i === actionIndex ? { ...a, status: 'failed' } : a)) }
              : item,
          ),
        )
        toast.error(err instanceof Error ? err.message : 'Não foi possível executar a ação.')
      }
    },
    [messages, refreshContext],
  )

  const rejectAction = useCallback(async (messageId: string, actionIndex: number) => {
    try {
      await updateActionStatus(messageId, actionIndex, 'rejected')
      setMessages((current) =>
        current.map((item) =>
          item.id === messageId
            ? { ...item, actions: item.actions.map((a, i) => (i === actionIndex ? { ...a, status: 'rejected' } : a)) }
            : item,
        ),
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível rejeitar a ação.')
    }
  }, [])

  return {
    conversations,
    activeConversation,
    messages,
    context,
    loading,
    sending,
    error,
    loadConversations,
    selectConversation,
    createNewConversation,
    deleteConversation,
    renameConversation,
    sendMessage,
    confirmAction,
    rejectAction,
    refreshContext,
  }
}
