import { NextResponse } from 'next/server'
import type { Business } from '@/lib/types'
import { db } from '@/lib/db'
import { generatedWebsites } from '@/lib/db/schema'
import { getDraft } from '@/lib/generated-websites'

type UploadedImage = { name: string; dataUrl: string }
type AIDesign = { headline: string; subheadline: string; story: string; sectionOrder: string[]; ctaLabel: string; formType: 'reservation' | 'stay' | 'table' | 'enquiry'; designNotes: string[] }


function isBusiness(value: unknown): value is Business {
  if (!value || typeof value !== 'object') return false
  const business = value as Partial<Business>
  return typeof business.id === 'string' && typeof business.name === 'string'
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { business?: unknown; uploadedImages?: UploadedImage[]; aiDesign?: AIDesign } | null
  if (!body?.business || !isBusiness(body.business)) return NextResponse.json({ error: 'A valid business record is required.' }, { status: 400 })
  const phoneDigits = typeof body.business.phone === 'string' ? body.business.phone.replace(/\D/g, '') : ''
  if (phoneDigits.length < 8) return NextResponse.json({ error: 'Website generation requires a verified business phone number for calls and WhatsApp.' }, { status: 422 })
  const id = `${body.business.id}-${Date.now().toString(36)}`
  const uploadedImages = Array.isArray(body.uploadedImages)
    ? body.uploadedImages.filter((image): image is UploadedImage => Boolean(image && typeof image.name === 'string' && typeof image.dataUrl === 'string' && image.dataUrl.startsWith('data:image/'))).slice(0, 24)
    : undefined
  await db.insert(generatedWebsites).values({ id, business: body.business, uploadedImages, aiDesign: body.aiDesign, createdAt: new Date() })
  return NextResponse.json({ id, url: `https://${id}.sustunenn.com`, fallbackUrl: `/generated/${encodeURIComponent(id)}` }, { status: 201 })
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')
  const draft = id ? await getDraft(id) : null
  if (!draft) return NextResponse.json({ error: 'Website draft not found.' }, { status: 404 })
  return NextResponse.json(draft)
}
