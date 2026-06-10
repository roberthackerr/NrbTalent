// app/[lang]/onboarding/role/page.tsx
'use client'

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession, getSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { 
  User, 
  Building, 
  Rocket, 
  CheckCircle2, 
  Loader2,
  Sparkles,
  TrendingUp,
  Briefcase,
  Users,
  Target,
  Star,
  ArrowRight
} from "lucide-react"
import LanguageSwitcher from "@/components/common/LanguageSwitcher"
import type { Locale } from '@/lib/i18n/config'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'

export default function RoleSelectionPage() {
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"freelance" | "client" | null>(null)
  const [dict, setDict] = useState<any>(null)
  const [hoveredRole, setHoveredRole] = useState<"freelance" | "client" | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const params = useParams()
  const lang = params.lang as Locale

  // Charger le dictionnaire
  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  // Vérifier et rediriger immédiatement si l'onboarding est déjà complété
  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push(`/${lang}/auth/signin`)
      return
    }

    const onboardingRoleCompleted = (session.user as any)?.onboardingRoleCompleted
    const currentRole = (session.user as any)?.role

    // Redirection immédiate si déjà complété
    if (onboardingRoleCompleted && currentRole && !isRedirecting) {
      setIsRedirecting(true)
      console.log("✅ Onboarding role already completed, redirecting to /onboarding")
      router.push(`/${lang}/onboarding`)
      return
    }

    // Si un rôle existe mais onboarding non complété, le sélectionner
    if (currentRole && !selectedRole && !onboardingRoleCompleted) {
      setSelectedRole(currentRole)
    }
  }, [session, status, router, lang, selectedRole, isRedirecting])

  // Ne pas afficher la page si redirection en cours
  if (isRedirecting || (status === "loading" && !dict)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{dict?.common?.loading || "Loading..."}</p>
        </div>
      </div>
    )
  }

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      toast.error(dict?.roleSelection?.errors?.selectRole || "Please select a role")
      return
    }

    setLoading(true)
    try {
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

      await update({
        role: selectedRole,
        onboardingRoleCompleted: true,
      })

      toast.success(
        selectedRole === "freelance" 
          ? dict?.roleSelection?.success?.freelance || "Welcome as a freelancer!"
          : dict?.roleSelection?.success?.client || "Welcome as a client!"
      )
      
      router.push(`/${lang}/onboarding`)

    } catch (error) {
      console.error("❌ Erreur:", error)
      toast.error(error instanceof Error ? error.message : dict?.roleSelection?.errors?.update || "Error updating role")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || !dict) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!session) {
    return null // Will redirect in useEffect
  }

  const currentRole = (session.user as any)?.role
  const roleDict = dict.roleSelection

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background decoration - hidden on mobile for performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
      </div>

      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher lang={lang} />
      </div>

      <div className="relative container mx-auto px-4 py-8 sm:py-12 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-5xl">
          
          {/* En-tête responsive */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-indigo-200 dark:border-indigo-800 shadow-lg mb-6 sm:mb-8">
              <Rocket className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs sm:text-sm font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                {currentRole ? roleDict?.confirmRole : roleDict?.chooseRole}
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 px-4">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {roleDict?.welcome?.replace('{{name}}', session.user?.name?.split(' ')[0] || '')}
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed px-4">
              {currentRole 
                ? roleDict?.currentRole?.replace('{{role}}', 
                    `${
                      currentRole === "freelance" ? roleDict?.freelance : roleDict?.client
                    }`)
                : roleDict?.subtitle
              }
            </p>
          </div>

          {/* Cartes responsive - Grille adaptative */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {/* Carte Freelance */}
            <div
              className="group relative"
              onMouseEnter={() => setHoveredRole("freelance")}
              onMouseLeave={() => setHoveredRole(null)}
            >
              <div className={`absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-1000 ${
                selectedRole === "freelance" ? "opacity-30" : ""
              }`}></div>
              
              <Card 
                className={`relative cursor-pointer transition-all duration-500 overflow-hidden ${
                  selectedRole === "freelance" || currentRole === "freelance"
                    ? "border-2 border-blue-500 shadow-xl lg:scale-[1.02] bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20" 
                    : "border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg bg-white dark:bg-gray-800"
                }`}
                onClick={() => setSelectedRole("freelance")}
              >
                {hoveredRole === "freelance" && (
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="hidden sm:inline">Popular</span>
                      <span className="sm:hidden">⭐</span>
                    </div>
                  </div>
                )}

                <CardHeader className="text-center pb-2 sm:pb-4">
                  <div className="relative mx-auto mb-4 sm:mb-6">
                    <div className={`absolute inset-0 bg-blue-400 rounded-full blur-xl transition-opacity duration-500 ${
                      selectedRole === "freelance" || hoveredRole === "freelance" ? "opacity-40" : "opacity-0"
                    }`}></div>
                    <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto flex items-center justify-center transition-all duration-500 transform group-hover:scale-110 ${
                      selectedRole === "freelance" || currentRole === "freelance"
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 ring-4 ring-blue-200 dark:ring-blue-900" 
                        : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600"
                    }`}>
                      <User className={`h-10 w-10 sm:h-12 sm:w-12 transition-all duration-500 ${
                        selectedRole === "freelance" || currentRole === "freelance" || hoveredRole === "freelance"
                          ? "text-white scale-110" 
                          : "text-gray-600 dark:text-gray-400"
                      }`} />
                    </div>
                  </div>

                  <CardTitle className="flex items-center justify-center gap-2 text-xl sm:text-2xl mb-2">
                    {roleDict?.freelance}
                    {(selectedRole === "freelance" || currentRole === "freelance") && (
                      <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 animate-bounce" />
                    )}
                  </CardTitle>
                  
                  <CardDescription className="text-sm px-2">
                    {roleDict?.freelanceDesc}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    {/* Statistiques simplifiées */}
                    <div className="flex justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="text-center">
                        <div className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">10K+</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 hidden sm:block">Projets</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400">4.9★</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 hidden sm:block">Rating</div>
                      </div>
                    </div>

                    {/* Liste des bénéfices réduite sur mobile */}
                    <ul className="space-y-2 sm:space-y-3">
                      {roleDict?.freelanceBenefits?.slice(0, 3).map((benefit: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 sm:gap-3 p-1 sm:p-2 rounded-lg hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors">
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    {selectedRole === "freelance" && (
                      <div className="mt-3 sm:mt-4 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-center">
                        <p className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">
                          ✓ {roleDict?.confirm} {roleDict?.freelance}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Carte Client */}
            <div
              className="group relative"
              onMouseEnter={() => setHoveredRole("client")}
              onMouseLeave={() => setHoveredRole(null)}
            >
              <div className={`absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl sm:rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-1000 ${
                selectedRole === "client" ? "opacity-30" : ""
              }`}></div>
              
              <Card 
                className={`relative cursor-pointer transition-all duration-500 overflow-hidden ${
                  selectedRole === "client" || currentRole === "client"
                    ? "border-2 border-purple-500 shadow-xl lg:scale-[1.02] bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-purple-900/20 dark:to-pink-900/20" 
                    : "border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg bg-white dark:bg-gray-800"
                }`}
                onClick={() => setSelectedRole("client")}
              >
                {hoveredRole === "client" && (
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
                    <div className="bg-gradient-to-r from-purple-400 to-pink-400 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <TrendingUp className="h-3 w-3" />
                      <span className="hidden sm:inline">Recommandé</span>
                      <span className="sm:hidden">📈</span>
                    </div>
                  </div>
                )}

                <CardHeader className="text-center pb-2 sm:pb-4">
                  <div className="relative mx-auto mb-4 sm:mb-6">
                    <div className={`absolute inset-0 bg-purple-400 rounded-full blur-xl transition-opacity duration-500 ${
                      selectedRole === "client" || hoveredRole === "client" ? "opacity-40" : "opacity-0"
                    }`}></div>
                    <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto flex items-center justify-center transition-all duration-500 transform group-hover:scale-110 ${
                      selectedRole === "client" || currentRole === "client"
                        ? "bg-gradient-to-br from-purple-500 to-pink-600 ring-4 ring-purple-200 dark:ring-purple-900" 
                        : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600"
                    }`}>
                      <Building className={`h-10 w-10 sm:h-12 sm:w-12 transition-all duration-500 ${
                        selectedRole === "client" || currentRole === "client" || hoveredRole === "client"
                          ? "text-white scale-110" 
                          : "text-gray-600 dark:text-gray-400"
                      }`} />
                    </div>
                  </div>

                  <CardTitle className="flex items-center justify-center gap-2 text-xl sm:text-2xl mb-2">
                    {roleDict?.client}
                    {(selectedRole === "client" || currentRole === "client") && (
                      <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 animate-bounce" />
                    )}
                  </CardTitle>
                  
                  <CardDescription className="text-sm px-2">
                    {roleDict?.clientDesc}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="text-center">
                        <div className="text-xs sm:text-sm font-semibold text-purple-600 dark:text-purple-400">5K+</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 hidden sm:block">Talents</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs sm:text-sm font-semibold text-pink-600 dark:text-pink-400">24h</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 hidden sm:block">Réponse</div>
                      </div>
                    </div>

                    <ul className="space-y-2 sm:space-y-3">
                      {roleDict?.clientBenefits?.slice(0, 3).map((benefit: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 sm:gap-3 p-1 sm:p-2 rounded-lg hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors">
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    {selectedRole === "client" && (
                      <div className="mt-3 sm:mt-4 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-center">
                        <p className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300">
                          ✓ {roleDict?.confirm} {roleDict?.client}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bouton d'action responsive */}
          <div className="text-center">
            <Button
              size="default"
              className="relative group bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-6 h-auto text-base sm:text-lg md:text-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              onClick={handleRoleSelection}
              disabled={loading || !selectedRole}
            >
              <div className="absolute inset-0 bg-white rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-2 sm:mr-3" />
                  <span className="text-sm sm:text-base">{roleDict?.updating}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 group-hover:animate-spin" />
                  <span className="text-sm sm:text-base">
                    {currentRole 
                      ? `${roleDict?.confirm} ${selectedRole === "freelance" ? roleDict?.freelance : roleDict?.client}`
                      : `${roleDict?.start} ${selectedRole === "freelance" ? roleDict?.freelance : roleDict?.client}`
                    }
                  </span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2 sm:ml-3 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            {!selectedRole && !currentRole && (
              <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                👆 {dict?.roleSelection?.errors?.selectRole || "Please select a role to continue"}
              </p>
            )}
          </div>

          {/* Indicateur de progression responsive */}
          <div className="mt-8 sm:mt-12 flex justify-center items-center gap-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-600 rounded-full animate-pulse animation-delay-200"></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-600 rounded-full animate-pulse animation-delay-400"></div>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-2">
              {roleDict?.step || "Step"} 1/4
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        @media (max-width: 640px) {
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        }
      `}</style>
    </div>
  )
}