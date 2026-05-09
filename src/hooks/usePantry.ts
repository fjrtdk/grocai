import { useEffect, useState } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { PantryItem } from '../types'

export function usePantry(userId: string | undefined) {
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    const ref = query(
      collection(db, 'pantry', userId, 'items'),
      orderBy('expiryDate', 'asc'),
      orderBy('name', 'asc'),
    )
    const unsub = onSnapshot(ref, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PantryItem)))
      setLoading(false)
    })
    return unsub
  }, [userId])

  const addItem = async (data: Omit<PantryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addDoc(collection(db, 'pantry', userId!, 'items'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  const updateItem = async (itemId: string, data: Partial<PantryItem>) => {
    await updateDoc(doc(db, 'pantry', userId!, 'items', itemId), {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }

  const removeItem = async (itemId: string) => {
    await deleteDoc(doc(db, 'pantry', userId!, 'items', itemId))
  }

  return { items, loading, addItem, updateItem, removeItem }
}
