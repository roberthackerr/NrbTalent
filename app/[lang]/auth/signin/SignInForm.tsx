// app/[lang]/auth/signin/SignInForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Sparkles, CheckCircle2 } from 'lucide-react'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

interface Props {
  dict: Dictionary
  lang: Locale
}

export default function SignInForm({ dict, lang }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        const errorMessages: Record<string, string> = {
          'No user found with this email': dict.auth.errors.invalidCredentials,
          'Invalid password': dict.auth.errors.invalidCredentials,
          'Email and password required': dict.auth.errors.emailRequired,
          'Ce compte utilise Google. Connectez-vous avec Google.': dict.auth.errors.googleAccount,
        }
        toast.error(errorMessages[result.error] || result.error)
      } else {
        toast.success(dict.auth.success.login)
        router.push(`/${lang}/dashboard`)
        router.refresh()
      }
    } catch (error) {
      toast.error(dict.common.error)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    try {
      await signIn('google', { 
        callbackUrl: `/${lang}/onboarding/role` 
      })
    } catch (error) {
      toast.error(dict.auth.errors.googleAccount)
      setGoogleLoading(false)
    }
  }

  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/30 dark:to-purple-950/30">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/30 dark:to-purple-950/30">
      {/* Language Switcher */}
      <div className="absolute right-4 top-4 z-50">
        <LanguageSwitcher lang={lang} />
      </div>

      <div className="container relative flex min-h-screen flex-col items-center justify-center p-4 lg:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        
        {/* Left side - Form */}
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
            {/* Header */}
            <div className="flex flex-col space-y-2 text-center">
              <Link href={`/${lang}`} className="inline-flex items-center gap-3 self-center">
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
              <h1 className="text-3xl font-bold tracking-tight dark:text-white">
                {dict.auth.welcome}
              </h1>
              <p className="text-lg text-muted-foreground dark:text-slate-400">
                {dict.auth.subtitle}
              </p>
            </div>

            <Card className="border-slate-200/50 dark:border-slate-800/50 shadow-lg dark:bg-slate-950/90 dark:backdrop-blur-sm">
              <div className="p-6">
                {/* Google Sign In */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-200"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                >
                  {googleLoading ? (
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {dict.common.loading}
                    </div>
                  ) : (
                    <>
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      {dict.auth.google}
                    </>
                  )}
                </Button>

                {/* Separator */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-300 dark:border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground dark:bg-slate-950 dark:text-slate-400">
                      {dict.auth.or}
                    </span>
                  </div>
                </div>

                {/* Email Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="dark:text-slate-200">{dict.auth.email}</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      required 
                      placeholder={dict.auth.email}
                      disabled={loading || googleLoading}
                      className="border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="dark:text-slate-200">{dict.auth.password}</Label>
                      <Link 
                        href={`/${lang}/auth/forgot-password`} 
                        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {dict.auth.forgotPassword}
                      </Link>
                    </div>
                    <Input 
                      id="password" 
                      name="password" 
                      type="password" 
                      required 
                      placeholder="••••••••"
                      disabled={loading || googleLoading}
                      className="border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600"
                    disabled={loading || googleLoading}
                  >
                    {loading ? dict.common.loading : dict.auth.login}
                  </Button>
                </form>

                {/* Sign Up Link */}
                <p className="mt-6 text-center text-sm text-muted-foreground dark:text-slate-400">
                  {dict.auth.noAccount}{' '}
                  <Link 
                    href={`/${lang}/auth/signup`} 
                    className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {dict.auth.register}
                  </Link>
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Right side - Benefits */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:p-8">
          <div className="mx-auto max-w-md space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                <Sparkles className="h-4 w-4" />
                {dict.navigation.signin}
              </div>
              
              {/* Titre et sous-titre traduits */}
              <h2 className="text-4xl font-bold tracking-tight dark:text-white">
                {dict.signin?.benefits?.title || "Bienvenue sur votre espace"}
              </h2>
              <p className="text-lg text-muted-foreground dark:text-slate-400">
                {dict.signin?.benefits?.subtitle || "Accédez à votre compte pour gérer vos projets et collaborations"}
              </p>
            </div>

            {/* Liste des avantages traduits */}
            <div className="space-y-4">
              {(dict.signin?.benefits?.items || [
                "Accédez à votre espace personnel",
                "Gérez vos projets en cours",
                "Communiquez avec vos clients",
                "Suivez vos revenus en temps réel"
              ]).map((benefit: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground dark:text-slate-400">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">50K+</div>
                <div className="text-xs text-muted-foreground dark:text-slate-400">
                  {dict.onboarding?.role?.freelance || "Freelances"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">10K+</div>
                <div className="text-xs text-muted-foreground dark:text-slate-400">
                  {dict.dashboard?.stats?.projects || "Projets"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">95%</div>
                <div className="text-xs text-muted-foreground dark:text-slate-400">
                  {dict.dashboard?.stats?.rating || "Satisfaction"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}