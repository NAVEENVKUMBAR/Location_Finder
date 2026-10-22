import { NextResponse } from 'next/server'
import type { Business } from '@/lib/types'

const drafts = new Map<string, { business: Business; createdAt: string }>()

function isBusiness(value: unknown): value is Business {
  if (!value || typeof value !== 'object') return false
  const business = value as Partial<Business>
  return typeof business.id === 'string' && typeof business.name === 'string'
}

export function getDraft(id: string) {
  return drafts.get(id)
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { business?: unknown } | null
  if (!body?.business || !isBusiness(body.business)) return NextResponse.json({ error: 'A valid business record is required.' }, { status: 400 })
  const phoneDigits = typeof body.business.phone === 'string' ? body.business.phone.replace(/\D/g, '') : ''
  if (phoneDigits.length < 8) return NextResponse.json({ error: 'Website generation requires a verified business phone number for calls and WhatsApp.' }, { status: 422 })
  const id = `${body.business.id}-${Date.now().toString(36)}`
  drafts.set(id, { business: body.business, createdAt: new Date().toISOString() })
  return NextResponse.json({ id, url: `/generated/${encodeURIComponent(id)}` }, { status: 201 })
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')
  const draft = id ? drafts.get(id) : null
  if (!draft) return NextResponse.json({ error: 'Website draft not found.' }, { status: 404 })
  return NextResponse.json(draft)
}
