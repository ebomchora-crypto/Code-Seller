// Função da Vercel: entrega o site já com SEO para robôs de busca e prévias de link (a regra de quem chega aqui
// está no vercel.json). Quem abre no navegador continua vendo o site no quadro isolado do painel.
import { injectSeo, PAGE, SLUG } from './_seo.mjs'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://mfzlwynqjbusyudstdds.supabase.co'
// Chave pública (anon): a mesma que o navegador usa; o acesso é limitado pelas regras do banco.
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1memx3eW5xamJ1c3l1ZHN0ZGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxOTI3ODksImV4cCI6MjEwNTc2ODc4OX0.tJWftMdCxLLiWcDEsOUSTmDhLJs5bnY1xYSRcFTMqXc'

async function shell(origin, res) {
  // Endereço que não é de um site (login, termos…): entrega o app normal.
  try {
    const response = await fetch(`${origin}/index.html`, { headers: { 'User-Agent': 'codesellers-prerender' } })
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.end(await response.text())
  } catch {
    res.statusCode = 502
    res.end('Indisponível.')
  }
}

export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'codesellers.vercel.app'
  const origin = `https://${host}`
  const query = new URL(req.url, origin).searchParams
  const slug = String(query.get('slug') || '').toLowerCase()
  const page = String(query.get('page') || '').toLowerCase()
  if (!SLUG.test(slug) || (page && !PAGE.test(page)) || !ANON_KEY) return shell(origin, res)
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_site_seo`, {
      method: 'POST',
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_slug: slug, p_page: page || null }),
      signal: AbortSignal.timeout(8000),
    })
    const site = response.ok ? await response.json() : null
    if (!site || typeof site.html !== 'string') return shell(origin, res)
    const url = `${origin}/${slug}${page ? `/${page}` : ''}`
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
    res.end(injectSeo(site.html, site, url))
  } catch {
    return shell(origin, res)
  }
}
