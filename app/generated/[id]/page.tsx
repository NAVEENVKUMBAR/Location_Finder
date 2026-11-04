import type { Metadata } from 'next'
import { GeneratedWebsiteClient } from '@/components/generated-website-client'
import { getDraft } from '@/lib/generated-websites'

export const metadata: Metadata = {
  title: 'Business website | Sthala',
  description: 'A professional business website created from verified local listing details.',
  robots: { index: false, follow: false },
}

export default async function GeneratedWebsite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const draft = await getDraft(id)
  return <GeneratedWebsiteClient id={id} initialDraft={draft} />
}
