import type { Timestamp } from 'firebase/firestore'

export type Locale = 'da-DK' | 'en-US'
export type Role = 'owner' | 'editor' | 'viewer'
export type StorageArea = 'køleskab' | 'fryser' | 'skab' | 'stuetemperatur'

export type GroceryCategory =
  | 'Mejeri'
  | 'Grøntsager & Frugt'
  | 'Kød & Fisk'
  | 'Pantry'
  | 'Frostvarer'
  | 'Drikkevarer'
  | 'Bagning'
  | 'Krydderier'
  | 'Hygiejne'
  | 'Rengøring'
  | 'Dåsemad'
  | 'Slik & Snacks'
  | 'Baby'
  | 'Kæledyr'
  | 'Vin & Øl'
  | 'Andet'

export type InsightType =
  | 'price_alert'
  | 'expiry_warning'
  | 'restock'
  | 'pattern'
  | 'recommendation'

export type Priority = 'low' | 'medium' | 'high'

export type ActivityType =
  | 'item_added'
  | 'item_checked'
  | 'item_unchecked'
  | 'item_removed'
  | 'item_updated'
  | 'member_added'
  | 'member_removed'
  | 'list_created'
  | 'list_renamed'
  | 'list_archived'

export interface UserDoc {
  displayName: string
  email: string
  photoURL: string
  createdAt: Timestamp
  preferences: {
    locale: Locale
    defaultStore: string
  }
}

export interface GroceryList {
  id: string
  name: string
  description: string
  color: string
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
  pinned: boolean
  archived: boolean
  itemCount: number
  checkedCount: number
  members: Record<string, Role>
}

export interface ListItem {
  id: string
  name: string
  quantity: number
  unit: string
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

export interface PantryItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: GroceryCategory
  storageArea: StorageArea
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

export interface InsightTip {
  id: string
  type: InsightType
  title: string
  message: string
  priority: Priority
  createdAt: Timestamp
  expiresAt: Timestamp
  dismissed: boolean
  sourceItemId?: string
}

export interface ActivityLog {
  id: string
  type: ActivityType
  userId: string
  userName: string
  timestamp: Timestamp
  metadata?: Record<string, string>
}

export interface BarcodeResult {
  found: boolean
  source: 'pricetracker' | 'openfoodfacts' | 'openproductsfacts' | 'google' | 'none'
  ean: string
  productName: string
  brand?: string
  category?: string
  imageUrl?: string
  prices?: {
    lowest: number
    highest: number
    avg: number
    currency: 'DKK'
  }
  store?: string
}

export interface AICategorization {
  category: GroceryCategory
  storageArea: StorageArea
}

export interface AIEnrichment {
  normalized_name: string
  danish_name: string
  category: GroceryCategory
  storageArea: StorageArea
  estimatedPriceRange: {
    low: number
    high: number
    currency: 'DKK'
  }
  storageTip: string
  alternativeProducts: string[]
}

export interface AIInsightResult {
  tips: Array<{
    type: InsightType
    title: string
    message: string
    priority: Priority
  }>
}
