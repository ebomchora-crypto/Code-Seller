// An isolated fetch fixture: no Supabase request leaves this browser page.
if (!import.meta.env.DEV || location.hostname !== '127.0.0.1') throw new Error('Local test only')
const user = { id:'00000000-0000-4000-8000-000000000001', email:'fixture@example.invalid', created_at:new Date().toISOString(), user_metadata:{name:'Teste'} }
const now = Date.now()
const date = (days: number) => new Date(now + days * 86400000).toISOString()
const contact = (id: string, name: string) => ({id, name, user_id:user.id, status:'negotiating', niche:'Servicos', city:'Sao Paulo', state:'SP', phone:null, email:null, origin:'manual', notes:'Precisa de um site para captar clientes.', created_at:date(-10), updated_at:date(-1), contact_tags:[]})
const leadA = contact('00000000-0000-4000-8000-000000000002','Lead Teste Alfa')
const leadB = contact('00000000-0000-4000-8000-000000000003','Lead Teste Beta')
const task = {id:'00000000-0000-4000-8000-000000000004', user_id:user.id, contact_id:leadA.id, deal_id:null, title:'Retomar proposta Alfa', description:null, status:'todo', kind:'follow_up', followup_step:1, copilot_key:null, due_date:date(-1), reminder_at:date(-1), reminder_seen_at:date(-1), created_at:date(-2), updated_at:date(-2), recurrence:'none', recurrence_end_date:null, parent_task_id:null, completed_at:null, position:0, priority:'medium', assigned_to:null, task_tags:[]}
const fixtureConversation = {id:'00000000-0000-4000-8000-000000000010',user_id:user.id,contact_id:null,title:'Resposta pronta de teste',preferences:null,commercial_memory:null,created_at:date(-1),updated_at:date(0)}
const fixtureAnalysis = {mode:'quick_reply',interest:'Moderado',stage:'Interesse',evidence:'O lead gostou e perguntou o preço.',objection:'Não identificada',risk:'Desviar da pergunta pode gerar atrito.',summary:'O lead demonstrou interesse e pediu o valor.',next_action:'Responder ao preço agora.',reason:'A pergunta foi direta.',strategy:'Responder com objetividade e manter o avanço.',suggested_message:'Que bom que gostou! O investimento para este escopo é de R$ 500. Qual parte você gostaria que eu detalhasse primeiro?',next_step:'Se ele demonstrar interesse, alinhe escopo e prazo.',follow_up_at:null}
const fixtureMessage = {id:'00000000-0000-4000-8000-000000000011',conversation_id:fixtureConversation.id,user_id:user.id,role:'assistant',content:'',analysis:fixtureAnalysis,actions:[],created_at:date(0)}
type Row = Record<string, any>
const db: Record<string, Row[]> = {
  contacts:[leadA,leadB], tasks:[task], deals:[],
  interactions:[{id:crypto.randomUUID(),user_id:user.id,contact_id:leadA.id,type:'whatsapp',direction:'inbound',content:'Gostei do prototipo. Podemos conversar amanha?',occurred_at:date(-0.1),created_at:date(-0.1),metadata:null}],
  autopilot_conversations:[fixtureConversation],autopilot_messages:[fixtureMessage],sites:[],deal_activities:[],online_proposals:[],
  user_profiles:[{id:user.id,full_name:'Teste local',company_name:'Teste'}], message_templates:[], portfolio_pages:[],
  academy_progress:[],
}
const ref = new URL(import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co').hostname.split('.')[0]
localStorage.setItem('sb-' + ref + '-auth-token', JSON.stringify({access_token:'test.fixture.signature',refresh_token:'fixture-only',expires_at:Math.floor(now/1000)+86400,token_type:'bearer',user}))
const originalFetch = window.fetch.bind(window)
const respond = (body: unknown, status=200) => new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}})
let writes = 0
const audit = document.createElement('output')
audit.setAttribute('aria-label','Fixture audit')
audit.style.cssText = 'position:fixed;bottom:0;left:0;z-index:10000;font-size:10px;background:white;color:black;max-width:100%;pointer-events:none'
document.body.append(audit)
const updateAudit = () => { audit.textContent = JSON.stringify({writes,tasks:db.tasks.map(({title,status,due_date,reminder_seen_at})=>({title,status,due_date,reminder_seen_at})),messages:db.autopilot_messages.length,notes:db.interactions.length}) }
updateAudit()
window.fetch = async (input, init) => {
  const request = new Request(input,init)
  const url = new URL(request.url)
  if (url.origin === location.origin) return originalFetch(input,init)
  if (!url.hostname.endsWith('.supabase.co')) throw new Error('Blocked remote request in fixture')
  if (url.pathname === '/auth/v1/user') return respond(user)
  if (url.pathname.startsWith('/functions/v1/')) {
    const payload = await request.json()
    if (payload.mode === 'commercial_memory') return respond({memory:'Lead demonstrou interesse e pediu continuidade da conversa.'})
    const history = JSON.stringify(payload)
    if (history.includes('preferences') && history.includes('material')) return respond({choices:[{message:{role:'assistant',content:'Mensagem personalizada para Lead Teste Alfa.'}}]})
    const name = history.includes('Lead Teste Alfa') ? 'Alfa' : 'Beta'
    const analysis = {interest:'alto',stage:'Negociacao',evidence:'O lead pediu uma conversa.',objection:'Nenhuma registrada',summary:'Interesse no site de ' + name, next_action:'Agendar conversa com ' + name, suggested_message:'Oi, '+name+'! Podemos conversar amanha as 10h?',follow_up_at:date(2)}
    return respond({choices:[{message:{role:'assistant',content:'<lead_analysis>'+JSON.stringify(analysis)+'</lead_analysis>'}}]})
  }
  const table = url.pathname.split('/').pop()!
  if (url.pathname.includes('/rpc/')) {
    const {p_message_id,p_index,p_status} = await request.json()
    const message = db.autopilot_messages.find(row=>row.id===p_message_id)
    const action = message?.actions?.[p_index]
    if (!action) return respond(false)
    const next = table === 'claim_copilot_action' ? 'confirmed' : p_status
    const valid = next === 'confirmed' || next === 'rejected' ? ['pending','failed'].includes(action.status) : action.status === 'confirmed'
    if (valid) { action.status=next; writes++; updateAudit() }
    return respond(valid)
  }
  const rows = db[table] ?? []
  const matches = (row: Row) => [...url.searchParams].every(([key,value]) => {
    if (['select','order','limit','offset'].includes(key)) return true
    if (key==='or') return table==='contacts' ? value.toLowerCase().includes(String(row.name).toLowerCase().split(' ')[0]) || String(row.name).toLowerCase().includes(value.match(/%([^%]+)%/)?.[1]?.toLowerCase()??'') : value.includes(row.contact_id) || Boolean(row.deal_id && value.includes(row.deal_id))
    if (key==='autopilot_conversations.contact_id') return db.autopilot_conversations.some(c=>c.id===row.conversation_id && c.contact_id===value.slice(3))
    if (value.startsWith('eq.')) return String(row[key])===value.slice(3)
    if (value==='is.null') return row[key]==null
    if (value==='not.is.null') return row[key]!=null
    if (value.startsWith('in.')) return value.slice(4,-1).split(',').includes(row[key])
    return true
  })
  let result = rows.filter(matches)
  if (request.method==='POST') {
    const values = await request.json()
    result = (Array.isArray(values)?values:[values]).map(value=>({id:crypto.randomUUID(),created_at:date(0),updated_at:date(0),...value}))
    db[table] = [...rows,...result]; writes++; updateAudit()
  } else if (request.method==='PATCH') {
    const value = await request.json()
    result.forEach(row=>Object.assign(row,value)); writes++; updateAudit()
  } else if (request.method==='DELETE') {
    db[table] = rows.filter(row => !result.includes(row)); writes++; updateAudit()
    result = []
  }
  const order = url.searchParams.get('order')
  if (order) {
    const [key,direction] = order.split('.')
    result = [...result].sort((a,b)=>String(a[key]).localeCompare(String(b[key]))*(direction==='desc'?-1:1))
  }
  result = result.slice(Number(url.searchParams.get('offset')??0))
  if (url.searchParams.has('limit')) result = result.slice(0,Number(url.searchParams.get('limit')))
  if (table==='contacts') result = result.map(row=>({...row,deals:db.deals.filter(d=>d.contact_id===row.id),interactions:db.interactions.filter(i=>i.contact_id===row.id)}))
  if (request.headers.get('accept')?.includes('vnd.pgrst.object')) return respond(result[0]??null)
  return respond(result)
}
