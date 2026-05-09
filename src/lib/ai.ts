import OpenAI from 'openai'
import type { AICategorization, AIEnrichment, AIInsightResult, Locale } from '../types'

const FAST_MODEL = 'meta/llama-3.1-8b-instruct'
const MAIN_MODEL = 'nvidia/llama-3.3-nemotron-super-49b-v1'

let nim: OpenAI | null = null

function getClient(): OpenAI {
  if (!nim) {
    nim = new OpenAI({
      baseURL: 'https://integrate.api.nvidia.com/v1',
      apiKey: import.meta.env.VITE_NVIDIA_API_KEY,
      dangerouslyAllowBrowser: true,
    })
  }
  return nim
}

const categorySchema = {
  type: 'object' as const,
  properties: {
    category: {
      type: 'string' as const,
      enum: [
        'Mejeri', 'Grøntsager & Frugt', 'Kød & Fisk', 'Pantry',
        'Frostvarer', 'Drikkevarer', 'Bagning', 'Krydderier',
        'Hygiejne', 'Rengøring', 'Dåsemad', 'Slik & Snacks',
        'Baby', 'Kæledyr', 'Vin & Øl', 'Andet',
      ],
    },
    storageArea: {
      type: 'string' as const,
      enum: ['køleskab', 'fryser', 'skab', 'stuetemperatur'],
    },
  },
  required: ['category', 'storageArea'],
}

const enrichmentSchema = {
  type: 'object' as const,
  properties: {
    normalized_name: { type: 'string' as const },
    danish_name: { type: 'string' as const },
    category: {
      type: 'string' as const,
      enum: [
        'Mejeri', 'Grøntsager & Frugt', 'Kød & Fisk', 'Pantry',
        'Frostvarer', 'Drikkevarer', 'Bagning', 'Krydderier',
        'Hygiejne', 'Rengøring', 'Dåsemad', 'Slik & Snacks',
        'Baby', 'Kæledyr', 'Vin & Øl', 'Andet',
      ],
    },
    storageArea: {
      type: 'string' as const,
      enum: ['køleskab', 'fryser', 'skab', 'stuetemperatur'],
    },
    estimatedPriceRange: {
      type: 'object' as const,
      properties: {
        low: { type: 'number' as const },
        high: { type: 'number' as const },
        currency: { type: 'string' as const, enum: ['DKK'] },
      },
      required: ['low', 'high', 'currency'],
    },
    storageTip: { type: 'string' as const },
    alternativeProducts: {
      type: 'array' as const,
      items: { type: 'string' as const },
      maxItems: 3,
    },
  },
  required: ['normalized_name', 'danish_name', 'category', 'storageArea', 'estimatedPriceRange', 'storageTip', 'alternativeProducts'],
}

const insightSchema = {
  type: 'object' as const,
  properties: {
    tips: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          type: {
            type: 'string' as const,
            enum: ['price_alert', 'expiry_warning', 'restock', 'pattern', 'recommendation'],
          },
          title: { type: 'string' as const },
          message: { type: 'string' as const },
          priority: { type: 'string' as const, enum: ['low', 'medium', 'high'] },
        },
        required: ['type', 'title', 'message', 'priority'],
      },
    },
  },
  required: ['tips'],
}

async function chatCompletion(model: string, messages: any[], schema: any, maxTokens: number, temperature: number) {
  const res = await getClient().chat.completions.create(
    {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    } as any,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        extra_body: { guided_json: schema },
      }),
    } as any,
  )
  return JSON.parse((res as any).choices[0].message.content!)
}

export async function categorizeItem(itemName: string): Promise<AICategorization> {
  return chatCompletion(
    FAST_MODEL,
    [
      {
        role: 'system',
        content:
          'Du er en hjælpsom assistent der kategoriserer danske dagligvareprodukter. Svar kun med JSON. Brug kategorier på dansk.',
      },
      { role: 'user', content: itemName },
    ],
    categorySchema,
    100,
    0.1,
  )
}

export async function enrichProduct(
  ean: string,
  rawName: string,
  brand: string | undefined,
  source: string,
  locale: Locale,
): Promise<AIEnrichment> {
  return chatCompletion(
    MAIN_MODEL,
    [
      {
        role: 'system',
        content: `Du er en ekspert i danske dagligvareprodukter. Din opgave er at berige produktdata fra et stregkodeopslag. Normaliser produktnavnet, oversæt til dansk hvis nødvendigt, og giv opbevaringsråd. Brug ${locale} til at bestemme svarsprog. Svar kun med JSON.`,
      },
      {
        role: 'user',
        content: JSON.stringify({ source, ean, rawName, brand }),
      },
    ],
    enrichmentSchema,
    500,
    0.3,
  )
}

export async function generateInsights(
  locale: Locale,
  context: {
    listItems: string[]
    pantryExpiring: string[]
    pantryLow: string[]
    patterns: string[]
  },
): Promise<AIInsightResult> {
  return chatCompletion(
    MAIN_MODEL,
    [
      {
        role: 'system',
        content: `Du er GrocAI, en AI-assistent der hjælper brugere med at handle smartere. Analyser brugerens indkøbsliste og pantry, og giv handlingsorienterede tips på ${locale}. Svar kun med JSON.`,
      },
      {
        role: 'user',
        content: JSON.stringify(context),
      },
    ],
    insightSchema,
    500,
    0.3,
  )
}
