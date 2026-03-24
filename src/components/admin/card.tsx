import type React from "react"
export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-md border border-foreground/10 bg-background shadow-sm ${className}`}>{children}</div>
  )
}
