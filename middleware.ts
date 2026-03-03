import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from 'next/server'
import { locales, defaultLocale } from '@/lib/i18n/config'

// Routes publiques (accessibles sans authentification)
const publicRoutes = [
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/verify-email-prompt',
  '/api/auth',
  '/',
  '/about',
  '/contact',
  '/pricing',
  '/legal'
]

// Routes qui ne nécessitent pas de vérification d'email
const noEmailVerifyRoutes = [
  '/auth/verify-email-prompt',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password'
]

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     * - api/ws (WebSocket connections)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/ws).*)',
  ],
}

// Middleware pour la langue
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Ignorer les fichiers statiques
  if (
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
  if (!pathnameHasLocale && !pathname.startsWith('/api')) {
    const acceptLanguage = request.headers.get('accept-language')
    const browserLocale = acceptLanguage?.split(',')[0].split('-')[0]
    const locale = locales.includes(browserLocale as any) ? browserLocale : defaultLocale
    
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    )
  }

  return NextResponse.next()
}

// Middleware d'authentification
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    const lang = path.split('/')[1] // Récupérer la langue depuis l'URL

    // Extraire le chemin sans la langue
    const pathWithoutLang = path.replace(/^\/[^\/]+/, '')

    // Vérifier si la route est publique
    const isPublicRoute = publicRoutes.some(route => 
      pathWithoutLang.startsWith(route) || pathWithoutLang === route
    )

    // Vérifier si la route nécessite une vérification d'email
    const needsEmailVerification = !noEmailVerifyRoutes.some(route => 
      pathWithoutLang.startsWith(route)
    )

    // Si c'est une route publique, autoriser l'accès
    if (isPublicRoute) {
      // Rediriger vers le dashboard si déjà connecté et sur page auth
      if (token && (pathWithoutLang.startsWith('/auth'))) {
        return NextResponse.redirect(new URL(`/${lang}/dashboard`, req.url))
      }
      return NextResponse.next()
    }

    // Vérifier si l'utilisateur est authentifié
    if (!token) {
      const signInUrl = new URL(`/${lang}/auth/signin`, req.url)
      signInUrl.searchParams.set('callbackUrl', path)
      return NextResponse.redirect(signInUrl)
    }

    // Vérifier si l'email est vérifié (sauf pour certaines routes)
    if (needsEmailVerification && !token.emailVerified) {
      // Stocker l'email pour la page de vérification
      const response = NextResponse.redirect(
        new URL(`/${lang}/auth/verify-email-prompt`, req.url)
      )
      
      // Ajouter l'email dans un cookie pour la page de vérification
      response.cookies.set('pendingVerificationEmail', token.email as string, {
        maxAge: 60 * 5, // 5 minutes
        path: '/',
        sameSite: 'lax'
      })
      
      return response
    }

    // Role-based access pour les routes dashboard
    if (pathWithoutLang.startsWith('/dashboard')) {
      // Dashboard client
      if (pathWithoutLang.startsWith('/dashboard/client') && token.role !== 'client') {
        return NextResponse.redirect(new URL(`/${lang}/dashboard`, req.url))
      }

      // Dashboard freelance
      if (pathWithoutLang.startsWith('/dashboard/freelance') && token.role !== 'freelance') {
        return NextResponse.redirect(new URL(`/${lang}/dashboard`, req.url))
      }

      // Dashboard admin
      if (pathWithoutLang.startsWith('/dashboard/admin') && token.role !== 'admin') {
        return NextResponse.redirect(new URL(`/${lang}/dashboard`, req.url))
      }

      // Vérifier si l'onboarding est complété
      if (!token.onboardingCompleted && !pathWithoutLang.startsWith('/onboarding')) {
        return NextResponse.redirect(new URL(`/${lang}/onboarding`, req.url))
      }
    }

    // Protection des routes onboarding
    if (pathWithoutLang.startsWith('/onboarding') && token.onboardingCompleted) {
      return NextResponse.redirect(new URL(`/${lang}/dashboard`, req.url))
    }

    // Sécuriser les connexions WebSocket
    if (path.startsWith('/api/ws')) {
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
  }
)