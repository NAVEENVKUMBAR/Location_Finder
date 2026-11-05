import type { Metadata } from 'next'
import { GeneratedWebsiteClient } from '@/components/generated-website-client'
import { getDraft } from '@/lib/generated-websites'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const draft = await getDraft(id)
  return {
    title: draft ? `${draft.business.name} | Sthala` : 'Business website | Sthala',
    description: draft?.business.address ? `${draft.business.name} in ${draft.business.address}.` : 'A website generated from verified local business details.',
    openGraph: { title: draft?.business.name || 'Business website', description: draft?.business.address || 'Discover a local business.' },
  }
}

export default async function GeneratedWebsite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const draft = await getDraft(id)
  return <GeneratedWebsiteClient id={id} initialDraft={draft} />
}
