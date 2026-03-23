// middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from 'next/server'
import { locales, defaultLocale } from '@/lib/i18n/config'
import { getToken } from 'next-auth/jwt'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

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

// Routes qui ne nécessitent pas de vérification d'email
const noEmailVerifyRoutes = [
  '/auth/verify-email-prompt',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password'
]

// Routes API qui ne nécessitent pas d'authentification
const publicApiRoutes = [
  '/api/auth',
  '/api/webhooks',
  '/api/health',
  '/api/public'
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

// Cache pour la langue utilisateur (pour éviter trop d'appels DB)
const userLanguageCache = new Map<string, { lang: string, timestamp: number }>()
const CACHE_TTL = 60 * 1000 // 1 minute

// Récupérer la langue préférée de l'utilisateur depuis la base de données avec cache
async function getUserPreferredLanguage(userId: string): Promise<string> {
  try {
    // Vérifier le cache
    const cached = userLanguageCache.get(userId)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.lang
    }

    const db = await getDatabase()
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { projection: { language: 1, 'preferences.language': 1 } }
    )
    
    const userLang = user?.language || user?.preferences?.language
    const result = userLang && locales.includes(userLang as any) ? userLang : defaultLocale
    
    // Mettre en cache
    userLanguageCache.set(userId, { lang: result, timestamp: Date.now() })
    
    return result
  } catch (error) {
    console.error('Error fetching user language:', error)
    return defaultLocale
  }
}

// Nettoyer le cache périodiquement
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of userLanguageCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      userLanguageCache.delete(key)
    }
  }
}, CACHE_TTL)

// Middleware pour la langue (avec support des préférences utilisateur)
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Ignorer les fichiers statiques et API spéciales
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/ws')
  ) {
    return NextResponse.next()
  }

  // Vérifier si le chemin commence par une locale supportée
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // Récupérer la langue depuis l'URL si présente
  let currentLocale = defaultLocale
  if (pathnameHasLocale) {
    currentLocale = pathname.split('/')[1] as typeof locales[number]
  }

  // Récupérer le token pour l'utilisateur connecté
  const token = await getToken({ req: request })
  
  // Si l'utilisateur est connecté, utiliser sa langue préférée
  let preferredLocale = currentLocale
  if (token?.sub) {
    try {
      const userLang = await getUserPreferredLanguage(token.sub)
      preferredLocale = userLang
    } catch (error) {
      console.error('Error getting user language:', error)
    }
  }

  // Redirection vers la langue préférée si nécessaire
  if (!pathnameHasLocale && !pathname.startsWith('/api')) {
    // Déterminer la langue à utiliser
    let targetLocale = preferredLocale
    
    // Si pas d'utilisateur connecté, utiliser la langue du navigateur
    if (!token?.sub) {
      const acceptLanguage = request.headers.get('accept-language')
      const browserLocale = acceptLanguage?.split(',')[0].split('-')[0]
      targetLocale = locales.includes(browserLocale as any) ? browserLocale : defaultLocale
    }
    
    // Construire la nouvelle URL
    const newUrl = new URL(`/${targetLocale}${pathname}`, request.url)
    
    // Préserver les paramètres de recherche
    request.nextUrl.searchParams.forEach((value, key) => {
      newUrl.searchParams.set(key, value)
    })
    
    const response = NextResponse.redirect(newUrl)
    
    // Ajouter un cookie pour la langue
    response.cookies.set('preferred-language', targetLocale, {
      maxAge: 60 * 60 * 24 * 30, // 30 jours
      path: '/',
      sameSite: 'lax'
    })
    
    return response
  }

  // Si l'utilisateur est connecté et que la langue dans l'URL ne correspond pas à sa préférence
  if (token?.sub && pathnameHasLocale && currentLocale !== preferredLocale) {
    // Ne pas rediriger si c'est une route API
    if (!pathname.startsWith('/api')) {
      const newPathname = pathname.replace(`/${currentLocale}`, `/${preferredLocale}`)
      const newUrl = new URL(newPathname, request.url)
      
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
  }

  return NextResponse.next()
}

// Middleware d'authentification
export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    const lang = path.split('/')[1] || defaultLocale

    // Extraire le chemin sans la langue
    const pathWithoutLang = path.replace(/^\/[^\/]+/, '') || '/'

    // Vérifier si c'est une route API publique
    const isPublicApiRoute = publicApiRoutes.some(route => 
      pathWithoutLang === route || pathWithoutLang.startsWith(route + '/')
    )

    // Vérifier si la route est publique
    const isPublicRoute = publicRoutes.some(route => 
      pathWithoutLang === route || pathWithoutLang.startsWith(route + '/')
    )

    // Vérifier si la route nécessite une vérification d'email
    const needsEmailVerification = !noEmailVerifyRoutes.some(route => 
      pathWithoutLang === route || pathWithoutLang.startsWith(route + '/')
    )

    // Si c'est une route API publique, autoriser sans vérification
    if (isPublicApiRoute) {
      return NextResponse.next()
    }

    // Si c'est une route publique, autoriser l'accès
    if (isPublicRoute) {
      // Rediriger vers le dashboard si déjà connecté et sur page auth
      if (token && (pathWithoutLang.startsWith('/auth') || pathWithoutLang === '/auth')) {
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

    // Récupérer le rôle de l'utilisateur depuis le token
    const userRole = token.role as string

    // Role-based access pour les routes dashboard
    if (pathWithoutLang.startsWith('/dashboard')) {
      // Dashboard client
      if (pathWithoutLang.startsWith('/dashboard/client') && userRole !== 'client') {
        return NextResponse.redirect(new URL(`/${lang}/dashboard`, req.url))
      }

      // Dashboard freelance
      if (pathWithoutLang.startsWith('/dashboard/freelance') && userRole !== 'freelance') {
        return NextResponse.redirect(new URL(`/${lang}/dashboard`, req.url))
      }

      // Dashboard admin
      if (pathWithoutLang.startsWith('/dashboard/admin') && userRole !== 'admin') {
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

    // Protection des routes admin
    if (pathWithoutLang.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL(`/${lang}/dashboard`, req.url))
    }

    // Protection des routes API privées
    if (pathWithoutLang.startsWith('/api') && !isPublicApiRoute && !isPublicRoute) {
      // Vérifier les permissions pour les API
      if (pathWithoutLang.startsWith('/api/admin') && userRole !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        )
      }
    }

    // Ajouter des headers de sécurité
    const response = NextResponse.next()
    
    // Ajouter la langue dans les headers pour les composants serveur
    response.headers.set('x-user-language', lang)
    
    // Ajouter l'ID utilisateur dans les headers pour les logs
    if (token?.sub) {
      response.headers.set('x-user-id', token.sub)
    }
    
    // Ajouter le rôle utilisateur dans les headers
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