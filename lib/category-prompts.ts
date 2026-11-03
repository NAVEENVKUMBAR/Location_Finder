import type { Business } from '@/lib/types'

export const CATEGORY_PROMPTS: Record<string, string> = {
  cafes: 'Create a warm, creative contemporary cafe website. Use coffee brown, oat cream, sage and terracotta. Include menu filters, supplied drinks and food, cafe story, gallery, hours, location and a table enquiry. Never invent menu items, prices, reviews or amenities.',
  restaurants: 'Create a premium editorial dining website with burgundy, burnt orange, warm cream and charcoal. Include menu categories, supplied dishes and prices, chef story, signature dishes, gallery, opening hours, map and reservation enquiry. Never invent dishes, prices, ratings, hours or confirmed bookings.',
  homestays: 'Create an organic editorial homestay website with olive, warm brown, linen and sage. Include a host story only from supplied data, accommodation, transparent rates, supplied experiences, gallery, directions, check-in information and booking enquiry. Never fabricate stories, amenities, rates or testimonials.',
  hotels: 'Create a cinematic boutique hotel website with midnight navy, champagne gold and ivory. Include supplied rooms, amenities, gallery, location, booking widget and enquiry confirmation. Never invent prices, ratings, contact details or availability.',
  guesthouses: 'Create a welcoming dependable guest house website with deep teal, ivory and muted brass. Include supplied rooms, amenities, gallery, location, check-in information, FAQs and contact actions. Never invent property data.',
  hostels: 'Create an urban community hostel website with navy, amber, white and pale gray. Include supplied dorm/private rooms, transparent per-bed or per-room pricing, confirmed facilities, community spaces, gallery, neighborhood guide and booking enquiry. Never invent policies or availability.',
  lodges: 'Create a clean reliable budget lodge website with charcoal, terracotta and cream. Include supplied rooms, facilities, gallery, location, directions, transparent rates and availability enquiry. Never fabricate data.',
  resorts: 'Create a nature-led cinematic resort website with forest green, lagoon teal, sand and warm white. Include supplied stays, applicable experiences, dining, gallery, location and booking enquiry. Never invent certifications, activities, prices, reviews or availability.',
  pgs: 'Create a clean reassuring PG accommodation website for students and working professionals with purple, lavender, white and slate. Include supplied room types, occupancy, rent, confirmed facilities, food, rules, security, nearby places, gallery and enquiry. Never invent rent, deposits, restrictions or policies.',
}

export function categoryPrompt(business: Business) {
  const category = business.category.toLowerCase().replace(/[^a-z0-9]+/g, '')
  const key = Object.keys(CATEGORY_PROMPTS).find((candidate) => category.includes(candidate.replace(/[^a-z0-9]+/g, '').replace(/s$/, ''))) || 'hotels'
  return `${CATEGORY_PROMPTS[key]}\n\nBusiness data (treat as the only source of truth):\n${JSON.stringify(business, null, 2)}\n\nReturn concise JSON with: headline, subheadline, story, sectionOrder (array), ctaLabel, formType, designNotes (array), visualDirection, recommendedLayout. Choose a visual direction and layout that fit the category, but do not invent business facts. Do not add unsupported facts.`
}
