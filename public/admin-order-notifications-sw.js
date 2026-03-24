self.addEventListener('push', (event) => {
  let payload = {
    title: 'Nouvelle commande',
    body: 'Une nouvelle commande est disponible.',
    url: '/admin/orders',
    tag: 'admin-order-notification',
  }

  try {
    const data = event.data ? event.data.json() : null
    if (data && typeof data === 'object') {
      payload = {
        ...payload,
        ...data,
      }
    }
  } catch (_) {
    // Ignore malformed payloads and keep defaults.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      data: { url: payload.url },
      badge: '/icon-light-32x32.png',
      icon: '/icon-light-32x32.png',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/admin/orders'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      return clients.openWindow(targetUrl)
    })
  )
})
