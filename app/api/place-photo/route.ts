import { NextResponse } from 'next/server'

const apiKey = () => process.env.GCP_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY

async function resolvePhotoName(query: string, key: string) {
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.photos',
    },
    body: JSON.stringify({ textQuery: query, pageSize: 1 }),
    cache: 'no-store',
  })
  if (!response.ok) return null
  const payload = await response.json() as { places?: Array<{ photos?: Array<{ name?: string }> }> }
  return payload.places?.[0]?.photos?.[0]?.name || null
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const key = apiKey()
  if (!key) return new NextResponse('Photo unavailable', { status: 404 })

  const requestedName = params.get('name')
  const query = params.get('query')
  const name = requestedName || (query ? await resolvePhotoName(query, key) : null)
  if (!name) return new NextResponse('Photo unavailable', { status: 404 })

  const response = await fetch(`https://places.googleapis.com/v1/${name}/media?maxWidthPx=1800&maxHeightPx=1100&skipHttpRedirect=true&key=${encodeURIComponent(key)}`, { cache: 'no-store' })
  if (!response.ok) return new NextResponse('Photo unavailable', { status: response.status })
  const payload = await response.json() as { photoUri?: string }
  if (!payload.photoUri) return new NextResponse('Photo unavailable', { status: 404 })
  return NextResponse.redirect(payload.photoUri, { headers: { 'Cache-Control': 'public, max-age=3600' } })
}
