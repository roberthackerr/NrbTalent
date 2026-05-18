// app/auth/activate/[token]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2, Sparkles, Mail, ArrowRight, Home, LogIn } from "lucide-react"

export default function ActivateAccountPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (token) {
      activateAccount()
    }
  }, [token])

  useEffect(() => {
    if (status === "success") {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            router.push("/auth/signin")
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [status, router])

  const activateAccount = async () => {
    try {
      const response = await fetch(`/api/auth/activate/${token}`, {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage(data.message || "Votre compte a été activé avec succès !")
      } else {
        setStatus("error")
        setMessage(data.error || "Le lien d'activation est invalide ou a expiré.")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Une erreur est survenue lors de l'activation de votre compte.")
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-purple-200 dark:border-gray-700 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 blur-2xl opacity-20 animate-pulse rounded-full"></div>
              <Loader2 className="h-16 w-16 text-purple-600 dark:text-purple-400 animate-spin relative z-10" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Activation en cours...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Veuillez patienter pendant que nous activons votre compte.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full border-green-200 dark:border-green-800 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <CardContent className="pt-12 pb-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 dark:from-green-300 dark:to-emerald-300 bg-clip-text text-transparent mb-2">
                Compte activé !
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {message}
              </p>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push("/auth/signin")}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Se connecter
                </Button>
                
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Redirection automatique dans {countdown} secondes...
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md w-full border-red-200 dark:border-red-800 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/25">
              <XCircle className="h-10 w-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
              Activation échouée
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => router.push("/auth/signin")}
                variant="outline"
                className="w-full border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
              >
                <Home className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
              
              <Button 
                onClick={() => router.push("/auth/signup")}
                variant="ghost"
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                Demander un nouveau lien
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}