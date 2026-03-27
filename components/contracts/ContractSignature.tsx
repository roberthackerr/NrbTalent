// components/contracts/ContractSignature.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, CheckCircle, XCircle, Edit, Clock, UserCheck } from "lucide-react"

interface ContractSignatureProps {
  contractId: string
  title: string
  currentUserRole: "client" | "freelancer"
  onSigned: () => void
  onRequestChanges: (changes: string) => void
  isSigned: boolean          // L'utilisateur courant a-t-il signé ?
  otherPartySigned: boolean  // L'autre partie a-t-elle signé ?
}

export function ContractSignature({
  contractId,
  title,
  currentUserRole,
  onSigned,
  onRequestChanges,
  isSigned,
  otherPartySigned
}: ContractSignatureProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showChangesForm, setShowChangesForm] = useState(false)
  const [changesRequested, setChangesRequested] = useState("")
  const [error, setError] = useState("")

  const handleSign = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign" })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la signature")
      }

      onSigned()
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestChanges = async () => {
    if (!changesRequested.trim()) {
      setError("Veuillez décrire les modifications demandées")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "request_changes",
          changesRequested 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la demande de modifications")
      }

      onRequestChanges(changesRequested)
      setShowChangesForm(false)
      setChangesRequested("")
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Déterminer le nom de l'autre partie pour l'affichage
  const otherPartyName = currentUserRole === "client" ? "Freelancer" : "Client"

  return (
    <Card className="border-purple-200 dark:border-purple-800 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <CheckCircle className="h-5 w-5 text-purple-600" />
          Signature du Contrat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Statut de l'autre partie */}
          <div className={`p-4 rounded-xl border transition-all ${
            otherPartySigned 
              ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" 
              : "bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className={`h-4 w-4 ${
                otherPartySigned ? "text-emerald-600" : "text-amber-600"
              }`} />
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {otherPartyName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {otherPartySigned ? (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Signé
                  </span>
                  <span className="text-xs text-emerald-600 ml-auto">
                    ✅ Contrat signé par {otherPartyName.toLowerCase()}
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    En attente
                  </span>
                  <span className="text-xs text-amber-600 ml-auto">
                    ⏳ En attente de signature
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Statut de l'utilisateur courant */}
          <div className={`p-4 rounded-xl border transition-all ${
            isSigned 
              ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" 
              : "bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className={`h-4 w-4 ${
                isSigned ? "text-emerald-600" : "text-amber-600"
              }`} />
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Vous ({currentUserRole === "client" ? "Client" : "Freelancer"})
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isSigned ? (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Signé
                  </span>
                  <span className="text-xs text-emerald-600 ml-auto">
                    ✅ Vous avez signé ce contrat
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    En attente
                  </span>
                  <span className="text-xs text-amber-600 ml-auto">
                    ⏳ En attente de votre signature
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Message spécial quand l'autre a signé mais pas vous */}
        {otherPartySigned && !isSigned && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">
                  {otherPartyName} a déjà signé !
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  Il ne vous reste plus qu'à signer pour finaliser le contrat.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Message quand vous avez signé mais pas l'autre */}
        {isSigned && !otherPartySigned && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800 dark:text-blue-300">
                  Vous avez signé !
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  En attente de la signature de {otherPartyName.toLowerCase()} pour finaliser le contrat.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Actions */}
        {!isSigned && (
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSign}
              disabled={isLoading}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signature en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Signer le Contrat
                </>
              )}
            </Button>

            {!showChangesForm ? (
              <Button
                onClick={() => setShowChangesForm(true)}
                variant="outline"
                className="border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30"
              >
                <Edit className="h-4 w-4 mr-2" />
                Demander des Modifications
              </Button>
            ) : (
              <Button
                onClick={() => setShowChangesForm(false)}
                variant="outline"
                className="border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Annuler
              </Button>
            )}
          </div>
        )}

        {isSigned && !otherPartySigned && (
          <div className="text-center py-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="h-5 w-5 mx-auto mb-2" />
            <p className="font-medium">Vous avez signé ce contrat</p>
            <p className="text-sm mt-1">En attente de la signature de {otherPartyName.toLowerCase()}</p>
          </div>
        )}

        {isSigned && otherPartySigned && (
          <div className="text-center py-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="h-5 w-5 mx-auto mb-2" />
            <p className="font-medium">Contrat complètement signé !</p>
            <p className="text-sm mt-1">Les deux parties ont signé le contrat</p>
          </div>
        )}

        {/* Changes Request Form */}
        {showChangesForm && (
          <div className="space-y-3 p-4 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
            <p className="font-medium text-purple-700 dark:text-purple-300">
              Demander des modifications
            </p>
            <Textarea
              placeholder="Décrivez les modifications que vous souhaitez apporter au contrat..."
              value={changesRequested}
              onChange={(e) => setChangesRequested(e.target.value)}
              rows={4}
              className="border-purple-200 dark:border-purple-800 focus:border-purple-500"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleRequestChanges}
                disabled={isLoading || !changesRequested.trim()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  "Envoyer la Demande"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}