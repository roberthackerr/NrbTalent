"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Shield, Key, Smartphone, LogOut } from "lucide-react"
import { toast } from "sonner"

export function SecurityTab() {
  const [loading, setLoading] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

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

  const handleToggle2FA = async (enabled: boolean) => {
    setLoading(true)
    try {
      const response = await fetch('/api/users/two-factor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled })
      })

      if (response.ok) {
        setTwoFactorEnabled(enabled)
        toast.success(`Authentification à deux facteurs ${enabled ? 'activée' : 'désactivée'}!`)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update 2FA')
      }
    } catch (error) {
      console.error('Error updating 2FA:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour")
      setTwoFactorEnabled(!enabled) // Revert the switch
    } finally {
      setLoading(false)
    }
  }

  const handleTerminateSession = async (sessionId: number) => {
    try {
      const response = await fetch('/api/users/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      })

      if (response.ok) {
        toast.success("Session terminée avec succès")
        // Recharger les sessions ou les retirer de la liste
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to terminate session')
      }
    } catch (error) {
      console.error('Error terminating session:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la fermeture de session")
    }
  }

  const sessions = [
    { id: 1, device: "Chrome sur Windows", location: "Paris, France", lastActive: "Maintenant", current: true },
    { id: 2, device: "Safari sur iPhone", location: "Lyon, France", lastActive: "Il y a 2 heures", current: false },
    { id: 3, device: "Firefox sur MacOS", location: "Marseille, France", lastActive: "Il y a 3 jours", current: false },
  ]

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
                "Mettre à jour le mot de passe"
              )}
            </Button>
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
              <Badge variant={twoFactorEnabled ? "default" : "outline"} className={twoFactorEnabled ? "bg-green-500 hover:bg-green-600" : ""}>
                {twoFactorEnabled ? "Activé" : "Désactivé"}
              </Badge>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={handleToggle2FA}
                disabled={loading}
              />
            </div>
          </div>
          
          {twoFactorEnabled && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Configuration requise
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Scannez le QR code avec votre application d'authentification pour terminer la configuration.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessions actives */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle>Sessions Actives</CardTitle>
          <CardDescription>
            Gérez vos sessions connectées sur différents appareils
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Smartphone className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {session.device}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span>{session.location}</span>
                      <span>•</span>
                      <span>{session.lastActive}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {session.current && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800">
                      Actuelle
                    </Badge>
                  )}
                  {!session.current && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTerminateSession(session.id)}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Déconnecter
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}