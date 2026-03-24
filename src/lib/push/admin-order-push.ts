import 'server-only'

import { createServerPb } from '@/lib/pb'

type PushSubscriptionRecord = {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

type NewOrderPayload = {
  id: string
  total: number
  currency: string
  customerName: string
}

function getAdminCredentials() {
  return {
    email: process.env.PB_ADMIN_EMAIL ?? '',
    password: process.env.PB_ADMIN_PASSWORD ?? '',
  }
}

async function createAdminPb() {
  const { email, password } = getAdminCredentials()
  if (!email || !password) return null

  const pb = createServerPb()
  await pb.collection('_superusers').authWithPassword(email, password)
  return pb
}

function isConfigured() {
  return Boolean(
    process.env.WEB_PUSH_SUBJECT &&
      process.env.WEB_PUSH_PUBLIC_KEY &&
      process.env.WEB_PUSH_PRIVATE_KEY
  )
}

async function getWebPush() {
  const mod = await import('web-push')
  mod.setVapidDetails(
    process.env.WEB_PUSH_SUBJECT ?? '',
    process.env.WEB_PUSH_PUBLIC_KEY ?? '',
    process.env.WEB_PUSH_PRIVATE_KEY ?? ''
  )
  return mod
}

export async function saveAdminPushSubscription(input: {
  adminUserId: string
  endpoint: string
  p256dh: string
  auth: string
}) {
  const pb = await createAdminPb()
  if (!pb) {
    throw new Error('PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD are required for push subscriptions')
  }

  const safeEndpoint = input.endpoint.replace(/"/g, '\\"')
  const existing = await pb.collection('admin_push_subscriptions').getFirstListItem<PushSubscriptionRecord>(
    `endpoint="${safeEndpoint}"`,
    { requestKey: null }
  ).catch(() => null)

  if (existing) {
    await pb.collection('admin_push_subscriptions').update(existing.id, {
      adminUserId: input.adminUserId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
    })
    return
  }

  await pb.collection('admin_push_subscriptions').create(
    {
      adminUserId: input.adminUserId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
    },
    { requestKey: null }
  )
}

export async function removeAdminPushSubscription(endpoint: string) {
  const pb = await createAdminPb()
  if (!pb) return

  const safeEndpoint = endpoint.replace(/"/g, '\\"')
  const existing = await pb.collection('admin_push_subscriptions').getFirstListItem<PushSubscriptionRecord>(
    `endpoint="${safeEndpoint}"`,
    { requestKey: null }
  ).catch(() => null)

  if (!existing) return

  await pb.collection('admin_push_subscriptions').delete(existing.id)
}

export async function sendAdminOrderPushNotification(order: NewOrderPayload) {
  if (!isConfigured()) return

  const pb = await createAdminPb()
  if (!pb) return

  const webpush = await getWebPush()
  const subscriptions = await pb.collection('admin_push_subscriptions').getFullList<PushSubscriptionRecord>({
    fields: 'id,endpoint,p256dh,auth',
    requestKey: null,
  })

  if (subscriptions.length === 0) return

  const amount = `${order.total.toFixed(2)} ${order.currency}`
  const payload = JSON.stringify({
    title: 'Nouvelle commande',
    body: `${order.customerName} a passe une commande (${amount}).`,
    tag: `order-${order.id}`,
    url: '/admin/orders',
  })

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
      } catch (error: any) {
        const statusCode = Number(error?.statusCode ?? 0)
        if (statusCode === 404 || statusCode === 410) {
          await pb.collection('admin_push_subscriptions').delete(sub.id).catch(() => null)
        }
      }
    })
  )
}
