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
  Star,
  Users,
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
      router.replace("/connexion")
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
    <aside className="hidden w-60 border-r border-foreground/10 bg-background md:flex md:flex-col">
      <div className="flex items-center justify-center px-6 py-4">
        <Link href="/" className="flex items-center justify-center">
          <div className="relative h-20 w-20">
            <Image src="/logow.webp" alt="Chia Charged logo" width={160} height={160} className="object-cover" />
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-0">
        <NavLink href="/admin" icon={LayoutDashboard} label="Dashboard" />
        <NavLink href="/admin/products" icon={Package} label="Products" />
        <NavLink href="/admin/vedettes" icon={Star} label="Featured" />
        <NavLink href="/admin/categories" icon={FolderTree} label="Categories" />
        <NavLink href="/admin/variables" icon={Sliders} label="Variables" />
        <NavLink href="/admin/orders" icon={ShoppingCart} label="Orders" badge={pendingCount} />
        <NavLink href="/admin/inventory" icon={Boxes} label="Inventory" />
        <NavLink href="/admin/users" icon={Users} label="Customers" />
        <NavLink href="/admin/blog" icon={FileText} label="Blog" />

      </nav>

      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-red-600 cursor-pointer transition-colors hover:bg-foreground/15"
        >
          <LogOut size={20} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
