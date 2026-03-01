// app/[lang]/auth/verify-email/page.tsx
'use client'
import { signIn } from "next-auth/react"
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, CheckCircle, Mail, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import type { Locale } from '@/lib/i18n/config'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const params = useParams()
  const lang = params.lang as Locale
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [dict, setDict] = useState<any>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  useEffect(() => {
    if (token && isMounted && dict) {
      verifyEmail(token)
    } else if (!token && isMounted && dict) {
      setStatus('error')
    }
  }, [token, isMounted, dict])

  // app/[lang]/auth/verify-email/page.tsx - Modifiez verifyEmail

const verifyEmail = async (verificationToken: string) => {
  setLoading(true)
  
  try {
    const response = await fetch(`/api/auth/verify-email?token=${verificationToken}&lang=${lang}`)
    const data = await response.json()

    if (response.ok) {
      setStatus('success')
      setMessage(data.message || dict?.auth?.emailVerified || "Email vérifié avec succès!")
      
      if (data.email) {
        setUserEmail(data.email)
        
        // ✅ CONNEXION AUTOMATIQUE VIA NEXT-AUTH
        const signInResult = await signIn('credentials', {
          email: data.email,
          password: 'VERIFIED_BY_EMAIL', // Mot de passe spécial
          isVerifiedFlow: 'true', // Flag pour indiquer que c'est une vérification
          lang: lang,
          redirect: false,
        })

        console.log("🔐 Connexion auto résultat:", signInResult)
      }
      
      // Redirection automatique après 2 secondes
      setTimeout(() => {
        router.push(data.redirectTo || `/${lang}/onboarding`)
        router.refresh()
      }, 2000)
    } else {
      setStatus('error')
      setMessage(data.error || dict?.auth?.verificationError || 'Erreur de vérification')
      
      if (data.error?.includes('expiré') || data.error?.includes('expired')) {
        setStatus('expired')
      }
    }
  } catch (error) {
    console.error("❌ Verification error:", error)
    setStatus('error')
    setMessage(dict?.common?.error || 'Erreur de connexion au serveur')
  } finally {
    setLoading(false)
  }
}
  const resendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setStatus('error')
      setMessage(dict?.auth?.emailRequired || 'Veuillez entrer votre email')
      return
    }

    setResendLoading(true)
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lang })
      })

      const data = await response.json()
      
      if (response.ok) {
        setStatus('success')
        setMessage(data.message || dict?.auth?.verificationEmailSent || 'Email de vérification envoyé!')
        
        if (data.alreadyVerified) {
          setMessage(dict?.auth?.alreadyVerified || 'Votre email est déjà vérifié. Vous pouvez vous connecter.')
        }
      } else {
        setStatus('error')
        setMessage(data.error || dict?.common?.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      setStatus('error')
      setMessage(dict?.common?.error || 'Erreur de connexion au serveur')
    } finally {
      setResendLoading(false)
    }
  }

  if (!isMounted || !dict) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/30 dark:to-purple-950/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">{dict?.common?.loading || "Loading..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/30 dark:to-purple-950/30 flex items-center justify-center p-4">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher lang={lang} />
      </div>

      <div className="container relative flex max-w-md flex-col items-center justify-center">
        {/* Logo */}
        <Link href={`/${lang}`} className="mb-8 inline-flex items-center gap-3">
          <div className="relative">
            <Image 
              src="/logo.png"
              alt="NRBTalents"
              width={48}
              height={48}
              className="h-12 w-12 transition-transform hover:scale-110"
            />
          </div>
          <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            NRBTalents
          </span>
        </Link>

        <Card className="w-full border-slate-200/50 dark:border-slate-800/50 shadow-xl dark:bg-slate-950/90 dark:backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
              {dict?.auth?.emailVerification || "Vérification d'Email"}
            </CardTitle>
            <CardDescription className="text-muted-foreground dark:text-slate-400">
              {!token 
                ? dict?.auth?.enterEmailForVerification || "Entrez votre email pour recevoir un nouveau lien de vérification"
                : dict?.auth?.verifyingEmail || "Vérification de votre adresse email en cours..."
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Status Alert */}
            {message && (
              <Alert className={`${status === 'success' ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'border-red-200 bg-red-50 dark:bg-red-950/20'}`}>
                {status === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
                <AlertTitle className={status === 'success' ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}>
                  {status === 'success' ? (dict?.common?.success || 'Succès') : 
                   status === 'error' ? (dict?.common?.error || 'Erreur') : 
                   status === 'expired' ? (dict?.auth?.expiredLink || 'Lien expiré') : 
                   (dict?.common?.loading || 'Chargement')}
                </AlertTitle>
                <AlertDescription className={status === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
                <p className="mt-4 text-muted-foreground dark:text-slate-400">
                  {dict?.auth?.verifying || "Vérification en cours..."}
                </p>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && token && (
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-24 h-24">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                  <div className="absolute inset-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-white" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground dark:text-white">
                    {dict?.auth?.emailVerified || "Email vérifié avec succès!"}
                  </h3>
                  <p className="text-muted-foreground dark:text-slate-400 mt-2">
                    {userEmail && `${dict?.auth?.yourEmail || 'Votre email'} ${userEmail} ${dict?.auth?.hasBeenVerified || 'a été vérifié.'}`}
                    <br />
                    {dict?.auth?.redirecting || "Redirection vers le tableau de bord..."}
                  </p>
                </div>
                
                <div className="pt-4">
                  <Link href={`/${lang}/dashboard`}>
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      {dict?.auth?.goToDashboard || "Aller au tableau de bord"}
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Expired/Error State or No Token */}
            {(status === 'expired' || status === 'error' || !token) && !loading && (
              <div className="space-y-4">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-amber-500 dark:text-amber-400 mx-auto" />
                  <p className="mt-3 text-muted-foreground dark:text-slate-400">
                    {!token 
                      ? dict?.auth?.noTokenFound || "Aucun lien de vérification trouvé. Entrez votre email pour en recevoir un nouveau."
                      : dict?.auth?.linkExpired || "Le lien de vérification a expiré ou est invalide."
                    }
                  </p>
                </div>

                <form onSubmit={resendVerification} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium dark:text-slate-200">
                      {dict?.auth?.email || "Adresse Email"}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      required
                      className="mt-1 border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={resendLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {resendLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {dict?.common?.sending || "Envoi en cours..."}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {dict?.auth?.resendVerification || "Renvoyer l'email de vérification"}
                      </>
                    )}
                  </Button>
                </form>

                <div className="text-center text-sm text-muted-foreground dark:text-slate-500">
                  <p>{dict?.auth?.linkExpiresIn || "Le lien de vérification expire après 24 heures."}</p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            <div className="text-center text-sm text-muted-foreground dark:text-slate-500 w-full">
              <p>
                {dict?.auth?.needHelp || "Vous avez des problèmes?"}{" "}
                <Link href={`/${lang}/support`} className="text-blue-600 hover:underline dark:text-blue-400">
                  {dict?.common?.contact || "Contactez le support"}
                </Link>
              </p>
            </div>
            
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 w-full text-center">
              <Link href={`/${lang}/auth/signin`}>
                <Button variant="outline" className="w-full border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {dict?.auth?.backToSignin || "Retour à la connexion"}
                </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="mt-8 text-xs text-muted-foreground dark:text-slate-600">
          &copy; {new Date().getFullYear()} NRBTalents. {dict?.footer?.rights || "All rights reserved."}
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/30 dark:to-purple-950/30">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}