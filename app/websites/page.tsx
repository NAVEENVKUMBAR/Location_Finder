import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowUpRight, Globe2 } from 'lucide-react'
import { getDrafts } from '@/lib/generated-websites'

export const metadata: Metadata = {
  title: 'Saved websites | Sthala',
  description: 'Manage websites generated from verified local business data.',
}

export default async function WebsitesPage() {
  const websites = await getDrafts()
  return (
    <main className="min-h-screen bg-[#f6f7f4] px-6 py-12 text-[#1d2a25] sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex items-end justify-between gap-6 border-b border-[#d8ded8] pb-6">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[#557267]">Sthala / workspace</p>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">Generated websites</h1>
            <p className="mt-4 max-w-xl text-[#65746d]">Every site is generated from verified business details and a distinct AI-directed visual system.</p>
          </div>
          <Link href="/" className="hidden rounded-full bg-[#1d2a25] px-5 py-3 text-sm font-semibold text-white sm:inline-flex">Find a business</Link>
        </header>
        {websites.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[#b8c8be] bg-white p-12 text-center"><Globe2 className="mx-auto mb-4 h-8 w-8 text-[#739184]" /><h2 className="text-xl font-semibold">No websites yet</h2><p className="mt-2 text-[#65746d]">Generate your first AI website from a local business.</p></div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{websites.map((website) => <Link key={website.id} href={`/generated/${encodeURIComponent(website.id)}`} className="group rounded-[1.5rem] border border-[#d8ded8] bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl"><div className="mb-12 flex items-start justify-between"><span className="rounded-full bg-[#eef3ed] px-3 py-1 text-xs font-semibold text-[#557267]">{website.business.category}</span><ArrowUpRight className="h-5 w-5 text-[#739184] transition group-hover:-translate-y-1 group-hover:translate-x-1" /></div><h2 className="text-2xl font-semibold tracking-[-0.03em]">{website.business.name}</h2><p className="mt-2 line-clamp-2 text-sm text-[#65746d]">{website.business.address}</p><p className="mt-6 text-xs font-medium text-[#8a9891]">{new Date(website.createdAt).toLocaleDateString()}</p></Link>)}</div>
        )}
      </div>
    </main>
  )
}
