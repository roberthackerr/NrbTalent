"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, Clock, Upload, Shield, Mail, Phone, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface VerificationTabProps {
  user: any
}

type VerificationStatus = "none" | "pending" | "approved" | "rejected"

export function VerificationTab({ user }: VerificationTabProps) {
  const [loading, setLoading] = useState(false)
  const [idVerificationStatus, setIdVerificationStatus] = useState<VerificationStatus>("none")

  const verifications = [
    {
      id: "email",
      name: "Email",
      description: user?.email,
      status: "approved" as VerificationStatus,
      icon: Mail,
      required: true
    },
    {
      id: "phone",
      name: "Numéro de Téléphone",
      description: "Non vérifié",
      status: "none" as VerificationStatus,
      icon: Phone,
      required: false
    },
    {
      id: "identity",
      name: "Identité",
      description: "Document d'identité",
      status: idVerificationStatus,
      icon: Shield,
      required: true
    },
    {
      id: "payment",
      name: "Méthode de Paiement",
      description: "Carte bancaire ou compte",
      status: "none" as VerificationStatus,
      icon: CreditCard,
      required: false
    }
  ]

  const handleVerificationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      setIdVerificationStatus("pending")
      toast.success("Documents soumis! Nous les examinerons sous 24-48 heures.")
    } catch (error) {
      toast.error("Erreur lors du téléchargement des documents")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <XCircle className="h-5 w-5 text-slate-400" />
    }
  }

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">Vérifié</Badge>
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800">En attente</Badge>
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800">Rejeté</Badge>
      default:
        return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">Non vérifié</Badge>
    }
  }

  const completedVerifications = verifications.filter(v => v.status === "approved").length
  const verificationProgress = (completedVerifications / verifications.length) * 100

  return (
    <div className="space-y-6">
      {/* Progression de la vérification */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle>Statut de Vérification</CardTitle>
          <CardDescription>
            Complétez les vérifications pour débloquer toutes les fonctionnalités
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Progression globale</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {completedVerifications}/{verifications.length} complétées
              </span>
            </div>
            <Progress value={verificationProgress} className="h-2 bg-slate-200 dark:bg-slate-800" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {verifications.map((verification) => {
              const Icon = verification.icon
              return (
                <div
                  key={verification.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      verification.status === "approved" && "bg-green-100 dark:bg-green-900/30",
                      verification.status === "pending" && "bg-yellow-100 dark:bg-yellow-900/30",
                      verification.status === "rejected" && "bg-red-100 dark:bg-red-900/30",
                      verification.status === "none" && "bg-slate-100 dark:bg-slate-800"
                    )}>
                      <Icon className={cn(
                        "h-4 w-4",
                        verification.status === "approved" && "text-green-600 dark:text-green-400",
                        verification.status === "pending" && "text-yellow-600 dark:text-yellow-400",
                        verification.status === "rejected" && "text-red-600 dark:text-red-400",
                        verification.status === "none" && "text-slate-600 dark:text-slate-400"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {verification.name}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {verification.description}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(verification.status)}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Vérification d'identité */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Vérification d'Identité
          </CardTitle>
          <CardDescription>
            Vérifiez votre identité pour renforcer la confiance et débloquer les fonctionnalités premium
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {idVerificationStatus === "none" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  Pourquoi vérifier votre identité ?
                </h4>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Badge vérifié sur votre profil</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Accès aux projets à haute valeur</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Visibilité accrue dans les résultats de recherche</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confiance accrue des clients</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Documents acceptés
                  </h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="font-medium text-sm">Passeport</p>
                    </div>
                    <div className="text-center p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="font-medium text-sm">Carte d'identité</p>
                    </div>
                    <div className="text-center p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="font-medium text-sm">Permis de conduire</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Télécharger les documents d'identité
                  </label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Formats acceptés : JPG, PNG, PDF (max 5MB par fichier)
                  </p>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={handleVerificationUpload}
                      disabled={loading}
                      className="flex-1"
                    />
                    <Button 
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {loading ? "Téléchargement..." : "Soumettre"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {idVerificationStatus === "pending" && (
            <div className="flex items-center gap-4 p-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10">
              <Clock className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="font-semibold text-yellow-500">Vérification en Cours</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Nous examinons vos documents. Cela prend généralement 24-48 heures.
                </p>
              </div>
            </div>
          )}

          {idVerificationStatus === "approved" && (
            <div className="flex items-center gap-4 p-4 rounded-lg border border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <div>
                <p className="font-semibold text-green-500">Identité Vérifiée</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Votre identité a été vérifiée avec succès ! Votre profil affiche maintenant le badge vérifié.
                </p>
              </div>
            </div>
          )}

          {idVerificationStatus === "rejected" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg border border-red-500/50 bg-red-500/10">
                <XCircle className="h-6 w-6 text-red-500" />
                <div>
                  <p className="font-semibold text-red-500">Vérification Rejetée</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Les documents fournis étaient illisibles ou incomplets. Veuillez télécharger des images plus claires.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setIdVerificationStatus("none")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Réessayer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}