# SPEC-03: NVIDIA NIM AI Integration

## Client Setup

```typescript
const nim = new OpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY,
})
```

## Model Split

| Model | Task | Tokens | Temp | Latency Target |
|---|---|---|---|---|
| `meta/llama-3.1-8b-instruct` | Fast categorization | 100 | 0.1 | <500ms |
| `nvidia/llama-3.3-nemotron-super-49b-v1` | Barcode enrichment | 500 | 0.3 | <2s |
| `nvidia/llama-3.3-nemotron-super-49b-v1` | Insights generation | 500 | 0.3 | <3s |

## NVIDIA-Specific API

NVIDIA NIM uses `extra_body: { guided_json: <schema> }` instead of OpenAI's `response_format`.

```typescript
const res = await nim.chat.completions.create({
  model: 'meta/llama-3.1-8b-instruct',
  messages: [/* ... */],
  extra_body: { guided_json: schema },
} as any)
```

## Fast Categorization (8B)

**Trigger**: Every item added to a list.

**System prompt**: "Du er en hjælpsom assistent der kategoriserer danske dagligvareprodukter. Svar kun med JSON."

**Schema**: `{ category: GroceryCategory, storageArea: StorageArea }`

## Barcode Enrichment (49B)

**Trigger**: After barcode scan with product data.

**System prompt**: Context-aware with raw product name, brand, source, locale.

**Enriches**: Normalized name, Danish name, category, storage area, price range, storage tip, 3 alternatives.

## Insights Generation (49B)

**Trigger**: Periodic / on-demand analysis of list + pantry.

**Context**: Current list items, expiring pantry items, low stock items, purchase patterns.

**Output**: Up to 3 tips with type, title, message, priority.
