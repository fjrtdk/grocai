import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus, Pin, Archive, Copy, Trash2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useLists } from '../hooks/useLists'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Dialog } from '../components/ui/dialog'
import { cn } from '../lib/utils'

export function ListsHome() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { lists, loading, createList, togglePin, toggleArchive, deleteList, duplicateList } =
    useLists(user?.uid)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')

  const pinned = lists.filter((l) => l.pinned && !l.archived)
  const active = lists.filter((l) => !l.pinned && !l.archived)
  const archived = lists.filter((l) => l.archived)

  const handleCreate = async () => {
    if (!user || !newName.trim()) return
    await createList(newName.trim(), user.uid)
    setNewName('')
    setShowCreate(false)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('nav.lists')}</h1>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            {t('list.newList')}
          </Button>
        </div>

        {pinned.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              {t('list.pinned')}
            </h2>
            <div className="space-y-2">
              {pinned.map((list) => (
                <ListCard
                  key={list.id}
                  list={list}
                  onSelect={() => navigate(`/lists/${list.id}`)}
                  onTogglePin={() => togglePin(list)}
                  onToggleArchive={() => toggleArchive(list)}
                  onDelete={() => deleteList(list.id)}
                  onDuplicate={() => duplicateList(list, user!.uid)}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            {t('list.allLists')}
          </h2>
          {active.length === 0 && !loading && (
            <Card className="text-center py-12">
              <p className="text-muted-foreground">{t('list.noListsHint')}</p>
            </Card>
          )}
          <div className="space-y-2">
            {active.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                onSelect={() => navigate(`/lists/${list.id}`)}
                onTogglePin={() => togglePin(list)}
                onToggleArchive={() => toggleArchive(list)}
                onDelete={() => deleteList(list.id)}
                onDuplicate={() => duplicateList(list, user!.uid)}
              />
            ))}
          </div>
        </section>

        {archived.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              {t('list.archived')}
            </h2>
            <div className="space-y-2">
              {archived.map((list) => (
                <ListCard
                  key={list.id}
                  list={list}
                  onSelect={() => navigate(`/lists/${list.id}`)}
                  onTogglePin={() => togglePin(list)}
                  onToggleArchive={() => toggleArchive(list)}
                  onDelete={() => deleteList(list.id)}
                  onDuplicate={() => duplicateList(list, user!.uid)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title={t('list.createList')}>
        <div className="space-y-4">
          <Input
            placeholder={t('list.listName')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <Button className="w-full" onClick={handleCreate} disabled={!newName.trim()}>
            {t('list.createList')}
          </Button>
        </div>
      </Dialog>
    </AppShell>
  )
}

function ListCard({
  list,
  onSelect,
  onTogglePin,
  onToggleArchive,
  onDelete,
  onDuplicate,
}: {
  list: any
  onSelect: () => void
  onTogglePin: () => void
  onToggleArchive: () => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const { t } = useTranslation()
  return (
    <button
      onClick={onSelect}
      className="w-full text-left cursor-pointer"
    >
      <Card className="flex items-center gap-4 hover:bg-accent/50 transition-colors">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{list.name}</h3>
          <p className="text-xs text-muted-foreground">
            {t('list.items', { count: list.itemCount })}
            {list.checkedCount > 0 && ` · ${t('list.checked', { count: list.checkedCount })}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTogglePin()
            }}
            className={cn(
              'p-1.5 rounded-md transition-colors cursor-pointer',
              list.pinned ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Pin size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate()
            }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleArchive()
            }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Archive size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </Card>
    </button>
  )
}
