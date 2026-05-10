import { describe, it, expect, vi } from 'vitest'

// Mock firebase before any module imports to prevent Firebase init errors
vi.mock('../lib/firebase', () => ({
  auth: {},
  db: {},
  googleProvider: {},
}))

// Mock useAuth to return an unauthenticated state
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    error: null,
    signInGoogle: vi.fn(),
    signOutUser: vi.fn(),
  }),
}))

import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renders sign-in page when not authenticated', () => {
    render(<App />)
    // AuthPage renders with a sign-in prompt
    expect(screen.getByText(/log ind|sign in|google/i)).toBeTruthy()
  })
})
