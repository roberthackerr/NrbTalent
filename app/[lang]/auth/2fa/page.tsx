// app/[lang]/auth/2fa/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, Smartphone, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

export default function TwoFactorPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const lang = params.lang as Locale
  
  const [dict, setDict] = useState<any>(null)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  const email = sessionStorage.getItem('2fa_email') || ''
  const password = sessionStorage.getItem('2fa_password')|| ''
  const urlLang = sessionStorage.getItem('2fa_lang') || lang

  useEffect(() => {
    setIsMounted(true)
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  useEffect(() => {
    if (!email || !password) {
      router.push(`/${lang}/auth/signin`)
    }
  }, [email, password, router, lang])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        twoFactorToken: token,
        lang: urlLang,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === '2FA_REQUIRED') {
          setError(dict?.twoFactor?.codeRequired || 'Code 2FA requis')
        } else if (result.error === 'Code 2FA invalide' || result.error.includes('invalide')) {
          setError(dict?.twoFactor?.invalidCode || 'Code invalide. Veuillez réessayer.')
          setToken('')
        } else {
          setError(result.error)
        }
      } else {
        toast.success(dict?.twoFactor?.success || 'Connexion réussie !')

        router.push(`/${lang}`)
                               sessionStorage.removeItem('2fa_email')  ;
                        sessionStorage.removeItem('2fa_password')  ;
                        sessionStorage.removeItem('2fa_lang')  ;
      }
    } catch (error) {
      setError(dict?.twoFactor?.error || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (!isMounted || !dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {dict?.common?.loading || 'Chargement...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {dict?.twoFactor?.title || 'Authentification à deux facteurs'}
          </CardTitle>
          <CardDescription>
            {dict?.twoFactor?.subtitle || 'Entrez le code à 6 chiffres de votre application d\'authentification'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="token" className="text-sm font-medium">
                {dict?.twoFactor?.verificationCode || 'Code de vérification'}
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="token"
                  type="text"
                  placeholder="123456"
                  value={token}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setToken(value)
                  }}
                  className="pl-10 text-center text-lg tracking-widest font-mono"
                  maxLength={6}
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {dict?.twoFactor?.appHint || 'Ouvrez Google Authenticator, Authy ou votre application 2FA'}
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || token.length !== 6}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {dict?.common?.verifying || 'Vérification...'}
                </>
              ) : (
                <>
                  <Smartphone className="h-4 w-4 mr-2" />
                  {dict?.twoFactor?.verifyAndLogin || 'Vérifier et se connecter'}
                </>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push(`/${lang}/auth/signin`)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                ← {dict?.twoFactor?.backToLogin || 'Retour à la connexion'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}