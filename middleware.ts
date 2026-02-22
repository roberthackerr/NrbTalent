import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from 'next/server'
import { locales, defaultLocale } from '@/lib/i18n/config'

export const config = {
  matcher: ["/dashboard/:path*",'/api/ws/:path*'],
}


// Middleware pour la langue
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Ignorer les routes API et les fichiers statiques
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Vérifier si le chemin commence par une locale supportée
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // Rediriger vers la locale par défaut si pas de locale
  if (!pathnameHasLocale) {
    // Détecter la langue du navigateur
    const acceptLanguage = request.headers.get('accept-language')
    const browserLocale = acceptLanguage?.split(',')[0].split('-')[0]
    const locale = locales.includes(browserLocale as any) ? browserLocale : defaultLocale
    
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    )
  }

  return NextResponse.next()
}
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Protect dashboard routes
    if (path.startsWith("/dashboard")) {
      if (!token) {
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      }
    }

    // Role-based access
    if (path.startsWith("/dashboard/client") && token?.role !== "client") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    if (path.startsWith("/dashboard/freelance") && token?.role !== "freelance") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
     // Sécuriser les connexions WebSocket
  if (req.nextUrl.pathname.startsWith('/api/ws')) {
    // Vérifier l'origine si nécessaire
    const origin = req.headers.get('origin')
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
    
    if (origin && !allowedOrigins.includes(origin) && process.env.NODE_ENV === 'production') {
      return new NextResponse('Origin not allowed', { status: 403 })
    }
  }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
)




