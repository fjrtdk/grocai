# SPEC-02: Firestore Data Model

## Collections

### `users/{uid}`

```typescript
interface UserDoc {
  displayName: string
  email: string
  photoURL: string
  createdAt: Timestamp
  preferences: {
    locale: 'da-DK' | 'en-US'
    defaultStore: string   // e.g. "Rema 1000"
  }
}
```

### `lists/{listId}`

```typescript
interface GroceryList {
  name: string
  description: string
  color: string
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string        // uid
  pinned: boolean
  archived: boolean
  itemCount: number
  checkedCount: number
  members: Record<string, 'owner' | 'editor' | 'viewer'>
}
```

### `lists/{listId}/items/{itemId}`

```typescript
interface ListItem {
  name: string
  quantity: number
  unit: string              // "stk", "g", "kg", "l", "ml", "pk", "dåse"
  category: GroceryCategory
  storageArea: StorageArea
  estimatedPrice?: number
  currency: 'DKK'
  barcode?: string
  imageUrl?: string
  isChecked: boolean
  addedBy: string
  checkedBy?: string
  checkedAt?: Timestamp
  aiEnriched: boolean
  sortOrder: number
  createdAt: Timestamp
}
```

### `pantry/{uid}/items/{itemId}`

```typescript
interface PantryItem {
  name: string
  quantity: number
  unit: string
  category: GroceryCategory
  storageArea: 'køleskab' | 'fryser' | 'skab' | 'stuetemperatur'
  expiryDate?: Timestamp
  purchasedAt?: Timestamp
  openedAt?: Timestamp
  barcode?: string
  imageUrl?: string
  currentPrice?: number
  avgPrice?: number
  store?: string
  notes?: string
  aiSuggestRestock: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `insights/{uid}/tips/{tipId}`

```typescript
interface InsightTip {
  type: 'price_alert' | 'expiry_warning' | 'restock' | 'pattern' | 'recommendation'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  createdAt: Timestamp
  expiresAt: Timestamp
  dismissed: boolean
  sourceItemId?: string
}
```

## Enums

```typescript
type GroceryCategory =
  | 'Mejeri' | 'Grøntsager & Frugt' | 'Kød & Fisk' | 'Pantry'
  | 'Frostvarer' | 'Drikkevarer' | 'Bagning' | 'Krydderier'
  | 'Hygiejne' | 'Rengøring' | 'Dåsemad' | 'Slik & Snacks'
  | 'Baby' | 'Kæledyr' | 'Vin & Øl' | 'Andet'

type StorageArea = 'køleskab' | 'fryser' | 'skab' | 'stuetemperatur'
```

## Firestore Indexes

```json
{
  "indexes": [
    { "fields": ["isChecked ASC", "sortOrder ASC"] },
    { "fields": ["category ASC", "sortOrder ASC"] },
    { "fields": ["pinned DESC", "updatedAt DESC"] },
    { "fields": ["expiryDate ASC", "name ASC"] },
    { "fields": ["storageArea ASC", "name ASC"] },
    { "fields": ["priority ASC", "createdAt DESC"] }
  ]
}
```
