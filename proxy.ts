import { NextRequest, NextResponse } from 'next/server'

const ROOT_DOMAIN = 'sustunenn.com'

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0]?.toLowerCase() || ''
  const subdomain = hostname.endsWith(`.${ROOT_DOMAIN}`) ? hostname.slice(0, -(`.${ROOT_DOMAIN}`).length) : ''

  if (!subdomain || subdomain === 'www' || subdomain.includes('.')) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = `/generated/${encodeURIComponent(subdomain)}${url.pathname === '/' ? '' : url.pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)'],
}
