import type React from "react"
interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "success" | "warning" | "destructive"
}

export default function Badge({ children, variant = "default" }: BadgeProps) {
  const variantClasses = {
    default: "bg-foreground/10 text-foreground",
    success: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-200",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
    destructive: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  )
}
