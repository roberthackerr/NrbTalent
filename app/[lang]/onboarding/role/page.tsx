"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession, getSession, signOut } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { User, Building, Rocket, CheckCircle2, Loader2, RefreshCw } from "lucide-react"

export default function RoleSelectionPage() {
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"freelance" | "client" | null>(null)
  const { data: session, status, update } = useSession()
  const router = useRouter()

  // Vérifier l'état de l'onboarding
  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    const onboardingRoleCompleted = (session.user as any)?.onboardingRoleCompleted
    
    console.log("🔍 Vérification onboarding:", {
      onboardingCompleted,
      role: (session.user as any)?.role,
      status
    })

    // Si l'onboarding est complété, rediriger vers la home
    if (onboardingRoleCompleted) {
      console.log("✅ Onboarding complété, redirection vers /")
      router.push("/")
    }
  }, [session, status, router])

  // Sélectionner automatiquement le rôle actuel
  useEffect(() => {
    if (session?.user) {
      const currentRole = (session.user as any)?.role
      if (currentRole && !selectedRole) {
        setSelectedRole(currentRole)
      }
    }
  }, [session, selectedRole])

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      toast.error("Veuillez sélectionner un rôle")
      return
    }

    setLoading(true)
    try {
      console.log("🔄 Début mise à jour du rôle:", selectedRole)

      // 1. Mettre à jour dans la base de données
      const response = await fetch("/api/users/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: selectedRole,
          onboardingCompleted: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la mise à jour")
      }

      const result = await response.json()
      console.log("✅ API response:", result)

      // 2. FORCER la mise à jour de la session avec reload
      console.log("🔄 Mise à jour de la session...")
      
      // Méthode 1: update avec les nouvelles données
      await update({
        role: selectedRole,
        onboardingCompleted: true,
      })

      // Méthode 2: Recharger la session depuis le serveur
      console.log("🔄 Rechargement de la session...")
      const newSession = await getSession()
      console.log("✅ Nouvelle session:", newSession)

      // Méthode 3: Petit délai pour laisser NextAuth se synchroniser
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Méthode 4: Vérifier que la session est bien mise à jour
      const finalSession = await getSession()
      console.log("🎯 Session finale:", finalSession)

      if ((finalSession?.user as any)?.onboardingCompleted) {
        toast.success(`Bienvenue en tant que ${selectedRole === "freelance" ? "freelance" : "client"} !`)
        
        // Redirection avec timeout pour être sûr
        setTimeout(() => {
          router.push("/onboarding")
        }, 500)
      } else {
        // Si la session n'est pas mise à jour, forcer un rechargement complet
        console.warn("Session non mise à jour, rechargement de la page")
        window.location.reload()
      }

    } catch (error) {
      console.error("❌ Erreur:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour")
      
      // En cas d'erreur, recharger la session
      await getSession()
    } finally {
      setLoading(false)
    }
  }

  // Fonction de débogage pour forcer le rafraîchissement
  const handleForceRefresh = async () => {
    console.log("🔄 Forcer le rafraîchissement de la session")
    await getSession()
    const newSession = await getSession()
    console.log("🔄 Session après refresh:", newSession)
    toast.info("Session rafraîchie")
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Chargement de votre session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Redirection vers la connexion...</p>
        </div>
      </div>
    )
  }

  const currentRole = (session.user as any)?.role
  const onboardingCompleted = (session.user as any)?.onboardingCompleted

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        
        {/* En-tête avec état de debug */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-200 mb-6">
            <Rocket className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              {currentRole ? "Confirmez votre rôle" : "Choisissez votre rôle"}
            </span>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Bienvenue {session.user?.name || "sur NRBTalents"} !
          </h1>
          <p className="text-xl text-muted-foreground">
            {currentRole 
              ? `Votre rôle actuel est : ${currentRole === "freelance" ? "Freelance" : "Client"}`
              : "Choisissez comment vous voulez utiliser la plateforme"
            }
          </p>

          {/* Debug info */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Debug:</strong> Role: {currentRole || "non défini"} | 
                Onboarding: {onboardingCompleted ? "complété" : "non complété"} |
                <Button 
                  variant="link" 
                  className="h-auto p-0 ml-2 text-xs"
                  onClick={handleForceRefresh}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Rafraîchir
                </Button>
              </p>
            </div>
          )}
        </div>

        {/* Le reste de votre JSX reste identique */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Carte Freelance */}
          <Card 
            className={`cursor-pointer transition-all duration-300 border-2 ${
              selectedRole === "freelance" || currentRole === "freelance"
                ? "border-blue-500 shadow-lg scale-[1.02] bg-blue-50/50" 
                : "border-gray-200 hover:border-blue-300 hover:shadow-md bg-white"
            }`}
            onClick={() => setSelectedRole("freelance")}
          >
            <CardHeader className="text-center pb-4">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center transition-colors ${
                selectedRole === "freelance" || currentRole === "freelance"
                  ? "bg-blue-100 ring-4 ring-blue-200" 
                  : "bg-gray-100"
              }`}>
                <User className={`h-8 w-8 transition-colors ${
                  selectedRole === "freelance" || currentRole === "freelance" ? "text-blue-600" : "text-gray-600"
                }`} />
              </div>
              <CardTitle className="flex items-center justify-center gap-2">
                Je suis Freelance
                {(selectedRole === "freelance" || currentRole === "freelance") && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
              </CardTitle>
              <CardDescription className="text-base">
                Je cherche des projets et veux développer mon activité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Trouvez des projets qui vous correspondent</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Développez votre portfolio</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Recevez des paiements sécurisés</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Carte Client */}
          <Card 
            className={`cursor-pointer transition-all duration-300 border-2 ${
              selectedRole === "client" || currentRole === "client"
                ? "border-purple-500 shadow-lg scale-[1.02] bg-purple-50/50" 
                : "border-gray-200 hover:border-purple-300 hover:shadow-md bg-white"
            }`}
            onClick={() => setSelectedRole("client")}
          >
            <CardHeader className="text-center pb-4">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center transition-colors ${
                selectedRole === "client" || currentRole === "client"
                  ? "bg-purple-100 ring-4 ring-purple-200" 
                  : "bg-gray-100"
              }`}>
                <Building className={`h-8 w-8 transition-colors ${
                  selectedRole === "client" || currentRole === "client" ? "text-purple-600" : "text-gray-600"
                }`} />
              </div>
              <CardTitle className="flex items-center justify-center gap-2">
                Je suis Client
                {(selectedRole === "client" || currentRole === "client") && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
              </CardTitle>
              <CardDescription className="text-base">
                Je cherche des talents pour mes projets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Accédez à des milliers de freelances</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Trouvez le talent parfait</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Gérez vos projets facilement</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 h-auto text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={handleRoleSelection}
            disabled={loading || !selectedRole}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Mise à jour en cours...
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5 mr-2" />
                {currentRole ? `Confirmer comme ${selectedRole === "freelance" ? "Freelance" : "Client"}` : `Commencer en tant que ${selectedRole === "freelance" ? "Freelance" : "Client"}`}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}