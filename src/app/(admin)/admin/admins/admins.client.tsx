'use client'

import { useMemo, useState } from 'react'
import { Search, CheckCircle2, XCircle, ShieldCheck, Download, UserPlus, KeyRound } from 'lucide-react'
import type { AdminUser } from '../users/page'
import { createAdminUserAction, resetAdminPasswordAction } from '../users/actions'
import { useAdminToast } from '@/components/admin/AdminToast'

export default function AdminsClient({
  initialAdmins,
  canManageAdmins,
}: {
  initialAdmins: AdminUser[]
  canManageAdmins: boolean
}) {
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins)
  const [query, setQuery] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [resettingId, setResettingId] = useState<string | null>(null)
  const { toast, ToastContainer } = useAdminToast()

  function csvCell(value: unknown) {
    const normalized = String(value ?? '').replace(/"/g, '""')
    return `"${normalized}"`
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return admins.filter((u) => {
      const fullName = `${u.name} ${u.surname}`.toLowerCase()
      return (
        !q ||
        fullName.includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
      )
    })
  }, [admins, query])

  function formatDate(dateStr: string) {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function exportAdminsCsv() {
    if (filtered.length === 0) {
      toast('No admins to export.', 'error')
      return
    }

    const headers = ['User ID', 'First Name', 'Last Name', 'Username', 'Email', 'Verified', 'Status', 'Joined']
    const rows = filtered.map((user) => [
      user.id,
      user.name || '',
      user.surname || '',
      user.username || '',
      user.email || '',
      user.verified ? 'Yes' : 'No',
      user.isActive ? 'Active' : 'Inactive',
      user.created ? new Date(user.created).toISOString() : '',
    ])

    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `admins-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast('Admins CSV exported.', 'success')
  }

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault()
    if (!canManageAdmins) {
      toast('Only admin@admin.com can add admins.', 'error')
      return
    }

    setCreating(true)
    try {
      const created = await createAdminUserAction({ email, name, surname, password })
      setAdmins((prev) => [created, ...prev])
      setEmail('')
      setName('')
      setSurname('')
      setPassword('')
      toast('Admin created successfully.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create admin.'
      toast(message, 'error')
    } finally {
      setCreating(false)
    }
  }

  async function handleResetPassword(admin: AdminUser) {
    if (!canManageAdmins) {
      toast('Only admin@admin.com can reset admin passwords.', 'error')
      return
    }

    const nextPassword = window.prompt(`Enter new password for ${admin.email}`)
    if (!nextPassword) return

    setResettingId(admin.id)
    try {
      await resetAdminPasswordAction(admin.id, nextPassword)
      toast('Admin password reset successfully.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset password.'
      toast(message, 'error')
    } finally {
      setResettingId(null)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
            System
          </p>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#111827' }}>Admins</h1>
        </div>
        <span className="text-sm font-medium" style={{ color: '#6B7280' }}>
          {filtered.length} admin{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <UserPlus className="h-4 w-4" />
          Add Admin
        </div>
        {!canManageAdmins && (
          <p className="mb-3 text-xs font-medium text-amber-700">
            Only `admin@admin.com` can create admins or reset passwords.
          </p>
        )}
        <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!canManageAdmins || creating}
            className="rounded-xl px-3 py-2.5 text-sm outline-none disabled:opacity-60"
            style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#111827' }}
          />
          <input
            type="text"
            required
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canManageAdmins || creating}
            className="rounded-xl px-3 py-2.5 text-sm outline-none disabled:opacity-60"
            style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#111827' }}
          />
          <input
            type="text"
            required
            placeholder="Surname"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            disabled={!canManageAdmins || creating}
            className="rounded-xl px-3 py-2.5 text-sm outline-none disabled:opacity-60"
            style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#111827' }}
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!canManageAdmins || creating}
            className="rounded-xl px-3 py-2.5 text-sm outline-none disabled:opacity-60"
            style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#111827' }}
          />
          <button
            type="submit"
            disabled={!canManageAdmins || creating}
            className="md:col-span-4 inline-flex items-center justify-center rounded-xl bg-[#4F46E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? 'Creating...' : 'Create Admin'}
          </button>
        </form>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-all"
            style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#111827' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#4F46E5')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E8EAED')}
          />
        </div>
        <button
          type="button"
          onClick={exportAdminsCsv}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer"
          style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#374151' }}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white" style={{ border: '1px solid #E8EAED', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-widest" style={{ borderBottom: '1px solid #F0F2F5', color: '#9CA3AF', background: '#FAFAFA' }}>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center" style={{ color: '#9CA3AF' }}>No admins found.</td>
              </tr>
            ) : (
              filtered.map((admin) => (
                <tr key={admin.id} className="transition-colors hover:bg-[#F9FAFB]" style={{ borderBottom: '1px solid #F0F2F5' }}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-[#6B7280]">{admin.id.slice(-8)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: '#111827' }}>
                      {admin.name || admin.surname ? `${admin.name} ${admin.surname}`.trim() : <span className="italic text-[#9CA3AF]">No name</span>}
                    </div>
                    {admin.username && <div className="text-xs text-[#6B7280]">@{admin.username}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[#111827]">{admin.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                      <ShieldCheck size={11} />
                      Admin
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {admin.verified ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[#111827]/30" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {admin.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#6B7280]">{formatDate(admin.created)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleResetPassword(admin)}
                      disabled={!canManageAdmins || resettingId === admin.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                      title={canManageAdmins ? 'Reset admin password' : 'Only admin@admin.com can reset password'}
                    >
                      <KeyRound size={12} />
                      {resettingId === admin.id ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {ToastContainer}
    </div>
  )
}
