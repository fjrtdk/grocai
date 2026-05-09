import { cn } from '../../lib/utils'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export function Sheet({ open, onClose, children, title }: SheetProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-background p-6',
          'animate-in slide-in-from-bottom',
          'scrollbar-none',
        )}
      >
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-muted" />
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent cursor-pointer">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
