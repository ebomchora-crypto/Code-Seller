import assert from 'node:assert/strict'
import test from 'node:test'
import { analysisNote, historyForModel } from './copilotHistory.ts'
import { createServer } from 'vite'
import { copilotConversationInstructions } from './copilotPrompt.ts'
import { COPILOT_PERMANENT_PROMPT, copilotInstructions, COPILOT_PROMPT_VERSION } from '../../supabase/functions/ai-chat/copilotPrompt.ts'
import { attributedHistory, historyWindow } from '../../supabase/functions/ai-chat/context.ts'

// autopilot.ts usa imports do app (sem extensão): carrega pelo Vite.
const server = await createServer({ server: { middlewareMode: true }, logLevel: 'silent' })
const { parseAutoPilotResponse } = await server.ssrLoadModule('/src/utils/autopilot.ts')
test.after(() => server.close())

const analysis = {
  mode: 'quick_reply', interest: 'Moderado', stage: 'Prévia enviada', evidence: 'Visualizou', objection: 'Não identificada',
  risk: 'Não identificado', summary: 'Prévia enviada ontem.', next_action: 'Mandar follow-up', reason: 'x', strategy: 'y',
  suggested_message: '', next_step: 'Se responder, marcar a conversa', follow_up_at: null,
}

function stored(raw) {
  // O que o app guarda no banco depois de receber a resposta.
  const parsed = parseAutoPilotResponse(raw)
  return { id: 'a1', conversation_id: 'c', user_id: 'u', role: 'assistant', content: parsed.text, analysis: parsed.analysis,
    actions: parsed.actions.map((action) => ({ ...action, status: 'pending' })), created_at: '' }
}

test('a mensagem pronta que o Copilot escreveu volta para ele no histórico (antes ia só {{MESSAGE}})', () => {
  const message = 'Oi, Carla! Ajustei a página de procedimentos da clínica. Te mostro amanhã às 10h ou prefere à tarde?'
  const saved = stored(`Manda isso amanhã cedo:\n<mensagem_pronta>\n${message}\n</mensagem_pronta>\nSe não responder, tenta sexta.\n<commercial_response>${JSON.stringify(analysis)}</commercial_response>`)
  assert.match(saved.content, /\{\{MESSAGE\}\}/)
  const [entry] = historyForModel([saved])
  assert.equal(entry.role, 'assistant')
  assert.doesNotMatch(entry.content, /\{\{MESSAGE\}\}/)
  assert.match(entry.content, new RegExp(`<mensagem_pronta>\\n${message.replace(/[?.]/g, '\\$&')}\\n</mensagem_pronta>`))
  assert.match(entry.content, /Se não responder, tenta sexta/)
  assert.match(entry.content, /etapa: Prévia enviada; interesse: Moderado; próximo passo: Se responder, marcar a conversa/)
  assert.doesNotMatch(entry.content, /objeção/)
})

test('ações viram uma linha legível e mensagens do usuário levam os anexos', () => {
  const saved = stored(`Crio a tarefa.\n<action>{"type":"create_task","label":"Follow-up sexta","description":"x","payload":{"title":"t"}}</action>`)
  saved.actions[0].status = 'executed'
  const user = { id: 'u1', conversation_id: 'c', user_id: 'u', role: 'user', content: 'olha o print', actions: [],
    attachments: [{ name: 'conversa.txt', kind: 'document', size: 10, text: 'Cliente: quanto custa?' }], created_at: '' }
  const [first, second] = historyForModel([user, saved])
  assert.match(first.content, /olha o print[\s\S]*conversa\.txt[\s\S]*quanto custa\?/)
  assert.match(second.content, /\[ação proposta \(create_task\): Follow-up sexta — status executed\]/)
  assert.doesNotMatch(second.content, /\{\{ACTION/)
})

test('mensagem antiga sem marcador ainda recebe a mensagem pronta e a leitura vazia some', () => {
  const old = { id: 'o', conversation_id: 'c', user_id: 'u', role: 'assistant', content: 'Resposta antiga.', actions: [], created_at: '',
    analysis: { ...analysis, suggested_message: 'Oi! Posso te mandar a prévia?', stage: 'Indeterminada', interest: 'Indeterminado', next_step: '' } }
  const [entry] = historyForModel([old])
  assert.match(entry.content, /Resposta antiga\.\n\n<mensagem_pronta>\nOi! Posso te mandar a prévia\?\n<\/mensagem_pronta>$/)
  assert.equal(analysisNote(null), '')
})

test('janela do histórico mantém as mensagens recentes literais e só resume as antigas', () => {
  const history = Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `${i}:`.padEnd(3000, 'x') }))
  const { older, recent } = historyWindow(history, 16000)
  assert.equal(recent.length, 5)
  assert.equal(older.length, 5)
  assert.equal(recent.at(-1).content.slice(0, 2), '9:')
  // A última troca vai sempre literal, mesmo maior que o orçamento.
  const huge = [{ role: 'user', content: 'a'.repeat(30000) }, { role: 'assistant', content: 'b'.repeat(30000) }]
  assert.equal(historyWindow(huge, 16000).recent.length, 2)
  const withSummary = attributedHistory(recent, 'resumo')
  assert.equal(withSummary.length, 6)
  assert.match(withSummary[0].content, /summarized_conversation_history/)
  assert.equal(attributedHistory(recent).length, 5)
})

test('prompt permanente traz os módulos novos e resolve os conflitos antigos', () => {
  for (const part of ['INTERPRETAÇÃO DO PEDIDO', 'RACIOCÍNIO COMERCIAL', 'METODOLOGIA CODE SELLERS', 'TÉCNICAS COMERCIAIS', 'NICHOS', 'FOLLOW-UP', 'SEGURANÇA', '<commercial_response>', 'create_task']) {
    assert.ok(COPILOT_PERMANENT_PROMPT.includes(part), part)
  }
  assert.match(COPILOT_PERMANENT_PROMPT, /Deixa mais persuasivo/)
  assert.match(COPILOT_PERMANENT_PROMPT, /Só passando para saber/)
  assert.match(COPILOT_PERMANENT_PROMPT, /oportunidade real/)
  assert.match(COPILOT_PERMANENT_PROMPT, /Exceção: se o lead já recusou reunião/)
  // O antigo "não use storytelling/FOMO" conflitava com o uso seletivo pedido.
  assert.doesNotMatch(COPILOT_PERMANENT_PROMPT, /Não use FOMO, storytelling/)
  assert.doesNotMatch(COPILOT_PERMANENT_PROMPT, /\(2 a 4 linhas\)/)
  assert.equal(COPILOT_PROMPT_VERSION, 2)
  const full = copilotInstructions('PREFERÊNCIAS:\n- Tom: natural.')
  assert.ok(full.startsWith(COPILOT_PERMANENT_PROMPT))
  assert.match(full, /CONFIGURAÇÃO DESTA CONVERSA[\s\S]*Tom: natural/)
})

test('configuração da conversa leva preferências legíveis, perfil, Kit e a orientação do pedido', () => {
  const config = copilotConversationInstructions({ playbook: 'whatsapp', tone: 'direct', length: 'short', language: 'pt_pt' }, null, 'ele achou caro')
  assert.match(config, /Tom: direto/)
  assert.match(config, /português de Portugal/)
  assert.match(config, /Venda pelo WhatsApp/)
  assert.match(config, /PERFIL COMERCIAL DO USUÁRIO: ainda não preenchido/)
  assert.match(config, /MODELOS DO KIT/)
  assert.match(config, /Objeção de preço/)
  assert.doesNotMatch(config, /"playbook"/)
})
