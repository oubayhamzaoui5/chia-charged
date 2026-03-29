'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { CheckCircle2, AlertCircle, Shield, UserRound, Mail, Eye, EyeOff } from 'lucide-react'
import { updateAdminPasswordAction } from './actions'

type AdminUser = {
  id: string
  email: string
  phone?: string
  surname: string
  name: string
  username: string
  role: 'admin' | 'customer'
  isActive: boolean
  verified: boolean
}

export default function SettingsClient({ user }: { user: AdminUser }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const fullName = `${user.surname ?? ''} ${user.name ?? ''}`.trim() || 'No name'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus(null)
    setSaving(true)
    try {
      const result = await updateAdminPasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      })

      if (!result.success) {
        setStatus({ type: 'error', msg: result.error ?? 'Failed to update password.' })
        return
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setStatus({ type: 'success', msg: 'Password updated successfully.' })
    } catch {
      setStatus({ type: 'error', msg: 'An unexpected error occurred.' })
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-slate-400'

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-8">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
          Account
        </p>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#111827' }}>
          Settings
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
          View your account details and update your password.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Your Information</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
          <InfoRow icon={<UserRound size={14} />} label="Full Name" value={fullName} />
          <InfoRow icon={<Shield size={14} />} label="Role" value={user.role === 'admin' ? 'Admin' : 'Customer'} />
          <div className="sm:col-span-2">
            <InfoRow icon={<Mail size={14} />} label="Email" value={user.email || 'No email'} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Change Password</h2>
        </div>

        <div className="px-6 py-5">
          {status && (
            <div
              className={`mb-4 flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${
                status.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
              )}
              <p>{status.msg}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <PasswordField
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              setShow={setShowCurrent}
              inputCls={inputCls}
            />
            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              setShow={setShowNew}
              inputCls={inputCls}
            />
            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              setShow={setShowConfirm}
              inputCls={inputCls}
            />

            <div className="pt-1">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#4F46E5] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        <span>{icon}</span>
        {label}
      </p>
      <p className="truncate text-sm font-medium text-slate-800">{value}</p>
    </div>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  setShow,
  inputCls,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  show: boolean
  setShow: (show: boolean) => void
  inputCls: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} pr-10`}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition hover:text-slate-600"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}
