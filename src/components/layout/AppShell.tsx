import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="flex-1 pb-20 lg:pb-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">{children}</div>
      </main>
      <MobileNav />
    </div>
  )
}
