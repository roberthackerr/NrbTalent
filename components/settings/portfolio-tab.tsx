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

export function PortfolioTab({ user }: PortfolioTabProps) {
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<"portfolio" | "experience">("portfolio")
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [experiences, setExperiences] = useState<Experience[]>([])

  // Charger les données initiales
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users/profile')
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile data')
      }
      
      const userData = await response.json()
      console.log('Données reçues:', userData) // Debug
      
      // Traiter le portfolio
      const portfolioData = userData.portfolio || []
      console.log('Portfolio brut:', portfolioData) // Debug
      
      const sortedPortfolio = [...portfolioData].sort((a: PortfolioItem, b: PortfolioItem) => {
        // Featured d'abord
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        
        // Ensuite par date (plus ancien d'abord)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateA - dateB
      })
      
      console.log('Portfolio trié:', sortedPortfolio) // Debug
      setPortfolioItems(sortedPortfolio)
      
      // Traiter les expériences
      const experienceData = userData.experience || []
      
      const sortedExperiences = [...experienceData].sort((a: Experience, b: Experience) => {
        // Postes actuels d'abord
        if (a.current && !b.current) return -1
        if (!a.current && b.current) return 1
        
        // Ensuite par date de début (plus récent d'abord)
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      })
      
      setExperiences(sortedExperiences)
      
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    console.log('Rafraîchissement des données...') // Debug
    await fetchData()
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              variant={activeSection === "portfolio" ? "default" : "outline"}
              onClick={() => setActiveSection("portfolio")}
              className="flex-1"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Portfolio ({portfolioItems.length})
            </Button>
            <Button
              variant={activeSection === "experience" ? "default" : "outline"}
              onClick={() => setActiveSection("experience")}
              className="flex-1"
            >
              <Building className="h-4 w-4 mr-2" />
              Expériences ({experiences.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contenu dynamique */}
      {activeSection === "portfolio" && (
        <PortfolioSection
          items={portfolioItems}
          onUpdate={handleUpdate}
          loading={loading}
        />
      )}

      {activeSection === "experience" && (
        <ExperienceSection
          experiences={experiences}
          onUpdate={handleUpdate}
          loading={loading}
        />
      )}
    </div>
  )
}