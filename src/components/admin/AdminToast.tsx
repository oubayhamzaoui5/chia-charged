'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export type Toast = {
  id: number
  message: string
  type: ToastType
}

type AdminToastProps = {
  toasts: Toast[]
  dismiss: (id: number) => void
}

const config: Record<ToastType, { bg: string; border: string; text: string; icon: typeof CheckCircle2 }> = {
  success: { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', icon: CheckCircle2 },
  error:   { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', icon: XCircle },
  info:    { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', icon: Info },
}

export default function AdminToast({ toasts, dismiss }: AdminToastProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => {
        const c = config[toast.type]
        const Icon = c.icon
        return (
          <div
            key={toast.id}
            className="flex items-start gap-3 rounded-2xl px-4 py-3 shadow-lg"
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              animation: 'slideIn 0.2s ease-out',
            }}
          >
            <Icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color: c.text }} />
            <p className="flex-1 text-sm font-medium" style={{ color: c.text }}>{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded-md p-0.5 transition-opacity hover:opacity-60"
              style={{ color: c.text }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

let _nextId = 1

/**
 * Shared admin toast hook.
 * Usage:
 *   const { toasts, toast, ToastContainer } = useAdminToast()
 *   toast('Saved!', 'success')
 *   ...
 *   return <>{ToastContainer}</>
 */
export function useAdminToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = _nextId++
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const ToastContainer = <AdminToast toasts={toasts} dismiss={dismiss} />

  return { toasts, toast, dismiss, ToastContainer }
}
