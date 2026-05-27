"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Rocket, TrendingUp, Shield, Zap, Briefcase } from "lucide-react"
import { useState } from "react"
import { AuthShortcutButtons } from "@/components/auth/AuthShortcutButtons"

interface HeroSectionProps {
  lang: 'fr' | 'en' | 'mg'
  user: any
  onSearch: (query: string) => void
  dict: any
}

export function HeroSection({ 
  lang, 
  user, 
  onSearch, 
  dict 
}: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  const hero = dict?.hero || {}
  const actions = hero.actions || {}

  // Version simplifiée pour utilisateur connecté
  if (user) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto text-center">
            {/* Titre simplifié */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Bonjour, {user.name?.split(' ')[0] || "freelance"} 👋
            </h1>
            
            <p className="text-blue-100 mb-6">
              {user.role === "freelance" 
                ? "Trouvez votre prochain projet" 
                : "Trouvez les meilleurs talents"}
            </p>

            {/* Barre de recherche */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={hero.searchPlaceholder || "Rechercher un projet, un freelance..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-24 py-5 text-base border-0 shadow-lg rounded-xl bg-white/95"
                />
                <Button 
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700"
                >
                  <Search className="h-4 w-4 mr-1" />
                  Go
                </Button>
              </div>
            </form>

            {/* Actions rapides - 2 boutons seulement */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {user.role === "freelance" ? (
                <>
                  <Button asChild size="default" className="bg-white text-blue-600 hover:bg-blue-50">
                    <a href="/projects/recommended">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      {actions.recommendedProjects || "Projets"}
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="default" className="border-white/80 text-white hover:bg-white/10">
                    <a href="/gigs/create">
                      <Rocket className="h-4 w-4 mr-2" />
                      {actions.createService || "Créer"}
                    </a>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="default" className="bg-white text-blue-600 hover:bg-blue-50">
                    <a href="/projects/create">
                      <Shield className="h-4 w-4 mr-2" />
                      {actions.postProject || "Projet"}
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="default" className="border-white/80 text-white hover:bg-white/10">
                    <a href="/search?type=users">
                      <Briefcase className="h-4 w-4 mr-2" />
                      {actions.findTalent || "Talents"}
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Version complète pour utilisateur non connecté
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Bouton "Commencer" */}
          <div className="flex justify-center mb-8">
            <Button asChild size="lg" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-6 rounded-full text-lg font-bold hover:scale-105 transition">
              <a href="/auth/signup">
                <Rocket className="h-5 w-5 mr-2" />
                {actions.startFree || "Commencer gratuitement"}
              </a>
            </Button>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 mb-6">
            <Zap className="h-4 w-4 text-yellow-300" />
            <span className="text-sm text-white">{hero.badge || "Plateforme #1 pour freelances"}</span>
          </div>

          {/* Titre */}
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            {hero.title || "Trouvez votre prochain"}
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              {hero.titleHighlight || "projet freelance"}
            </span>
          </h1>

          {/* Sous-titre */}
          <p className="text-lg text-blue-100 mb-8">
            {hero.subtitle || "Connectez-vous avec les meilleurs talents"}
          </p>

          {/* Recherche */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder={hero.searchPlaceholder || "Rechercher React, Design, Marketing..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-32 py-6 text-base rounded-2xl bg-white/95"
              />
              <Button type="submit" size="lg" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Search className="h-4 w-4 mr-2" />
                {hero.searchButton || "Rechercher"}
              </Button>
            </div>
          </form>

          {/* Auth shortcuts */}
          <div className="flex justify-center mb-6">
            <AuthShortcutButtons />
          </div>

          {/* Statistiques */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex flex-wrap justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">10k+</div>
                <p className="text-sm text-blue-200">Freelances actifs</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">5k+</div>
                <p className="text-sm text-blue-200">Projets complétés</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">98%</div>
                <p className="text-sm text-blue-200">Clients satisfaits</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}