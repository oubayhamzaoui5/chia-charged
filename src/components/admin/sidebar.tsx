"use client"

import NavLink from "./nav-link"
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  ShoppingCart,
  LogOut,
  Sliders,
  FileText,
  Users,
  ShieldCheck,
  Settings,
  KeyRound,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getPendingOrdersCountAction } from "@/app/(admin)/admin/dashboard/actions"

export default function Sidebar() {
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(0)

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } finally {
      router.replace("/login")
      router.refresh()
    }
  }

  useEffect(() => {
    let active = true

    async function fetchPending() {
      const count = await getPendingOrdersCountAction()
      if (active) setPendingCount(count)
    }

    function handleOrdersChanged() {
      void fetchPending()
    }

    void fetchPending()
    window.addEventListener("admin:orders-changed", handleOrdersChanged)
    window.addEventListener("focus", handleOrdersChanged)

    return () => {
      active = false
      window.removeEventListener("admin:orders-changed", handleOrdersChanged)
      window.removeEventListener("focus", handleOrdersChanged)
    }
  }, [])

  return (
    <aside
      className="hidden w-60 md:flex md:flex-col"
      style={{
        background: '#FFFFFF',
        borderRight: '1px solid #E8EAED',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid #F0F2F5' }}
      >
        <Link href="/" className="flex items-center gap-3">
          <div
            className="relative h-8 w-8 overflow-hidden rounded-lg shrink-0"
            style={{ background: '#EEF2FF' }}
          >
            <Image
              src="/logow.webp"
              alt="logo"
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
          <span
            className="text-sm font-bold truncate"
            style={{ color: '#111827', letterSpacing: '-0.01em' }}
          >
            Admin Panel
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p
          className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: '#9CA3AF' }}
        >
          Main
        </p>
        <NavLink href="/admin" icon={LayoutDashboard} label="Dashboard" />
        <NavLink href="/admin/products" icon={Package} label="Products" />
        <NavLink href="/admin/categories" icon={FolderTree} label="Categories" />
        <NavLink href="/admin/variables" icon={Sliders} label="Variables" />

        <p
          className="px-3 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: '#9CA3AF' }}
        >
          Operations
        </p>
        <NavLink href="/admin/orders" icon={ShoppingCart} label="Orders" badge={pendingCount} />
        <NavLink href="/admin/inventory" icon={Boxes} label="Inventory" />
        <NavLink href="/admin/users" icon={Users} label="Customers" />
        <NavLink href="/admin/admins" icon={ShieldCheck} label="Admins" />
        <NavLink href="/admin/blog" icon={FileText} label="Blog" />

        <p
          className="px-3 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: '#9CA3AF' }}
        >
          System
        </p>
        <NavLink href="/admin/keys" icon={KeyRound} label="API Keys" />
        <NavLink href="/admin/settings" icon={Settings} label="Settings" />
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 pt-2" style={{ borderTop: '1px solid #F0F2F5' }}>
        <button
          onClick={handleLogout}
          className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[#FFF1F1]"
          style={{ color: '#EF4444' }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
