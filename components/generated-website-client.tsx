'use client'

import { useEffect, useState } from 'react'
import type { Business } from '@/lib/types'
import { GeneratedBusinessSite } from '@/components/generated-business-site'

type UploadedImage = { name: string; dataUrl: string }
type AIDesign = { headline: string; subheadline: string; story: string; sectionOrder: string[]; ctaLabel: string; formType: 'reservation' | 'stay' | 'table' | 'enquiry'; designNotes: string[] }
type SavedWebsite = { business: Business; uploadedImages?: UploadedImage[]; aiDesign?: AIDesign }

export function GeneratedWebsiteClient({ id, initialDraft }: { id: string; initialDraft: SavedWebsite | null }) {
  const [draft, setDraft] = useState<SavedWebsite | null>(initialDraft)

  useEffect(() => {
    if (initialDraft) return
    try {
      const saved = window.localStorage.getItem(`sthala:website:${id}`)
      if (saved) setDraft(JSON.parse(saved) as SavedWebsite)
    } catch {
      setDraft(null)
    }
  }, [id, initialDraft])

  if (!draft) return null
  return <GeneratedBusinessSite business={draft.business} uploadedImages={draft.uploadedImages} aiDesign={draft.aiDesign} />
}
