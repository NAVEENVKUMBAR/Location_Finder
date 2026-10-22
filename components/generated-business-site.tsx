'use client'

import { FormEvent, useMemo, useState } from 'react'
import { ArrowUpRight, Check, Clock3, ExternalLink, MapPin, Menu, Phone, Send, Star, X } from 'lucide-react'
import type { Business } from '@/lib/types'

function phoneLink(phone: string | null) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  return `tel:${phone.startsWith('+') ? '+' : ''}${digits}`
}

function whatsappLink(phone: string | null, message: string) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

function validHours(hours: Business['openingHours']) {
  if (!hours) return []

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  return dayOrder
    .map((day) => [day, hours[day]] as const)
    .filter(([, value]) => value && value.open.trim() && value.close.trim())
}

function formatDay(day: string) {
  return day.slice(0, 3)
}

const palettes = [
  { ink: '#1c2b27', accent: '#d7844b', soft: '#f3e7d8', wash: '#e7eee9', line: '#d5dfd8' },
  { ink: '#2b193f', accent: '#c96983', soft: '#f8e5e8', wash: '#eee7f5', line: '#dfd3e6' },
  { ink: '#172b4d', accent: '#d7a84b', soft: '#f5ecd2', wash: '#e3edf5', line: '#d1dce7' },
  { ink: '#33251e', accent: '#b96842', soft: '#f5e4d8', wash: '#eee3d9', line: '#dfd0c3' },
  { ink: '#173b43', accent: '#d68059', soft: '#f4e9dc', wash: '#dcebed', line: '#cbdedc' },
  { ink: '#262626', accent: '#8d9b72', soft: '#f1f0e9', wash: '#e4e7dc', line: '#d3d8c8' },
]

const designDirections = ['editorial', 'cinematic', 'architectural', 'minimal', 'organic', 'bold'] as const

export function GeneratedBusinessSite({ business, websiteId }: { business: Business; websiteId?: string }) {
  const [exporting, setExporting] = useState(false)

  async function downloadSource() {
    if (!websiteId || exporting) return
    setExporting(true)
    try {
      const response = await fetch(`/api/websites/${encodeURIComponent(websiteId)}/export`, { method: 'POST' })
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'business'}-website-source.zip`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }
  const [menuOpen, setMenuOpen] = useState(false)
  const [activePhoto, setActivePhoto] = useState<number | null>(null)
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', message: '', details: {} as Record<string, string> })
  const design = useMemo(() => {
    const fingerprint = [...`${business.id}:${business.category}:${business.name}`].reduce((sum, char) => sum + char.charCodeAt(0), 0)
    const paletteIndex = fingerprint % palettes.length
    const direction = designDirections[fingerprint % designDirections.length]
    return { theme: palettes[paletteIndex], direction, fingerprint }
  }, [business.id, business.category, business.name])
  const theme = design.theme
  const phone = phoneLink(business.phone)
  const maps = business.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([business.name, business.address].filter(Boolean).join(', '))}`
  const names = business.photoNames?.length ? business.photoNames : business.photoName ? [business.photoName] : []
  const photos = useMemo(() => names.map((name) => `/api/place-photo?name=${encodeURIComponent(name)}`), [names])
  const hours = useMemo(() => validHours(business.openingHours), [business.openingHours])
  const cover = photos[0]
  const category = business.category.toLowerCase()
  const isStay = ['hotel', 'resort', 'lodge', 'homestay', 'guest house', 'hostel', 'pg'].some((value) => category.includes(value))
  const isFood = category.includes('restaurant') || category.includes('café') || category.includes('cafe')
  const isWellness = ['spa', 'wellness', 'ayur', 'salon', 'fitness', 'yoga'].some((value) => category.includes(value))
  const isSocial = isFood || isStay
  const template = isStay ? 'stay' : isFood ? 'food' : isWellness ? 'wellness' : 'service'
  const label = isStay ? 'Stay with intention' : isFood ? 'Made for lingering' : isWellness ? 'Make space for feeling good' : 'Local, considered, ready for you'
  const description = isStay ? `A considered stay in ${business.address?.split(',').slice(-2).join(',').trim() || 'the heart of the area'}.` : isFood ? `A neighborhood destination for good food, warm service, and time well spent.` : `${business.name} brings dependable local service and a more personal way to get things done.`
  const contactHeading = isStay ? 'Plan your stay' : isFood ? 'Reserve your table' : isWellness ? 'Book your reset' : 'Tell us what you need'
  const contactIntro = isStay ? 'Ask about availability, check-in, and the details that make your visit comfortable.' : isFood ? 'Ask about a table, menu, private dining, or your next celebration.' : isWellness ? 'Share what you are looking for and the team will guide you to the right service.' : 'Send a few details and the team will come back with a useful next step.'
  const whatsapp = whatsappLink(business.phone, `Hello ${business.name}, I would like to know more about your services.`)
  const formFields = isFood
    ? (category.includes('café') || category.includes('cafe')
      ? [{ key: 'enquiryType', label: 'What can we help with?', type: 'select', options: ['Visit information', 'Table enquiry', 'Private event', 'General question'] }, { key: 'visitDate', label: 'Visit date', type: 'date' }, { key: 'guests', label: 'Guests', type: 'number' }]
      : [{ key: 'date', label: 'Preferred date', type: 'date' }, { key: 'time', label: 'Preferred time', type: 'time' }, { key: 'guests', label: 'Number of guests', type: 'number' }, { key: 'seating', label: 'Seating preference', type: 'select', options: ['No preference', 'Indoor', 'Outdoor', 'Private dining'] }])
    : isStay
      ? [{ key: 'arrival', label: 'Arrival', type: 'date' }, { key: 'departure', label: 'Departure', type: 'date' }, { key: 'guests', label: 'Guests', type: 'number' }, { key: 'rooms', label: 'Rooms or units', type: 'number' }]
      : isWellness
        ? [{ key: 'service', label: 'Service you are interested in', type: 'text' }, { key: 'preferredDate', label: 'Preferred date', type: 'date' }, { key: 'preferredTime', label: 'Preferred time', type: 'time' }]
        : [{ key: 'service', label: 'What do you need help with?', type: 'text' }, { key: 'preferredDate', label: 'Preferred date', type: 'date' }]

  function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const details = Object.entries(form.details).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`).join(', ')
    const message = `Hello ${business.name}, my name is ${form.name}. ${details ? `${details}. ` : ''}${form.message}${form.phone ? ` You can reach me at ${form.phone}.` : ''}`
    const link = whatsappLink(business.phone, message)
    if (link) window.open(link, '_blank', 'noopener,noreferrer')
    else window.location.href = `mailto:?subject=${encodeURIComponent(`Enquiry for ${business.name}`)}&body=${encodeURIComponent(message)}`
    setSent(true)
  }

  return <main data-template={template} style={{ '--ink': theme.ink, '--accent': theme.accent, '--soft': theme.soft, '--wash': theme.wash, '--line': theme.line } as React.CSSProperties} className={`generated-site generated-site--${template} generated-site--${design.direction} min-h-screen overflow-hidden bg-[var(--soft)] text-[var(--ink)]`}>
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--soft)]/90 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8"><a href="#top" onClick={() => setMenuOpen(false)} className="min-w-0"><span className="block truncate font-serif text-2xl leading-none">{business.name}</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">{business.category}</span></a><nav className="hidden items-center gap-7 text-sm md:flex" aria-label="Main navigation"><a href="#story">About</a>{photos.length > 0 && <a href="#gallery">Gallery</a>}<a href="#details">Visit</a><a href="#contact">Contact</a></nav><div className="flex items-center gap-2">{whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer" className="hidden rounded-full bg-[var(--ink)] px-4 py-2.5 text-sm font-semibold text-white sm:inline-flex">WhatsApp us</a>}<button type="button" aria-label="Open menu" className="rounded-full border border-[var(--line)] p-2 md:hidden" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button></div></div>{menuOpen && <nav className="border-t border-[var(--line)] px-5 py-4 md:hidden"><div className="flex flex-col gap-4 text-sm"><a href="#story">About</a><a href="#gallery">Gallery</a><a href="#details">Visit</a><a href="#contact">Contact</a></div></nav>}</header>

    <section id="top" className="mx-auto max-w-7xl px-5 pt-5 sm:px-8 sm:pt-8"><div className="relative min-h-[600px] overflow-hidden rounded-[2rem] bg-[var(--ink)] sm:min-h-[700px]">{cover ? <img src={cover} alt={`${business.name} verified listing photo`} className="absolute inset-0 h-full w-full object-cover opacity-75" /> : <div aria-hidden="true" className="absolute inset-0 bg-[var(--ink)]"><div className="absolute -right-20 -top-24 h-96 w-96 rounded-full bg-[var(--accent)]/30 blur-3xl" /><div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[var(--wash)]/20 blur-3xl" /></div>}<div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/20 to-transparent" /><div className="relative flex min-h-[600px] flex-col justify-end p-7 text-white sm:min-h-[700px] sm:p-14"><div className="mb-6 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 backdrop-blur">{business.category}</span>{business.rating && <span className="flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 backdrop-blur"><Star size={13} fill="currentColor" /> {business.rating} rating</span>}</div><p className="max-w-3xl font-serif text-5xl leading-[.95] sm:text-8xl">{label}.</p><p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg">{description}</p><div className="mt-8 flex flex-wrap gap-3"><a href="#contact" className="rounded-full bg-[var(--soft)] px-6 py-3.5 text-sm font-bold text-[var(--ink)] transition hover:bg-white">Make an enquiry <ArrowUpRight className="ml-1 inline" size={16} /></a>{whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer" className="rounded-full border border-white/35 px-6 py-3.5 text-sm font-bold transition hover:bg-white/10">Chat on WhatsApp</a>}</div></div></div></section>

    <section id="details" className={`mx-auto grid max-w-7xl gap-4 px-5 py-8 sm:px-8 sm:py-12 ${hours.length > 0 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}><div className="rounded-2xl border border-[var(--line)] bg-white/60 p-6"><MapPin className="text-[var(--accent)]" size={21} /><p className="mt-4 text-xs font-bold uppercase tracking-[.16em] opacity-60">Find us</p><p className="mt-2 text-sm leading-6">{business.address || 'Address available through Google Maps'}</p></div><div className="rounded-2xl border border-[var(--line)] bg-white/60 p-6"><Star className="text-[var(--accent)]" size={21} fill="currentColor" /><p className="mt-4 text-xs font-bold uppercase tracking-[.16em] opacity-60">{isFood ? 'Guest rating' : isStay ? 'Guest rating' : isWellness ? 'Client rating' : 'Local rating'}</p><p className="mt-2 font-serif text-2xl">{business.rating ? `${business.rating} / 5` : 'Ask us directly'}</p></div>{hours.length > 0 && <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-6"><Clock3 className="text-[var(--accent)]" size={21} /><p className="mt-4 text-xs font-bold uppercase tracking-[.16em] opacity-60">Hours verified from listing</p><div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">{hours.slice(0, 7).map(([day, value]) => <div key={day} className="flex items-center justify-between gap-2 border-b border-[var(--line)]/70 pb-2"><span className="font-medium">{formatDay(day)}</span><span className="text-right text-xs opacity-70">{value.open}–{value.close}</span></div>)}</div></div>}</section>

    <section id="story" className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[.75fr_1.25fr]"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--accent)]">The experience</p><h2 className="mt-4 max-w-md font-serif text-5xl leading-tight sm:text-6xl">A place with its own point of view.</h2></div><div className="max-w-2xl text-lg leading-8 opacity-70"><p>{description} Every detail starts with the people behind {business.name} and a genuine understanding of what visitors need.</p><p className="mt-6">Reach out directly for current availability, services, pricing, and thoughtful recommendations for your visit.</p><a href="#contact" className="mt-8 inline-flex items-center border-b border-[var(--accent)] pb-1 text-sm font-bold text-[var(--accent)]">Start planning <ArrowUpRight className="ml-2" size={16} /></a></div></section>

    {photos.length > 0 && <section id="gallery" className="bg-[var(--wash)] px-5 py-16 sm:px-8 sm:py-24"><div className="mx-auto max-w-7xl"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--accent)]">The gallery</p><h2 className="mt-3 font-serif text-5xl">See it for yourself.</h2></div><span className="text-sm opacity-60">{photos.length} listing {photos.length === 1 ? 'photo' : 'photos'}</span></div><div className="mt-8 grid auto-rows-[190px] grid-cols-2 gap-3 sm:auto-rows-[250px] sm:grid-cols-4">{photos.map((url, index) => <button type="button" key={url} onClick={() => setActivePhoto(index)} className={`${index === 0 ? 'col-span-2 row-span-2' : ''} group overflow-hidden rounded-2xl bg-black/10 text-left focus:outline-none focus:ring-2 focus:ring-[var(--accent)]`} aria-label={`Open photo ${index + 1}`}><img src={url} alt={`${business.name} gallery photo ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /></button>)}</div><p className="mt-4 text-xs opacity-60">Photos are served from the verified Google business listing. Rights remain with the original photographer or listing owner.</p></div></section>}

    <section id="contact" className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[.8fr_1fr]"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--accent)]">Let&apos;s talk</p><h2 className="mt-4 max-w-xl font-serif text-5xl leading-tight sm:text-6xl">{contactHeading}.</h2><p className="mt-6 max-w-xl text-base leading-7 opacity-70">{contactIntro} Prefer a faster reply? Use WhatsApp.</p><div className="mt-8 flex flex-wrap gap-3">{whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-white">Chat on WhatsApp <ArrowUpRight size={16} /></a>}{phone && <a href={phone} className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-5 py-3 text-sm font-bold"><Phone size={16} /> Call now</a>}</div></div><form onSubmit={submitContact} className={`generated-contact-form generated-contact-form--${template} rounded-[1.5rem] bg-[var(--ink)] p-7 text-white sm:p-10`}><p className="text-sm text-white/60">{isFood ? 'Table and visit enquiry' : isStay ? 'Stay enquiry' : isWellness ? 'Wellness enquiry' : 'Service enquiry'} for {business.name}</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{formFields.map((field) => <label key={field.key} className="text-sm">{field.label}{field.type === 'select' ? <select value={form.details[field.key] || ''} onChange={(event) => setForm({ ...form, details: { ...form.details, [field.key]: event.target.value } })} className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-[var(--accent)]"><option value="" className="text-black">Select an option</option>{field.options?.map((option) => <option key={option} value={option} className="text-black">{option}</option>)}</select> : <input type={field.type} value={form.details[field.key] || ''} onChange={(event) => setForm({ ...form, details: { ...form.details, [field.key]: event.target.value } })} className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-[var(--accent)]" />}</label>)}</div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm">Your name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-[var(--accent)]" placeholder="Full name" /></label><label className="text-sm">Phone or email<input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-[var(--accent)]" placeholder="How should we reply?" /></label></div><label className="mt-4 block text-sm">Your message<textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-2 w-full resize-none rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-[var(--accent)]" placeholder="Tell us what you need..." /></label><button type="submit" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--soft)] px-5 py-3.5 text-sm font-bold text-[var(--ink)] hover:bg-white"><Send size={16} /> Send enquiry</button>{sent && <p className="mt-4 flex items-center gap-2 text-sm text-white/70"><Check size={16} /> Your enquiry is ready to send.</p>}</form></section>

    <footer className="border-t border-[var(--line)] px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-xs opacity-60 sm:flex-row"><span>© {new Date().getFullYear()} {business.name}. All rights reserved.</span><span>{business.category} · {business.address || 'Local business'}</span><button type="button" onClick={downloadSource} disabled={!websiteId || exporting} className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50">{exporting ? 'Preparing source…' : 'Download source code'}</button></div></footer>
    {activePhoto !== null && photos[activePhoto] && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={() => setActivePhoto(null)}><button type="button" aria-label="Close photo viewer" onClick={() => setActivePhoto(null)} className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white"><X size={22} /></button><img src={photos[activePhoto]} alt={`${business.name} gallery photo ${activePhoto + 1}`} className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain" onClick={(event) => event.stopPropagation()} /></div>}
  </main>
}
