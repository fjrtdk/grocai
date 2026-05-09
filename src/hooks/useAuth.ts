import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut, type User } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { auth, db, googleProvider } from '../lib/firebase'
import type { UserDoc, Locale } from '../types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      console.error('Redirect sign-in failed:', err)
      setError(err.message || 'Kunne ikke logge ind via Google')
    })

    const timeout = setTimeout(() => setLoading(false), 10_000)

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          const ref = doc(db, 'users', u.uid)
          const snap = await getDoc(ref)
          if (snap.exists()) {
            setProfile(snap.data() as UserDoc)
          } else {
            const newProfile: UserDoc = {
              displayName: u.displayName || 'User',
              email: u.email || '',
              photoURL: u.photoURL || '',
              createdAt: serverTimestamp() as any,
              preferences: { locale: 'da-DK' as Locale, defaultStore: '' },
            }
            await setDoc(ref, newProfile)
            setProfile(newProfile)
          }
        } catch (err) {
          console.error('Error loading profile:', err)
          setError('Kunne ikke indlæse profil')
        }
      } else {
        setProfile(null)
      }
      clearTimeout(timeout)
      setLoading(false)
    })
    return () => {
      clearTimeout(timeout)
      unsub()
    }
  }, [])

  const signInGoogle = async () => {
    await signInWithRedirect(auth, googleProvider)
  }

  const signOutUser = async () => {
    await signOut(auth)
  }

  return { user, profile, loading, error, signInGoogle, signOutUser }
}
