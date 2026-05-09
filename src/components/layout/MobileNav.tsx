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

export function MobileNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                'min-w-0 cursor-pointer',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <tab.icon size={22} />
              <span className="text-[10px] font-medium leading-tight">
                {t(tab.labelKey)}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
