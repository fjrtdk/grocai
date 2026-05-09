import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'
import { ListsHome } from './pages/ListsHome'
import { ListDetail } from './pages/ListDetail'
import { Scanner } from './pages/Scanner'
import { Pantry } from './pages/Pantry'
import { Settings } from './pages/Settings'
import { ErrorBoundary } from './components/ErrorBoundary'

function AppRoutes() {
  const location = useLocation()
  return (
    <ErrorBoundary key={location.pathname}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/lists" element={<ListsHome />} />
        <Route path="/lists/:id" element={<ListDetail />} />
        <Route path="/scan" element={<Scanner />} />
        <Route path="/pantry" element={<Pantry />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default function App() {
  const { user, loading, signInGoogle } = useAuth()

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <AuthPage onSignIn={signInGoogle} loading={loading} />
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
