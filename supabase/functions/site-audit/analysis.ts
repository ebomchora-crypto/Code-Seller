import { load } from 'npm:cheerio@1.1.2'
import type { SiteAuditResult, IntelligenceFact, AuditFinding, AuditScoreCheck, AuditScore } from '../_shared/lead-intelligence.ts'
import { socialHost } from './safe-fetch.ts'

export const RULES_VERSION = 'html-v1.0.0'
const clean = (value: string) => value.replace(/\s+/g,' ').trim()
const now = () => new Date().toISOString()
function score(label: string, checks: AuditScoreCheck[]): AuditScore {
  const measured = checks.filter(c=>c.passed !== null)
  const earned = measured.reduce((n,c)=>n+(c.passed ? c.weight : 0),0)
  const possible = measured.reduce((n,c)=>n+c.weight,0)
  return {label,earned,possible,score:possible ? Math.round(earned/possible*100) : null,checks}
}
export function analyzeHtml(html: string, url: string, network: { elapsed: number; bytes: number; status: number; redirects: number }) {
  if (!html.trim()) throw new Error('HTML vazio: nao foi possivel analisar o site.')
  const $ = load(html)
  if (/just a moment|checking your browser|attention required|verify you are human/i.test($('title').text()) || $('#cf-challenge-running,#challenge-running,[id^="cf-chl-"]').length) throw new Error('Anti-bot/Cloudflare: HTML de desafio, nao o site do lead.')
  $('script,style,noscript,template,[hidden],[aria-hidden="true"]').remove()
  const collectedText = clean($('body').text())
  const text = collectedText.slice(0,16_000)
  const insufficient = text.length < 80
  const title = clean($('title').first().text()).slice(0,500)
  const meta = (name: string) => clean($(`meta[name="${name}"]`).first().attr('content') ?? '').slice(0,1000)
  const description = meta('description')
  const viewport = meta('viewport')
  const headings = $('h1,h2,h3').toArray().slice(0,40).map(el=>({level:el.tagName,text:clean($(el).text()).slice(0,300)}))
  const anchors = $('a[href]').toArray().slice(0,500).map(el=>({href:$(el).attr('href') ?? '',text:clean($(el).text()).slice(0,200)}))
  const absolute = (href: string) => {try{return new URL(href,url)}catch{return null}}
  const allLinks = anchors.map(a=>absolute(a.href)).filter((a): a is URL => !!a)
  const origin = new URL(url).origin
  const links = [...new Set(allLinks.filter(a=>a.origin===origin && /^https?:$/.test(a.protocol) && !/\.(?:pdf|png|jpe?g|gif|svg|zip|mp4|webp|css|js)$/i.test(a.pathname) && a.href.split('#')[0]!==url).map(a=>{a.hash='';return a.href}))]
  const phones = anchors.filter(a=>/^tel:/i.test(a.href)).map(a=>a.href.slice(4)).slice(0,10)
  const emails = anchors.filter(a=>/^mailto:/i.test(a.href)).map(a=>a.href.slice(7).split('?')[0]).slice(0,10)
  const whatsapp = allLinks.filter(a=>/^(?:www\.|api\.|web\.)?(?:wa\.me|whatsapp\.com)$/.test(a.hostname)).map(a=>a.href).slice(0,10)
  const socials = [...new Set(allLinks.filter(a=>socialHost(a.hostname) && !/wa\.me|whatsapp\.com/.test(a.hostname)).map(a=>a.href))].slice(0,15)
  const ctas = [...anchors,...$('button,input[type="submit"]').toArray().map(el=>({text:clean($(el).text() || $(el).attr('value') || ''),href:''}))].filter(a=>/agend|orcamento|orçamento|contat|solicit|ligar|fale|reserv|compr|book|quote|contact|schedule|call|whatsapp/i.test(a.text)).slice(0,20)
  const forms = $('form').length
  const images = $('img').length
  const missingAlt = $('img').toArray().filter(el=>$(el).attr('alt') === undefined).length
  const emptyAlt = $('img[alt=""]').length
  const favicon = $('link[rel]').toArray().some(el=>/\bicon\b/i.test($(el).attr('rel') ?? '') && !!$(el).attr('href'))
  const h1 = $('h1').length
  const observed = (condition: boolean) => insufficient ? null : condition
  const check = (key: string,label: string,weight: number,passed: boolean|null,evidence: string): AuditScoreCheck => ({key,label,weight,passed,evidence})
  const scores = {
    technical:score('Tecnico',[
      check('https','HTTPS',50,new URL(url).protocol==='https:',url),
      check('favicon','Referencia de favicon',20,observed(favicon),`Referencia no HTML: ${favicon}`),
      check('image_alt','Atributo alt nas imagens',30,insufficient || !images ? null : missingAlt===0,`${missingAlt} sem atributo alt / ${images} imagens; ${emptyAlt} alt vazios`),
    ]),
    seo:score('SEO basico',[
      check('title','Title presente',30,observed(!!title),title || 'Title nao encontrado no HTML'),
      check('description','Meta description presente',30,observed(!!description),description || 'Meta description nao encontrada no HTML'),
      check('h1','Um H1 no HTML',40,observed(h1===1),`${h1} elementos H1`),
    ]),
    contact:score('Contato no HTML',[
      check('telephone','Telefone clicavel',30,observed(phones.length>0),phones.join(', ') || 'Nenhum link tel: encontrado'),
      check('whatsapp','Link WhatsApp',30,observed(whatsapp.length>0),whatsapp.join(', ') || 'Nenhum link WhatsApp encontrado'),
      check('email','Email clicavel',20,observed(emails.length>0),emails.join(', ') || 'Nenhum link mailto: encontrado'),
      check('form','Formulario HTML',20,observed(forms>0),`${forms} formularios; envio nao testado`),
    ]),
    mobile:score('Mobile',[]), conversion:score('Conversao (interpretacao)',[]), clarity:score('Clareza (interpretacao)',[]), trust:score('Confianca (interpretacao)',[]),
  }
  const metrics: SiteAuditResult['metrics'] = {}
  const measured = (key: string,label: string,value: string|number|boolean,evidence: string|null=null) => {metrics[key]={label,status:'measured',value,evidence}}
  measured('https','HTTPS',new URL(url).protocol==='https:',url)
  measured('http_status','HTTP',network.status)
  measured('network_fetch_ms','Tempo de coleta de rede (ms)',network.elapsed,'DNS, conexao e transferencia; nao e Lighthouse nem tempo de renderizacao')
  measured('html_bytes','Bytes coletados',network.bytes)
  measured('collected_text_characters','Caracteres de texto no HTML coletado',collectedText.length)
  metrics.semantic_input_characters={label:'Caracteres enviados para analise comercial',status:'not_measured',value:null,evidence:'Analise comercial ainda nao executada'}
  measured('redirects','Redirecionamentos',network.redirects)
  measured('title','Title',title)
  measured('description','Meta description',description)
  measured('viewport','Meta viewport',viewport,'Presenca de viewport nao comprova responsividade')
  measured('viewport_device_width','Viewport device-width',/width\s*=\s*device-width/i.test(viewport))
  measured('headings','Headings',JSON.stringify(headings))
  measured('h1_count','Quantidade de H1',h1)
  measured('images','Imagens no HTML',images)
  measured('images_missing_alt','Imagens sem atributo alt',missingAlt)
  measured('images_empty_alt','Imagens com alt vazio',emptyAlt,'Alt vazio pode ser intencional em imagens decorativas')
  measured('favicon','Referencia a favicon',favicon,'Recurso nao baixado; disponibilidade nao verificada')
  measured('forms','Formularios',forms,'Funcionamento/envio nao testado')
  measured('telephone','Links de telefone',phones.join(', '))
  measured('whatsapp','Links WhatsApp',whatsapp.join(', '))
  measured('email','Links de email',emails.join(', '))
  measured('social_links','Links sociais',socials.join(', '))
  measured('navigation','Navegacao semantica no HTML',$('nav').length)
  measured('cta','Textos de CTA encontrados',ctas.map(a=>a.text).join(' | '),'Deteccao por termos; posicao visual, destaque e funcionamento nao medidos')
  measured('important_pages','Links com termos de contato/servicos/sobre/privacidade',anchors.filter(a=>/contat|servi|sobre|about|privacy|privacidade/i.test(a.text+' '+a.href)).map(a=>a.href).slice(0,20).join(' | '))
  for (const [key,label] of [['mobile','Responsividade visual'],['performance','Lighthouse/PageSpeed'],['resource_weight','Peso de imagens/scripts'],['form_delivery','Entrega de formulario']]) metrics[key]={label,status:'not_measured',value:null,evidence:'Infraestrutura de medicao nao executada nesta auditoria'}
  metrics.link_check={label:'Links internos (amostra)',status:'not_measured',value:null,evidence:`${links.length} candidatos; amostra ainda nao verificada`}
  const facts: IntelligenceFact[] = []
  const fact = (key: string,value: string) => {if(value) facts.push({key,value,source:'site_audit:html',source_url:url,confidence:null,collected_at:now(),type:'observed'})}
  fact('website_title',title)
  fact('company_summary',description)
  for(const heading of headings) if (heading.text) fact('website_heading',heading.text)
  for(const phone of phones) fact('phone',phone)
  for(const email of emails) fact('email',email)
  for(const link of whatsapp) fact('whatsapp',link)
  for(const link of socials) fact('social_link',link)
  const findings: AuditFinding[] = []
  const recommendations: Record<string,string> = {https:'Habilitar HTTPS com certificado valido.',favicon:'Adicionar referencia de favicon e verificar o recurso.',image_alt:'Revisar imagens informativas e fornecer texto alternativo.',title:'Definir title descritivo da empresa e servicos.',description:'Escrever meta description fiel ao conteudo da pagina.',h1:'Organizar a pagina com um H1 que descreva sua oferta.',telephone:'Disponibilizar telefone em link tel: se for um canal adequado.',whatsapp:'Adicionar WhatsApp se este canal fizer parte do atendimento.',email:'Disponibilizar um email clicavel quando adequado.',form:'Considerar formulario acessivel quando necessario para a jornada.'}
  for(const category of Object.values(scores)) for(const c of category.checks) if(c.passed !== null) findings.push({
    id:'html-'+c.key,kind:c.passed?'strength':'issue',title:c.passed?c.label+' encontrado':c.label+' ausente/incompleto no HTML',
    evidence:c.evidence ?? '',source_url:url,impact:c.passed?'Sinal estrutural presente; efeito em vendas nao medido.':'Pode dificultar descoberta, acessibilidade ou contato; impacto em vendas nao medido.',
    recommendation:c.passed?'Manter e verificar funcionamento no navegador.':recommendations[c.key],priority:c.passed?'low':c.key==='https'?'high':'medium',type:'observed',
  })
  if(!insufficient && !ctas.length) findings.push({id:'html-cta',kind:'opportunity',title:'Revisar caminho de contato',evidence:'Nenhum texto de CTA reconhecido no HTML coletado.',source_url:url,impact:'Pode haver atrito para iniciar contato; interpretacao estrutural, sem medicao de conversao.',recommendation:'Avaliar uma acao de contato alinhada ao atendimento da empresa.',priority:'medium',type:'inferred'})
  const limitations = ['Sem renderizacao visual, execucao JavaScript ou medicao de responsividade.','PageSpeed/Lighthouse nao executado; performance externa nao medida.','Recursos, imagens, formularios e destinos sociais nao foram executados/baixados.','Ausencia de sinal significa ausencia no HTML coletado, nao em todo o site.','Analise comercial semantica ainda nao realizada.']
  if(collectedText.length>text.length) limitations.push(`Analise comercial limitada a amostra inicial de ${text.length} de ${collectedText.length} caracteres do HTML coletado; restante nao analisado semanticamente.`)
  if($('a[href]').length>500 || $('h1,h2,h3').length>40) limitations.push(`Extracao detalhada por amostra: ${Math.min($('a[href]').length,500)} de ${$('a[href]').length} links e ${Math.min($('h1,h2,h3').length,40)} de ${$('h1,h2,h3').length} headings. Contagens de H1 e imagens cobrem o HTML recebido.`)
  if(insufficient) limitations.push('HTML insuficiente: possivel shell JavaScript; conteudo e ausencias nao podem ser confirmados.')
  const result: SiteAuditResult = {rules_version:RULES_VERSION,summary:insufficient?'HTML insuficiente para auditoria completa.':'Auditoria estrutural do HTML coletado; interpretacoes e limites discriminados abaixo.',metrics,scores,findings,facts,limitations,analyzed_pages:[url]}
  return {result,text,links,insufficient}
}

export type Semantic = { summary: string; facts: IntelligenceFact[]; findings: AuditFinding[]; inputTruncated?: boolean }
function field(value: unknown, max=1200): string {
  if(typeof value !== 'string' || !value.trim() || value.length>max) throw new Error('JSON semantico: campo textual invalido.')
  return value.trim()
}
const quantified = (value: string) => /\d|\b(?:dobr|triplic|metade|percent|por cento)\b/i.test(value)
export function validateSemantic(input: unknown, text: string, url: string): Semantic {
  if(!input || typeof input!=='object' || Array.isArray(input)) throw new Error('JSON semantico invalido.')
  const row = input as Record<string,unknown>
  const summary = field(row.summary)
  if(quantified(summary)) throw new Error('Resumo semantico com afirmacao quantitativa sem medicao.')
  if(!Array.isArray(row.facts) || row.facts.length>12 || !Array.isArray(row.findings) || row.findings.length>8) throw new Error('JSON semantico: listas ausentes ou excessivas.')
  const facts = row.facts.map((raw: unknown): IntelligenceFact => {
    if(!raw || typeof raw!=='object') throw new Error('Fato semantico invalido.')
    const f = raw as Record<string,unknown>
    const key = field(f.key,60)
    if(!['service','target_audience','differentiator','company_summary','commercial_angle'].includes(key)) throw new Error('Chave de fato semantico nao permitida.')
    const value = field(f.value,600)
    if(f.type!=='observed' && f.type!=='inferred') throw new Error('Proveniencia semantica invalida.')
    const quote = field(f.quote,600)
    if(!text.includes(quote) || (f.type==='observed' && !quote.includes(value))) throw new Error('Fato observado nao sustentado por citacao literal.')
    if(f.type==='inferred' && quantified(value)) throw new Error('Inferencia quantitativa sem fundamento.')
    return {key,value,source:'site_audit:commercial',source_url:url,type:f.type,confidence:null,collected_at:now()}
  })
  const findings = row.findings.map((raw: unknown,index: number): AuditFinding => {
    if(!raw || typeof raw!=='object') throw new Error('Finding semantico invalido.')
    const f = raw as Record<string,unknown>
    const title=field(f.title,200), evidence=field(f.evidence,600), impact=field(f.impact,600), recommendation=field(f.recommendation,600)
    if(!text.includes(evidence) || quantified(title+' '+impact+' '+recommendation)) throw new Error('Finding semantico sem evidencia ou impacto quantificado nao medido.')
    if(!['issue','opportunity','strength'].includes(String(f.kind)) || !['high','medium','low'].includes(String(f.priority))) throw new Error('Finding semantico: classificacao invalida.')
    return {id:'semantic-'+index,kind:f.kind as AuditFinding['kind'],title,evidence,impact,recommendation,priority:f.priority as AuditFinding['priority'],source_url:url,type:'inferred'}
  })
  return {summary,facts,findings}
}
export function applySemantic(result: SiteAuditResult, semantic: Semantic): void {
  result.summary='Interpretacao comercial: '+semantic.summary
  result.facts.push(...semantic.facts)
  result.findings.push(...semantic.findings)
  result.limitations=result.limitations.filter(x=>x!=='Analise comercial semantica ainda nao realizada.')
  result.limitations.push('Analise comercial por IA e interpretacao, com citacoes validadas; nao mede conversao, clareza visual nem confianca.')
  if(semantic.inputTruncated) result.limitations.push('Analise comercial recebeu amostra dos primeiros 16000 caracteres; texto restante nao analisado semanticamente.')
}
