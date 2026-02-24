// app/auth/verify-email/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, CheckCircle, Mail, AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    }
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`)
      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message)
        
        if (data.user) {
          setUserEmail(data.user.email)
        }
        
        // Redirection automatique après 3 secondes
        if (data.redirectTo) {
          setTimeout(() => {
            router.push(data.redirectTo)
          }, 3000)
        }
      } else {
        setStatus('error')
        setMessage(data.error || 'Erreur de vérification')
        
        if (data.error?.includes('expiré')) {
          setStatus('expired')
        }
      }
    } catch (error) {
      setStatus('error')
      setMessage('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const resendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setStatus('error')
      setMessage('Veuillez entrer votre email')
      return
    }

    setResendLoading(true)
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      
      if (response.ok) {
        setStatus('success')
        setMessage(data.message || 'Email de vérification envoyé!')
        
        if (data.alreadyVerified) {
          setMessage('Votre email est déjà vérifié. Vous pouvez vous connecter.')
        }
      } else {
        setStatus('error')
        setMessage(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Erreur de connexion au serveur')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Vérification d'Email</CardTitle>
          <CardDescription>
            {!token 
              ? "Entrez votre email pour recevoir un nouveau lien de vérification"
              : "Vérification de votre adresse email en cours..."
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Alert */}
          {message && (
            <Alert className={status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {status === 'success' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <AlertTitle className="capitalize">
                {status === 'success' ? 'Succès' : 
                 status === 'error' ? 'Erreur' : 
                 status === 'expired' ? 'Lien expiré' : 'Chargement'}
              </AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
              <p className="mt-4 text-slate-600">Vérification en cours...</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && token && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Email vérifié avec succès!</h3>
                <p className="text-slate-600 mt-2">
                  {userEmail && `Votre email ${userEmail} a été vérifié.`}
                  <br />
                  Redirection vers le tableau de bord...
                </p>
              </div>
              <div className="pt-4">
                <Button 
                  onClick={() => router.push('/dashboard')}
                  className="w-full"
                >
                  Aller au tableau de bord
                </Button>
              </div>
            </div>
          )}

          {/* Expired/Error State or No Token */}
          {(status === 'expired' || status === 'error' || !token) && !loading && (
            <div className="space-y-4">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                <p className="mt-3 text-slate-700">
                  {!token 
                    ? "Aucun lien de vérification trouvé. Entrez votre email pour en recevoir un nouveau."
                    : "Le lien de vérification a expiré ou est invalide."
                  }
                </p>
              </div>

              <form onSubmit={resendVerification} className="space-y-4">
                <div>
                  <Label htmlFor="email">Adresse Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    className="mt-1"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={resendLoading}
                  className="w-full"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Renvoyer l'email de vérification
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center text-sm text-slate-500">
                <p>Le lien de vérification expire après 24 heures.</p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <div className="text-center text-sm text-slate-500 w-full">
            <p>Vous avez des problèmes? <Link href="/contact" className="text-blue-600 hover:underline">Contactez le support</Link></p>
          </div>
          
          <div className="border-t pt-4 w-full text-center">
            <Button 
              variant="outline" 
              onClick={() => router.push('/auth/signin')}
              className="w-full"
            >
              ← Retour à la connexion
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}