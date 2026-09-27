// Supabase Edge Function — entrega do login do navegador pro app de Windows.
//
// O navegador (já logado) chama esta função e recebe um código de uso único
// (token_hash de magic link, gerado sem enviar e-mail). O app troca esse
// código por uma sessão PRÓPRIA — independente da sessão do navegador. Assim,
// sair no app não desloga a web, e vice-versa.
//
// POST (Authorization: Bearer <access token do navegador>) → { token_hash }

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user?.email) return json({ error: 'unauthorized' }, 401)

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
    const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: userData.user.email })
    const tokenHash = data?.properties?.hashed_token
    if (error || !tokenHash) {
      console.error('desktop-handoff', error?.message)
      return json({ error: 'internal' }, 500)
    }

    return json({ token_hash: tokenHash })
  } catch (error) {
    console.error('desktop-handoff', error)
    return json({ error: 'internal' }, 500)
  }
})
