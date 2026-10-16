import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Business } from '@/lib/types'
import { GeneratedBusinessSite } from '@/components/generated-business-site'

export const metadata: Metadata = {
  title: 'Business website | Sthala',
  description: 'A professional business website created from verified local listing details.',
  robots: { index: false, follow: false },
}

async function getDraft(id: string): Promise<{ business: Business } | null> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/websites?id=${encodeURIComponent(id)}`, { cache: 'no-store' }).catch(() => null)
  if (!response?.ok) return null
  return response.json()
}

export default async function GeneratedWebsite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const draft = await getDraft(id)
  if (!draft) notFound()
  return <GeneratedBusinessSite business={draft.business} />
}
