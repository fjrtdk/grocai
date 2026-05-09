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
  increment,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { ListItem } from '../types'

export function useListItems(listId: string | undefined) {
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!listId) {
      setLoading(false)
      return
    }
    const ref = query(
      collection(db, 'lists', listId, 'items'),
      orderBy('isChecked', 'asc'),
      orderBy('sortOrder', 'asc'),
    )
    const unsub = onSnapshot(ref, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ListItem)))
      setLoading(false)
    })
    return unsub
  }, [listId])

  const addItem = async (
    data: Omit<ListItem, 'id' | 'createdAt'>,
  ) => {
    const itemRef = await addDoc(collection(db, 'lists', listId!, 'items'), {
      ...data,
      createdAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'lists', listId!), {
      itemCount: increment(1),
      updatedAt: serverTimestamp(),
    })
    return itemRef.id
  }

  const toggleCheck = async (item: ListItem, userId: string) => {
    const now = serverTimestamp()
    if (item.isChecked) {
      await updateDoc(doc(db, 'lists', listId!, 'items', item.id), {
        isChecked: false,
        checkedBy: null,
        checkedAt: null,
      })
    } else {
      await updateDoc(doc(db, 'lists', listId!, 'items', item.id), {
        isChecked: true,
        checkedBy: userId,
        checkedAt: now,
      })
    }
    const delta = item.isChecked ? -1 : 1
    await updateDoc(doc(db, 'lists', listId!), {
      checkedCount: increment(delta),
      updatedAt: now,
    })
  }

  const removeItem = async (itemId: string) => {
    await deleteDoc(doc(db, 'lists', listId!, 'items', itemId))
    await updateDoc(doc(db, 'lists', listId!), {
      itemCount: increment(-1),
      checkedCount: increment(-1),
      updatedAt: serverTimestamp(),
    })
  }

  return { items, loading, addItem, toggleCheck, removeItem }
}
