import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Update Design | Login',
}

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function resolveRedirect(path?: string | null): string | null {
  if (!path) return null
  if (!path.startsWith('/')) return null
  if (path.startsWith('//')) return null
  return path
}

export default async function LoginRedirectPage({ searchParams }: Props) {
  const sp = await searchParams
  const next = Array.isArray(sp.next) ? sp.next[0] : sp.next
  const safeNext = resolveRedirect(next)
  const target = safeNext
    ? `/?auth=login&next=${encodeURIComponent(safeNext)}`
    : '/?auth=login'

  redirect(target)
}