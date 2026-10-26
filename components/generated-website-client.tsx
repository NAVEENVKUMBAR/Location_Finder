'use client'

import { useEffect, useState } from 'react'
import type { Business } from '@/lib/types'
import { GeneratedBusinessSite } from '@/components/generated-business-site'

type UploadedImage = { name: string; dataUrl: string }
type SavedWebsite = { business: Business; uploadedImages?: UploadedImage[] }

export function GeneratedWebsiteClient({ id, initialDraft, showSourceDownload }: { id: string; initialDraft: SavedWebsite | null; showSourceDownload: boolean }) {
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
  return <GeneratedBusinessSite business={draft.business} websiteId={initialDraft ? id : undefined} uploadedImages={draft.uploadedImages} showSourceDownload={showSourceDownload} />
}
