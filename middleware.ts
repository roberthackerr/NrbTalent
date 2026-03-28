// middleware.ts - Version corrigée avec lecture du token.language
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from 'next/server'
import { locales, defaultLocale } from '@/lib/i18n/config'
import { getToken } from 'next-auth/jwt'

// Routes publiques
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
  '/legal',
  '/talents',
  '/gigs',
  '/projects',
  '/ai-matching',
  '/blog',
  '/faq',
  '/how-it-works',
  '/privacy',
  '/terms',
  '/cookies'
]

const noEmailVerifyRoutes = [
  '/auth/verify-email-prompt',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password'
]

const publicApiRoutes = [
  '/api/auth',
  '/api/webhooks',
  '/api/health',
  '/api/public'
]

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api/ws).*)',
  ],
}

// Middleware pour la langue
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/ws')
  ) {
    return NextResponse.next()
  }

  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  let currentLocale = defaultLocale
  if (pathnameHasLocale) {
    currentLocale = pathname.split('/')[1] as typeof locales[number]
  }

  // Récupérer le token pour l'utilisateur connecté
  const token = await getToken({ req: request })
  
  // 👈 CRUCIAL: Récupérer la langue depuis le token
  let preferredLocale = currentLocale
  
  // Priorité 1: Langue dans le token (de l'utilisateur connecté)
  if (token?.language && locales.includes(token.language as any)) {
    preferredLocale = token.language
  }
  // Priorité 2: Cookie (fallback)
  else if (request.cookies.get('preferred-language')?.value) {
    const cookieLang = request.cookies.get('preferred-language')?.value
    if (cookieLang && locales.includes(cookieLang as any)) {
      preferredLocale = cookieLang
    }
  }
  // Priorité 3: Langue du navigateur (si pas d'utilisateur connecté)
  else if (!token?.sub && !pathnameHasLocale) {
    // const acceptLanguage = request.headers.get('accept-language')
    // const browserLocale = acceptLanguage?.split(',')[0].split('-')[0]
    // if (browserLocale && locales.includes(browserLocale as any)) {
    //   preferredLocale = browserLocale
    // }
  }

  console.log('🔍 Language detection:', {
    tokenLang: token?.language,
    preferredLocale,
    currentLocale,
    pathnameHasLocale,
    hasToken: !!token
  })

  // Redirection vers la langue préférée
  if (!pathnameHasLocale && !pathname.startsWith('/api')) {
    const newUrl = new URL(`/${preferredLocale}${pathname}`, request.url)
    
    request.nextUrl.searchParams.forEach((value, key) => {
      newUrl.searchParams.set(key, value)
    })
    
    const response = NextResponse.redirect(newUrl)
    
    response.cookies.set('preferred-language', preferredLocale, {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'lax'
    })
    
    return response
  }

  // Si l'utilisateur est connecté et la langue ne correspond pas
  if (token?.language && pathnameHasLocale && currentLocale !== token.language) {
    if (!pathname.startsWith('/api')) {
      const newPathname = pathname.replace(`/${currentLocale}`, `/${token.language}`)
      const newUrl = new URL(newPathname, request.url)
      
      request.nextUrl.searchParams.forEach((value, key) => {
        newUrl.searchParams.set(key, value)
      })
      
      const response = NextResponse.redirect(newUrl)
      response.cookies.set('preferred-language', token.language, {
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        sameSite: 'lax'
      })
      
      return response
    }
  }

  return NextResponse.next()
}

// Middleware d'authentification
export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    const lang = path.split('/')[1] || defaultLocale

    const pathWithoutLang = path.replace(/^\/[^\/]+/, '') || '/'

    const isPublicApiRoute = publicApiRoutes.some(route => 
      pathWithoutLang === route || pathWithoutLang.startsWith(route + '/')
    )

    const isPublicRoute = publicRoutes.some(route => 
      pathWithoutLang === route || pathWithoutLang.startsWith(route + '/')
    )

    const needsEmailVerification = !noEmailVerifyRoutes.some(route => 
      pathWithoutLang === route || pathWithoutLang.startsWith(route + '/')
    )

    if (isPublicApiRoute) {
      return NextResponse.next()
    }

    if (isPublicRoute) {
      if (token && (pathWithoutLang.startsWith('/auth') || pathWithoutLang === '/auth')) {
        return NextResponse.redirect(new URL(`/${lang}/dashboard`, req.url))
      }
      return NextResponse.next()
    }

    if (!token) {
      const signInUrl = new URL(`/${lang}/auth/signin`, req.url)
      signInUrl.searchParams.set('callbackUrl', path)
      return NextResponse.redirect(signInUrl)
    }

    if (needsEmailVerification && !token.emailVerified) {
      const response = NextResponse.redirect(
        new URL(`/${lang}/auth/verify-email-prompt`, req.url)
      )
      
      response.cookies.set('pendingVerificationEmail', token.email as string, {
        maxAge: 60 * 5,
        path: '/',
        sameSite: 'lax'
      })
      
      return response
    }

    const userRole = token.role as string

    if (pathWithoutLang.startsWith('/dashboard')) {
      if (pathWithoutLang.startsWith('/dashboard/client') && userRole !== 'client') {
        return NextResponse.redirect(new URL(`/${lang}/dashboard`, req.url))
      }

      if (pathWithoutLang.startsWith('/dashboard/freelance') && userRole !== 'freelance') {
        return NextResponse.redirect(new URL(`/${lang}/dashboard`, req.url))
      }

      if (pathWithoutLang.startsWith('/dashboard/admin') && userRole !== 'admin') {
        return NextResponse.redirect(new URL(`/${lang}/dashboard`, req.url))
      }

      if (!token.onboardingCompleted && !pathWithoutLang.startsWith('/onboarding')) {
        return NextResponse.redirect(new URL(`/${lang}/onboarding`, req.url))
      }
    }

    if (pathWithoutLang.startsWith('/onboarding') && token.onboardingCompleted) {
      return NextResponse.redirect(new URL(`/${lang}/dashboard`, req.url))
    }

    if (pathWithoutLang.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL(`/${lang}/dashboard`, req.url))
    }

    if (pathWithoutLang.startsWith('/api') && !isPublicApiRoute && !isPublicRoute) {
      if (pathWithoutLang.startsWith('/api/admin') && userRole !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        )
      }
    }

    const response = NextResponse.next()
    response.headers.set('x-user-language', lang)
    
    if (token?.sub) {
      response.headers.set('x-user-id', token.sub)
    }
    
    if (userRole) {
      response.headers.set('x-user-role', userRole)
    }

    return response
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)