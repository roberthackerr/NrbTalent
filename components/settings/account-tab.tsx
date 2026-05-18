// components/settings/account-tab.tsx (version mise à jour)
"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Download, Trash2, AlertTriangle, CheckCircle2, X, UserX, RefreshCw } from "lucide-react"

interface AccountTabProps {
  dict: any
  lang: string
}

export function AccountTab({ dict, lang }: AccountTabProps) {
  const { data: session, update } = useSession()
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeactivated, setIsDeactivated] = useState(false)

  const userEmail = session?.user?.email || ""
  const requiredText = `${dict?.account?.deleteConfirm?.replace('{email}', userEmail) || `supprimer mon compte ${userEmail}`}`

  // Vérifier le statut du compte
  const checkAccountStatus = async () => {
    try {
      const response = await fetch("/api/users/status")
      if (response.ok) {
        const data = await response.json()
        setIsDeactivated(data.isDeactivated)
      }
    } catch (error) {
      console.error("Error checking status:", error)
    }
  }

  const handleDeactivate = async () => {
    setDeactivating(true)
    try {
      const response = await fetch("/api/users/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (response.ok) {
        toast.success(dict?.account?.deactivateSuccess || "Votre compte a été désactivé")
        setIsDeactivated(true)
        await update()
        setTimeout(() => {
          router.push(`/${lang}`)
        }, 2000)
      } else {
        const error = await response.json()
        toast.error(error.error || dict?.account?.deactivateError || "Erreur lors de la désactivation")
      }
    } catch (error) {
      console.error("Error deactivating account:", error)
      toast.error(dict?.account?.deactivateError || "Erreur lors de la désactivation")
    } finally {
      setDeactivating(false)
    }
  }

  const handleReactivate = async () => {
    setReactivating(true)
    try {
      const response = await fetch("/api/users/deactivate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      })

      if (response.ok) {
        toast.success(dict?.account?.reactivateSuccess || "Votre compte a été réactivé")
        setIsDeactivated(false)
        await update()
      } else {
        const error = await response.json()
        toast.error(error.error || dict?.account?.reactivateError || "Erreur lors de la réactivation")
      }
    } catch (error) {
      console.error("Error reactivating account:", error)
      toast.error(dict?.account?.reactivateError || "Erreur lors de la réactivation")
    } finally {
      setReactivating(false)
    }
  }

  const handleExportData = async () => {
    try {
      const response = await fetch("/api/users/export-data")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = 'mes-donnees-nrbtalents.json'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success("Données exportées avec succès")
      } else {
        toast.error("Erreur lors de l'export des données")
      }
    } catch (error) {
      console.error("Error exporting data:", error)
      toast.error("Erreur lors de l'export des données")
    }
  }

  const handleDeleteAccount = async () => {
    if (confirmText !== requiredText) {
      toast.error(dict?.account?.textMismatch || "Veuillez taper exactement le texte demandé")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/users/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        toast.success(dict?.account?.deleteSuccess || "Votre compte a été supprimé avec succès")
        await signOut({ redirect: false })
        router.push(`/${lang}`)
        setTimeout(() => {
          window.location.href = `/${lang}`
        }, 1000)
      } else {
        const error = await response.json()
        toast.error(error.error || dict?.account?.deleteError || "Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error(dict?.account?.deleteError || "Erreur lors de la suppression")
    } finally {
      setLoading(false)
      setIsDialogOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Section Export des données */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            {dict?.account?.exportTitle || "Export de vos données"}
          </CardTitle>
          <CardDescription>
            {dict?.account?.exportDescription || "Téléchargez une copie de toutes vos données personnelles"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {dict?.account?.exportInfo || "Vous pouvez télécharger toutes vos données au format JSON."}
          </p>
          <Button onClick={handleExportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {dict?.account?.exportButton || "Exporter mes données"}
          </Button>
        </CardContent>
      </Card>

      {/* Section Désactivation temporaire */}
      {!isDeactivated ? (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <UserX className="h-5 w-5" />
              {dict?.account?.deactivateTitle || "Désactivation du compte"}
            </CardTitle>
            <CardDescription className="text-orange-600/80">
              {dict?.account?.deactivateDescription || "Masquez temporairement votre profil sans supprimer vos données"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  {dict?.account?.whatHappens || "Que se passe-t-il lors de la désactivation ?"}
                </p>
                <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1 list-disc list-inside">
                  <li>{dict?.account?.what1 || "Votre profil ne sera plus visible"}</li>
                  <li>{dict?.account?.what2 || "Vous ne recevrez plus de propositions"}</li>
                  <li>{dict?.account?.what3 || "Vos projets en cours restent actifs"}</li>
                  <li>{dict?.account?.what4 || "Vous pouvez réactiver à tout moment"}</li>
                  <li>{dict?.account?.what5 || "Toutes vos données sont conservées"}</li>
                </ul>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleDeactivate}
              disabled={deactivating}
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              {deactivating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {dict?.account?.deactivating || "Désactivation..."}
                </>
              ) : (
                <>
                  <UserX className="h-4 w-4 mr-2" />
                  {dict?.account?.deactivateButton || "Désactiver mon compte"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <RefreshCw className="h-5 w-5" />
              {dict?.account?.reactivateTitle || "Compte désactivé"}
            </CardTitle>
            <CardDescription className="text-green-600/80">
              {dict?.account?.reactivateDescription || "Votre compte est actuellement désactivé"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleReactivate}
              disabled={reactivating}
              className="bg-green-600 hover:bg-green-700"
            >
              {reactivating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {dict?.account?.reactivating || "Réactivation..."}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {dict?.account?.reactivateButton || "Réactiver mon compte"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Section Suppression définitive */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            {dict?.account?.deleteTitle || "Suppression définitive du compte"}
          </CardTitle>
          <CardDescription className="text-red-600/80">
            {dict?.account?.deleteDescription || "Cette action est irréversible. Toutes vos données seront définitivement supprimées."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>{dict?.account?.warning || "Attention :"}</strong> {dict?.account?.warningText || "La suppression de votre compte entraînera la perte définitive de :"}
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>{dict?.account?.loss1 || "Votre profil et toutes vos informations"}</li>
                <li>{dict?.account?.loss2 || "Vos compétences et votre portfolio"}</li>
                <li>{dict?.account?.loss3 || "Vos projets en cours et historiques"}</li>
                <li>{dict?.account?.loss4 || "Vos messages et conversations"}</li>
                <li>{dict?.account?.loss5 || "Vos préférences et paramètres"}</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="h-4 w-4 mr-2" />
                {dict?.account?.deleteButton || "Supprimer définitivement mon compte"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  {dict?.account?.confirmTitle || "Confirmer la suppression définitive"}
                </DialogTitle>
                <DialogDescription className="text-red-600/80">
                  {dict?.account?.confirmDescription || "Cette action ne peut pas être annulée."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                    {dict?.account?.confirmInstruction || "Pour confirmer, veuillez taper exactement :"}
                  </p>
                  <p className="text-sm bg-white dark:bg-slate-800 p-2 rounded border font-mono">
                    {requiredText}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-delete" className="text-sm font-medium">
                    {dict?.account?.confirmation || "Confirmation"}
                  </Label>
                  <Input
                    id="confirm-delete"
                    placeholder={dict?.account?.typeHere?.replace('{text}', requiredText) || `Tapez "${requiredText}"`}
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>

                <div className={`flex items-center gap-2 text-sm ${
                  confirmText === requiredText ? "text-green-600" : "text-red-600"
                }`}>
                  {confirmText === requiredText ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  <span>
                    {confirmText === requiredText 
                      ? (dict?.account?.textMatches || "Texte correspondant")
                      : (dict?.account?.textMismatch || "Le texte ne correspond pas")
                    }
                  </span>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  {dict?.common?.cancel || "Annuler"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={loading || confirmText !== requiredText}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent mr-2" />
                      {dict?.account?.deleting || "Suppression..."}
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      {dict?.account?.confirmDelete || "Supprimer définitivement"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>{dict?.account?.important || "Considérations importantes :"}</strong>
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>{dict?.account?.note1 || "La suppression prend effet immédiatement"}</li>
              <li>{dict?.account?.note2 || "Vous perdrez l'accès à tous vos projets en cours"}</li>
              <li>{dict?.account?.note3 || "Vos données ne pourront pas être récupérées"}</li>
              <li>{dict?.account?.note4 || "Vous devrez créer un nouveau compte pour réutiliser la plateforme"}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}