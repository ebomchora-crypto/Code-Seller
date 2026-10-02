import { createClient } from 'jsr:@supabase/supabase-js@2'
import { createAuditHandler } from './handler.ts'

declare const EdgeRuntime: {waitUntil(promise: Promise<unknown>): void} | undefined
const supabaseUrl=Deno.env.get('SUPABASE_URL')!
const admin=createClient(supabaseUrl,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}})
Deno.serve(createAuditHandler({
  admin,
  userClient:authorization=>createClient(supabaseUrl,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}}),
  env:name=>Deno.env.get(name),
  waitUntil:typeof EdgeRuntime!=='undefined' && typeof EdgeRuntime.waitUntil==='function' ? promise=>EdgeRuntime!.waitUntil(promise) : undefined,
  backgroundError:message=>console.error(message),
}))
