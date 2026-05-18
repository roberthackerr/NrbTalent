// app/[lang]/auth/account-deactivated/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Mail, ArrowRight, Home, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function AccountDeactivatedPage() {
  const params = useParams()
  const router = useRouter()
  const lang = params.lang as string
  const [email, setEmail] = useState("")
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const deactivatedEmail = sessionStorage.getItem("deactivatedAccountEmail")
    if (deactivatedEmail) {
      setEmail(deactivatedEmail)
    }
  }, [])

  const handleReactivateAccount = async () => {
    setResending(true)
    try {
      const response = await fetch("/api/auth/reactivate-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Email envoyé !", {
          description: "Un lien de réactivation a été envoyé à votre adresse email."
        })
        setTimeout(() => {
          router.push(`/${lang}/auth/signin`)
        }, 3000)
      } else {
        toast.error(data.error || "Erreur lors de l'envoi")
      }
    } catch (error) {
      console.error("Error reactivating account:", error)
      toast.error("Erreur réseau")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md w-full border-orange-200 dark:border-orange-800 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              Compte désactivé
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Votre compte a été désactivé
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4">
              <p className="text-sm text-orange-800 dark:text-orange-300">
                Votre compte a été désactivé. Pour le réactiver, veuillez suivre les instructions ci-dessous.
              </p>
            </div>

            {email && (
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300 break-all">
                  Compte concerné : {email}
                </p>
              </div>
            )}

            <div className="space-y-4 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">Pour réactiver votre compte :</h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>Cliquez sur le bouton "Renvoyer le lien de réactivation"</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>Un email vous sera envoyé avec un lien de réactivation</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>Cliquez sur le lien dans l'email pour réactiver votre compte</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleReactivateAccount}
              disabled={resending}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              {resending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Renvoyer le lien de réactivation
                </>
              )}
            </Button>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/${lang}/auth/signin`)}
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400"
            >
              <Home className="h-4 w-4 mr-2" />
              Retour à la connexion
            </Button>
            
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
              Besoin d'aide ?{" "}
              <Link href={`/${lang}/contact`} className="text-orange-600 hover:underline">
                Contactez le support
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}