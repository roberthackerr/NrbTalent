// components/settings/portfolio-tab.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, Building } from "lucide-react"
import { toast } from "sonner"
import { ExperienceSection } from "./experience-section"
import { PortfolioSection } from "./portfolio-section"

interface PortfolioTabProps {
  user: any
  dict: any
  lang: string
  onUpdate?: () => void
}

interface PortfolioItem {
  id: string
  title: string
  description: string
  image: string
  url?: string
  technologies: string[]
  category: string
  featured: boolean
  createdAt?: Date
}

interface Experience {
  id: string
  company: string
  position: string
  startDate: string
  endDate?: string
  current: boolean
  description: string
  technologies: string[]
  achievement: string
}

export function PortfolioTab({ user, dict, lang, onUpdate }: PortfolioTabProps) {
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<"portfolio" | "experience">("portfolio")
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [experiences, setExperiences] = useState<Experience[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users/profile')

      if (!response.ok) throw new Error('Failed to fetch profile data')

      const userData = await response.json()

      const portfolioData = userData.portfolio || []
      const sortedPortfolio = [...portfolioData].sort((a: PortfolioItem, b: PortfolioItem) => {
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateA - dateB
      })
      setPortfolioItems(sortedPortfolio)

      const experienceData = userData.experience || []
      const sortedExperiences = [...experienceData].sort((a: Experience, b: Experience) => {
        if (a.current && !b.current) return -1
        if (!a.current && b.current) return 1
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      })
      setExperiences(sortedExperiences)

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error(dict?.errors?.fetch || "Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    await fetchData()
    onUpdate?.()
  }

  return (
    /*
      suppressHydrationWarning sur le wrapper racine : Google Translate modifie
      les nœuds texte de ce composant, ce qui crée un décalage entre le DOM
      réel et le DOM virtuel de React. Sans cette protection, React tente de
      supprimer des nœuds que Google Translate a déjà remplacés → removeChild.
    */
    <div className="space-y-6" suppressHydrationWarning>

      {/* Navigation — suppressHydrationWarning sur les spans de texte traduits */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              variant={activeSection === "portfolio" ? "default" : "outline"}
              onClick={() => setActiveSection("portfolio")}
              className="flex-1"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              {/* translate="no" empêche Google Translate de toucher ce nœud */}
              <span translate="no" suppressHydrationWarning>
                {dict?.navigation?.portfolio || "Portfolio"} ({portfolioItems.length})
              </span>
            </Button>
            <Button
              variant={activeSection === "experience" ? "default" : "outline"}
              onClick={() => setActiveSection("experience")}
              className="flex-1"
            >
              <Building className="h-4 w-4 mr-2" />
              <span translate="no" suppressHydrationWarning>
                {dict?.navigation?.experience || "Expériences"} ({experiences.length})
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/*
        CORRECTION PRINCIPALE — Google Translate + rendu conditionnel :

        Le problème : Google Translate remplace les nœuds texte enfants par ses
        propres nœuds <font>. Quand React démontait PortfolioSection ou
        ExperienceSection via {condition && <Composant />}, il tentait de
        supprimer les nœuds originaux — mais Google Translate les avait déjà
        remplacés. D'où l'erreur "removeChild: node is not a child of this node".

        La solution : garder les DEUX composants toujours montés dans le DOM,
        et les afficher/masquer uniquement via CSS (display: none).
        React ne démonte plus jamais ces composants → plus aucun removeChild.
        Google Translate peut modifier les textes sans conflit.
      */}
      <div style={{ display: activeSection === "portfolio" ? "block" : "none" }}>
        <PortfolioSection
          items={portfolioItems}
          onUpdate={handleUpdate}
          loading={loading}
          dict={dict?.portfolio || dict}
          lang={lang}
        />
      </div>

      <div style={{ display: activeSection === "experience" ? "block" : "none" }}>
        <ExperienceSection
          experiences={experiences}
          onUpdate={handleUpdate}
          loading={loading}
          dict={dict?.experience || dict}
          lang={lang}
        />
      </div>

    </div>
  )
} 