// app/[lang]/auth/reactivate/[token]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function ReactivateAccountPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const lang = params.lang as string
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (token) {
      reactivateAccount()
    }
  }, [token])

  useEffect(() => {
    if (status === "success") {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            router.push(`/${lang}/auth/signin`)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [status, router, lang])

  const reactivateAccount = async () => {
    try {
      const response = await fetch(`/api/auth/reactivate/${token}`, {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage(data.message || "Votre compte a été réactivé avec succès !")
        toast.success("Compte réactivé")
      } else {
        setStatus("error")
        setMessage(data.error || "Le lien de réactivation est invalide ou a expiré.")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Une erreur est survenue lors de la réactivation de votre compte.")
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-8 text-center">
            <Loader2 className="h-16 w-16 text-purple-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Réactivation en cours...</h2>
            <p className="text-gray-600">Veuillez patienter...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className="max-w-md w-full border-green-200 dark:border-green-800 shadow-xl">
            <CardContent className="pt-12 pb-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Compte réactivé !</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500">Redirection vers la connexion dans {countdown} secondes...</p>
              <Button onClick={() => router.push(`/${lang}/auth/signin`)} className="mt-4 w-full">
                Se connecter maintenant
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-red-200 dark:border-red-800">
        <CardContent className="pt-12 pb-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Échec de la réactivation</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <Button onClick={() => router.push(`/${lang}/auth/signin`)} variant="outline" className="w-full">
            Retour à la connexion
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}