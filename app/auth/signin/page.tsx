"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import Image from "next/image"

export default function SignInPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Évite les problèmes d'hydratation
  useEffect(() => {
    setIsMounted(true)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Invalid credentials")
      } else {
         router.push("/")
        toast.success("Welcome back!")
       
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

async function handleGoogleSignIn() {
  setGoogleLoading(true)
  try {
    await signIn("google", { callbackUrl: "/onboarding/role" })
  } catch (error) {
    toast.error("Failed to sign in with Google")
    setGoogleLoading(false)
  }
}

  // Animation de chargement douce
  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
        {/* Logo avec animation */}
        <div className="mb-8 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 transition-transform hover:scale-105"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg  shadow-md">
                    <Image 
                           src={"/logo.png"}
                           alt="logo"
                           width={60}
                           height={60}
                           
                           />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              NRBTalents
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold animate-in fade-in duration-500">
            Welcome back
          </h1>
          <p className="mt-2 text-muted-foreground animate-in fade-in duration-500 delay-100">
            Sign in to your account to continue
          </p>
        </div>

        {/* Bouton Google amélioré */}
        <Button
          type="button"
          variant="outline"
          className="w-full bg-transparent transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border-2"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
        >
          {googleLoading ? (
            <div className="flex items-center">
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              Signing in...
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
              Continue with Google
            </>
          )}
        </Button>

        {/* Séparateur avec animation */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground animate-in fade-in">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Formulaire avec interactions */}
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-500 delay-200">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              required 
              className="transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
              placeholder="Enter your email"
              disabled={loading || googleLoading}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Link 
                href="/auth/forgot-password" 
                className="text-sm font-medium text-primary hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
              placeholder="Enter your password"
              disabled={loading || googleLoading}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
            disabled={loading || googleLoading}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Lien d'inscription */}
        <p className="mt-6 text-center text-sm text-muted-foreground animate-in fade-in duration-500 delay-300">
          Don't have an account?{" "}
          <Link 
            href="/auth/signup" 
            className="font-medium text-primary hover:underline transition-colors"
          >
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  )
}