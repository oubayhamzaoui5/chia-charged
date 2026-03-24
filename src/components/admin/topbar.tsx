"use client"

import { Search, User } from "lucide-react"

export default function Topbar() {
  return (
    <header className="border-b border-foreground/10 bg-background px-4 py-3 md:px-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-foreground">Admin</h1>

        <div className="flex items-center gap-3">
          {/* Search - hidden on mobile */}
          <div className="hidden flex-1 md:flex md:max-w-xs">
            <div className="flex w-full items-center gap-2 rounded-lg border border-foreground/10 bg-background px-3 py-2">
              <Search className="h-4 w-4 text-foreground/40" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/40"
              />
            </div>
          </div>

          {/* User Avatar */}
          <button className="rounded-full bg-foreground/10 p-2 outline-none hover:bg-foreground/20 focus-visible:ring-2">
            <User className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>
    </header>
  )
}
