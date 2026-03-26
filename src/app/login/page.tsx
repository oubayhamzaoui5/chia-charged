import { redirect } from 'next/navigation'

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function resolveRedirect(path?: string | null): string | null {
  if (!path) return null
  if (!path.startsWith('/')) return null
  if (path.startsWith('//')) return null
  return path
}

export default async function ConnexionPage({ searchParams }: Props) {
  const sp = await searchParams
  const nextParam = Array.isArray(sp.next) ? sp.next[0] : sp.next
  const safeNext = resolveRedirect(nextParam)
  const target = safeNext
    ? `/?auth=login&next=${encodeURIComponent(safeNext)}`
    : '/?auth=login'

  redirect(target)
}