'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getClientPb } from '@/lib/pb'
import type { User } from './server'

function resolveRedirectPath(path?: string | null): string | null {
  if (!path) return null
  if (!path.startsWith('/')) return null
  if (path.startsWith('//')) return null
  return path
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      let res = await fetch('/api/auth/session')
      if (!res.ok) {
        const pb = getClientPb(true)
        const token = pb.authStore.token
        const model = pb.authStore.model as User | null

        if (pb.authStore.isValid && token && model?.id) {
          const syncRes = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, user: model }),
          })
          if (syncRes.ok) {
            res = await fetch('/api/auth/session')
          }
        }
      }

      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        return
      }

      setUser(null)
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = useCallback(async (email: string, password: string, redirectTo?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Connexion impossible')
      }

      const data = await res.json()
      setUser(data.user)

      const pb = getClientPb(true)
      if (data?.token && data?.user) {
        pb.authStore.save(data.token, data.user)
      }

      const safeRedirectTo = resolveRedirectPath(redirectTo)
      const targetPath = safeRedirectTo ?? (data.user.role === 'admin' ? '/admin/products' : '/')

      router.refresh()
      router.push(targetPath)

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error?.message || 'Connexion impossible' }
    }
  }, [router])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      
      // Clear client-side auth
      const pb = getClientPb()
      pb.authStore.clear()
      
      setUser(null)
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [router])

  const register = useCallback(async (data: {
    email: string
    password: string
    passwordConfirm: string
    surname: string
    name: string
    username: string
  }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Inscription impossible")
      }

      const result = await res.json()
      
      return { success: true, data: result }
    } catch (error: any) {
      console.error('Registration error:', error)
      return { success: false, error: error.message }
    }
  }, [])

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    register,
    checkAuth,
  }
}
