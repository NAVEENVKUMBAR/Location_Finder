import type { Business } from '@/lib/types'

export type LayoutFamily = 'cinematic' | 'editorial' | 'magazine' | 'architectural' | 'floating' | 'gallery' | 'minimal' | 'bold' | 'luxury'
export type CategoryFamily = 'cafe' | 'restaurant' | 'stay' | 'wellness' | 'service'

export interface WebsiteDesign {
  layout: LayoutFamily
  palette: { ink: string; accent: string; soft: string; wash: string; line: string }
  displayFont: string
  bodyFont: string
  navigation: 'pill' | 'editorial' | 'quiet' | 'utility'
  radius: 'soft' | 'sharp' | 'organic'
}

const designs: WebsiteDesign[] = [
  { layout: 'cinematic', palette: { ink: '#172b4d', accent: '#d7a84b', soft: '#f5ecd2', wash: '#e3edf5', line: '#d1dce7' }, displayFont: "'Iowan Old Style', Georgia, serif", bodyFont: "'Avenir Next', Avenir, Arial, sans-serif", navigation: 'pill', radius: 'soft' },
  { layout: 'editorial', palette: { ink: '#2b193f', accent: '#c96983', soft: '#f8e5e8', wash: '#eee7f5', line: '#dfd3e6' }, displayFont: "Baskerville, Georgia, serif", bodyFont: "'Trebuchet MS', Arial, sans-serif", navigation: 'editorial', radius: 'organic' },
  { layout: 'magazine', palette: { ink: '#33251e', accent: '#b96842', soft: '#f5e4d8', wash: '#eee3d9', line: '#dfd0c3' }, displayFont: "'Arial Narrow', Impact, sans-serif", bodyFont: "Arial, sans-serif", navigation: 'utility', radius: 'sharp' },
  { layout: 'architectural', palette: { ink: '#173b43', accent: '#d68059', soft: '#f4e9dc', wash: '#dcebed', line: '#cbdedc' }, displayFont: "'Helvetica Neue', Arial, sans-serif", bodyFont: "'Helvetica Neue', Arial, sans-serif", navigation: 'quiet', radius: 'sharp' },
  { layout: 'floating', palette: { ink: '#1c2b27', accent: '#d7844b', soft: '#f3e7d8', wash: '#e7eee9', line: '#d5dfd8' }, displayFont: "'Iowan Old Style', Georgia, serif", bodyFont: "'Avenir Next', Avenir, Arial, sans-serif", navigation: 'pill', radius: 'soft' },
  { layout: 'gallery', palette: { ink: '#262626', accent: '#8d9b72', soft: '#f1f0e9', wash: '#e4e7dc', line: '#d3d8c8' }, displayFont: "Georgia, serif", bodyFont: "Arial, sans-serif", navigation: 'quiet', radius: 'organic' },
  { layout: 'minimal', palette: { ink: '#172b4d', accent: '#8799b6', soft: '#f7f8fa', wash: '#e9edf2', line: '#d7dee8' }, displayFont: "'Helvetica Neue', Arial, sans-serif", bodyFont: "'Helvetica Neue', Arial, sans-serif", navigation: 'quiet', radius: 'sharp' },
  { layout: 'bold', palette: { ink: '#201719', accent: '#ef765d', soft: '#fff1e5', wash: '#f2d8cd', line: '#e4b9ad' }, displayFont: "'Arial Narrow', Impact, sans-serif", bodyFont: "Arial, sans-serif", navigation: 'utility', radius: 'sharp' },
  { layout: 'luxury', palette: { ink: '#33251e', accent: '#bd995c', soft: '#f3eee5', wash: '#e5ded2', line: '#d6c8b4' }, displayFont: "'Bodoni 72', Didot, Georgia, serif", bodyFont: "'Avenir Next', Avenir, Arial, sans-serif", navigation: 'editorial', radius: 'soft' },
]

const categoryPools: Record<CategoryFamily, LayoutFamily[]> = {
  cafe: ['magazine', 'gallery', 'bold', 'editorial'],
  restaurant: ['editorial', 'cinematic', 'luxury', 'magazine'],
  stay: ['cinematic', 'floating', 'architectural', 'luxury', 'gallery'],
  wellness: ['minimal', 'floating', 'editorial', 'luxury'],
  service: ['architectural', 'minimal', 'bold', 'magazine'],
}

function hash(value: string) {
  return [...value].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 7)
}

function categoryFamily(category: string): CategoryFamily {
  const value = category.toLowerCase()
  if (value.includes('cafe') || value.includes('café')) return 'cafe'
  if (value.includes('restaurant')) return 'restaurant'
  if (['hotel', 'resort', 'lodge', 'homestay', 'guest house', 'hostel', 'pg'].some((item) => value.includes(item))) return 'stay'
  if (['spa', 'wellness', 'ayur', 'salon', 'fitness', 'yoga'].some((item) => value.includes(item))) return 'wellness'
  return 'service'
}

export function selectWebsiteDesign(
  business: Pick<Business, 'id' | 'name' | 'category' | 'photoName'>,
  preferredLayout?: string,
): WebsiteDesign & { fingerprint: string; categoryFamily: CategoryFamily; variant: number } {
  const fingerprint = hash(`${business.id}:${business.name}:${business.category}:${business.photoName ?? ''}`)
  const family = categoryFamily(business.category)
  const pool = categoryPools[family]
  const layout = pool.includes(preferredLayout as LayoutFamily) ? preferredLayout as LayoutFamily : pool[fingerprint % pool.length]
  const design = designs.find((item) => item.layout === layout) ?? designs[0]
  const variant = (fingerprint >>> 5) % 3
  const paletteVariants = [
    { accent: design.palette.accent, wash: design.palette.wash },
    { accent: design.palette.ink, wash: design.palette.soft },
    { accent: design.palette.accent, wash: design.palette.line },
  ]
  const colors = paletteVariants[variant]
  return { ...design, palette: { ...design.palette, ...colors }, fingerprint: `${family}-${fingerprint.toString(36)}`, categoryFamily: family, variant }
}
