import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createServicePb } from '@/lib/pb-service.server'

export const dynamic = 'force-dynamic'
export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin()
  const params = await searchParams
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page || '1', 10) || 1))
  const pb = await createServicePb()
  const jobs = await pb.collection('notification_jobs').getList(page, 25, { sort: '-created', fields: 'id,kind,recipient,status,attempts,lastError,created,sentAt' })
  return <main className="mx-auto max-w-5xl space-y-5 p-6">
    <h1 className="text-2xl font-bold">Email notifications</h1>
    <p>Delivery uses the hoster’s SMTP configuration. Blocked jobs wait for setup. Failed or uncertain jobs need review of mail logs before retrying. Sent means accepted by the mail server, not guaranteed inbox delivery.</p>
    <Link href="/admin/settings" className="underline">Store settings and support recipient</Link>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm">
      <thead><tr>{['Message', 'Recipient', 'Status', 'Attempts', 'Details'].map(label => <th className="p-3" key={label}>{label}</th>)}</tr></thead>
      <tbody>{jobs.items.map(job => <tr key={job.id} className="border-t"><td className="p-3">{job.kind}</td><td className="p-3">{job.recipient || 'Not configured'}</td><td className="p-3">{job.status}</td><td className="p-3">{job.attempts}</td><td className="p-3">{job.lastError || (job.sentAt ? `Accepted: ${job.sentAt}` : 'Waiting for worker')}</td></tr>)}</tbody>
    </table></div>
    {!jobs.items.length && <p>No notification jobs yet.</p>}
    <nav className="flex gap-5" aria-label="Notification pages">{page > 1 && <Link href={`?page=${page - 1}`}>Previous</Link>}<span>Page {page} of {Math.max(1, jobs.totalPages)}</span>{page < jobs.totalPages && <Link href={`?page=${page + 1}`}>Next</Link>}</nav>
  </main>
}
