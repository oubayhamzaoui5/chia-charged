'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, Phone, Lock, MapPin, ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'

type UserInfo = {
  id: string
  email: string
  phone?: string
  surname?: string
  name?: string
}

type Address = {
  id: string
  address: string
  city: string
  postalCode?: string
  notes?: string
}

const inputClass =
  'w-full rounded-xl border border-border/60 bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-accent/20 focus:border-accent'
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5'
const sectionClass = 'rounded-3xl border border-border/40 bg-white/80 p-6 shadow-sm backdrop-blur-sm'

export default function MonComptePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // Personal info
  const [surname, setSurname] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [infoSaving, setInfoSaving] = useState(false)
  const [infoMsg, setInfoMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Email
  const [email, setEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailMsg, setEmailMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Password
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([])
  const [newAddr, setNewAddr] = useState({ address: '', city: '', postalCode: '', notes: '' })
  const [addrSaving, setAddrSaving] = useState(false)
  const [addrMsg, setAddrMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [showAddrForm, setShowAddrForm] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' })
        if (!res.ok) {
          router.push('/?auth=login&next=/account')
          return
        }
        const data = await res.json()
        const u = data?.user
        if (!u?.id) {
          router.push('/?auth=login&next=/account')
          return
        }
        if (!cancelled) {
          setUser(u)
          setSurname(u.surname || '')
          setName(u.name || '')
          setPhone(u.phone?.replace('+216', '').trim() || '')
          setEmail(u.email || '')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    const loadAddresses = async () => {
      try {
        const res = await fetch('/api/shop/addresses', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setAddresses(Array.isArray(data?.items) ? data.items : [])
      } catch { /* ignore */ }
    }
    void load()
    void loadAddresses()
    return () => { cancelled = true }
  }, [router])

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setInfoSaving(true)
    setInfoMsg(null)
    try {
      const res = await fetch('/api/auth/update-info', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surname: surname.trim(),
          name: name.trim(),
          phone: phone.trim() ? `+216 ${phone.trim()}` : '',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Erreur')
      setInfoMsg({ type: 'ok', text: 'Informations mises à jour.' })
      if (data.user) setUser(prev => ({ ...prev!, ...data.user }))
    } catch (err: any) {
      setInfoMsg({ type: 'err', text: err?.message || 'Impossible de mettre à jour.' })
    } finally {
      setInfoSaving(false)
    }
  }

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailSaving(true)
    setEmailMsg(null)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Erreur')
      setEmailMsg({ type: 'ok', text: 'Email mis à jour.' })
      if (data.user?.email) setEmail(data.user.email)
    } catch (err: any) {
      setEmailMsg({ type: 'err', text: err?.message || 'Impossible de mettre à jour.' })
    } finally {
      setEmailSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwSaving(true)
    setPwMsg(null)
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Erreur')
      setPwMsg({ type: 'ok', text: 'Mot de passe modifié avec succès.' })
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPwMsg({ type: 'err', text: err?.message || 'Impossible de changer le mot de passe.' })
    } finally {
      setPwSaving(false)
    }
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddrSaving(true)
    setAddrMsg(null)
    try {
      const res = await fetch('/api/shop/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddr),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Erreur')
      setAddresses(prev => [data.item, ...prev])
      setNewAddr({ address: '', city: '', postalCode: '', notes: '' })
      setShowAddrForm(false)
      setAddrMsg({ type: 'ok', text: 'Adresse ajoutée.' })
    } catch (err: any) {
      setAddrMsg({ type: 'err', text: err?.message || 'Impossible d\'ajouter l\'adresse.' })
    } finally {
      setAddrSaving(false)
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Supprimer cette adresse ?')) return
    try {
      const res = await fetch(`/api/shop/addresses?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) return
      setAddresses(prev => prev.filter(a => a.id !== id))
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fafafa]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-28 pb-20 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Mon compte</h1>
          <Link href="/orders" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={14} />
            Mes commandes
          </Link>
        </div>

        {/* Personal info */}
        <section className={sectionClass}>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <User size={17} />
            </div>
            <h2 className="font-semibold text-lg">Informations personnelles</h2>
          </div>
          <form onSubmit={handleSaveInfo} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prénom</label>
                <input className={inputClass} value={surname} onChange={e => setSurname(e.target.value)} placeholder="Votre prénom" />
              </div>
              <div>
                <label className={labelClass}>Nom</label>
                <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Téléphone</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground border-r pr-3 border-border/60">+216</span>
                <input className={`${inputClass} pl-16`} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="20 123 456" />
              </div>
            </div>
            {infoMsg && (
              <p className={`text-sm ${infoMsg.type === 'ok' ? 'text-emerald-600' : 'text-destructive'}`}>{infoMsg.text}</p>
            )}
            <button type="submit" disabled={infoSaving} className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
              <Save size={14} />
              {infoSaving ? 'Enregistrement...' : 'Sauvegarder'}
            </button>
          </form>
        </section>

        {/* Email */}
        <section className={sectionClass}>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Mail size={17} />
            </div>
            <h2 className="font-semibold text-lg">Adresse email</h2>
          </div>
          <form onSubmit={handleSaveEmail} className="space-y-4">
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" className={inputClass} value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@email.com" />
            </div>
            {emailMsg && (
              <p className={`text-sm ${emailMsg.type === 'ok' ? 'text-emerald-600' : 'text-destructive'}`}>{emailMsg.text}</p>
            )}
            <button type="submit" disabled={emailSaving} className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
              <Save size={14} />
              {emailSaving ? 'Enregistrement...' : 'Mettre à jour'}
            </button>
          </form>
        </section>

        {/* Password */}
        <section className={sectionClass}>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Lock size={17} />
            </div>
            <h2 className="font-semibold text-lg">Changer le mot de passe</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className={labelClass}>Mot de passe actuel</label>
              <input type="password" className={inputClass} value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nouveau mot de passe</label>
                <input type="password" className={inputClass} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" minLength={8} />
              </div>
              <div>
                <label className={labelClass}>Confirmation</label>
                <input type="password" className={inputClass} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" minLength={8} />
              </div>
            </div>
            {pwMsg && (
              <p className={`text-sm ${pwMsg.type === 'ok' ? 'text-emerald-600' : 'text-destructive'}`}>{pwMsg.text}</p>
            )}
            <button type="submit" disabled={pwSaving} className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
              <Lock size={14} />
              {pwSaving ? 'Modification...' : 'Changer le mot de passe'}
            </button>
          </form>
        </section>

        {/* Addresses */}
        <section className={sectionClass}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <MapPin size={17} />
              </div>
              <h2 className="font-semibold text-lg">Adresses enregistrées</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAddrForm(v => !v)}
              className="flex items-center gap-1.5 text-sm text-accent hover:opacity-80 font-semibold"
            >
              <Plus size={14} />
              Ajouter
            </button>
          </div>

          {addrMsg && (
            <p className={`text-sm mb-3 ${addrMsg.type === 'ok' ? 'text-emerald-600' : 'text-destructive'}`}>{addrMsg.text}</p>
          )}

          {addresses.length === 0 && !showAddrForm && (
            <p className="text-sm text-muted-foreground">Aucune adresse enregistrée.</p>
          )}

          <div className="space-y-3">
            {addresses.map(addr => (
              <div key={addr.id} className="flex items-start justify-between rounded-xl border border-border/40 bg-secondary/20 p-4">
                <div className="text-sm space-y-0.5">
                  <p className="font-medium">{addr.address}</p>
                  <p className="text-muted-foreground">{addr.city} {addr.postalCode}</p>
                  {addr.notes && <p className="text-muted-foreground text-xs">{addr.notes}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors ml-3"
                  aria-label="Supprimer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {showAddrForm && (
            <form onSubmit={handleAddAddress} className="mt-4 space-y-3 border-t border-border/40 pt-4">
              <div>
                <label className={labelClass}>Adresse complète <span className="text-destructive">*</span></label>
                <input className={inputClass} value={newAddr.address} onChange={e => setNewAddr(p => ({ ...p, address: e.target.value }))} required placeholder="N°, Rue, Appartement..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Ville <span className="text-destructive">*</span></label>
                  <input className={inputClass} value={newAddr.city} onChange={e => setNewAddr(p => ({ ...p, city: e.target.value }))} required placeholder="Tunis" />
                </div>
                <div>
                  <label className={labelClass}>Code postal</label>
                  <input className={inputClass} value={newAddr.postalCode} onChange={e => setNewAddr(p => ({ ...p, postalCode: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="1000" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Instructions</label>
                <input className={inputClass} value={newAddr.notes} onChange={e => setNewAddr(p => ({ ...p, notes: e.target.value }))} placeholder="Digicode, étage..." />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={addrSaving} className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
                  {addrSaving ? 'Ajout...' : 'Ajouter'}
                </button>
                <button type="button" onClick={() => setShowAddrForm(false)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary/30">
                  Annuler
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
