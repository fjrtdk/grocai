import { useEffect, useState } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { GroceryList } from '../types'

export function useLists(userId: string | undefined) {
  const [lists, setLists] = useState<GroceryList[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    const ref = query(
      collection(db, 'lists'),
      where(`members.${userId}`, 'in', ['owner', 'editor', 'viewer']),
      orderBy('pinned', 'desc'),
      orderBy('updatedAt', 'desc'),
    )
    const unsub = onSnapshot(ref, (snap) => {
      setLists(snap.docs.map((d) => ({ id: d.id, ...d.data() } as GroceryList)))
      setLoading(false)
    })
    return unsub
  }, [userId])

  const createList = async (name: string, userId: string) => {
    await addDoc(collection(db, 'lists'), {
      name,
      description: '',
      color: '#ffffff',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      pinned: false,
      archived: false,
      itemCount: 0,
      checkedCount: 0,
      members: { [userId]: 'owner' },
    })
  }

  const togglePin = async (list: GroceryList) => {
    await updateDoc(doc(db, 'lists', list.id), { pinned: !list.pinned })
  }

  const toggleArchive = async (list: GroceryList) => {
    await updateDoc(doc(db, 'lists', list.id), { archived: !list.archived })
  }

  const deleteList = async (id: string) => {
    await deleteDoc(doc(db, 'lists', id))
  }

  const duplicateList = async (list: GroceryList, userId: string) => {
    await addDoc(collection(db, 'lists'), {
      ...list,
      id: undefined,
      name: `${list.name} (kopi)`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      pinned: false,
      archived: false,
      itemCount: 0,
      checkedCount: 0,
      members: { [userId]: 'owner' },
    })
  }

  return { lists, loading, createList, togglePin, toggleArchive, deleteList, duplicateList }
}
