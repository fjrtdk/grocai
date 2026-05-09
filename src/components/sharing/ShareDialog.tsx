import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { updateDoc, doc, getDoc, deleteField } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Dialog } from '../ui/dialog'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Avatar } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { X, Copy, Check } from 'lucide-react'
import type { GroceryList } from '../../types'

interface ShareDialogProps {
  open: boolean
  onClose: () => void
  listId: string
  list: GroceryList
}

export function ShareDialog({ open, onClose, listId, list }: ShareDialogProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const members = Object.entries(list.members)

  const inviteByEmail = async () => {
    if (!email.trim()) return
    setError('')
    try {
      const usersSnap = await getDoc(doc(db, 'users', email.trim()))
      if (!usersSnap.exists()) {
        setError('User not found')
        return
      }
      const uid = usersSnap.id
      await updateDoc(doc(db, 'lists', listId), {
        [`members.${uid}`]: 'editor',
      })
      setEmail('')
    } catch {
      setError('Could not invite user')
    }
  }

  const removeMember = async (uid: string) => {
    await updateDoc(doc(db, 'lists', listId), {
      [`members.${uid}`]: deleteField(),
    })
  }

  const copyLink = () => {
    const url = `${window.location.origin}/lists/${listId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onClose={onClose} title={t('sharing.shareList')}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder={t('sharing.inviteByEmail')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && inviteByEmail()}
          />
          <Button onClick={inviteByEmail}>{t('common.save')}</Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button variant="outline" className="w-full" onClick={copyLink}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {t('sharing.copyLink')}
        </Button>

        <div className="space-y-2">
          <p className="text-sm font-medium">{t('sharing.members')}</p>
          {members.map(([uid, role]) => (
            <div
              key={uid}
              className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Avatar name={uid} size="sm" />
                <div>
                  <p className="text-sm font-medium truncate max-w-[150px]">
                    {uid === list.createdBy ? list.members[uid] : uid}
                  </p>
                  <Badge variant="default" className="text-[10px]">
                    {t(`sharing.role_${role}`)}
                  </Badge>
                </div>
              </div>
              {role !== 'owner' && (
                <button
                  onClick={() => removeMember(uid)}
                  className="p-1 rounded-md text-muted-foreground hover:text-destructive cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  )
}
