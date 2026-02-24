// app/[lang]/auth/forgot-password/page.tsx
'use client'

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft, Mail, CheckCircle, Lock, Loader2 } from "lucide-react"
import LanguageSwitcher from "@/components/common/LanguageSwitcher"
import type { Locale } from '@/lib/i18n/config'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [email, setEmail] = useState("")
  const [dict, setDict] = useState<any>(null)
  const [isMounted, setIsMounted] = useState(false)
  
  const router = useRouter()
  const params = useParams()
  const lang = params.lang as Locale

  useEffect(() => {
    setIsMounted(true)
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const emailValue = formData.get("email") as string
    setEmail(emailValue)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      })

      if (response.ok) {
        setEmailSent(true)
        toast.success(dict?.auth?.success?.emailSent || "Password reset link sent to your email")
      } else {
        const error = await response.json()
        toast.error(error.error || dict?.common?.error || "Something went wrong")
      }
    } catch (error) {
      toast.error(dict?.common?.error || "Something went wrong")
    } finally {
      setLoading(false)
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

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/30 dark:to-purple-950/30 flex items-center justify-center p-4">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSwitcher lang={lang} />
        </div>
        
        <Card className="w-full max-w-md p-8 border-slate-200/50 dark:border-slate-800/50 shadow-xl dark:bg-slate-950/90 dark:backdrop-blur-sm">
          <div className="text-center">
            {/* Success Animation */}
            <div className="relative mx-auto mb-6 w-24 h-24">
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent dark:from-green-400 dark:to-emerald-400">
              {dict?.auth?.checkEmail || "Check your email"}
            </h1>
            
            <p className="mt-4 text-muted-foreground dark:text-slate-400">
              {dict?.auth?.emailSent || "We've sent a password reset link to"}{" "}
              <span className="font-semibold text-foreground dark:text-white">{email}</span>
            </p>
            
            <p className="mt-2 text-sm text-muted-foreground dark:text-slate-400">
              {dict?.auth?.checkSpam || "Please check your spam folder if you don't see it in your inbox."}
            </p>

            <div className="mt-8 space-y-3">
              <Link href={`/${lang}/auth/signin`}>
                <Button variant="outline" className="w-full border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {dict?.auth?.backToSignin || "Back to Sign In"}
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                className="w-full text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setEmailSent(false)}
              >
                {dict?.auth?.tryDifferentEmail || "Try a different email"}
              </Button>
            </div>
          </div>
        </Card>
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
          <div className="p-8">
            {/* Back Button */}
            <Link
              href={`/${lang}/auth/signin`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {dict?.auth?.backToSignin || "Back to Sign In"}
            </Link>

            {/* Header */}
            <div className="mt-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mx-auto mb-4">
                <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              
              <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                {dict?.auth?.forgotPassword || "Forgot your password?"}
              </h1>
              
              <p className="mt-3 text-center text-muted-foreground dark:text-slate-400">
                {dict?.auth?.resetInstructions || "Enter your email address and we'll send you a link to reset your password."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium dark:text-slate-200">
                  {dict?.auth?.email || "Email"}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-slate-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="pl-10 border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-muted-foreground dark:text-slate-500">
                  {dict?.auth?.emailPrivacy || "We'll never share your email with anyone else."}
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {dict?.common?.sending || "Sending..."}
                  </>
                ) : (
                  dict?.auth?.sendResetLink || "Send Reset Link"
                )}
              </Button>
            </form>

            {/* Help Text */}
            <p className="mt-8 text-center text-xs text-muted-foreground dark:text-slate-500">
              {dict?.auth?.needHelp || "Need help?"}{" "}
              <Link 
                href={`/${lang}/support`} 
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {dict?.common?.contact || "Contact support"}
              </Link>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="mt-8 text-xs text-muted-foreground dark:text-slate-600">
          &copy; {new Date().getFullYear()} NRBTalents. {dict?.footer?.rights || "All rights reserved."}
        </p>
      </div>
    </div>
  )
}