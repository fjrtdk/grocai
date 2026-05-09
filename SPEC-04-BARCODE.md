# SPEC-04: Barcode Lookup Orchestrator

## Source Chain

All sources queried concurrently. First meaningful result wins. 5s total timeout.

| Source | Endpoint | Rate Limit | Coverage |
|---|---|---|---|
| PriceTracker.dk | `GET /public/product/{ean}` | 10/min/IP | 1,500+ Danish stores, 5M+ products, prices in DKK |
| OpenFoodFacts | `GET /api/v2/product/{ean}.json` | 15/min/IP | 500K+ global food products |
| OpenProductsFacts | `GET /api/v2/product/{ean}.json` | 15/min/IP | Non-food products |

## Normalized Output

```typescript
interface BarcodeResult {
  found: boolean
  source: 'pricetracker' | 'openfoodfacts' | 'openproductsfacts' | 'none'
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
```

## Flow

```
[react-zxing decodes camera → EAN-13 string]
                   ↓
[Barcode Orchestrator — parallel queries, 3s each]
  ├→ PriceTracker.dk (Danish prices, real stores)
  ├→ OpenFoodFacts (global food)
  └→ OpenProductsFacts (non-food)
                   ↓
[First result wins → normalize to BarcodeResult]
                   ↓
[NVIDIA 49B enriches → category, price range, storage, tips]
                   ↓
[User confirms → add to list or pantry]
```

## Rate Limit Guard

- Track per-source request count in memory
- Skip source if rate limited in the last 60s
- All requests include `User-Agent: GrocAI/1.0` header
