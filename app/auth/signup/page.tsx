"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { signIn } from "next-auth/react"
import Image from "next/image"
import { Rocket, Users, Sparkles, CheckCircle2 } from "lucide-react"

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [role, setRole] = useState<"freelance" | "client">("freelance")

  // Récupérer le rôle depuis l'URL si présent
  useEffect(() => {
    const urlRole = searchParams.get("role")
    if (urlRole === "freelance" || urlRole === "client") {
      setRole(urlRole)
    }
  }, [searchParams])

  const roleBenefits = {
    freelance: [
      "Trouvez des projets qui correspondent à vos compétences",
      "Construisez votre réputation avec notre système de notation",
      "Recevez des paiements sécurisés",
      "Bénéficiez de l'AI Matching pour plus de pertinence"
    ],
    client: [
      "Accédez à des milliers de freelances qualifiés",
      "Trouvez le talent parfait avec notre AI Matching",
      "Gérez vos projets en toute simplicité",
      "Paiements sécurisés et garantis"
    ]
  }

async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  setLoading(true)

  const formData = new FormData(e.currentTarget)
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    // 🔥 UNE SEULE REQUÊTE : création + connexion
    const result = await signIn("credentials", {
      name,        // Présence du nom = inscription
      email,
      password,
      role,        // Rôle sélectionné
      redirect: false,
    })

    if (result?.error) {
      // Affiche l'erreur de NextAuth
      toast.error(result.error)
    } else {
      // Succès : utilisateur créé ET connecté
      toast.success("Compte créé et connecté !")
      router.push("/onboarding")
      router.refresh() // Rafraîchir l'état
    }
  } catch (error: any) {
    toast.error(error.message || "Erreur d'inscription")
  } finally {
    setLoading(false)
  }
}

  async function handleGoogleSignUp() {
    setGoogleLoading(true)
    try {
      await signIn("google", { 
        callbackUrl: "/onboarding",
        role: role // Passer le rôle sélectionné
      })
    } catch (error) {
      toast.error("Échec de l'inscription avec Google")
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/30 dark:to-purple-950/30">
      <div className="container relative flex min-h-screen flex-col items-center justify-center p-4 lg:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        
        {/* Section gauche - Formulaire */}
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
            {/* Header */}
            <div className="flex flex-col space-y-2 text-center">
              <Link href="/" className="inline-flex items-center gap-3 self-center">
                <div className="relative">
                  <Image 
                    src="/logo.png"
                    alt="NRBTalents"
                    width={48}
                    height={48}
                    className="h-12 w-12 transition-transform hover:scale-110"
                  />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  NRBTalents
                </span>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">
                Commencez votre aventure
              </h1>
              <p className="text-lg text-muted-foreground">
                Rejoignez la révolution freelance
              </p>
            </div>

            <Card className="border-slate-200/50 dark:border-slate-800/50 shadow-lg">
              <CardContent className="pt-6">
                {/* Sélection du rôle */}
                <div className="mb-6">
                  <Label className="text-base font-semibold">Je veux :</Label>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={role === "freelance" ? "default" : "outline"}
                      className={`h-16 ${role === "freelance" ? "bg-gradient-to-r from-blue-600 to-purple-600" : ""}`}
                      onClick={() => setRole("freelance")}
                    >
                      <Rocket className="mr-2 h-4 w-4" />
                      Travailler
                    </Button>
                    <Button
                      type="button"
                      variant={role === "client" ? "default" : "outline"}
                      className={`h-16 ${role === "client" ? "bg-gradient-to-r from-green-600 to-emerald-600" : ""}`}
                      onClick={() => setRole("client")}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Recruter
                    </Button>
                  </div>
                </div>

                {/* Google Sign Up */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={handleGoogleSignUp}
                  disabled={googleLoading || loading}
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {googleLoading ? "Inscription..." : "Continuer avec Google"}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-300 dark:border-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Ou avec email</span>
                  </div>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom d'utilisateur</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      required 
                      placeholder="Votre nom d'utilisateur"
                      className="border-slate-300 dark:border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      required 
                      placeholder="votre@email.com"
                      className="border-slate-300 dark:border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input 
                      id="password" 
                      name="password" 
                      type="password" 
                      required 
                      placeholder="••••••••"
                      className="border-slate-300 dark:border-slate-600"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={loading || googleLoading}
                  >
                    {loading ? "Création du compte..." : "Créer mon compte"}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Déjà un compte ?{" "}
                  <Link href="/auth/signin" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                    Se connecter
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section droite - Avantages */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:p-8">
          <div className="mx-auto max-w-md space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                <Sparkles className="h-4 w-4" />
                {role === "freelance" ? "Mode Freelance" : "Mode Recruteur"}
              </div>
              <h2 className="text-4xl font-bold tracking-tight">
                {role === "freelance" 
                  ? "Libérez votre potentiel freelance" 
                  : "Trouvez les talents exceptionnels"
                }
              </h2>
              <p className="text-lg text-muted-foreground">
                {role === "freelance"
                  ? "Rejoignez des milliers de freelances qui développent leur carrière sur NRBTalents"
                  : "Accédez à notre réseau de professionnels vérifiés et compétents"
                }
              </p>
            </div>

            <div className="space-y-4">
              {roleBenefits[role].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">50K+</div>
                <div className="text-xs text-muted-foreground">Professionnels</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">10K+</div>
                <div className="text-xs text-muted-foreground">Projets réalisés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">95%</div>
                <div className="text-xs text-muted-foreground">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}