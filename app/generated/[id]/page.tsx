import { notFound } from 'next/navigation'
import type { Business } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Business website draft | Sthala',
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
  const business = draft.business
  const rawPhone = business.phone?.trim() || ''
  const phoneDigits = rawPhone.replace(/\D/g, '')
  const phoneHref = rawPhone ? `tel:${rawPhone.startsWith('+') ? `+${phoneDigits}` : phoneDigits}` : null
  const whatsapp = rawPhone.startsWith('+') && phoneDigits.length >= 8 ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Hello ${business.name}, I found you through Sthala.`)}` : null
  const maps = business.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([business.name, business.address].filter(Boolean).join(', '))}`
  const photo = `/api/place-photo?${business.photoName ? `name=${encodeURIComponent(business.photoName)}` : `query=${encodeURIComponent([business.name, business.address, business.category].filter(Boolean).join(', '))}`}`
  const isFood = ['Restaurants', 'Cafés'].some((value) => business.category.toLowerCase().includes(value.toLowerCase()))
  const heading = isFood ? 'Good food, close to you.' : 'Make your next stay memorable.'
  return <main className="min-h-screen bg-[#f7f4ee] text-[#29251f]">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10"><div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#a45e32]">Sthala guide</p><h1 className="mt-1 font-serif text-xl sm:text-2xl">{business.name}</h1></div><a href={maps} target="_blank" rel="noreferrer" className="rounded-full border border-[#d6cec2] px-4 py-2 text-sm font-semibold hover:bg-white">Directions</a></header>
    <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-10 sm:px-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end"><div className="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-[#3b2c22] shadow-xl"><img src={photo} alt={`${business.name} exterior`} className="absolute inset-0 h-full w-full object-cover opacity-75" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" /><div className="relative flex min-h-[430px] flex-col justify-end p-8 text-white sm:p-12"><div className="mb-5 flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 backdrop-blur">{business.category}</span>{business.rating ? <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 backdrop-blur">{business.rating} rating</span> : null}</div><p className="max-w-2xl font-serif text-5xl leading-[0.95] sm:text-7xl">{heading}</p><p className="mt-5 max-w-xl text-sm leading-6 text-white/80">{business.address || 'A local business worth discovering.'}</p></div></div><div className="rounded-[2rem] border border-[#ded5c8] bg-white p-7 shadow-sm sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a45e32]">Visit or enquire</p><h2 className="mt-3 font-serif text-3xl">Plan your visit.</h2><p className="mt-3 text-sm leading-6 text-[#6f665c]">Use the verified details below to connect directly with {business.name}.</p><div className="mt-7 flex flex-col gap-3">{phoneHref ? <a href={phoneHref} className="rounded-xl bg-[#2f2924] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#4a3b30]">Call {business.phone}</a> : null}{whatsapp ? <a href={whatsapp} target="_blank" rel="noreferrer" className="rounded-xl bg-[#d9ead8] px-4 py-3 text-center text-sm font-semibold text-[#315f3d] hover:bg-[#c9e2c8]">Connect on WhatsApp</a> : null}<a href={maps} target="_blank" rel="noreferrer" className="rounded-xl border border-[#d6cec2] px-4 py-3 text-center text-sm font-semibold hover:bg-[#f7f4ee]">Get directions</a></div></div></section>
    <section className="mx-auto grid max-w-7xl gap-5 px-6 pb-14 sm:px-10 md:grid-cols-3"><div className="rounded-2xl border border-[#ded5c8] bg-white p-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a45e32]">Location</p><p className="mt-3 text-sm leading-6">{business.address || 'Address not available'}</p></div><div className="rounded-2xl border border-[#ded5c8] bg-white p-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a45e32]">Hours</p><p className="mt-3 text-sm leading-6">{business.openingHours ? 'Opening hours available from the verified listing.' : 'Contact the business for current hours.'}</p></div><div className="rounded-2xl border border-[#ded5c8] bg-white p-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a45e32]">About this page</p><p className="mt-3 text-sm leading-6 text-[#6f665c]">AI-assisted draft using verified listing data. Confirm details with the owner before publishing.</p></div></section>
    <footer className="border-t border-[#ded5c8] px-6 py-6 text-center text-xs text-[#81776b]">Draft website generated by Sthala · Not an official business website</footer>
  </main>
}
