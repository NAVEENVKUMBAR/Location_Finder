import { NextResponse } from 'next/server'
import type { Business } from '@/lib/types'

const pipeline = new Map<string, { business: Business; addedAt: string }>()

function validBusiness(value: unknown): value is Business {
  if (!value || typeof value !== 'object') return false
  const business = value as Partial<Business>
  return typeof business.id === 'string' && business.id.length > 0 && typeof business.name === 'string'
}

export async function GET() {
  return NextResponse.json({ records: [...pipeline.values()] })
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { businesses?: unknown }
    const businesses = Array.isArray(body.businesses) ? body.businesses.filter(validBusiness) : []
    if (!businesses.length) return NextResponse.json({ error: 'Select at least one valid business.' }, { status: 400 })

    const added: Array<{ business: Business; addedAt: string }> = []
    const duplicates: Business[] = []
    const failed: Business[] = []
    for (const business of businesses) {
      if (pipeline.has(business.id)) {
        duplicates.push(business)
      } else {
        const record = { business, addedAt: new Date().toISOString() }
        pipeline.set(business.id, record)
        added.push(record)
      }
    }
    return NextResponse.json({ added, duplicates, failed, total: pipeline.size })
  } catch {
    return NextResponse.json({ error: 'Could not save pipeline records.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Business id is required.' }, { status: 400 })
  const removed = pipeline.delete(id)
  return NextResponse.json({ removed, total: pipeline.size })
}
