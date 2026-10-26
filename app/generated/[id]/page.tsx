import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Business } from '@/lib/types'
import { GeneratedWebsiteClient } from '@/components/generated-website-client'

export const metadata: Metadata = {
  title: 'Business website | Sthala',
  description: 'A professional business website created from verified local listing details.',
  robots: { index: false, follow: false },
}

type UploadedImage = { name: string; dataUrl: string }

async function getDraft(id: string): Promise<{ business: Business; uploadedImages?: UploadedImage[] } | null> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/websites?id=${encodeURIComponent(id)}`, { cache: 'no-store' }).catch(() => null)
  if (!response?.ok) return null
  return response.json()
}

export default async function GeneratedWebsite({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string }> }) {
  const { id } = await params
  const { view } = await searchParams
  const draft = await getDraft(id)
  return <GeneratedWebsiteClient id={id} initialDraft={draft} showSourceDownload={view === '1'} />
}
