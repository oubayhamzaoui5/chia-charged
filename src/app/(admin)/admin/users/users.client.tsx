'use client'

import { useMemo, useState } from 'react'
import { Search, CheckCircle2, XCircle, ShieldCheck, User, Download } from 'lucide-react'
import type { AdminUser } from './page'
import { toggleUserActiveAction } from './actions'
import { useAdminToast } from '@/components/admin/AdminToast'

export default function UsersCustomer({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [query, setQuery] = useState('')
  const { toast, ToastContainer } = useAdminToast()
  const [togglingId, setTogglingId] = useState<string | null>(null)

  function csvCell(value: unknown) {
    const normalized = String(value ?? '').replace(/"/g, '""')
    return `"${normalized}"`
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter(u => {
      const fullName = `${u.name} ${u.surname}`.toLowerCase()
      const matchesQuery =
        !q ||
        fullName.includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
      return matchesQuery
    })
  }, [users, query])

  async function handleToggleActive(user: AdminUser) {
    setTogglingId(user.id)
    try {
      await toggleUserActiveAction(user.id, !user.isActive)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      toast(`${user.name || user.email} ${!user.isActive ? 'activated' : 'deactivated'}.`, 'success')
    } catch {
      toast('Error updating user.', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function exportUsersCsv() {
    if (filtered.length === 0) {
      toast('No customers to export.', 'error')
      return
    }

    const headers = [
      'User ID',
      'First Name',
      'Last Name',
      'Username',
      'Email',
      'Phone',
      'Role',
      'Verified',
      'Status',
      'Joined',
    ]

    const rows = filtered.map((user) => [
      user.id,
      user.name || '',
      user.surname || '',
      user.username || '',
      user.email || '',
      user.phone || '',
      user.role || '',
      user.verified ? 'Yes' : 'No',
      user.isActive ? 'Active' : 'Inactive',
      user.created ? new Date(user.created).toISOString() : '',
    ])

    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast('Customers CSV exported.', 'success')
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
            Operations
          </p>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#111827' }}>Customers</h1>
        </div>
        <span className="text-sm font-medium" style={{ color: '#6B7280' }}>{filtered.length} customer{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-all"
            style={{ border: '1px solid #E8EAED', background: '#FFFFFF', color: '#111827' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#4F46E5')}
            onBlur={e => (e.currentTarget.style.borderColor = '#E8EAED')}
          />
        </div>
        <button
          type="button"
          onClick={exportUsersCsv}
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
                <td colSpan={8} className="px-4 py-12 text-center" style={{ color: '#9CA3AF' }}>No users found.</td>
              </tr>
            ) : (
              filtered.map(user => (
                <tr key={user.id} className="transition-colors hover:bg-[#F9FAFB]" style={{ borderBottom: '1px solid #F0F2F5' }}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-[#6B7280]">{user.id.slice(-8)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: '#111827' }}>
                      {user.name || user.surname
                        ? `${user.name} ${user.surname}`.trim()
                        : <span className="italic text-[#9CA3AF]">No name</span>}
                    </div>
                    {user.username && (
                      <div className="text-xs text-[#6B7280]">@{user.username}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[#111827]">{user.email}</div>
                    {user.phone && (
                      <div className="text-xs text-[#6B7280]">{user.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                        <ShieldCheck size={11} />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        <User size={11} />
                        Customer
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.verified ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[#111827]/30" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#6B7280]">
                    {formatDate(user.created)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(user)}
                      disabled={togglingId === user.id || user.role === 'admin'}
                      title={user.role === 'admin' ? 'Cannot deactivate an admin' : user.isActive ? 'Deactivate' : 'Activate'}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                        user.isActive
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {togglingId === user.id ? '...' : user.isActive ? 'Deactivate' : 'Activate'}
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
