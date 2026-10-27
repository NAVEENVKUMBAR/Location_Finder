import { generateObject } from 'ai'
import { z } from 'zod'
import { categoryPrompt } from '@/lib/category-prompts'
import type { Business } from '@/lib/types'

const designSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  story: z.string(),
  sectionOrder: z.array(z.string()).max(12),
  ctaLabel: z.string(),
  formType: z.enum(['reservation', 'stay', 'table', 'enquiry']),
  designNotes: z.array(z.string()).max(8),
})

export async function POST(request: Request) {
  try {
    const body = await request.json() as { business?: Business }
    if (!body.business?.name || !body.business.category) return Response.json({ error: 'Business data is required.' }, { status: 400 })
    const result = await generateObject({
      model: 'google/gemini-3.7-flash',
      schema: designSchema,
      prompt: categoryPrompt(body.business),
      temperature: 0.35,
    })
    return Response.json({ design: result.object })
  } catch (error) {
    console.error('[v0] Gemini website design generation failed', error)
    return Response.json({ error: 'AI design generation is unavailable right now.' }, { status: 502 })
  }
}
