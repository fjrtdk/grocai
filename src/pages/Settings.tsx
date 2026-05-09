import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { updateDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Avatar } from '../components/ui/avatar'
import { LogOut } from 'lucide-react'
import type { Locale } from '../types'

export function Settings() {
  const { t, i18n } = useTranslation()
  const { user, profile, signOutUser } = useAuth()

  const setLocale = async (locale: Locale) => {
    await i18n.changeLanguage(locale)
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        'preferences.locale': locale,
      })
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

        <Card>
          <h2 className="font-semibold mb-4">{t('settings.profile')}</h2>
          <div className="flex items-center gap-4">
            <Avatar
              src={profile?.photoURL}
              name={profile?.displayName || ''}
              size="lg"
            />
            <div>
              <p className="font-medium">{profile?.displayName}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold mb-4">{t('settings.language')}</h2>
          <div className="space-y-2">
            <button
              onClick={() => setLocale('da-DK')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
            >
              <span>{t('settings.danish')}</span>
              {i18n.language === 'da-DK' && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
            <button
              onClick={() => setLocale('en-US')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
            >
              <span>{t('settings.english')}</span>
              {i18n.language === 'en-US' && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          </div>
        </Card>

        <Button
          variant="destructive"
          className="w-full"
          onClick={signOutUser}
        >
          <LogOut size={16} />
          {t('auth.signOut')}
        </Button>
      </div>
    </AppShell>
  )
}
