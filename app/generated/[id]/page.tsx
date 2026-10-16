import { notFound } from 'next/navigation'
import type { Business } from '@/lib/types'
import type { Metadata } from 'next'

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

function formatHours(hours: Business['openingHours']) {
  if (!hours) return 'Contact us for today\'s hours'
  return Object.entries(hours).slice(0, 3).map(([day, value]) => `${day}: ${value.open}–${value.close}`).join(' · ')
}

export default async function GeneratedWebsite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const draft = await getDraft(id)
  if (!draft) notFound()

  const business = draft.business
  const phone = business.phone?.trim() || ''
  const phoneDigits = phone.replace(/\D/g, '')
  const phoneHref = phone ? `tel:${phone.startsWith('+') ? `+${phoneDigits}` : phoneDigits}` : null
  const maps = business.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([business.name, business.address].filter(Boolean).join(', '))}`
  const photoNames = business.photoNames?.length ? business.photoNames : business.photoName ? [business.photoName] : []
  const photos = photoNames.map((name) => `/api/place-photo?name=${encodeURIComponent(name)}`)
  const cover = photos[0] || `/api/place-photo?query=${encodeURIComponent([business.name, business.address, business.category].filter(Boolean).join(', '))}`
  const isFood = ['Restaurants', 'Cafés'].some((value) => business.category.toLowerCase().includes(value.toLowerCase()))
  const isStay = ['Hotels', 'Resorts', 'Lodges', 'Homestays', 'Guest Houses', 'PGs', 'Hostels'].some((value) => business.category.toLowerCase().includes(value.toLowerCase()))
  const intro = isFood ? `Thoughtfully prepared experiences, warm service, and a reason to stay a little longer.` : isStay ? `A comfortable place to settle in, recharge, and make the most of your time away.` : `A trusted local business focused on making every visit feel worthwhile.`
  const primaryAction = isStay ? 'Plan your stay' : isFood ? 'Make an enquiry' : 'Get in touch'

  return <main className="min-h-screen bg-[#f7f4ee] text-[#29251f]">
    <header className="sticky top-0 z-20 border-b border-[#ded5c8]/80 bg-[#f7f4ee]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#a45e32]">{business.category}</p><h1 className="mt-1 font-serif text-xl sm:text-2xl">{business.name}</h1></div>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label="Primary navigation"><a href="#about" className="hover:text-[#a45e32]">About</a>{photos.length > 1 && <a href="#gallery" className="hover:text-[#a45e32]">Gallery</a>}<a href="#visit" className="hover:text-[#a45e32]">Visit</a></nav>
        <a href={maps} target="_blank" rel="noreferrer" className="rounded-full bg-[#2f2924] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4a3b30]">Directions</a>
      </div>
    </header>

    <section className="mx-auto grid max-w-7xl gap-8 px-6 py-8 sm:px-10 sm:py-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
      <div className="relative min-h-[470px] overflow-hidden rounded-[2rem] bg-[#3b2c22] shadow-xl"><img src={cover} alt={`${business.name} exterior`} className="absolute inset-0 h-full w-full object-cover opacity-75" /><div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" /><div className="relative flex min-h-[470px] flex-col justify-end p-8 text-white sm:p-12"><div className="mb-5 flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 backdrop-blur">Welcome</span>{business.rating ? <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 backdrop-blur">{business.rating} / 5 rating</span> : null}</div><p className="max-w-2xl font-serif text-5xl leading-[0.95] sm:text-7xl">{isFood ? 'Good food. Good company.' : isStay ? 'Stay somewhere memorable.' : 'Made for your next visit.'}</p><p className="mt-5 max-w-xl text-base leading-7 text-white/80">{intro}</p><div className="mt-7 flex flex-wrap gap-3"><a href={phoneHref || `mailto:?subject=${encodeURIComponent(`Enquiry for ${business.name}`)}`} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#2f2924] hover:bg-[#f1e9dd]">{primaryAction}</a><a href="#about" className="rounded-full border border-white/35 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Discover more</a></div></div></div>
      <aside id="visit" className="rounded-[2rem] border border-[#ded5c8] bg-white p-7 shadow-sm sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a45e32]">Plan your visit</p><h2 className="mt-3 font-serif text-3xl">We would love to welcome you.</h2><p className="mt-3 text-sm leading-6 text-[#6f665c]">Find us, give us a call, or reach out directly using the verified details below.</p><div className="mt-7 flex flex-col gap-3">{phoneHref && <a href={phoneHref} className="rounded-xl bg-[#2f2924] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#4a3b30]">Call {phone}</a>}<a href={maps} target="_blank" rel="noreferrer" className="rounded-xl border border-[#d6cec2] px-4 py-3 text-center text-sm font-semibold hover:bg-[#f7f4ee]">Open in Google Maps</a></div><div className="mt-7 border-t border-[#eee8df] pt-5 text-sm leading-6 text-[#6f665c]"><p className="font-semibold text-[#29251f]">Opening hours</p><p className="mt-1">{formatHours(business.openingHours)}</p></div></aside>
    </section>

    <section id="about" className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:py-20"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a45e32]">About {business.name}</p><h2 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">A place with its own point of view.</h2></div><div className="max-w-2xl text-base leading-8 text-[#6f665c]"><p>{intro} Our team is here to make the details feel easy, from the first enquiry to the moment you arrive.</p><p className="mt-5">Located in {business.address || 'your local neighbourhood'}, {business.name} is part of the community and ready to welcome you.</p></div></section>

    {photos.length > 1 && <section id="gallery" className="mx-auto max-w-7xl px-6 pb-14 sm:px-10"><div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a45e32]">A look around</p><h2 className="mt-2 font-serif text-4xl">Explore the space.</h2></div><span className="text-sm text-[#81776b]">{photos.length} photos</span></div><div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[230px] sm:grid-cols-4">{photos.map((url, index) => <figure key={url} className={index === 0 ? 'col-span-2 row-span-2 overflow-hidden rounded-2xl bg-[#ded5c8]' : 'overflow-hidden rounded-2xl bg-[#ded5c8]'}><img src={url} alt={`${business.name} gallery photo ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} className="h-full w-full object-cover transition duration-500 hover:scale-105" /></figure>)}</div><p className="mt-3 text-xs text-[#81776b]">Images are displayed from the business listing. Image rights remain with the original photographer or listing owner.</p></section>}

    <section className="mx-auto grid max-w-7xl gap-5 px-6 pb-16 sm:px-10 md:grid-cols-3"><div className="rounded-2xl border border-[#ded5c8] bg-white p-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a45e32]">Find us</p><p className="mt-3 text-sm leading-6">{business.address || 'Address available on Google Maps'}</p><a href={maps} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-[#a45e32] hover:underline">Get directions →</a></div><div className="rounded-2xl border border-[#ded5c8] bg-white p-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a45e32]">Contact</p><p className="mt-3 text-sm leading-6">{phone || 'Call the business through Google Maps for current contact details.'}</p>{phoneHref && <a href={phoneHref} className="mt-4 inline-block text-sm font-semibold text-[#a45e32] hover:underline">Call now →</a>}</div><div className="rounded-2xl border border-[#ded5c8] bg-white p-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a45e32]">Good to know</p><p className="mt-3 text-sm leading-6">{business.rating ? `Rated ${business.rating} out of 5 by visitors.` : 'Contact the business for the latest availability and details.'}</p></div></section>

    <footer className="border-t border-[#ded5c8] px-6 py-8 sm:px-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-xs text-[#81776b] sm:flex-row"><span>{business.name} · {business.category}</span><span>{business.address || 'Local business'}</span></div></footer>
  </main>
}
