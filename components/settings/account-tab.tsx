// components/settings/account-tab.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Trash2, AlertTriangle, UserX } from "lucide-react"
import { AccountDeletionSection } from "@/components/settings/account-deletion-section"

export function AccountTab() {
  const handleExportData = async () => {
    // Fonction pour exporter les données
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
      } else {
        console.error("Erreur lors de l'export des données")
      }
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Section Export des données */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Export de vos données
          </CardTitle>
          <CardDescription>
            Téléchargez une copie de toutes vos données personnelles stockées sur NRBTalents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Vous pouvez télécharger toutes vos données personnelles au format JSON. 
            Cela inclut votre profil, vos compétences, votre portfolio, vos messages, et toutes vos activités.
          </p>
          <Button onClick={handleExportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter mes données
          </Button>
        </CardContent>
      </Card>

      {/* Section Désactivation temporaire */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <UserX className="h-5 w-5" />
            Désactivation du compte
          </CardTitle>
          <CardDescription className="text-orange-600/80">
            Masquez temporairement votre profil sans supprimer vos données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Que se passe-t-il lors de la désactivation ?
              </p>
              <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1 list-disc list-inside">
                <li>Votre profil ne sera plus visible par les autres utilisateurs</li>
                <li>Vous ne recevrez plus de nouvelles propositions</li>
                <li>Vos projets en cours restent actifs</li>
                <li>Vous pouvez réactiver votre compte à tout moment</li>
                <li>Toutes vos données sont conservées</li>
              </ul>
            </div>
          </div>
          <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
            <UserX className="h-4 w-4 mr-2" />
            Désactiver mon compte temporairement
          </Button>
        </CardContent>
      </Card>

      {/* Section Suppression définitive */}
      <AccountDeletionSection />
    </div>
  )
}