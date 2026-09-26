// Code Sellers — service worker: recebe as notificações (Web Push) e abre o
// app na tela certa ao tocar no aviso. Não faz cache de páginas.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'Code Sellers', body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'Code Sellers'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: data.tag,
      data: { url: data.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
