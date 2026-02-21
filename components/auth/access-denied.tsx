"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ShieldAlert, UserX, Lock, Home, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20 p-4">
      <Card className="w-full max-w-md border-red-200 dark:border-red-800 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-700 dark:text-red-300">
            Accès Refusé
          </CardTitle>
          <CardDescription className="text-red-600/80 dark:text-red-400/80">
            Vous n'avez pas les autorisations nécessaires
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="font-medium text-red-800 dark:text-red-200">
                  Restrictions d'accès
                </p>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  <li className="flex items-center gap-2">
                    <Lock className="h-3 w-3" />
                    <span>Cette page est réservée aux freelances</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <UserX className="h-3 w-3" />
                    <span>Votre compte n'a pas les privilèges requis</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <p className="font-medium text-slate-900 dark:text-slate-100">Solutions possibles :</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Connectez-vous avec un compte freelance</li>
              <li>Contactez l'administrateur pour obtenir les droits</li>
              <li>Vérifiez votre type de compte dans les paramètres</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/" className="flex items-center justify-center gap-2">
              <Home className="h-4 w-4" />
              Retour à l'accueil
            </Link>
          </Button>
          <Button asChild variant="default" className="flex-1 bg-blue-600 hover:bg-blue-700">
            <Link href="/auth/signin?callbackUrl=/freelance/dashboard" className="flex items-center justify-center gap-2">
              <UserX className="h-4 w-4" />
              Se connecter
            </Link>
          </Button>
        </CardFooter>

        <div className="px-6 pb-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
            Besoin d'aide ?{" "}
            <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
              Contactez le support
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}