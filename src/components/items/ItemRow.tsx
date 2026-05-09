import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Checkbox } from '../ui/checkbox'
import type { ListItem } from '../../types'

interface ItemRowProps {
  item: ListItem
  onToggle?: () => void
  onDelete?: () => void
  compact?: boolean
}

export function ItemRow({ item, onToggle, onDelete, compact }: ItemRowProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50',
        compact && 'py-1.5',
      )}
    >
      <Checkbox checked={item.isChecked} onChange={() => onToggle?.()} />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium truncate',
            item.isChecked && 'line-through text-muted-foreground',
          )}
        >
          {item.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {item.quantity} {t(`item.${item.unit}`)}
          </span>
          {item.estimatedPrice && (
            <>
              <span>·</span>
              <span>
                kr {item.estimatedPrice.toFixed(2).replace('.', ',')}
              </span>
            </>
          )}
          <span>·</span>
          <span>{t(`category.${item.category}`)}</span>
        </div>
      </div>
      {onDelete && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-muted-foreground hover:text-destructive transition-all cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}
