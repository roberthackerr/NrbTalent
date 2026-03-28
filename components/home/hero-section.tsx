"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Rocket, Star, TrendingUp, Shield, Zap, Calendar, Users, Code2 } from "lucide-react"
import { useState } from "react"
import { TeamAccessButton } from '@/components/ui/team-access-button';
import { AIMatchingButtonHero } from "../ai-matching/AIMatchingButton"
import { AuthShortcutButtons } from "@/components/auth/AuthShortcutButtons"

interface HeroSectionProps {
  lang: 'fr' | 'en' | 'mg'
  user: any
  onSearch: (query: string) => void
  onCalendarClick?: () => void
  onIDEClick?: () => void
  dict: any // Using any to avoid deep type issues
}

export function HeroSection({ 
  lang, 
  user, 
  onSearch, 
  onCalendarClick, 
  onIDEClick,
  dict 
}: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  // Safe access to nested properties with fallbacks
  const hero = dict?.hero || {}
  const stats = hero.stats || {}
  const actions = hero.actions || {}
  const calendar = hero.calendar || {}
  const teams = hero.teams || {}

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-900">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />
      
      <div className="relative container mx-auto px-4 py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
            <Zap className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-medium text-white">
              {hero.badge || "Plateforme #1 pour les freelances en 2025"}
            </span>
          </div>

          {/* Titre principal */}
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            {hero.title || "Trouvez votre prochain"}
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              {hero.titleHighlight || "projet freelance"}
            </span>
          </h1>

          {/* Sous-titre */}
          <p className="text-xl lg:text-2xl text-blue-100 mb-8 leading-relaxed max-w-3xl mx-auto">
            {hero.subtitle || "Connectez-vous avec les meilleurs talents et clients grâce à notre"}
            <span className="font-semibold text-white"> {hero.subtitleHighlight || "intelligence artificielle avancée"}</span>
          </p>

          {/* Barre de recherche avec boutons d'authentification */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder={hero.searchPlaceholder || "Rechercher React, Design, Marketing, Développement..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-[180px] py-6 text-lg border-0 shadow-2xl rounded-2xl bg-white/95 backdrop-blur-sm focus:bg-white"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {/* Boutons d'authentification */}
                {!user && <AuthShortcutButtons />}
                <Button 
                  type="submit"
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {hero.searchButton || "Rechercher"}
                </Button>
              </div>
            </div>
          </form>
          
          <AIMatchingButtonHero dict={dict} lang={lang} />
          
          {/* Stats rapides */}
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-white">{stats.projectsValue || "50K+"}</div>
              <div className="text-blue-200 text-sm">{stats.projects || "Projets réalisés"}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-white">{stats.freelancersValue || "15K+"}</div>
              <div className="text-blue-200 text-sm">{stats.freelancers || "Freelances experts"}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-white">{stats.satisfactionValue || "98%"}</div>
              <div className="text-blue-200 text-sm">{stats.satisfaction || "Taux de satisfaction"}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-white">{stats.responseTimeValue || "24h"}</div>
              <div className="text-blue-200 text-sm">{stats.responseTime || "Temps moyen de réponse"}</div>
            </div>
          </div>

          {/* Actions principales */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            {!user ? (
              <>
                <a href="/auth/signup"   className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-xl text-lg font-semibold shadow-2xl">
                  <Rocket className="h-5 w-5 mr-2" />
                  {actions.startFree || "Commencer gratuitement"}
                </a>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3 rounded-xl text-lg font-semibold">
                  {actions.viewProjects || "Voir les projets"}
                </Button>
              </>
            ) : user.role === "freelance" ? (
              <>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-xl text-lg font-semibold shadow-2xl">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  {actions.recommendedProjects || "Projets recommandés"}
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3 rounded-xl text-lg font-semibold">
                  {actions.createService || "Créer un service"}
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-xl text-lg font-semibold shadow-2xl">
                  <Shield className="h-5 w-5 mr-2" />
                  {actions.postProject || "Publier un projet"}
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3 rounded-xl text-lg font-semibold">
                  {actions.findTalent || "Trouver un talent"}
                </Button>
              </>
            )}
          </div>

          {/* Calendar and IDE Sections */}
          {user && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-6">
              {/* Calendar Section */}
              <div className="animate-fade-in">
                <div className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 w-full">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-semibold text-sm">
                        {calendar.title || "Nouveau : Calendrier"}
                      </p>
                      <p className="text-blue-200 text-xs">
                        {calendar.description || "Gérez vos rendez-vous"}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={onCalendarClick}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg shadow-green-500/25 flex-shrink-0"
                  >
                    {calendar.button || "Découvrir"}
                  </Button>
                </div>
              </div>

              {/* IDE Section */}
              <div className="animate-fade-in">
                <div className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 w-full">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Code2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-semibold text-sm">
                        IDE en ligne
                      </p>
                      <p className="text-blue-200 text-xs">
                        Codez directement dans le navigateur
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={onIDEClick}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-lg shadow-blue-500/25 flex-shrink-0"
                  >
                    Essayer
                  </Button>
                </div>
              </div>

              {/* Team Section with TeamAccessButton */}
              <div className="animate-fade-in">
                <div className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 w-full">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-semibold text-sm">
                        {teams.title || "Équipes Collaboratives"}
                      </p>
                      <p className="text-blue-200 text-xs">
                        {teams.description || "Rejoignez des équipes de talents"}
                      </p>
                    </div>
                  </div>
                  
                  <TeamAccessButton
                    teamId=""
                    variant="gradient"
                    size="sm"
                    iconType="users"
                    dict={{
                      viewTeam: teams.viewTeams || "Voir les équipes",
                      viewDetails: teams.viewTeams || "Voir les équipes",
                      openTeam: teams.viewTeams || "Voir les équipes",
                      loading: lang === 'fr' ? 'Chargement...' : 
                              lang === 'mg' ? 'Amplasiana...' : 'Loading...',
                    }}
                    lang={lang}
                    className="flex-shrink-0"
                  >
                    {teams.viewTeams || "Voir les équipes"}
                  </TeamAccessButton>
                </div>
              </div>
            </div>
          )}

          {/* Create Team Button */}
          {user && user.role === "freelance" && (
            <div className="mt-4">
              <TeamAccessButton
                teamId="create"
                variant="outline"
                size="default"
                iconType="sparkles"
                dict={{
                  viewTeam: teams.createTeam || "Créer une équipe",
                  viewDetails: teams.createTeam || "Créer une équipe",
                  openTeam: teams.createTeam || "Créer une équipe",
                  loading: lang === 'fr' ? 'Chargement...' : 
                          lang === 'mg' ? 'Amplasiana...' : 'Loading...',
                }}
                lang={lang}
                className="border-white/30 text-white hover:bg-white/10"
              >
                {teams.createTeam || "Créer une équipe"}
              </TeamAccessButton>
            </div>
          )}
        </div>
      </div>

      {/* Vague décorative */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none" 
          className="w-full h-12 text-white dark:text-slate-950"
        >
          <path 
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
            opacity=".25" 
            fill="currentColor"
          ></path>
          <path 
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
            opacity=".5" 
            fill="currentColor"
          ></path>
          <path 
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
            fill="currentColor"
          ></path>
        </svg>
      </div>
    </section>
  )
}