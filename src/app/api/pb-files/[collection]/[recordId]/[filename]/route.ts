import { getServerPbOrigin } from '@/lib/url-policy'
import { getSession } from '@/lib/auth/server'
import { createServerPb } from '@/lib/pb'
import type { NextRequest } from 'next/server'

type RouteContext = {
  params: Promise<{
    collection: string
    recordId: string
    filename: string
  }>
}

function getPbBaseUrl(): string {
  return getServerPbOrigin()
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, context: RouteContext) {
  const { collection, recordId, filename } = await context.params
  if (!collection || !recordId || !filename) {
    return new Response('Not found', { status: 404 })
  }

  // Anonymous view-rule check also covers collection IDs used by existing URLs.
  const catalog = createServerPb()
  const session = await getSession()
  if (session?.user.role === 'admin') catalog.authStore.save(session.token, session.user as any)
  let record
  try { record = await catalog.collection(collection).getOne(recordId, { requestKey: null }) }
  catch { return new Response('Not found', { status: 404 }) }
  const imageField: Record<string, string> = { products: 'images', categories: 'coverImage', posts: 'coverImage', variables: 'image' }
  const field = imageField[record.collectionName]
  const files = field ? [record[field]].flat() : []
  if (!files.includes(filename)) return new Response('Not found', { status: 404 })

  const target = new URL(
    `/api/files/${encodeURIComponent(collection)}/${encodeURIComponent(recordId)}/${encodeURIComponent(filename)}`,
    getPbBaseUrl()
  )

  if (session?.user.role === 'admin') target.searchParams.set('token', await catalog.files.getToken())
  const searchParams = request.nextUrl.searchParams
  for (const [key, value] of searchParams.entries()) {
    if (key === 'thumb' || key === 'download') target.searchParams.append(key, value)
  }

  const upstream = await fetch(target.toString(), {
    method: 'GET',
    redirect: 'error',
    headers: {
      accept: request.headers.get('accept') ?? '*/*',
    },
    cache: 'no-store',
  })

  if (!upstream.body) {
    return new Response(null, { status: upstream.status })
  }

  const responseHeaders = new Headers()
  for (const header of ['content-type', 'content-length', 'cache-control', 'etag', 'last-modified', 'content-disposition']) {
    const value = upstream.headers.get(header)
    if (value) responseHeaders.set(header, value)
  }

  responseHeaders.set('cache-control', 'private, no-store')
  responseHeaders.set('x-content-type-options', 'nosniff')
  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
}
