// app/auth/error/page.tsx
'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from 'lucide-react'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: Record<string, string> = {
    'Configuration': 'Problème de configuration serveur.',
    'AccessDenied': 'Accès refusé.',
    'Verification': 'Le lien de vérification a expiré ou a déjà été utilisé.',
    'Default': 'Une erreur est survenue lors de l\'authentification.',
  }

  const message = error ? errorMessages[error] || errorMessages['Default'] : errorMessages['Default']

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <CardTitle>Erreur d'authentification</CardTitle>
          </div>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Si le problème persiste :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Vérifiez vos identifiants</li>
              <li>Essayez un autre navigateur</li>
              <li>Effacez les cookies de votre navigateur</li>
              <li>Contactez le support si nécessaire</li>
            </ul>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/auth/signin'}
              className="flex-1"
            >
              Retour à la connexion
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              className="flex-1"
            >
              Accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}