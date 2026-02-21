// components/settings/backup-codes.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Copy, RefreshCw, Printer, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

export function BackupCodes() {
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)

  const generateBackupCodes = async () => {
    setGenerating(true)
    try {
      // Générer 10 codes de secours uniques
      const codes = Array.from({ length: 10 }, () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase() + 
               Math.random().toString(36).substring(2, 8).toUpperCase()
      })
      
      setBackupCodes(codes)
      
      // Enregistrer les codes côté serveur
      const response = await fetch('/api/users/backup-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codes })
      })

      if (!response.ok) {
        throw new Error('Failed to save backup codes')
      }

      toast.success("Codes de secours générés avec succès")

    } catch (error) {
      console.error('Error generating backup codes:', error)
      toast.error("Erreur lors de la génération des codes")
    } finally {
      setGenerating(false)
    }
  }

  const downloadCodes = () => {
    if (backupCodes.length === 0) return
    
    const content = `CODES DE SECOURS NRBTALENTS\n\n` +
                    `Ces codes vous permettent d'accéder à votre compte si vous perdez l'accès à votre application d'authentification.\n\n` +
                    `${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\n` +
                    `⚠️ IMPORTANT :\n` +
                    `- Conservez ces codes en lieu sûr\n` +
                    `- Ne les partagez avec personne\n` +
                    `- Chaque code ne peut être utilisé qu'une seule fois\n` +
                    `- Générez de nouveaux codes si vous les utilisez tous`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nrbtalents-backup-codes-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyCodes = () => {
    if (backupCodes.length === 0) return
    
    const content = backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')
    navigator.clipboard.writeText(content)
    toast.success("Codes copiés dans le presse-papier")
  }

  const printCodes = () => {
    if (backupCodes.length === 0) return
    
    const printContent = `
      <html>
        <head>
          <title>Codes de secours NRBTalents</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e40af; }
            .codes { margin: 20px 0; font-family: monospace; font-size: 14px; }
            .warning { color: #dc2626; margin: 20px 0; padding: 10px; border: 1px solid #fecaca; background: #fef2f2; }
          </style>
        </head>
        <body>
          <h1>📋 Codes de secours NRBTalents</h1>
          <p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
          
          <div class="codes">
            ${backupCodes.map((code, index) => `<div>${index + 1}. ${code}</div>`).join('')}
          </div>
          
          <div class="warning">
            <h3>⚠️ IMPORTANT :</h3>
            <ul>
              <li>Conservez ces codes en lieu sûr</li>
              <li>Ne les partagez avec personne</li>
              <li>Chaque code ne peut être utilisé qu'une seule fois</li>
              <li>Générez de nouveaux codes si vous les utilisez tous</li>
            </ul>
          </div>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    printWindow?.document.write(printContent)
    printWindow?.document.close()
    printWindow?.print()
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-600">
          <AlertTriangle className="h-5 w-5" />
          Codes de secours 2FA
        </CardTitle>
        <CardDescription className="text-amber-600/80">
          Utilisez ces codes pour accéder à votre compte si vous perdez l'accès à votre application d'authentification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {backupCodes.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-amber-300 dark:text-amber-700 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Aucun code de secours généré. Générez des codes maintenant.
            </p>
            <Button
              onClick={generateBackupCodes}
              disabled={generating}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Génération...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Générer des codes de secours
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center"
                >
                  <div className="text-xs text-slate-500 dark:text-slate-500 mb-1">
                    Code #{index + 1}
                  </div>
                  <div className="font-mono font-bold text-slate-900 dark:text-slate-100 tracking-wider">
                    {code}
                  </div>
                  <Badge 
                    variant="outline" 
                    className="mt-2 text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                  >
                    Non utilisé
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={downloadCodes}
                variant="outline"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
              <Button
                onClick={copyCodes}
                variant="outline"
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copier
              </Button>
              <Button
                onClick={printCodes}
                variant="outline"
                className="flex-1"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {backupCodes.length} codes disponibles
              </p>
              <Button
                onClick={generateBackupCodes}
                variant="outline"
                size="sm"
                disabled={generating}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Régénérer
              </Button>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                ⚠️ Instructions importantes
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• Conservez ces codes en lieu sûr (hors ligne)</li>
                <li>• Chaque code ne peut être utilisé qu'une seule fois</li>
                <li>• Après utilisation, le code devient invalide</li>
                <li>• Régénérez de nouveaux codes si vous en utilisez plusieurs</li>
                <li>• Ne partagez jamais ces codes avec qui que ce soit</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}