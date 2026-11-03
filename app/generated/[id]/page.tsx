import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Business } from '@/lib/types'
import { GeneratedWebsiteClient } from '@/components/generated-website-client'
import { getDraft } from '@/app/api/websites/route'

export const metadata: Metadata = {
  title: 'Business website | Sthala',
  description: 'A professional business website created from verified local listing details.',
  robots: { index: false, follow: false },
}

type UploadedImage = { name: string; dataUrl: string }
type AIDesign = { headline: string; subheadline: string; story: string; sectionOrder: string[]; ctaLabel: string; formType: 'reservation' | 'stay' | 'table' | 'enquiry'; designNotes: string[] }

export default async function GeneratedWebsite({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string }> }) {
  const { id } = await params
  const { view } = await searchParams
  const draft = await getDraft(id)
  return <GeneratedWebsiteClient id={id} initialDraft={draft} showSourceDownload={view === '1'} />
}
