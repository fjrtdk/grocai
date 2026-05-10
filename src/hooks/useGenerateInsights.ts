import { useEffect, useRef } from 'react'
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { generateInsights } from '../lib/ai'
import type { ListItem, PantryItem } from '../types'

export function useGenerateInsights(
  userId: string | undefined,
  listItems: ListItem[],
  pantryItems: PantryItem[],
  locale: string,
) {
  const generating = useRef(false)

  useEffect(() => {
    if (!userId) return

    const timer = setTimeout(async () => {
      if (generating.current) return
      generating.current = true

      try {
        const existing = await getDocs(
          query(
            collection(db, 'insights', userId, 'tips'),
            where('dismissed', '==', false),
          ),
        )
        if (!existing.empty) {
          generating.current = false
          return
        }

        const context = {
          listItems: listItems.map((i) => i.name),
          pantryExpiring: pantryItems
            .filter((i) => i.expiryDate)
            .map((i) => i.name),
          pantryLow: pantryItems
            .filter((i) => i.quantity <= 1)
            .map((i) => i.name),
          patterns: [],
        }

        if (
          context.listItems.length === 0 &&
          context.pantryExpiring.length === 0 &&
          context.pantryLow.length === 0
        ) {
          generating.current = false
          return
        }

        const result = await generateInsights(locale as any, context)

        await Promise.all(
          result.tips.map((tip) =>
            addDoc(collection(db, 'insights', userId, 'tips'), {
              ...tip,
              createdAt: serverTimestamp(),
              dismissed: false,
            }),
          ),
        )
      } catch (err) {
        console.error('Failed to generate insights:', err)
      } finally {
        generating.current = false
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [userId, listItems, pantryItems, locale])
}
