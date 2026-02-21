"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  Key, 
  Smartphone, 
  LogOut, 
  Copy,
  CheckCircle,
  XCircle,
  RefreshCw,
  Globe,
  Monitor,
  Smartphone as PhoneIcon,
  Tablet,
  Lock,
  AlertTriangle,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BackupCodes } from "./backup-codes"

interface Session {
  id: string
  device: {
    browser: string
    os: string
    device: string
    ip?: string
    userAgent?: string
  }
  location?: {
    country?: string
    city?: string
    region?: string
    timezone?: string
  }
  createdAt: Date | string
  lastActive: Date | string
  current: boolean
  active: boolean
}

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function SecurityTab() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorSecret, setTwoFactorSecret] = useState("")
  const [qrCode, setQrCode] = useState("")
  const [verificationToken, setVerificationToken] = useState("")
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null)
  const [terminatingAll, setTerminatingAll] = useState(false)

  // Charger les données 2FA et sessions
  useEffect(() => {
    load2FAStatus()
    loadSessions()
  }, [])

  const load2FAStatus = async () => {
    try {
      const response = await fetch('/api/users/two-factor')
      if (response.ok) {
        const data = await response.json()
        setTwoFactorEnabled(data.enabled)
        if (data.secret) {
          setTwoFactorSecret(data.secret)
          setQrCode(data.qrCode)
        }
      }
    } catch (error) {
      console.error('Error loading 2FA status:', error)
    }
  }

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/users/sessions')
      if (response.ok) {
        const data = await response.json()
        console.log('Sessions loaded:', data)
        // Filtrer les sessions en double avant de les définir
        const uniqueSessions = getUniqueSessions(data.sessions || [])
        setSessions(uniqueSessions)
      } else {
        const error = await response.json()
        console.error('Error loading sessions response:', error)
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
      toast.error("Erreur lors du chargement des sessions")
    }
  }

  // Fonction pour filtrer les sessions en double
  const getUniqueSessions = (sessions: Session[]): Session[] => {
    const seen = new Set<string>()
    return sessions.filter(session => {
      // Créer un identifiant unique pour chaque session
      const key = `${session.id}_${session.createdAt}_${session.device.browser}_${session.device.os}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas")
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      if (response.ok) {
        toast.success("Mot de passe modifié avec succès!")
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la modification du mot de passe")
    } finally {
      setLoading(false)
    }
  }

  const handleSetup2FA = async () => {
    setTwoFactorLoading(true)
    try {
      const response = await fetch('/api/users/two-factor')
      if (response.ok) {
        const data = await response.json()
        setTwoFactorSecret(data.secret)
        setQrCode(data.qrCode)
        setShow2FASetup(true)
      }
    } catch (error) {
      toast.error("Erreur lors de la configuration du 2FA")
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleVerify2FA = async () => {
    if (!verificationToken) {
      toast.error("Veuillez entrer le code de vérification")
      return
    }

    setTwoFactorLoading(true)
    try {
      const response = await fetch('/api/users/two-factor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: "verify",
          token: verificationToken
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.valid) {
          toast.success("Code vérifié avec succès!")
          setShow2FASetup(false)
          setVerificationToken("")
          
          // Activer le 2FA
          await fetch('/api/users/two-factor', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: "toggle",
              enabled: true
            })
          })
          
          setTwoFactorEnabled(true)
          await update()
        } else {
          toast.error("Code invalide")
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Échec de la vérification')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la vérification")
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleToggle2FA = async (enabled: boolean) => {
    setTwoFactorLoading(true)
    try {
      const response = await fetch('/api/users/two-factor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: "toggle",
          enabled
        })
      })

      if (response.ok) {
        setTwoFactorEnabled(enabled)
        toast.success(`Authentification à deux facteurs ${enabled ? 'activée' : 'désactivée'}!`)
        await update()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update 2FA')
      }
    } catch (error) {
      console.error('Error updating 2FA:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour")
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleTerminateSession = async (sessionId: string) => {
    if (!sessionId) {
      toast.error("ID de session manquant")
      return
    }

    setTerminatingSession(sessionId)
    console.log("Attempting to terminate session:", sessionId)

    try {
      const response = await fetch('/api/users/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      })

      const data = await response.json()
      console.log("Terminate session response:", data)

      if (response.ok) {
        toast.success("Session terminée avec succès")
        // Recharger les sessions
        await loadSessions()
      } else {
        throw new Error(data.error || `Erreur ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error terminating session:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la fermeture de session")
    } finally {
      setTerminatingSession(null)
    }
  }

  const handleTerminateAllSessions = async () => {
    if (!confirm("Êtes-vous sûr de vouloir déconnecter toutes les autres sessions ?")) {
      return
    }

    setTerminatingAll(true)
    console.log("Terminating all other sessions")

    try {
      const response = await fetch('/api/users/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ terminateAll: true })
      })

      const data = await response.json()
      console.log("Terminate all sessions response:", data)

      if (response.ok) {
        toast.success(`Toutes les sessions ont été terminées (${data.terminatedCount || 0} sessions)`)
        await loadSessions()
      } else {
        throw new Error(data.error || `Erreur ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error terminating all sessions:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la fermeture des sessions")
    } finally {
      setTerminatingAll(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Secret copié dans le presse-papier")
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <PhoneIcon className="h-4 w-4" />
      case 'tablet':
      case 'tablette':
        return <Tablet className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const formatDate = (date: Date | string) => {
    try {
      const d = new Date(date)
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return "Date inconnue"
    }
  }

  const getTimeAgo = (date: Date | string) => {
    try {
      const now = new Date()
      const then = new Date(date)
      const diffMs = now.getTime() - then.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return "À l'instant"
      if (diffMins < 60) return `Il y a ${diffMins} min`
      if (diffHours < 24) return `Il y a ${diffHours} h`
      if (diffDays < 7) return `Il y a ${diffDays} j`
      return formatDate(then)
    } catch (error) {
      return "Temps inconnu"
    }
  }

  const refreshSessions = async () => {
    await loadSessions()
    toast.success("Sessions rafraîchies")
  }

  // Calculer le nombre de sessions pouvant être déconnectées
  const terminableSessionsCount = sessions.filter(s => s.active && !s.current).length

  return (
    <div className="space-y-6">
      {/* Changement de mot de passe */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-500" />
            Changer le Mot de Passe
          </CardTitle>
          <CardDescription>
            Assurez-vous que votre compte utilise un mot de passe fort et sécurisé
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="current-password" className="text-sm font-medium">
                Mot de Passe Actuel
              </Label>
              <Input
                id="current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="border-slate-200 dark:border-slate-700 focus:border-blue-500"
                placeholder="Entrez votre mot de passe actuel"
                required
                minLength={8}
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="new-password" className="text-sm font-medium">
                  Nouveau Mot de Passe
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="border-slate-200 dark:border-slate-700 focus:border-blue-500"
                  placeholder="Créez un nouveau mot de passe"
                  required
                  minLength={8}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Minimum 8 caractères, incluant majuscules, minuscules et chiffres
                </p>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirmer le Mot de Passe
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="border-slate-200 dark:border-slate-700 focus:border-blue-500"
                  placeholder="Confirmez le nouveau mot de passe"
                  required
                  minLength={8}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Mettre à jour le mot de passe
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordForm({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: ""
                })}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Effacer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Authentification à deux facteurs */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Authentification à Deux Facteurs
          </CardTitle>
          <CardDescription>
            Ajoutez une couche de sécurité supplémentaire à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  2FA par Application
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Utilisez Google Authenticator ou Authy
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                variant={twoFactorEnabled ? "default" : "outline"} 
                className={cn(
                  "transition-colors",
                  twoFactorEnabled 
                    ? "bg-green-500 hover:bg-green-600 text-white" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                )}
              >
                {twoFactorEnabled ? "Activé" : "Désactivé"}
              </Badge>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={(enabled) => {
                  if (enabled && !twoFactorSecret) {
                    handleSetup2FA()
                  } else {
                    handleToggle2FA(enabled)
                  }
                }}
                disabled={twoFactorLoading}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
          </div>
          
          {twoFactorEnabled && (
            <Alert className="mt-4 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                L'authentification à deux facteurs est activée sur votre compte.
                Vous devrez entrer un code de vérification à chaque connexion.
              </AlertDescription>
            </Alert>
          )}

          {!twoFactorEnabled && twoFactorSecret && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Configuration 2FA en attente
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Vous avez généré un secret 2FA mais ne l'avez pas encore activé.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShow2FASetup(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Terminer la configuration
                </Button>
                <Button
                  onClick={() => {
                    setTwoFactorSecret("")
                    setQrCode("")
                  }}
                  size="sm"
                  variant="outline"
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          <div className="mt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Pour une sécurité optimale, activez l'authentification à deux facteurs.
            </p>
            <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Protège votre compte même si votre mot de passe est compromis</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Nécessite votre téléphone en plus de votre mot de passe</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Gratuit et facile à configurer</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de configuration 2FA */}
      <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              Configuration 2FA
            </DialogTitle>
            <DialogDescription>
              Suivez ces étapes pour activer l'authentification à deux facteurs
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {qrCode ? (
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900 dark:text-slate-100">
                  Étape 1: Scannez le QR Code
                </h4>
                <div className="flex flex-col items-center">
                  <img 
                    src={qrCode} 
                    alt="QR Code 2FA" 
                    className="w-48 h-48 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-white"
                  />
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 text-center">
                    Utilisez Google Authenticator, Authy ou une application similaire
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Ou entrez manuellement ce code:
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={twoFactorSecret}
                      readOnly
                      className="font-mono text-sm bg-slate-50 dark:bg-slate-800"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(twoFactorSecret)}
                      className="flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Copiez ce code dans votre application d'authentification
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400">
                  Génération du secret 2FA...
                </p>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-medium text-slate-900 dark:text-slate-100">
                Étape 2: Vérifiez le code
              </h4>
              <div className="space-y-2">
                <Label htmlFor="verification-token" className="text-sm font-medium">
                  Code à 6 chiffres
                </Label>
                <Input
                  id="verification-token"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-widest"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Entrez le code à 6 chiffres affiché dans votre application d'authentification
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShow2FASetup(false)
                setVerificationToken("")
              }}
              disabled={twoFactorLoading}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleVerify2FA}
              disabled={twoFactorLoading || verificationToken.length !== 6}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {twoFactorLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Vérification...
                </>
              ) : (
                "Vérifier et activer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes (si 2FA activé) */}
      {twoFactorEnabled && <BackupCodes />}

      {/* Sessions actives */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-500" />
                Sessions Actives
              </CardTitle>
              <CardDescription>
                Gérez vos sessions connectées sur différents appareils
                {sessions.length > 0 && (
                  <div className="text-xs text-slate-500 mt-1">
                    {sessions.length} session(s) • {terminableSessionsCount} pouvant être déconnectée(s)
                  </div>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshSessions}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTerminateAllSessions}
                disabled={terminableSessionsCount === 0 || terminatingAll}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                {terminatingAll ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Tout déconnecter ({terminableSessionsCount})
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="relative">
                <Monitor className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-pulse">
                    <XCircle className="h-8 w-8 text-slate-400" />
                  </div>
                </div>
              </div>  
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Aucune session active
              </h4>
              <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Vous n'êtes actuellement connecté sur aucun appareil.
                Les sessions apparaîtront ici lorsque vous vous connecterez.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {sessions.map((session, index) => {
                  const uniqueKey = `session_${session.id}_${index}`
                  const isCurrent = session.current
                  const canTerminate = !isCurrent && session.active
                  const isTerminating = terminatingSession === session.id
                  
                  return (
                    <div
                      key={uniqueKey}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-sm",
                        isCurrent 
                          ? "border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20" 
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-lg",
                          isCurrent
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        )}>
                          {getDeviceIcon(session.device.device)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {session.device.browser} sur {session.device.os}
                            </p>
                            {isCurrent && (
                              <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 text-xs px-2 py-0.5">
                                Actuelle
                              </Badge>
                            )}
                            {!session.active && (
                              <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                              {getDeviceIcon(session.device.device)}
                              <span className="capitalize font-medium">{session.device.device}</span>
                            </div>
                            
                            {session.location?.country && session.location.country !== "Unknown" && (
                              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                <Globe className="h-3 w-3" />
                                <span>
                                  {session.location.city && `${session.location.city}, `}
                                  {session.location.country}
                                </span>
                              </div>
                            )}
                            
                            {session.device.ip && session.device.ip !== "Unknown" && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                  IP: {session.device.ip}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-500">
                            <span className="flex items-center gap-1">
                              <span className="text-slate-400 dark:text-slate-600">🕐</span>
                              Connecté le {formatDate(session.createdAt)}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="flex items-center gap-1">
                              <span className="text-slate-400 dark:text-slate-600">⏱️</span>
                              Dernière activité: {getTimeAgo(session.lastActive)}
                            </span>
                          </div>
                          
                          {session.id && (
                            <div className="mt-1">
                              <span className="text-xs text-slate-400 dark:text-slate-600 font-mono">
                                ID: {session.id.substring(0, 8)}...
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {canTerminate && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleTerminateSession(session.id)}
                          disabled={isTerminating}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 ml-2 flex-shrink-0 min-w-[100px]"
                        >
                          {isTerminating ? (
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          ) : (
                            <>
                              <LogOut className="h-4 w-4 mr-2" />
                              Déconnecter
                            </>
                          )}
                        </Button>
                      )}
                      
                      {!canTerminate && !isCurrent && (
                        <span className="text-xs text-slate-500 italic px-3">
                          Déjà déconnecté
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Statistiques des sessions */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {sessions.length}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Sessions</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {sessions.filter(s => s.current).length}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Actuelle</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {sessions.filter(s => s.active).length}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">Actives</div>
                  </div>
                  <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {new Set(sessions.map(s => s.device.device)).size}
                    </div>
                    <div className="text-sm text-amber-600 dark:text-amber-400">Types d'appareils</div>
                  </div>
                </div>
              </div>

              {/* Conseils de sécurité */}
              <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Conseils de sécurité
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Déconnectez-vous toujours des appareils publics ou partagés</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Activez le 2FA pour une protection supplémentaire de votre compte</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Utilisez un mot de passe unique et fort pour chaque compte</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Vérifiez régulièrement vos sessions actives et déconnectez les appareils inconnus</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}