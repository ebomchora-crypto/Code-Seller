import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'vite'

const server = await createServer({ server:{middlewareMode:true}, logLevel:'silent' })
const { parseAutoPilotResponse, serializeContext } = await server.ssrLoadModule('/src/utils/autopilot.ts')
await server.close()

const analysis = {interest:'Alto',stage:'Proposta',evidence:'Pediu preco',objection:'',summary:'Resumo',next_action:'Confirmar escopo',suggested_message:'Qual o escopo?',follow_up_at:null}
const commercial = {mode:'quick_reply',interest:'Moderado',stage:'Interesse',evidence:'Perguntou o preço',objection:'Não identificada',risk:'Responder sem preço',summary:'O lead gostou e perguntou o valor.',next_action:'Responder à pergunta',reason:'Evita atrito.',strategy:'Informar o valor e avançar.',suggested_message:'O investimento é R$ 500.',next_step:'Aguardar a resposta.',follow_up_at:null}

test('extracts the complete commercial response contract', () => {
  const result = parseAutoPilotResponse('<commercial_response>'+JSON.stringify(commercial)+'</commercial_response>')
  assert.equal(result.analysis.mode, 'quick_reply')
  assert.equal(result.analysis.risk, 'Responder sem preço')
  assert.equal(result.analysis.strategy, 'Informar o valor e avançar.')
  assert.equal(result.text, '')
})

test('extracts analysis and preserves independent action markers', () => {
  const action = {type:'create_task',label:'Confirmar',description:'Uma tarefa',payload:{title:'Confirmar escopo'}}
  const result = parseAutoPilotResponse('Contexto\n<lead_analysis>'+JSON.stringify(analysis)+'</lead_analysis><action>'+JSON.stringify(action)+'</action>')
  assert.equal(result.analysis.suggested_message, analysis.suggested_message)
  assert.equal(result.actions.length, 1)
  assert.match(result.text,/\{\{ACTION:0\}\}/)
  assert.ok(!result.text.includes('lead_analysis'))
  assert.equal(result.actions[0].status,undefined)
})
test('rejects unknown actions and malformed analysis without throwing', () => {
  const result = parseAutoPilotResponse('Resposta legivel<lead_analysis>{bad}</lead_analysis><action>{"type":"send_whatsapp"}</action>')
  assert.equal(result.analysis,null)
  assert.deepEqual(result.actions,[])
  assert.equal(result.text,'Resposta legivel')
})
test('preserves full lead context without exposing proposal access tokens', () => {
  const result = JSON.parse(serializeContext({selected_lead:{contact:{notes:'x'.repeat(7000)},interactions:Array.from({length:50},()=>({content:'y'.repeat(2000)})),activities:[],tasks:[],proposals:[{body:'z'.repeat(3000),token:'private-token'}],prototypes:[]}}))
  assert.equal(result.selected_lead.contact.notes.length,7000)
  assert.equal(result.selected_lead.interactions.length,50)
  assert.equal(result.selected_lead.interactions[0].content.length,2000)
  assert.equal(result.selected_lead.proposals[0].token,undefined)
})

test('conversational answer keeps the prose and places the ready message where the AI put it', () => {
  const raw = 'Ele gostou da prévia, então é hora de puxar a conversa.\n<mensagem_pronta>\nQue bom que gostou! O que mais chamou sua atenção?\n</mensagem_pronta>\n**Por que funciona:** faz ele falar.\n<commercial_response>'+JSON.stringify({...commercial,suggested_message:''})+'</commercial_response>'
  const result = parseAutoPilotResponse(raw)
  assert.equal(result.analysis.suggested_message, 'Que bom que gostou! O que mais chamou sua atenção?')
  assert.match(result.text, /^Ele gostou da prévia/)
  assert.match(result.text, /\{\{MESSAGE\}\}/)
  assert.match(result.text, /Por que funciona/)
  assert.ok(!result.text.includes('mensagem_pronta'))
})

test('a ready message without analysis becomes a quote and the block keeps its own message', () => {
  assert.equal(parseAutoPilotResponse('Oi\n<mensagem_pronta>Teste</mensagem_pronta>').text, 'Oi\n\n> Teste')
  const withMessage = parseAutoPilotResponse('<mensagem_pronta>Da tag</mensagem_pronta><commercial_response>'+JSON.stringify(commercial)+'</commercial_response>')
  assert.equal(withMessage.analysis.suggested_message, 'O investimento é R$ 500.')
})
