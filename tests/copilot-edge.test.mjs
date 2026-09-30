import assert from 'node:assert/strict'
import test from 'node:test'
import { splitText, copilotParts } from '../supabase/functions/ai-chat/context.ts'

const large = 'Cliente recusou reunião. '.repeat(1400) + 'Pediu preço direto.'
test('chunking preserves a long pasted conversation exactly', () => {
  const chunks = splitText(large, 12000)
  assert.ok(chunks.length > 2)
  assert.equal(chunks.join(''), large)
  assert.ok(chunks.every(chunk => chunk.length <= 12000))
})

test('copilot message contract keeps the current request last', () => {
  const messages = [{role:'system',content:'instructions'},{role:'system',content:'CRM'},
    {role:'assistant',content:'old'},{role:'user',content:'latest'}]
  const parts = copilotParts(messages)
  assert.equal(parts.current.content,'latest')
  assert.equal(parts.history.length,1)
  assert.throws(()=>copilotParts(messages.slice(0,-1)))
})

let handle
globalThis.Deno = {
  env:{get: name => ({SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_ANON_KEY:'public-fixture',
    EXPERIENTIAL_API_KEY:'private-fixture'})[name]},
  serve: callback => { handle = callback },
}
await import('../supabase/functions/ai-chat/index.ts')
const originalFetch = globalThis.fetch
const providerCalls = []
globalThis.fetch = async (input, options) => {
  if (String(input).endsWith('/auth/v1/user')) {
    return new Response(JSON.stringify({id:'fixture-user'}),{status:options.headers.authorization==='Bearer authenticated' ? 200 : 401})
  }
  const payload = JSON.parse(options.body)
  providerCalls.push(payload)
  const summary = payload.messages[0].content.includes('Comprima o material')
  return new Response(JSON.stringify({choices:[{message:{content:summary
    ? 'Resumo: ' + [...new Set(payload.messages.at(-1).content.match(/PRECO_500|SEM_REUNIAO|PROTOTIPO_ENVIADO/g) ?? [])].join(', ')
    : 'Resposta comercial completa.'},finish_reason:'stop'}]}))
}

test('requires a logged-in user before invoking paid AI', async () => {
  providerCalls.length = 0
  const request = new Request('https://fixture.supabase.co/functions/v1/ai-chat',
    {method:'POST',headers:{authorization:'Bearer public-anon'},body:JSON.stringify({messages:[{role:'user',content:'oi'}]})})
  const response = await handle(request)
  assert.equal(response.status,401)
  assert.equal(providerCalls.length,0)
})

test('long CRM and user input are all sent through summarization with current tail literal', async () => {
  providerCalls.length = 0
  const text = 'SEM_REUNIAO ' + 'conversa '.repeat(2500) + 'PRECO_500 ' + 'resposta '.repeat(1400) + 'Pediu preço agora.'
  const messages = [{role:'system',content:'Não insista na reunião recusada.'},
    {role:'system',content:'PROTOTIPO_ENVIADO ' + 'historico '.repeat(2400)},
    {role:'user',content:text}]
  const response = await handle(new Request('https://fixture.supabase.co/functions/v1/ai-chat',
    {method:'POST',headers:{authorization:'Bearer authenticated'},body:JSON.stringify({mode:'copilot',messages})}))
  assert.equal(response.status,200)
  assert.equal((await response.json()).choices[0].message.content,'Resposta comercial completa.')
  assert.ok(providerCalls.length > 3)
  assert.ok(providerCalls.some(call=>JSON.stringify(call).includes('SEM_REUNIAO')))
  assert.ok(providerCalls.some(call=>JSON.stringify(call).includes('PRECO_500')))
  assert.ok(providerCalls.some(call=>JSON.stringify(call).includes('PROTOTIPO_ENVIADO')))
  const final = providerCalls.at(-1)
  assert.match(final.messages.at(-1).content,/Pediu preço agora/)
  assert.equal(final.max_tokens,6000)
})

test('commercial memory retains prior facts for the next request', async () => {
  providerCalls.length = 0
  const response = await handle(new Request('https://fixture.supabase.co/functions/v1/ai-chat',
    {method:'POST',headers:{authorization:'Bearer authenticated'},body:JSON.stringify({
      mode:'commercial_memory',messages:[{role:'user',content:'Memória anterior: SEM_REUNIAO. Novo fato: PRECO_500.'}],
    })}))
  assert.equal(response.status,200)
  const data = await response.json()
  assert.match(data.memory,/SEM_REUNIAO/)
  assert.match(data.memory,/PRECO_500/)
  assert.ok(providerCalls.every(call=>call.max_tokens===2400))
})

test.after(()=> { globalThis.fetch = originalFetch })
