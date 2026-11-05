import { z } from 'zod'
import { categoryPrompt } from '@/lib/category-prompts'
import type { Business } from '@/lib/types'

const requestCounts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 8
const RATE_WINDOW = 60_000

const designSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  story: z.string(),
  sectionOrder: z.array(z.string()).max(12),
  ctaLabel: z.string(),
  formType: z.enum(['reservation', 'stay', 'table', 'enquiry']),
  designNotes: z.array(z.string()).max(8),
  visualDirection: z.enum(['layered editorial', 'double exposure', 'quiet luxury', 'modern utility', 'organic retreat', 'bold geometric']),
  recommendedLayout: z.enum(['cinematic', 'editorial', 'magazine', 'architectural', 'floating', 'gallery', 'minimal', 'bold', 'luxury']),
  colorSystem: z.enum(['coffee-oat', 'burgundy-cream', 'olive-linen', 'navy-champagne', 'teal-brass', 'amber-slate', 'forest-sand', 'lavender-slate', 'terracotta-charcoal']),
  typeMood: z.enum(['serif editorial', 'warm humanist', 'quiet modern', 'bold geometric', 'refined classic']),
})

export async function POST(request: Request) {
  try {
    const clientKey = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const now = Date.now()
    const current = requestCounts.get(clientKey)
    if (current && current.resetAt > now && current.count >= RATE_LIMIT) return Response.json({ error: 'AI generation rate limit reached. Please try again in a minute.' }, { status: 429 })
    requestCounts.set(clientKey, current && current.resetAt > now ? { count: current.count + 1, resetAt: current.resetAt } : { count: 1, resetAt: now + RATE_WINDOW })
    const body = await request.json() as { business?: Business }
    if (!body.business?.name || !body.business.category) return Response.json({ error: 'Business data is required.' }, { status: 400 })
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return Response.json({ error: 'Gemini API key is not configured.' }, { status: 503 })

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: categoryPrompt(body.business) }] }],
        generationConfig: {
          temperature: 0.35,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              headline: { type: 'STRING' }, subheadline: { type: 'STRING' }, story: { type: 'STRING' },
              sectionOrder: { type: 'ARRAY', items: { type: 'STRING' } }, ctaLabel: { type: 'STRING' },
              formType: { type: 'STRING', enum: ['reservation', 'stay', 'table', 'enquiry'] },
              designNotes: { type: 'ARRAY', items: { type: 'STRING' } },
              visualDirection: { type: 'STRING', enum: ['layered editorial', 'double exposure', 'quiet luxury', 'modern utility', 'organic retreat', 'bold geometric'] },
              recommendedLayout: { type: 'STRING', enum: ['cinematic', 'editorial', 'magazine', 'architectural', 'floating', 'gallery', 'minimal', 'bold', 'luxury'] },
              colorSystem: { type: 'STRING', enum: ['coffee-oat', 'burgundy-cream', 'olive-linen', 'navy-champagne', 'teal-brass', 'amber-slate', 'forest-sand', 'lavender-slate', 'terracotta-charcoal'] },
              typeMood: { type: 'STRING', enum: ['serif editorial', 'warm humanist', 'quiet modern', 'bold geometric', 'refined classic'] },
            },
            required: ['headline', 'subheadline', 'story', 'sectionOrder', 'ctaLabel', 'formType', 'designNotes', 'visualDirection', 'recommendedLayout', 'colorSystem', 'typeMood'],
          },
        },
      }),
    })
    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } }
    if (!response.ok) throw new Error(payload.error?.message || `Gemini request failed with status ${response.status}`)
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Gemini returned an empty design response')
    const design = designSchema.parse(JSON.parse(text))
    return Response.json({ design })
  } catch (error) {
    console.error('[v0] Gemini website design generation failed', error)
    const message = error instanceof Error ? error.message : ''
    const requiresBilling = message.toLowerCase().includes('credit card') || message.toLowerCase().includes('customer_verification_required')
    return Response.json({ error: requiresBilling ? 'AI Gateway requires a valid credit card on the connected Vercel team before Gemini can generate websites.' : 'AI design generation is unavailable right now.' }, { status: requiresBilling ? 503 : 502 })
  }
}
