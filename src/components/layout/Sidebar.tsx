import { LayoutDashboard, ShoppingCart, Scan, Refrigerator, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/lists', icon: ShoppingCart, labelKey: 'nav.lists' },
  { path: '/scan', icon: Scan, labelKey: 'nav.scanner' },
  { path: '/pantry', icon: Refrigerator, labelKey: 'nav.pantry' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
]

export function Sidebar() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <aside className="hidden lg:flex flex-col w-56 border-r border-border bg-background h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight">{t('app.name')}</h1>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                'cursor-pointer',
                active
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              )}
            >
              <tab.icon size={18} />
              {t(tab.labelKey)}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
