import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Badge } from '../ui/badge'
import type { InsightTip, Priority } from '../../types'
import { Lightbulb, X } from 'lucide-react'

interface InsightsBannerProps {
  userId: string | undefined
}

const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

export function InsightsBanner({ userId }: InsightsBannerProps) {
  const { t } = useTranslation()
  const [tips, setTips] = useState<InsightTip[]>([])

  useEffect(() => {
    if (!userId) return
    const ref = query(
      collection(db, 'insights', userId, 'tips'),
      where('dismissed', '==', false),
    )
    const unsub = onSnapshot(ref, (snap) => {
      setTips(snap.docs.map((d) => ({ id: d.id, ...d.data() } as InsightTip)))
    })
    return unsub
  }, [userId])

  const active = tips
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 5)

  const dismiss = async (id: string) => {
    await updateDoc(doc(db, 'insights', userId!, 'tips', id), { dismissed: true })
  }

  if (active.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb size={14} className="text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t('insights.title')}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
        {active.map((tip) => (
          <div
            key={tip.id}
            className="shrink-0 w-72 rounded-xl border border-border bg-card p-4 relative"
          >
            <button
              onClick={() => dismiss(tip.id)}
              className="absolute top-2 right-2 p-0.5 rounded hover:bg-accent cursor-pointer"
            >
              <X size={12} className="text-muted-foreground" />
            </button>
            <Badge
              variant={
                tip.priority === 'high'
                  ? 'danger'
                  : tip.priority === 'medium'
                    ? 'warning'
                    : 'default'
              }
              className="mb-2"
            >
              {t(`insights.${tip.type}`)}
            </Badge>
            <p className="text-sm font-medium">{tip.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{tip.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
