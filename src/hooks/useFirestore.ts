import { useEffect, useState } from 'react'
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useCollection<T extends DocumentData>(
  path: string,
  ...constraints: QueryConstraint[]
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = query(collection(db, path), ...constraints)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as T)))
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [path])

  return { data, loading }
}

export function useDocument<T extends DocumentData>(path: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, path)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setData(snap.exists() ? ({ id: snap.id, ...snap.data() } as unknown as T) : null)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [path])

  return { data, loading }
}

export async function addDocument(path: string, data: DocumentData) {
  return addDoc(collection(db, path), { ...data, createdAt: serverTimestamp() })
}

export async function updateDocument(path: string, data: DocumentData) {
  return updateDoc(doc(db, path), { ...data, updatedAt: serverTimestamp() })
}

export async function removeDocument(path: string) {
  return deleteDoc(doc(db, path))
}
