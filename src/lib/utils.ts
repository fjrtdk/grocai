import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return `kr ${amount.toFixed(2).replace('.', ',')}`
}

export function daysUntil(date: Date): number {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getExpiryColor(days: number): string {
  if (days > 7) return 'var(--color-expiry-green)'
  if (days > 2) return 'var(--color-expiry-yellow)'
  return 'var(--color-expiry-red)'
}
