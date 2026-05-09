import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus, Snowflake, Refrigerator, Thermometer, Trash2, Package } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { usePantry } from '../hooks/usePantry'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { cn, daysUntil } from '../lib/utils'
import type { StorageArea } from '../types'

function PantrySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded bg-secondary" />
        <div className="h-8 w-36 rounded-lg bg-secondary" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-24 rounded-lg bg-secondary" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-secondary" />
        ))}
      </div>
    </div>
  )
}

const storageConfig: Record<StorageArea, { icon: any; labelKey: string }> = {
  køleskab: { icon: Refrigerator, labelKey: 'pantry.køleskab' },
  fryser: { icon: Snowflake, labelKey: 'pantry.fryser' },
  skab: { icon: Package, labelKey: 'pantry.skab' },
  stuetemperatur: { icon: Thermometer, labelKey: 'pantry.stuetemperatur' },
}

export function Pantry() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, loading, removeItem } = usePantry(user?.uid)
  const [activeTab, setActiveTab] = useState<StorageArea | 'all'>('all')

  if (loading) return <PantrySkeleton />

  const storageAreas = Object.keys(storageConfig) as StorageArea[]

  const filtered =
    activeTab === 'all' ? items : items.filter((i) => i.storageArea === activeTab)

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('pantry.title')}</h1>
          <Button size="sm" onClick={() => navigate('/scan')}>
            <Plus size={16} />
            {t('pantry.addToPantry')}
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
              activeTab === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:opacity-80',
            )}
          >
            Alle
          </button>
          {storageAreas.map((area) => {
            const Icon = storageConfig[area].icon
            return (
              <button
                key={area}
                onClick={() => setActiveTab(area)}
                className={cn(
                  'shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                  activeTab === area ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:opacity-80',
                )}
              >
                <Icon size={16} />
                {t(storageConfig[area].labelKey)}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <Card className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">{t('pantry.noItems')}</p>
            <p className="text-xs text-muted-foreground mb-4">{t('pantry.noItemsHint')}</p>
            <Button onClick={() => navigate('/scan')}>
              <Plus size={16} />
              {t('pantry.addToPantry')}
            </Button>
          </Card>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((item) => {
            const days = item.expiryDate ? daysUntil(item.expiryDate.toDate()) : null
            return (
              <Card key={item.id} className="relative group">
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
                <div className="space-y-2">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-16 w-16 rounded-lg object-cover bg-secondary"
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                  {days !== null && (
                    <Badge
                      variant={
                        days > 7 ? 'success' : days > 2 ? 'warning' : 'danger'
                      }
                    >
                      {days <= 0
                        ? t('pantry.expired')
                        : days === 0
                          ? t('pantry.expiresToday')
                          : t('pantry.expiresIn', { days })}
                    </Badge>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
