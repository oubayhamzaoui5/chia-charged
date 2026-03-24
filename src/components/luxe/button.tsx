import Link from 'next/link'

import { cn } from '@/lib/utils'

type LuxeButtonProps = {
  href: string
  label: string
  ariaLabel?: string
  variant?: 'primary' | 'ghost'
  className?: string
}

export default function LuxeButton({
  href,
  label,
  ariaLabel,
  variant = 'primary',
  className,
}: LuxeButtonProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel ?? label}
      className={cn(
        'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm tracking-wide transition duration-300',
        variant === 'primary'
          ? 'bg-stone-950 text-amber-50 hover:-translate-y-0.5 hover:bg-stone-800'
          : 'border border-stone-900/20 text-stone-900 hover:bg-stone-950 hover:text-amber-50',
        className
      )}
    >
      {label}
    </Link>
  )
}
