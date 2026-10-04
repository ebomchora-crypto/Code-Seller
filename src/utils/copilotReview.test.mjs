import assert from 'node:assert/strict'
import test from 'node:test'
import {
  cleanRewrite,
  isFirstContactRequest,
  pickBetter,
  reviewRewritePrompt,
  reviewSuggestedMessage,
} from '../../supabase/functions/ai-chat/review.ts'

const FIRST = { firstContact: true, mode: 'quick_reply' }
const codes = (message, options = FIRST) => reviewSuggestedMessage(message, options).map((problem) => problem.code)

test('detects first-contact requests on the server like the app does', () => {
  assert.equal(isFirstContactRequest('Faz uma mensagem de primeiro contato pra imobiliárias em Braga'), true)
  assert.equal(isFirstContactRequest('cria uma abordagem pra barbearias'), true)
  assert.equal(isFirstContactRequest('o cliente disse que está caro, o que respondo?'), false)
})

test('a methodology-compliant first message passes', () => {
  const good = 'Oi, tudo bem? Vi que a [nome da imobiliária] tem ótimas avaliações, mas quem procura no Google não acha um site de vocês. Montei uma prévia de como poderia ficar. Posso te mandar por aqui?'
  assert.deepEqual(codes(good), [])
})

test('flags the generic message the user complained about', () => {
  const generic = 'Olá! Sou o Arthur, da Code Sellers. Trabalho com criação de sites profissionais e estou entrando em contato com algumas empresas da região para ajudar a aumentar a presença digital e atrair potenciais clientes. Tem interesse em conversar?'
  const found = codes(generic)
  assert.ok(found.includes('self_intro'))
  assert.ok(found.includes('mass_outreach'))
  assert.ok(found.includes('marketing'))
})

test('first message must be short and end with a question', () => {
  const long = Array.from({ length: 7 }, (_, i) => `Linha ${i + 1} falando do negócio de vocês.`).join('\n')
  assert.ok(codes(long).includes('too_long'))
  assert.ok(codes(long).includes('no_question'))
})

test('a short line about the seller after personalization is allowed', () => {
  const kitLike = 'Oi, tudo bem? Vi o Instagram da clínica e os resultados são lindos. Eu crio sites para clínicas e montei uma ideia para vocês. Posso te mostrar?'
  assert.deepEqual(codes(kitLike), [])
})

test('fake urgency and marketing are flagged in any mode', () => {
  const options = { firstContact: false, mode: 'objection' }
  assert.deepEqual(codes('Entendo! Mas são as últimas vagas do mês, não perca.', options), ['fake_urgency'])
  assert.deepEqual(codes('Esse site vai alavancar o seu negócio.', options), ['marketing'])
  assert.deepEqual(codes('Entendo. Comparado com o quê?', options), [])
})

test('only follow-ups get the general length limit', () => {
  const long = 'Oi! '.repeat(200)
  assert.deepEqual(codes(long, { firstContact: false, mode: 'follow_up' }), ['too_long'])
  assert.deepEqual(codes(long, { firstContact: false, mode: 'analysis' }), [])
})

test('empty messages are not reviewed', () => {
  assert.deepEqual(codes(''), [])
})

test('keeps the rewrite only when it is better', () => {
  const bad = 'Olá! Sou o Arthur e trabalho com sites. Quer melhorar sua presença digital?'
  const better = 'Oi, tudo bem? Vi que a clínica não tem site e as avaliações são ótimas. Posso te mandar uma prévia?'
  assert.equal(pickBetter(bad, `"${better}"`, FIRST).message, better)
  assert.equal(pickBetter(bad, 'Sou o Arthur, especialista em presença digital. Vamos conversar?', FIRST).message, bad)
  assert.equal(pickBetter(bad, '<commercial_response>{}</commercial_response>', FIRST).message, bad)
  assert.equal(pickBetter(bad, '', FIRST).message, bad)
})

test('cleans labels and quotes from the rewrite', () => {
  assert.equal(cleanRewrite('Mensagem revisada: “Oi, posso te mostrar?”'), 'Oi, posso te mostrar?')
})

test('rewrite prompt lists the problems and asks for the message only', () => {
  const prompt = reviewRewritePrompt(reviewSuggestedMessage('Sou o Arthur. Tem interesse.', FIRST), FIRST)
  assert.match(prompt, /apresentação institucional/)
  assert.match(prompt, /SOMENTE com o texto final/)
})
