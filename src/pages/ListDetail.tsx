import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Share2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useDocument } from '../hooks/useFirestore'
import { useListItems } from '../hooks/useListItems'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { ItemRow } from '../components/items/ItemRow'
import { AddItemSheet } from '../components/items/AddItemSheet'
import { ShareDialog } from '../components/sharing/ShareDialog'
import type { GroceryList } from '../types'

function ListDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded bg-secondary" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-48 rounded bg-secondary" />
          <div className="h-3 w-32 rounded bg-secondary" />
        </div>
        <div className="h-8 w-20 rounded-lg bg-secondary" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-secondary" />
        ))}
      </div>
    </div>
  )
}

export function ListDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: list, loading: listLoading } = useDocument<GroceryList>(`lists/${id}`)
  const { items, addItem, toggleCheck, removeItem, loading: itemsLoading } = useListItems(id)
  const [showAdd, setShowAdd] = useState(false)
  const [showShare, setShowShare] = useState(false)

  if (listLoading || itemsLoading) return <ListDetailSkeleton />

  const categories = [...new Set(items.map((i) => i.category))]

  const handleAdd = async (data: any) => {
    await addItem(data)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/lists')}
            className="p-1.5 rounded-md hover:bg-accent cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold truncate">{list?.name || t('common.loading')}</h1>
            {list && (
              <p className="text-xs text-muted-foreground">
                {t('list.items', { count: list.itemCount })} ·{' '}
                {t('list.checked', { count: list.checkedCount })}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowShare(true)}>
            <Share2 size={18} />
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={16} />
            {t('item.addItem')}
          </Button>
        </div>

        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category === cat)
          return (
            <section key={cat}>
              <h2 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                {t(`category.${cat}`)}
              </h2>
              <div className="space-y-0.5">
                {catItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => toggleCheck(item, user!.uid)}
                    onDelete={() => removeItem(item.id)}
                  />
                ))}
              </div>
            </section>
          )
        })}

        {items.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-muted-foreground mb-4">{t('item.noItems')}</p>
            <Button onClick={() => setShowAdd(true)}>
              <Plus size={16} />
              {t('item.addItem')}
            </Button>
          </Card>
        )}
      </div>

      <AddItemSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={handleAdd}
        userId={user?.uid || ''}
        listId={id}
      />

      {id && list && (
        <ShareDialog
          open={showShare}
          onClose={() => setShowShare(false)}
          listId={id}
          list={list}
        />
      )}
    </AppShell>
  )
}
