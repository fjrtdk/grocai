import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useLists } from '../hooks/useLists'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { AppShell } from '../components/layout/AppShell'
import { InsightsBanner } from '../components/insights/InsightsBanner'
import { ItemRow } from '../components/items/ItemRow'
import { useListItems } from '../hooks/useListItems'

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded bg-secondary" />
        <div className="h-8 w-24 rounded-lg bg-secondary" />
      </div>
      <div className="h-32 rounded-xl bg-secondary" />
      <div className="h-48 rounded-xl bg-secondary" />
    </div>
  )
}

export function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { lists, loading, createList } = useLists(user?.uid)
  const pinned = lists.filter((l) => l.pinned && !l.archived)
  const activeList = pinned[0] || lists.find((l) => !l.archived)
  const { items } = useListItems(activeList?.id)

  if (loading) return <DashboardSkeleton />

  const handleCreateList = async () => {
    if (!user) return
    const name = prompt(t('list.listName'))
    if (name?.trim()) {
      await createList(name.trim(), user.uid)
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('nav.dashboard')}</h1>
          <Button variant="secondary" size="sm" onClick={handleCreateList}>
            <Plus size={16} />
            {t('list.newList')}
          </Button>
        </div>

        <InsightsBanner userId={user?.uid} />

        {activeList && (
          <Card>
            <button
              onClick={() => navigate(`/lists/${activeList.id}`)}
              className="w-full text-left cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg">{activeList.name}</h2>
                <span className="text-xs text-muted-foreground">
                  {t('list.items', { count: activeList.itemCount })}
                </span>
              </div>
            </button>
            <div className="space-y-1">
              {items.slice(0, 5).map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {t('item.noItems')}
                </p>
              )}
            </div>
          </Card>
        )}

        {!activeList && (
          <Card className="text-center py-12">
            <p className="text-muted-foreground mb-4">{t('list.noListsHint')}</p>
            <Button onClick={handleCreateList}>
              <Plus size={16} />
              {t('list.createList')}
            </Button>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
