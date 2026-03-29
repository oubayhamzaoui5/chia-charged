import type React from "react"

export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl bg-white ${className}`}
      style={{
        border: '1px solid #E8EAED',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
      }}
    >
      {children}
    </div>
  )
}
