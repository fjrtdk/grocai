import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Barcode, Search } from 'lucide-react'
import { Sheet } from '../ui/sheet'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { categorizeItem } from '../../lib/ai'

interface AddItemSheetProps {
  open: boolean
  onClose: () => void
  onAdd: (data: {
    name: string
    quantity: number
    unit: string
    category: string
    storageArea: string
    estimatedPrice?: number
    barcode?: string
    imageUrl?: string
    aiEnriched: boolean
    sortOrder: number
    isChecked: boolean
    addedBy: string
    currency: 'DKK'
  }) => void
  userId: string
  listId?: string
}

export function AddItemSheet({ open, onClose, onAdd, userId, listId }: AddItemSheetProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const ai = await categorizeItem(name.trim())
      onAdd({
        name: name.trim(),
        quantity,
        unit: 'stk',
        category: ai.category,
        storageArea: ai.storageArea,
        aiEnriched: true,
        sortOrder: Date.now(),
        isChecked: false,
        addedBy: userId,
        currency: 'DKK',
      })
      setName('')
      setQuantity(1)
      onClose()
    } catch {
      onAdd({
        name: name.trim(),
        quantity,
        unit: 'stk',
        category: 'Andet',
        storageArea: 'skab',
        aiEnriched: false,
        sortOrder: Date.now(),
        isChecked: false,
        addedBy: userId,
        currency: 'DKK',
      })
      setName('')
      setQuantity(1)
      onClose()
    }
    setLoading(false)
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('item.addItem')}>
      <div className="space-y-4">
        <button
          onClick={() => navigate('/scan', { state: { returnToList: listId } })}
          className="flex items-center justify-center gap-2 w-full p-3 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors cursor-pointer"
        >
          <Barcode size={18} />
          <span className="text-sm">{t('item.addItemHint')}</span>
        </button>

        <div className="space-y-3">
          <Input
            placeholder={t('item.itemName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              -
            </Button>
            <span className="flex items-center text-sm font-medium tabular-nums">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(quantity + 1)}
            >
              +
            </Button>
          </div>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
          >
            {loading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Search size={16} />
            )}
            {t('item.addItem')}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
