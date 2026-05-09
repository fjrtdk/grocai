import { cn } from '../../lib/utils'
import type { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant === 'default' && 'bg-secondary text-secondary-foreground',
        variant === 'success' && 'bg-expiry-green/20 text-expiry-green',
        variant === 'warning' && 'bg-expiry-yellow/20 text-expiry-yellow',
        variant === 'danger' && 'bg-expiry-red/20 text-expiry-red',
        className,
      )}
      {...props}
    />
  )
}
