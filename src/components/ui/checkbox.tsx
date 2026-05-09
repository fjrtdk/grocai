import { cn } from '../../lib/utils'
import { Check } from 'lucide-react'

interface CheckboxProps {
  checked: boolean
  onChange: () => void
  className?: string
}

export function Checkbox({ checked, onChange, className }: CheckboxProps) {
  return (
    <button
      onClick={onChange}
      className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer',
        checked
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border hover:border-muted-foreground',
        className,
      )}
    >
      {checked && <Check size={14} strokeWidth={3} />}
    </button>
  )
}
