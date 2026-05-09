import type { BarcodeResult } from '../types'

const PRICETRACKER_URL = 'https://api.pricetracker.dk/public/product'
const OPENFOODFACTS_URL = 'https://world.openfoodfacts.org/api/v2/product'
const OPENPRODUCTSFACTS_URL = 'https://world.openproductsfacts.org/api/v2/product'

function normalizeEan(ean: string): string {
  return ean.replace(/\D/g, '').padStart(13, '0').slice(0, 13)
}

async function lookupPriceTracker(ean: string): Promise<BarcodeResult | null> {
  try {
    const res = await fetch(`${PRICETRACKER_URL}/${ean}`, {
      headers: { 'User-Agent': 'GrocAI/1.0' },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.found) return null
    return {
      found: true,
      source: 'pricetracker',
      ean,
      productName: data.product.product_name,
      brand: data.product.brand,
      category: data.product.category,
      imageUrl: data.product.image_url,
      prices: {
        lowest: data.product.lowest_price,
        highest: data.product.highest_price,
        avg: data.product.avg_price,
        currency: 'DKK',
      },
      store: data.product.store?.name,
    }
  } catch {
    return null
  }
}

async function lookupOpenFoodFacts(ean: string): Promise<BarcodeResult | null> {
  try {
    const res = await fetch(`${OPENFOODFACTS_URL}/${ean}.json`, {
      headers: { 'User-Agent': 'GrocAI/1.0 (grocai@app)' },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 1) return null
    const p = data.product
    return {
      found: true,
      source: 'openfoodfacts',
      ean,
      productName: p.product_name || p.product_name_en || 'Unknown',
      brand: p.brands,
      category: p.categories?.split(',')[0]?.trim(),
      imageUrl: p.image_url || p.image_small_url,
      prices: undefined,
    }
  } catch {
    return null
  }
}

async function lookupOpenProductsFacts(ean: string): Promise<BarcodeResult | null> {
  try {
    const res = await fetch(`${OPENPRODUCTSFACTS_URL}/${ean}.json`, {
      headers: { 'User-Agent': 'GrocAI/1.0 (grocai@app)' },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 1) return null
    const p = data.product
    return {
      found: true,
      source: 'openproductsfacts',
      ean,
      productName: p.product_name || 'Unknown',
      brand: p.brands,
      category: p.categories?.split(',')[0]?.trim(),
      imageUrl: p.image_url,
      prices: undefined,
    }
  } catch {
    return null
  }
}

export async function lookupBarcode(rawEan: string): Promise<BarcodeResult> {
  const ean = normalizeEan(rawEan)

  const results = await Promise.allSettled([
    lookupPriceTracker(ean),
    lookupOpenFoodFacts(ean),
    lookupOpenProductsFacts(ean),
  ])

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value
    }
  }

  return { found: false, source: 'none', ean, productName: '' }
}
