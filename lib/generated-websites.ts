import type { Business } from '@/lib/types'
import { db } from '@/lib/db'
import { generatedWebsites } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

type UploadedImage = { name: string; dataUrl: string }
type AIDesign = { headline: string; subheadline: string; story: string; sectionOrder: string[]; ctaLabel: string; formType: 'reservation' | 'stay' | 'table' | 'enquiry'; designNotes: string[]; visualDirection?: string; recommendedLayout?: string; colorSystem?: string; typeMood?: string }

export async function getDraft(id: string) {
  const [draft] = await db.select().from(generatedWebsites).where(eq(generatedWebsites.id, id)).limit(1)
  if (!draft) return null
  return { business: draft.business as Business, uploadedImages: (draft.uploadedImages ?? undefined) as UploadedImage[] | undefined, aiDesign: draft.aiDesign as AIDesign | undefined, createdAt: draft.createdAt.toISOString() }
}
