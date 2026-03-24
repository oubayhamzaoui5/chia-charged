"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"

export default function NavLink({
  href,
  icon: Icon,
  label,
  badge,
}: {
  href: string
  icon: LucideIcon
  label: string
  badge?: number
}) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={` flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-bold outline-none transition-colors focus-visible:ring-2 ${
        isActive
          ? "text-blue-600"
          : "text-slate-700 hover:text-black"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-6 w-6" />
        {label}
      </div>

      {badge !== undefined && badge > 0 && (
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-base text-white">
          {badge}
        </span>
      )}
    </Link>
  )
}