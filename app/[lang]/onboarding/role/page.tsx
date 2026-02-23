// app/[lang]/onboarding/role/page.tsx
'use client'

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession, getSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { User, Building, Rocket, CheckCircle2, Loader2 } from "lucide-react"
import LanguageSwitcher from "@/components/common/LanguageSwitcher"
import type { Locale } from '@/lib/i18n/config'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'

export default function RoleSelectionPage() {
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"freelance" | "client" | null>(null)
  const [dict, setDict] = useState<any>(null)
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const params = useParams()
  const lang = params.lang as Locale

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  // Vérifier l'état de l'onboarding
  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push(`/${lang}/auth/signin`)
      return
    }

    const onboardingRoleCompleted = (session.user as any)?.onboardingRoleCompleted

    if (onboardingRoleCompleted) {
      console.log("✅ Onboarding role completed, redirection vers /onboarding")
      router.push(`/${lang}/onboarding`)
    }
  }, [session, status, router, lang])

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
      toast.error(dict?.roleSelection?.errors?.selectRole || "Please select a role")
      return
    }

    setLoading(true)
    try {
      // Appeler l'API avec le paramètre de langue
      const response = await fetch(`/api/users/update-role?lang=${lang}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: selectedRole,
          onboardingRoleCompleted: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error updating role")
      }

      // Mettre à jour la session
      await update({
        role: selectedRole,
        onboardingRoleCompleted: true,
      })
      router.push(`/${lang}/onboarding`)
      // Attendre que la session soit mise à jour
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Vérifier la session
      const newSession = await getSession()
      
      if ((newSession?.user as any)?.onboardingRoleCompleted) {
        toast.success(
          selectedRole === "freelance" 
            ? dict?.roleSelection?.success?.freelance || "Welcome as a freelancer!"
            : dict?.roleSelection?.success?.client || "Welcome as a client!"
        )
        
        router.push(`/${lang}/onboarding`)
      } else {
        window.location.reload()
      }

    } catch (error) {
      console.error("❌ Erreur:", error)
      toast.error(error instanceof Error ? error.message : dict?.roleSelection?.errors?.update || "Error updating role")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || !dict) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">{dict?.common?.loading || "Loading..."}</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">{dict?.roleSelection?.redirecting || "Redirecting..."}</p>
        </div>
      </div>
    )
  }

  const currentRole = (session.user as any)?.role
  const roleDict = dict.roleSelection

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher lang={lang} />
      </div>

      <div className="w-full max-w-2xl">
        
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-200 mb-6">
            <Rocket className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              {currentRole ? roleDict?.confirmRole : roleDict?.chooseRole}
            </span>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            {roleDict?.welcome?.replace('{{name}}', session.user?.name || '')}
          </h1>
          <p className="text-xl text-muted-foreground">
            {currentRole 
              ? roleDict?.currentRole?.replace('{{role}}', currentRole === "freelance" ? roleDict?.freelance : roleDict?.client)
              : roleDict?.subtitle
            }
          </p>
        </div>

        {/* Cartes de sélection */}
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
                {roleDict?.freelance}
                {(selectedRole === "freelance" || currentRole === "freelance") && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
              </CardTitle>
              <CardDescription className="text-base">
                {roleDict?.freelanceDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {roleDict?.freelanceBenefits?.map((benefit: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
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
                {roleDict?.client}
                {(selectedRole === "client" || currentRole === "client") && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
              </CardTitle>
              <CardDescription className="text-base">
                {roleDict?.clientDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {roleDict?.clientBenefits?.map((benefit: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
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
                {roleDict?.updating}
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5 mr-2" />
                {currentRole 
                  ? roleDict?.confirm + " " + (selectedRole === "freelance" ? roleDict?.freelance : roleDict?.client)
                  : roleDict?.start + " " + (selectedRole === "freelance" ? roleDict?.freelance : roleDict?.client)
                }
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}