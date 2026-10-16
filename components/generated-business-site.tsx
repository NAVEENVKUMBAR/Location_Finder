'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight, Clock3, ExternalLink, MapPin, Menu, Phone, Star, X } from 'lucide-react'
import type { Business } from '@/lib/types'

function phoneLink(phone: string | null) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  return `tel:${phone.startsWith('+') ? '+' : ''}${digits}`
}

function hoursText(hours: Business['openingHours']) {
  if (!hours) return 'Contact the business for current hours'
  return Object.entries(hours).slice(0, 4).map(([day, value]) => `${day}: ${value.open}–${value.close}`).join(' · ')
}

export function GeneratedBusinessSite({ business }: { business: Business }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activePhoto, setActivePhoto] = useState<number | null>(null)
  const phone = phoneLink(business.phone)
  const maps = business.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([business.name, business.address].filter(Boolean).join(', '))}`
  const names = business.photoNames?.length ? business.photoNames : business.photoName ? [business.photoName] : []
  const photos = useMemo(() => names.map((name) => `/api/place-photo?name=${encodeURIComponent(name)}`), [names])
  const cover = photos[0] || `/api/place-photo?query=${encodeURIComponent([business.name, business.address, business.category].filter(Boolean).join(' '))}`
  const isStay = ['Hotels', 'Resorts', 'Lodges', 'Homestays', 'Guest Houses', 'PGs', 'Hostels'].some((value) => business.category.toLowerCase().includes(value.toLowerCase()))
  const isFood = ['Restaurants', 'Cafés'].some((value) => business.category.toLowerCase().includes(value.toLowerCase()))
  const descriptor = isStay ? 'A thoughtful place to pause, settle in, and experience the local character of the area.' : isFood ? 'A local destination for good food, warm service, and time well spent.' : 'A trusted local business, ready to welcome you.'

  useEffect(() => {
    if (activePhoto === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActivePhoto(null)
      if (event.key === 'ArrowRight') setActivePhoto((value) => value === null ? 0 : (value + 1) % photos.length)
      if (event.key === 'ArrowLeft') setActivePhoto((value) => value === null ? photos.length - 1 : (value - 1 + photos.length) % photos.length)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [activePhoto, photos.length])

  return <main className="min-h-screen overflow-hidden bg-[#f7f5ef] text-[#292821]">
    <header className="sticky top-0 z-30 border-b border-[#ddd8cc] bg-[#f7f5ef]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#top" className="min-w-0" onClick={() => setMenuOpen(false)}><span className="block truncate font-serif text-2xl leading-none">{business.name}</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-[.22em] text-[#a2613d]">{business.category}</span></a>
        <nav className="hidden items-center gap-7 text-sm md:flex" aria-label="Main navigation"><a href="#story">Story</a>{photos.length > 0 && <a href="#gallery">Gallery</a>}<a href="#details">Details</a><a href="#contact">Contact</a></nav>
        <div className="flex items-center gap-2"><a href={maps} target="_blank" rel="noreferrer" className="hidden rounded-full bg-[#2f342a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#59614b] sm:inline-flex">Get directions</a><button type="button" aria-label="Open menu" className="rounded-full border border-[#d7d1c5] p-2 md:hidden" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button></div>
      </div>
      {menuOpen && <nav className="border-t border-[#ddd8cc] px-5 py-4 md:hidden" aria-label="Mobile navigation"><div className="flex flex-col gap-4 text-sm"><a href="#story" onClick={() => setMenuOpen(false)}>Story</a>{photos.length > 0 && <a href="#gallery" onClick={() => setMenuOpen(false)}>Gallery</a>}<a href="#details" onClick={() => setMenuOpen(false)}>Details</a><a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a></div></nav>}
    </header>

    <section id="top" className="mx-auto max-w-7xl px-5 pt-5 sm:px-8 sm:pt-8"><div className="relative min-h-[590px] overflow-hidden rounded-[2rem] bg-[#3c4035] sm:min-h-[650px]"><img src={cover} alt={`${business.name} featured view`} className="absolute inset-0 h-full w-full object-cover opacity-80" /><div className="absolute inset-0 bg-gradient-to-t from-[#182019]/90 via-[#182019]/20 to-transparent" /><div className="relative flex min-h-[590px] max-w-3xl flex-col justify-end p-7 text-white sm:min-h-[650px] sm:p-14"><div className="mb-6 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 backdrop-blur">{business.category}</span>{business.rating && <span className="flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 backdrop-blur"><Star size={13} fill="currentColor" /> {business.rating} rating</span>}</div><p className="max-w-2xl font-serif text-5xl leading-[.95] sm:text-8xl">{isStay ? 'Stay close to what matters.' : isFood ? 'A table worth finding.' : 'Make your next visit count.'}</p><p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg">{descriptor}</p><div className="mt-8 flex flex-wrap gap-3"><a href="#contact" className="rounded-full bg-[#f4e8d4] px-6 py-3.5 text-sm font-bold text-[#2f342a] transition hover:bg-white">Start a conversation <ArrowUpRight className="ml-1 inline" size={16} /></a>{phone && <a href={phone} className="rounded-full border border-white/35 px-6 py-3.5 text-sm font-bold transition hover:bg-white/10"><Phone className="mr-2 inline" size={15} /> Call now</a>}</div></div></div></section>

    <section id="details" className="mx-auto grid max-w-7xl gap-4 px-5 py-8 sm:grid-cols-3 sm:px-8 sm:py-12"><div className="rounded-2xl border border-[#ded8cc] bg-white p-6"><MapPin className="text-[#a2613d]" size={21} /><p className="mt-4 text-xs font-bold uppercase tracking-[.16em] text-[#8f877a]">Find us</p><p className="mt-2 text-sm leading-6">{business.address || 'Address available through Google Maps'}</p></div><div className="rounded-2xl border border-[#ded8cc] bg-white p-6"><Star className="text-[#a2613d]" size={21} fill="currentColor" /><p className="mt-4 text-xs font-bold uppercase tracking-[.16em] text-[#8f877a]">Guest rating</p><p className="mt-2 text-2xl font-serif">{business.rating ? `${business.rating} / 5` : 'Not listed'}</p></div><div className="rounded-2xl border border-[#ded8cc] bg-white p-6"><Clock3 className="text-[#a2613d]" size={21} /><p className="mt-4 text-xs font-bold uppercase tracking-[.16em] text-[#8f877a]">Opening hours</p><p className="mt-2 text-sm leading-6">{hoursText(business.openingHours)}</p></div></section>

    <section id="story" className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[.75fr_1.25fr]"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#a2613d]">The story</p><h2 className="mt-4 max-w-md font-serif text-5xl leading-tight sm:text-6xl">A place with a sense of place.</h2></div><div className="max-w-2xl text-lg leading-8 text-[#6f6c62]"><p>{descriptor} {business.name} is rooted in the local community and offers a straightforward way to connect with the area.</p><p className="mt-6">Whether you are planning ahead or already nearby, reach out directly for the most current information about availability, services, and your visit.</p><a href="#contact" className="mt-8 inline-flex items-center border-b border-[#a2613d] pb-1 text-sm font-bold text-[#a2613d]">Plan your visit <ArrowUpRight className="ml-2" size={16} /></a></div></section>

    {photos.length > 0 && <section id="gallery" className="bg-[#e9e4d9] px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto max-w-7xl"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#a2613d]">The gallery</p><h2 className="mt-3 font-serif text-5xl">A look around.</h2></div><span className="text-sm text-[#787469]">{photos.length} original listing {photos.length === 1 ? 'photo' : 'photos'}</span></div><div className="mt-8 grid auto-rows-[190px] grid-cols-2 gap-3 sm:auto-rows-[250px] sm:grid-cols-4">{photos.map((url, index) => <button type="button" key={url} onClick={() => setActivePhoto(index)} className={`${index === 0 ? 'col-span-2 row-span-2' : ''} group overflow-hidden rounded-2xl bg-[#d3cec2] text-left focus:outline-none focus:ring-2 focus:ring-[#a2613d]`} aria-label={`Open photo ${index + 1}`}><img src={url} alt={`${business.name} gallery photo ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /></button>)}</div><p className="mt-4 text-xs text-[#787469]">Photos are served from the verified business listing. Rights remain with the original photographer or listing owner.</p></div></section>}

    <section id="contact" className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_.8fr]"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#a2613d]">Get in touch</p><h2 className="mt-4 max-w-xl font-serif text-5xl leading-tight sm:text-6xl">Ready when you are.</h2><p className="mt-6 max-w-xl text-base leading-7 text-[#6f6c62]">For availability, current details, or a simple question, contact {business.name} directly. Information can change, so a direct conversation is the best way to plan.</p></div><div className="rounded-[1.5rem] bg-[#2f342a] p-7 text-[#f4eee2] sm:p-10"><p className="text-sm text-[#c5c8b9]">Contact details</p><p className="mt-3 font-serif text-3xl">{business.name}</p><p className="mt-4 text-sm leading-6 text-[#c5c8b9]">{business.address || 'Address available on Google Maps'}</p><div className="mt-8 flex flex-col gap-3">{phone && <a href={phone} className="flex items-center justify-center gap-2 rounded-xl bg-[#f4e8d4] px-4 py-3.5 text-sm font-bold text-[#2f342a] hover:bg-white"><Phone size={16} /> Call {business.phone}</a>}<a href={maps} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-white/25 px-4 py-3.5 text-sm font-bold hover:bg-white/10"><ExternalLink size={16} /> Open in Google Maps</a></div></div></section>

    <footer className="border-t border-[#ded8cc] px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-xs text-[#787469] sm:flex-row"><span>© {new Date().getFullYear()} {business.name}. All rights reserved.</span><span>{business.category} · {business.address || 'Local business'}</span></div></footer>
    {activePhoto !== null && photos[activePhoto] && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={() => setActivePhoto(null)}><button type="button" aria-label="Close photo viewer" onClick={() => setActivePhoto(null)} className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><X size={22} /></button><button type="button" aria-label="Previous photo" onClick={(event) => { event.stopPropagation(); setActivePhoto((activePhoto - 1 + photos.length) % photos.length) }} className="absolute left-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:left-8"><ChevronLeft size={26} /></button><img src={photos[activePhoto]} alt={`${business.name} gallery photo ${activePhoto + 1}`} className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain" onClick={(event) => event.stopPropagation()} /><button type="button" aria-label="Next photo" onClick={(event) => { event.stopPropagation(); setActivePhoto((activePhoto + 1) % photos.length) }} className="absolute right-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:right-8"><ChevronRight size={26} /></button></div>}
  </main>
}
