// components/settings/account-deletion-section.tsx
"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Trash2, AlertTriangle, CheckCircle2, X } from "lucide-react"

export function AccountDeletionSection() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const userEmail = session?.user?.email || ""
  const requiredText = `supprimer mon compte ${userEmail}`

  const handleDeleteAccount = async () => {
    if (confirmText !== requiredText) {
      toast.error("Veuillez taper exactement le texte demandé")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/users/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast.success("Votre compte a été supprimé avec succès")
        
        // Déconnexion et redirection
        await signOut({ redirect: false })
        router.push("/")
        
        // Recharger la page pour s'assurer que tout est nettoyé
        setTimeout(() => {
          window.location.href = "/"
        }, 1000)
        
      } else {
        const error = await response.json()
        toast.error(error.error || "Erreur lors de la suppression du compte")
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error("Erreur lors de la suppression du compte")
    } finally {
      setLoading(false)
      setIsDialogOpen(false)
    }
  }

  return (
    <Card className="border-red-200 dark:border-red-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <Trash2 className="h-5 w-5" />
          Suppression définitive du compte
        </CardTitle>
        <CardDescription className="text-red-600/80">
          Cette action est irréversible. Toutes vos données seront définitivement supprimées.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avertissement */}
        <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Attention :</strong> La suppression de votre compte entraînera la perte définitive de :
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Votre profil et toutes vos informations</li>
              <li>Vos compétences et votre portfolio</li>
              <li>Vos projets en cours et historiques</li>
              <li>Vos messages et conversations</li>
              <li>Vos préférences et paramètres</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Dialog de confirmation */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full sm:w-auto">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer définitivement mon compte
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Confirmer la suppression définitive
              </DialogTitle>
              <DialogDescription className="text-red-600/80">
                Cette action ne peut pas être annulée. Toutes vos données seront définitivement perdues.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                  Pour confirmer, veuillez taper exactement :
                </p>
                <p className="text-sm bg-white dark:bg-slate-800 p-2 rounded border font-mono">
                  supprimer mon compte {userEmail}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-delete" className="text-sm font-medium">
                  Confirmation
                </Label>
                <Input
                  id="confirm-delete"
                  placeholder={`Tapez "supprimer mon compte ${userEmail}"`}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              {/* Indicateur de correspondance */}
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
                    ? "Texte correspondant" 
                    : "Le texte ne correspond pas"
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
                Annuler
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
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer définitivement
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Informations supplémentaires */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Considérations importantes :</strong>
          </p>
          <ul className="space-y-1 list-disc list-inside">
            <li>La suppression prend effet immédiatement</li>
            <li>Vous perdrez l'accès à tous vos projets en cours</li>
            <li>Vos données ne pourront pas être récupérées</li>
            <li>Vous devrez créer un nouveau compte pour réutiliser la plateforme</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}