import { NextResponse } from 'next/server'
import type { Business, HospitalityCategory, WebsiteStatus } from '@/lib/types'

const TOMTOM_GEOCODE_URL = 'https://api.tomtom.com/search/2/geocode'
const TOMTOM_POI_URL = 'https://api.tomtom.com/search/2/poiSearch'
const GOOGLE_PLACES_URL = 'https://places.googleapis.com/v1/places:searchText'

type TomTomResult = {
  id?: string
  poi?: { name?: string; phone?: string; url?: string; categories?: string[]; classifications?: Array<{ code?: string }> }
  address?: { freeformAddress?: string; municipality?: string; countrySubdivision?: string; postalCode?: string }
  position?: { lat?: number; lon?: number }
  dist?: number
}

type TomTomSearchPayload = {
  results?: TomTomResult[]
  summary?: { totalResults?: number; numResults?: number; offset?: number }
}

type GooglePlace = {
  id?: string
  displayName?: { text?: string }
  formattedAddress?: string
  nationalPhoneNumber?: string
  websiteUri?: string
  rating?: number
  googleMapsUri?: string
  photos?: Array<{ name?: string }>
  location?: { latitude?: number; longitude?: number }
  types?: string[]
  regularOpeningHours?: { weekdayDescriptions?: string[] }
}

type GoogleSearchPayload = {
  places?: GooglePlace[]
  nextPageToken?: string
}

const SEARCH_RADIUS_METERS = 10_000
const TOMTOM_PAGE_SIZE = 100
const MAX_PAGES_PER_TERM = 10
const API_TIMEOUT_MS = 15_000
const WEBSITE_CHECK_CONCURRENCY = 8
const VALID_CATEGORIES = new Set<HospitalityCategory>([
  'All Hospitality', 'Hotels', 'Restaurants', 'PGs', 'Hostels', 'Resorts', 'Lodges',
  'Homestays', 'Guest Houses', 'Cafés', 'Other Hospitality',
])

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, worker: (item: T, index: number) => Promise<R>) {
  const results = new Array<R>(items.length)
  let nextIndex = 0
  async function consume() {
    while (true) {
      const index = nextIndex++
      if (index >= items.length) return
      results[index] = await worker(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, consume))
  return results
}

function addSearchParams(url: URL, apiKey: string, lat: number, lon: number, offset: number, radius = SEARCH_RADIUS_METERS) {
  url.searchParams.set('key', apiKey)
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lon))
  url.searchParams.set('radius', String(radius))
  url.searchParams.set('limit', String(TOMTOM_PAGE_SIZE))
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('language', 'en-US')
  url.searchParams.set('typeahead', 'false')
}

async function fetchAllPois(term: string, apiKey: string, lat: number, lon: number) {
  const collected: TomTomResult[] = []
  let offset = 0
  let totalResults: number | null = null

  let pageCount = 0
  while ((totalResults === null || offset < totalResults) && pageCount < MAX_PAGES_PER_TERM) {
    const pageUrl = new URL(`${TOMTOM_POI_URL}/${encodeURIComponent(term)}.json`)
    addSearchParams(pageUrl, apiKey, lat, lon, offset)
    const payload = await tomTomFetch(pageUrl) as TomTomSearchPayload
    const page = payload.results ?? []
    collected.push(...page)
    pageCount += 1
    totalResults = payload.summary?.totalResults ?? collected.length
    if (!page.length || page.length < TOMTOM_PAGE_SIZE) break
    offset += page.length
  }

  return collected
}

function searchTerms(category: HospitalityCategory) {
  if (category === 'All Hospitality' || category === 'Other Hospitality') {
    return ['hotel', 'restaurant', 'cafe', 'hostel', 'resort', 'lodge', 'guest house']
  }
  const terms: Record<Exclude<HospitalityCategory, 'All Hospitality' | 'Other Hospitality'>, string[]> = {
    Hotels: ['hotel'], Restaurants: ['restaurant'], PGs: ['paying guest accommodation', 'guest house'],
    Hostels: ['hostel'], Resorts: ['resort'], Lodges: ['lodge'], Homestays: ['homestay', 'guest house'],
    'Guest Houses': ['guest house'], 'Cafés': ['cafe'],
  }
  return terms[category] ?? ['hospitality']
}

function normalizeUrl(value?: string | null) {
  if (!value) return null
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`)
    return url.toString().replace(/\/$/, '')
  } catch { return null }
}

function normalizePhone(value?: string | null) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

async function verifyWebsite(website: string | null) {
  if (!website) return { status: 'NO_WEBSITE' as WebsiteStatus, checkStatus: 'Confirmed' as const }
  try {
    const response = await fetch(website, {
      method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(4500),
      headers: { 'User-Agent': 'TeamB-HospitalityFinder/1.0' },
    })
    return response.ok
      ? { status: 'ACTIVE' as WebsiteStatus, checkStatus: 'Confirmed' as const }
      : { status: 'INACTIVE' as WebsiteStatus, checkStatus: 'Confirmed' as const }
  } catch {
    return { status: 'ACTIVE' as WebsiteStatus, checkStatus: 'Temporary failure' as const }
  }
}

function distanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radius = 6371000
  const radians = (value: number) => value * Math.PI / 180
  const dLat = radians(lat2 - lat1)
  const dLon = radians(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function tomTomFetch(url: URL) {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(API_TIMEOUT_MS) })
  if (!response.ok) throw new Error(`TomTom returned ${response.status}`)
  return response.json()
}

async function googlePlacesSearch(textQuery: string, apiKey: string, latitude?: number, longitude?: number, maxPages = 3, radius = SEARCH_RADIUS_METERS) {
  const places: GooglePlace[] = []
  let pageToken: string | undefined

  for (let page = 0; page < maxPages; page += 1) {
    const body: Record<string, unknown> = {
      textQuery,
      languageCode: 'en',
      maxResultCount: 20,
    }
    if (pageToken) body.pageToken = pageToken
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      body.locationBias = { circle: { center: { latitude, longitude }, radius } }
    }

    const response = await fetch(GOOGLE_PLACES_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.googleMapsUri,places.photos,places.location,places.types,places.regularOpeningHours,nextPageToken',
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) throw new Error(`Google Places returned ${response.status}`)
    const payload = await response.json() as GoogleSearchPayload
    places.push(...(payload.places ?? []))
    pageToken = payload.nextPageToken
    if (!pageToken) break
    await new Promise((resolve) => setTimeout(resolve, 1500))
  }

  return places
}

function googlePlaceCategory(place: GooglePlace, requested: HospitalityCategory) {
  if (requested !== 'All Hospitality' && requested !== 'Other Hospitality') return requested
  const types = place.types ?? []
  if (types.some((type) => type.includes('hotel') || type.includes('resort'))) return 'Hotels'
  if (types.some((type) => type.includes('restaurant'))) return 'Restaurants'
  if (types.some((type) => type.includes('cafe'))) return 'Cafés'
  if (types.some((type) => type.includes('hostel'))) return 'Hostels'
  return requested === 'All Hospitality' ? 'Other Hospitality' : requested
}

async function searchGoogle(location: string, category: HospitalityCategory, apiKey: string) {
  let resolvedAddress: string | null = null
  let center: { lat: number; lng: number } | null = null

  // Prefer the legacy geocoder when it is enabled, but do not make it a hard
  // dependency: many production keys enable Places API (New) without Geocoding API.
  const geocodeResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${encodeURIComponent(apiKey)}`, { cache: 'no-store' })
  if (geocodeResponse.ok) {
    const geocode = await geocodeResponse.json()
    const resolved = geocode.results?.[0]
    const geocodedCenter = resolved?.geometry?.location
    if (geocodedCenter && Number.isFinite(geocodedCenter.lat) && Number.isFinite(geocodedCenter.lng)) {
      center = { lat: geocodedCenter.lat, lng: geocodedCenter.lng }
      resolvedAddress = resolved.formatted_address || null
    }
  }

  // Resolve city/town/area names through the same Places API used for results.
  // This also fixes searches such as Shivamogga when Geocoding API is disabled.
  if (!center) {
    const locationMatches = await googlePlacesSearch(`${location}, India`, apiKey, undefined, undefined, 1)
    const resolvedPlace = locationMatches.find((place) => Number.isFinite(place.location?.latitude) && Number.isFinite(place.location?.longitude))
    if (resolvedPlace?.location?.latitude !== undefined && resolvedPlace.location.longitude !== undefined) {
      center = { lat: resolvedPlace.location.latitude, lng: resolvedPlace.location.longitude }
      resolvedAddress = resolvedPlace.formattedAddress || null
    }
  }

  if (!center) return null

  const unique = new Map<string, GooglePlace>()
  const terms = searchTerms(category)
  // Text Search returns at most 60 places for one query. Search overlapping
  // tiles and category synonyms so dense locations are not capped at 59.
  const searchPoints = [
    { lat: center.lat, lng: center.lng },
    { lat: center.lat + 0.045, lng: center.lng },
    { lat: center.lat - 0.045, lng: center.lng },
    { lat: center.lat, lng: center.lng + 0.055 },
    { lat: center.lat, lng: center.lng - 0.055 },
  ]
  for (const point of searchPoints) {
    for (const term of terms) {
      const places = await googlePlacesSearch(`${term} near ${location}`, apiKey, point.lat, point.lng, 3, 6500)
      for (const place of places) {
        if (place.id && Number.isFinite(place.location?.latitude) && Number.isFinite(place.location?.longitude)) unique.set(place.id, place)
      }
    }
  }

  const businesses = await mapWithConcurrency([...unique.values()], WEBSITE_CHECK_CONCURRENCY, async (place, index) => {
    const latitude = Number(place.location!.latitude)
    const longitude = Number(place.location!.longitude)
    const website = normalizeUrl(place.websiteUri)
    const check = await verifyWebsite(website)
    const address = place.formattedAddress || null
    const phone = normalizePhone(place.nationalPhoneNumber)
    return {
      id: `google-${place.id || index}`,
      name: place.displayName?.text || 'Unnamed business',
      category: googlePlaceCategory(place, category), address, phone, website,
      websiteStatus: check.status, websiteCheckStatus: check.checkStatus,
      rating: place.rating ?? null,
      openingHours: place.regularOpeningHours ? { descriptions: { open: place.regularOpeningHours.weekdayDescriptions?.join(' | ') || 'Available', close: '' } } : null,
      mapUrl: place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([place.displayName?.text, address].filter(Boolean).join(', '))}`,
      photoName: place.photos?.[0]?.name || null,
      photoNames: place.photos?.map((photo) => photo.name).filter((name): name is string => Boolean(name)).slice(0, 12) || [],
      latitude, longitude, source: 'Google Places API',
      dataCompleteness: Math.min([place.displayName?.text, address, phone, website, place.rating].filter(Boolean).length * 20, 100),
      lastVerifiedAt: new Date().toISOString(),
    } satisfies Business
  })

  const withinRadius = businesses.filter((business) => distanceInMeters(center.lat, center.lng, business.latitude, business.longitude) <= SEARCH_RADIUS_METERS)
  withinRadius.sort((a, b) => distanceInMeters(center.lat, center.lng, a.latitude, a.longitude) - distanceInMeters(center.lat, center.lng, b.latitude, b.longitude))
  return { businesses: withinRadius, location: resolvedAddress || location, center }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const location = searchParams.get('location')?.trim()
  const requestedCategory = searchParams.get('category') || 'Restaurants'
  const category = (VALID_CATEGORIES.has(requestedCategory as HospitalityCategory) ? requestedCategory : 'Restaurants') as HospitalityCategory
  const source = searchParams.get('source') || 'Google Maps'

  if (!location) return NextResponse.json({ error: 'Location is required' }, { status: 400 })
  if (location.length > 160) return NextResponse.json({ error: 'Location must be 160 characters or fewer.' }, { status: 400 })

  if (source === 'Google Maps') {
    const googleApiKey = process.env.GCP_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY
    if (!googleApiKey) {
      return NextResponse.json({
        error: 'Google Maps is not configured on the server. Add GCP_API_KEY, GOOGLE_MAPS_API_KEY, or GOOGLE_PLACES_API_KEY in the project environment variables.',
      }, { status: 503 })
    }
    try {
      const result = await searchGoogle(location, category, googleApiKey)
      if (!result) return NextResponse.json({ error: `Could not locate “${location}”. Try a city, town, area, or full address.` }, { status: 404 })
      return NextResponse.json({
        businesses: result.businesses,
        location: result.location,
        totalCount: result.businesses.length,
        geocode: { latitude: result.center.lat, longitude: result.center.lng, type: 'Google Geocoding' },
        source: 'Google Places API',
        limitations: ['Results are limited to a 10 km radius around the resolved Google location.', 'Google returns places in its current index; it cannot guarantee every business or unlimited results.', 'Phone numbers, websites, ratings, and hours are returned only when Google has them.'],
      })
    } catch (error) {
      console.error('[v0] Google Places search failed:', error)
      return NextResponse.json({ error: 'Google Places could not complete this search. Check that Places API (New), Geocoding API, and billing/API restrictions are enabled for this key.' }, { status: 502 })
    }
  }

  if (source !== 'TomTom') return NextResponse.json({ error: `${source} is not configured yet. Select Google Maps or TomTom.` }, { status: 503 })
  const apiKey = process.env.TOMTOM_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'TomTom is not configured on the server.' }, { status: 503 })

  try {
    const geocodeUrl = new URL(`${TOMTOM_GEOCODE_URL}/${encodeURIComponent(location)}.json`)
    geocodeUrl.searchParams.set('key', apiKey)
    geocodeUrl.searchParams.set('limit', '1')
    geocodeUrl.searchParams.set('language', 'en-US')
    const geocode = await tomTomFetch(geocodeUrl)
    const geocodeResult = geocode.results?.[0]
    const position = geocodeResult?.position
    if (!position || !Number.isFinite(position.lat) || !Number.isFinite(position.lon)) {
      return NextResponse.json({ error: `Could not locate “${location}”. Try a city, town, area, or full address.` }, { status: 404 })
    }

    const results = new Map<string, TomTomResult>()
    const termResults = await Promise.all(searchTerms(category).map((term) => fetchAllPois(term, apiKey, position.lat, position.lon)))
    for (const items of termResults) {
      for (const item of items) {
        if (!item.id || !Number.isFinite(item.position?.lat) || !Number.isFinite(item.position?.lon)) continue
        const distance = distanceInMeters(position.lat, position.lon, Number(item.position!.lat), Number(item.position!.lon))
        if (distance <= SEARCH_RADIUS_METERS) results.set(item.id, item)
      }
    }

    const businesses = await Promise.all([...results.values()]
      .filter((item) => item.poi?.name)
      .sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity))
      .map(async (item, index) => {
        const lat = Number(item.position!.lat)
        const lon = Number(item.position!.lon)
        const website = normalizeUrl(item.poi?.url)
        const check = await verifyWebsite(website)
        const address = item.address?.freeformAddress || null
        const phone = normalizePhone(item.poi?.phone)
        return {
          id: `tomtom-${item.id || `${lat}-${lon}-${index}`}`,
          name: item.poi!.name || 'Unnamed business',
          category,
          address,
          phone,
          website,
          websiteStatus: check.status,
          websiteCheckStatus: check.checkStatus,
          rating: null,
          openingHours: null,
          mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([item.poi!.name, address, location].filter(Boolean).join(', '))}`,
          latitude: lat,
          longitude: lon,
          source: 'TomTom Search API',
          dataCompleteness: Math.min([item.poi!.name, address, phone, website].filter(Boolean).length * 25, 100),
          lastVerifiedAt: new Date().toISOString(),
        } satisfies Business
      }))

    businesses.sort((a, b) => distanceInMeters(position.lat, position.lon, a.latitude, a.longitude) - distanceInMeters(position.lat, position.lon, b.latitude, b.longitude))
    return NextResponse.json({
      businesses,
      location: geocodeResult.address?.freeformAddress || location,
      totalCount: businesses.length,
      geocode: { latitude: position.lat, longitude: position.lon, type: geocodeResult.type || 'unknown' },
      source: 'TomTom Search API',
      limitations: ['Results are strictly limited to a 10 km radius around the resolved TomTom geocode.', 'TomTom coverage and account quotas determine how many current POIs are returned; no provider can guarantee every business or unlimited results.', 'POI contact fields are only reported when TomTom has them. Website status is best-effort because some sites block automated checks.'],
    })
  } catch (error) {
    console.error('[v0] TomTom search failed:', error)
    return NextResponse.json({ error: 'TomTom could not complete this search. Verify the key, quota, and location, then try again.' }, { status: 502 })
  }
}
