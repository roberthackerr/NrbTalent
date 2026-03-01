// app/[lang]/auth/verify-email-prompt/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import type { Locale } from '@/lib/i18n/config'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'

export default function VerifyEmailPromptPage() {
  const params = useParams()
  const router = useRouter()
  const lang = params.lang as Locale
  const [email, setEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [dict, setDict] = useState<any>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    getDictionarySafe(lang).then(setDict)
    
    // Récupérer l'email depuis le sessionStorage
    const pendingEmail = sessionStorage.getItem('pendingVerificationEmail')
    if (pendingEmail) {
      setEmail(pendingEmail)
    }
  }, [lang])

  const resendVerification = async () => {
    if (!email) return
    
    setResendLoading(true)
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lang })
      })
      
      if (response.ok) {
        setResendSuccess(true)
        setTimeout(() => setResendSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Erreur renvoi:', error)
    } finally {
      setResendLoading(false)
    }
  }

  if (!isMounted || !dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/30 dark:to-purple-950/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/30 dark:to-purple-950/30 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher lang={lang} />
      </div>

      <div className="container relative flex max-w-md flex-col items-center justify-center">
        {/* Logo */}
        <Link href={`/${lang}`} className="mb-8 inline-flex items-center gap-3">
          <Image src="/logo.png" alt="NRBTalents" width={48} height={48} className="h-12 w-12" />
          <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            NRBTalents
          </span>
        </Link>

        <Card className="w-full border-slate-200/50 dark:border-slate-800/50 shadow-xl dark:bg-slate-950/90">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {dict?.auth?.verifyYourEmail || "Vérifiez votre email"}
            </CardTitle>
            <CardDescription>
              {dict?.auth?.verificationEmailSent || "Un email de vérification a été envoyé à"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Email */}
            <div className="text-center">
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 break-all">
                {email}
              </p>
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <p className="text-sm text-muted-foreground dark:text-slate-400">
                  {dict?.auth?.openEmailPrompt || "Ouvrez votre boîte de réception"}
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">2</span>
                </div>
                <p className="text-sm text-muted-foreground dark:text-slate-400">
                  {dict?.auth?.clickLinkPrompt || "Cliquez sur le lien de vérification dans l'email"}
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">3</span>
                </div>
                <p className="text-sm text-muted-foreground dark:text-slate-400">
                  {dict?.auth?.startJourney || "Commencez votre aventure sur NRBTalents!"}
                </p>
              </div>
            </div>

            {/* Message spam */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                {dict?.auth?.checkSpam || "Si vous ne trouvez pas l'email, vérifiez vos spams."}
              </p>
            </div>

            {/* Resend button */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground dark:text-slate-400 mb-2">
                {dict?.auth?.didntReceive || "Vous n'avez pas reçu l'email?"}
              </p>
              <Button
                variant="outline"
                onClick={resendVerification}
                disabled={resendLoading}
                className="w-full border-slate-300 dark:border-slate-600"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {dict?.common?.sending || "Envoi..."}
                  </>
                ) : (
                  dict?.auth?.resendVerification || "Renvoyer l'email"
                )}
              </Button>
              
              {resendSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center justify-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  {dict?.auth?.verificationEmailSent || "Email renvoyé!"}
                </p>
              )}
            </div>

            {/* Back to signin */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
              <Link href={`/${lang}/auth/signin`}>
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {dict?.auth?.backToSignin || "Retour à la connexion"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}