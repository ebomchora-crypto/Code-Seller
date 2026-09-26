import { supabase } from '@/lib/supabaseClient'

// Notificações no celular (Web Push). A chave pública vem da Edge Function
// notifications-dispatch — nada de variável de ambiente no front.

export type PushStatus = 'unsupported' | 'ios-needs-install' | 'not-configured' | 'denied' | 'off' | 'on'

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
}

function base64UrlToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let index = 0; index < raw.length; index++) bytes[index] = raw.charCodeAt(index)
  return bytes
}

async function getPublicKey(): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke<{ publicKey: string | null }>('notifications-dispatch', {
    body: { action: 'config' },
  })
  if (error) return null
  return data?.publicKey ?? null
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/sw.js')
  return existing ?? navigator.serviceWorker.register('/sw.js')
}

export async function getPushStatus(): Promise<PushStatus> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return isIos() && !isStandalone() ? 'ios-needs-install' : 'unsupported'
  }
  if (Notification.permission === 'denied') return 'denied'
  const registration = await navigator.serviceWorker.getRegistration('/sw.js')
  const subscription = await registration?.pushManager.getSubscription()
  if (subscription) return 'on'
  const publicKey = await getPublicKey()
  return publicKey ? 'off' : 'not-configured'
}

export async function enablePush(): Promise<PushStatus> {
  const publicKey = await getPublicKey()
  if (!publicKey) return 'not-configured'

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off'

  const registration = await getRegistration()
  await navigator.serviceWorker.ready
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToUint8Array(publicKey) }))

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Usuário não autenticado.')
  const json = subscription.toJSON() as { endpoint: string; keys?: { p256dh?: string; auth?: string } }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userData.user.id,
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
      user_agent: navigator.userAgent.slice(0, 200),
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw new Error(error.message)
  return 'on'
}

export async function disablePush(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration('/sw.js')
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return
  await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
  await subscription.unsubscribe()
}

export async function sendTestPush(): Promise<number> {
  const { data, error } = await supabase.functions.invoke<{ delivered: number }>('notifications-dispatch', {
    body: { action: 'test' },
  })
  if (error) throw new Error('Não foi possível enviar o teste.')
  return data?.delivered ?? 0
}
