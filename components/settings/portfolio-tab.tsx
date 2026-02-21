"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Briefcase, Plus, X, Edit, ExternalLink, Star, Calendar, Building } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
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
}

export function PortfolioTab({ user }: PortfolioTabProps) {
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<"portfolio" | "experience">("portfolio")
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [experiences, setExperiences] = useState<Experience[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/users/profile')
      if (response.ok) {
        const userData = await response.json()
        setPortfolioItems(userData.portfolio || [])
        setExperiences(userData.experience || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error("Erreur lors du chargement des données")
    }
  }

  // Implémentation similaire pour portfolio et expériences...
  // (Le code serait très similaire à l'onglet compétences)

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
              Portfolio
            </Button>
            <Button
              variant={activeSection === "experience" ? "default" : "outline"}
              onClick={() => setActiveSection("experience")}
              className="flex-1"
            >
              <Building className="h-4 w-4 mr-2" />
              Expériences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contenu dynamique selon la section active */}
      {activeSection === "portfolio" && (
        <PortfolioSection 
          items={portfolioItems}
          onUpdate={fetchData}
          loading={loading}
        />
      )}

      {activeSection === "experience" && (
        <ExperienceSection 
          experiences={experiences}
          onUpdate={fetchData}
          loading={loading}
        />
      )}
    </div>
  )
}

// Composants enfants pour chaque section...