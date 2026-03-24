import type { NextRequest } from 'next/server'

type RouteContext = {
  params: Promise<{
    collection: string
    recordId: string
    filename: string
  }>
}

function getPbBaseUrl(): string {
  return process.env.POCKETBASE_URL ?? process.env.NEXT_PUBLIC_PB_URL ?? 'http://127.0.0.1:8090'
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, context: RouteContext) {
  const { collection, recordId, filename } = await context.params
  if (!collection || !recordId || !filename) {
    return new Response('Not found', { status: 404 })
  }

  const target = new URL(
    `/api/files/${encodeURIComponent(collection)}/${encodeURIComponent(recordId)}/${encodeURIComponent(filename)}`,
    getPbBaseUrl()
  )

  const searchParams = request.nextUrl.searchParams
  for (const [key, value] of searchParams.entries()) {
    target.searchParams.append(key, value)
  }

  const upstream = await fetch(target.toString(), {
    method: 'GET',
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

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
}
