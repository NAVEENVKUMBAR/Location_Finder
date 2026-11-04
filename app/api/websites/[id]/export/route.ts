import JSZip from 'jszip'
import { NextResponse } from 'next/server'
import { getDraft } from '@/lib/generated-websites'
import type { Business } from '@/lib/types'

function safeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'business'
}

function escapeJson(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function projectFiles(business: Business, imageFiles: string[]) {
  const year = new Date().getFullYear()
  return {
    'package.json': escapeJson({ name: `${safeName(business.name)}-website`, private: true, version: '1.0.0', type: 'module', scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' }, dependencies: { '@vitejs/plugin-react': '^4.3.4', vite: '^6.0.0', typescript: '^5.7.2', react: '^19.0.0', 'react-dom': '^19.0.0', 'lucide-react': '^0.468.0' }, devDependencies: {} }),
    'index.html': `<!doctype html>\n<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${business.name}</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n`,
    'vite.config.ts': `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()] })\n`,
    'tsconfig.json': escapeJson({ compilerOptions: { target: 'ES2022', useDefineForClassFields: true, lib: ['ES2022', 'DOM', 'DOM.Iterable'], allowJs: false, skipLibCheck: true, esModuleInterop: true, allowSyntheticDefaultImports: true, strict: true, module: 'ESNext', moduleResolution: 'Bundler', resolveJsonModule: true, isolatedModules: true, noEmit: true, jsx: 'react-jsx' }, include: ['src'] }),
    '.env.example': '# Add an email or form provider here if you connect the enquiry form to your backend.\n',
    '.gitignore': 'node_modules\ndist\n.env\n',
    'README.md': `# ${business.name}\n\nIndependent source code exported from Sthala.\n\n## Run locally\n\n1. Extract this ZIP and open the folder in VS Code, Cursor, WebStorm, or another editor.\n2. Run \`npm install\`.\n3. Run \`npm run dev\`.\n4. Open the local URL shown by Vite.\n5. Run \`npm run build\` for production and \`npm run preview\` to preview the build.\n\nThe site includes the selected business content, category styling, contact links, enquiry form, and ${imageFiles.length} original listing image(s).\n`,
    'src/main.tsx': `import { StrictMode } from 'react'\nimport { createRoot } from 'react-dom/client'\nimport App from './App'\nimport './styles.css'\ncreateRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)\n`,
    'src/App.tsx': `import { useState } from 'react'\nimport { Phone, MapPin, MessageCircle } from 'lucide-react'\n\nconst business = ${escapeJson(business)}\nconst images = ${escapeJson(imageFiles)}\nconst phone = business.phone ? business.phone.replace(/\\D/g, '') : ''\n\nexport default function App() {\n  const [sent, setSent] = useState(false)\n  const whatsapp = phone ? \`https://wa.me/\${phone}?text=\${encodeURIComponent('Hello ' + business.name + ', I would like to know more.') }\` : ''\n  return <main className="site"><header><a href="#top" className="brand">{business.name}<small>{business.category}</small></a><nav><a href="#about">About</a><a href="#gallery">Gallery</a><a href="#contact">Contact</a></nav></header><section className="hero" id="top"><div><span className="eyebrow">{business.category}</span><h1>A more considered local experience.</h1><p>Connect with {business.name} for current availability, services, and details.</p><div className="actions">{phone && <a className="button" href={\`tel:+\${phone}\`}><Phone size={16}/> Call now</a>}{whatsapp && <a className="button secondary" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={16}/> WhatsApp</a>}</div></div>{images[0] && <img src={images[0]} alt={business.name + ' listing photo'} />}</section><section className="details" id="about"><div><MapPin size={20}/><strong>Find us</strong><p>{business.address || 'Contact the business for its current location.'}</p></div><div><strong>About this business</strong><p>{business.name} is a local {business.category.toLowerCase()} ready to help. Reach out directly for the most accurate information.</p></div></section>{images.length > 0 && <section id="gallery"><span className="eyebrow">Gallery</span><h2>See the space</h2><div className="gallery">{images.map((image: string, index: number) => <img key={image} src={image} alt={business.name + ' gallery photo ' + (index + 1)} />)}</div></section>}<section className="contact" id="contact"><div><span className="eyebrow">Get in touch</span><h2>Tell us what you need.</h2><p>Send an enquiry and the team can follow up with the right details.</p></div><form onSubmit={(event) => { event.preventDefault(); setSent(true) }}><input required placeholder="Your name" aria-label="Your name"/><input required placeholder="Phone or email" aria-label="Phone or email"/><textarea required placeholder="How can we help?" aria-label="Your message" rows={5}/><button className="button" type="submit">{sent ? 'Enquiry ready to send' : 'Send enquiry'}</button>{sent && <p className="success">Your details are ready. For an immediate reply, use the call or WhatsApp buttons above.</p>}</form></section><footer>© ${year} {business.name}. All rights reserved.</footer></main>\n`,
    'src/styles.css': `:root{font-family:Georgia,serif;color:#182d29;background:#f4eadb;line-height:1.5}*{box-sizing:border-box}body{margin:0}a{color:inherit;text-decoration:none}.site{max-width:1280px;margin:auto;padding:0 28px}header{display:flex;justify-content:space-between;align-items:center;padding:24px 0;border-bottom:1px solid #d9cdbd}.brand{font-size:26px}.brand small{display:block;font:700 10px Arial;letter-spacing:.18em;text-transform:uppercase;color:#b56642;margin-top:4px}nav{display:flex;gap:28px;font:600 14px Arial}.hero{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;padding:90px 0}.hero h1{font-size:clamp(48px,7vw,88px);line-height:.95;font-weight:400;margin:16px 0}.hero p{max-width:480px;font:18px/1.7 Arial;color:#52615b}.hero img{width:100%;height:560px;object-fit:cover;border-radius:28px}.eyebrow{font:700 11px Arial;letter-spacing:.2em;text-transform:uppercase;color:#b56642}.actions{display:flex;gap:12px;margin-top:28px}.button{border:0;border-radius:999px;background:#182d29;color:#fff;padding:14px 20px;display:inline-flex;align-items:center;gap:8px;font:700 14px Arial;cursor:pointer}.button.secondary{background:#b56642}.details{display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:30px 0 100px}.details>div{padding:28px;background:#e8dfd2;border-radius:20px}.details strong{display:block;margin-top:12px}.details p,form{font:15px/1.7 Arial;color:#52615b}section[id=gallery]{padding:80px 0}.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:24px}.gallery img{width:100%;height:280px;object-fit:cover;border-radius:16px}.contact{display:grid;grid-template-columns:1fr 1fr;gap:60px;padding:100px 0}.contact h2{font-size:56px;line-height:1;margin:14px 0;font-weight:400}.contact p{font:16px/1.7 Arial;color:#52615b}form{display:grid;gap:12px}input,textarea{border:1px solid #d9cdbd;background:#fffaf3;border-radius:12px;padding:14px;font:inherit;width:100%}.success{color:#246343!important}footer{border-top:1px solid #d9cdbd;padding:28px 0;font:12px Arial;color:#68736d}@media(max-width:760px){.site{padding:0 18px}nav{display:none}.hero,.details,.contact{grid-template-columns:1fr;gap:28px;padding:56px 0}.hero img{height:360px;order:-1}.gallery{grid-template-columns:1fr 1fr}.gallery img{height:180px}.contact h2{font-size:44px}}\n`,
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const draft = await getDraft(id)
  if (!draft) return NextResponse.json({ error: 'Website draft not found.' }, { status: 404 })
  const zip = JSZip()
  const imageFiles: string[] = []
  const names = draft.business.photoNames?.length ? draft.business.photoNames : draft.business.photoName ? [draft.business.photoName] : []
  const origin = new URL(request.url).origin
  for (let index = 0; index < names.length; index += 1) {
    const response = await fetch(`${origin}/api/place-photo?name=${encodeURIComponent(names[index])}`, { cache: 'no-store' }).catch(() => null)
    if (!response?.ok) continue
    const bytes = await response.arrayBuffer().catch(() => null)
    if (!bytes) continue
    const filename = `src/assets/images/business-${index + 1}.jpg`
    zip.file(filename, bytes)
    imageFiles.push(`/${filename.replace(/^src\//, '')}`)
  }
  const files = projectFiles(draft.business, imageFiles)
  for (const [path, content] of Object.entries(files)) zip.file(path, content)
  const archive = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
  return new NextResponse(archive as BodyInit, { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${safeName(draft.business.name)}-website-source.zip"`, 'Cache-Control': 'no-store' } })
}
