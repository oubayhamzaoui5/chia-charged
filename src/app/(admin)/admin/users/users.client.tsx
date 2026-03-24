'use client'

import { useMemo, useState } from 'react'
import { Search, CheckCircle2, XCircle, ShieldCheck, User } from 'lucide-react'
import type { AdminUser } from './page'
import { toggleUserActiveAction } from './actions'

export default function UsersCustomer({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'customer'>('all')
  const [notice, setNotice] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

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
      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      return matchesQuery && matchesRole
    })
  }, [users, query, roleFilter])

  async function handleToggleActive(user: AdminUser) {
    setTogglingId(user.id)
    try {
      await toggleUserActiveAction(user.id, !user.isActive)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      setNotice(`${user.name || user.email} ${!user.isActive ? 'activated' : 'deactivated'}.`)
    } catch {
      setNotice('Error updating user.')
    } finally {
      setTogglingId(null)
      setTimeout(() => setNotice(null), 3000)
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Customers</h1>
        <span className="text-sm text-muted-foreground">{filtered.length} customer{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {notice && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-lg border border-foreground/20 bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value as 'all' | 'admin' | 'customer')}
          className="rounded-lg border border-foreground/20 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          <option value="all">All roles</option>
          <option value="customer">Customers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-foreground/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/10 bg-foreground/5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No users found.</td>
              </tr>
            ) : (
              filtered.map(user => (
                <tr key={user.id} className="hover:bg-foreground/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {user.name || user.surname
                        ? `${user.name} ${user.surname}`.trim()
                        : <span className="text-muted-foreground italic">No name</span>}
                    </div>
                    {user.username && (
                      <div className="text-xs text-muted-foreground">@{user.username}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-foreground">{user.email}</div>
                    {user.phone && (
                      <div className="text-xs text-muted-foreground">{user.phone}</div>
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
                      <XCircle className="h-4 w-4 text-foreground/30" />
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
                  <td className="px-4 py-3 text-muted-foreground">
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
    </div>
  )
}
