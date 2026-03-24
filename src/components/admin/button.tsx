import type { ButtonHTMLAttributes } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary"
}

export default function Button({ children, variant = "primary", className = "", ...props }: ButtonProps) {
  const baseClasses =
    "rounded-lg px-4 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 disabled:opacity-50"

  const variantClasses = {
    primary: "bg-foreground text-background hover:bg-foreground/90",
    secondary: "border border-foreground/20 text-foreground hover:bg-foreground/5",
  }

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
