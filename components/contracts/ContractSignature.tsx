// components/contracts/ContractSignature.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, CheckCircle, XCircle, Edit } from "lucide-react"

interface ContractSignatureProps {
  contractId: string
  title: string
  currentUserRole: "client" | "freelancer"
  onSigned: () => void
  onRequestChanges: (changes: string) => void
  isSigned: boolean
  otherPartySigned: boolean
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

      if (!response.ok) {
        throw new Error("Erreur lors de la signature")
      }

      onSigned()
    } catch (err) {
      setError("Une erreur est survenue")
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

      if (!response.ok) {
        throw new Error("Erreur lors de la demande de modifications")
      }

      onRequestChanges(changesRequested)
      setShowChangesForm(false)
      setChangesRequested("")
    } catch (err) {
      setError("Une erreur est survenue")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Signature du Contrat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-gray-600">
                  En attente de signature par les deux parties
                </p>
              </div>
              <div className="flex gap-2">
                <div className={`px-3 py-1 rounded-full text-sm ${
                  otherPartySigned 
                    ? "bg-green-100 text-green-800" 
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {otherPartySigned ? "Signé" : "En attente"}
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${
                  isSigned 
                    ? "bg-green-100 text-green-800" 
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {isSigned ? "Signé" : "À signer"}
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className={`p-3 rounded-lg ${
                otherPartySigned 
                  ? "bg-green-50 border border-green-200" 
                  : "bg-gray-100"
              }`}>
                <p className="font-medium">
                  {currentUserRole === "client" ? "Freelancer" : "Client"}
                </p>
                <p className={otherPartySigned ? "text-green-600" : "text-gray-500"}>
                  {otherPartySigned ? "✅ Signé" : "⌛ En attente"}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                isSigned 
                  ? "bg-green-50 border border-green-200" 
                  : "bg-gray-100"
              }`}>
                <p className="font-medium">Vous</p>
                <p className={isSigned ? "text-green-600" : "text-gray-500"}>
                  {isSigned ? "✅ Signé" : "⌛ À signer"}
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!isSigned && (
              <>
                <Button
                  onClick={handleSign}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signature...
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
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Demander des Modifications
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowChangesForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                )}
              </>
            )}

            {isSigned && (
              <div className="flex-1 text-center py-3 bg-green-50 text-green-700 rounded-lg">
                ✅ Vous avez signé ce contrat
              </div>
            )}
          </div>

          {/* Changes Request Form */}
          {showChangesForm && (
            <div className="space-y-3">
              <Textarea
                placeholder="Décrivez les modifications que vous souhaitez apporter au contrat..."
                value={changesRequested}
                onChange={(e) => setChangesRequested(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleRequestChanges}
                  disabled={isLoading || !changesRequested.trim()}
                  className="flex-1"
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
        </div>
      </CardContent>
    </Card>
  )
}