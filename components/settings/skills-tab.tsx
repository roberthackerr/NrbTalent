"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap, Plus, X, Star, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface SkillsTabProps {
  user: any
}

interface Skill {
  id: string
  name: string
  category: string
  level: "beginner" | "intermediate" | "advanced" | "expert"
  yearsOfExperience: number
  featured: boolean
}

const skillCategories = [
  "Développement Web",
  "Développement Mobile",
  "Design UI/UX",
  "DevOps",
  "Data Science",
  "Marketing Digital",
  "Rédaction",
  "Traduction",
  "Consulting",
  "Autre"
]

const popularSkills = [
  "React", "TypeScript", "Node.js", "Python", "Next.js", "Vue.js", "Angular",
  "PHP", "Laravel", "Symfony", "Java", "Spring Boot", "C#", ".NET",
  "Swift", "Kotlin", "Flutter", "React Native", "Docker", "Kubernetes",
  "AWS", "Azure", "Google Cloud", "MongoDB", "PostgreSQL", "MySQL",
  "Redis", "GraphQL", "REST API", "Tailwind CSS", "Figma", "Adobe XD",
  "Photoshop", "Illustrator", "SEO", "Marketing", "Content Writing"
]

export function SkillsTab({ user }: SkillsTabProps) {
  const [loading, setLoading] = useState(false)
  const [skills, setSkills] = useState<Skill[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [skillLevel, setSkillLevel] = useState<Skill["level"]>("intermediate")
  const [yearsOfExperience, setYearsOfExperience] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)

  useEffect(() => {
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    try {
      const response = await fetch('/api/users/profile')
      if (response.ok) {
        const userData = await response.json()
        setSkills(userData.skills || [])
      }
    } catch (error) {
      console.error('Error fetching skills:', error)
      toast.error("Erreur lors du chargement des compétences")
    }
  }

  const filteredSkills = popularSkills.filter(skill =>
    skill.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addSkill = async () => {
    const skillToAdd = showCustomInput ? newSkill : (newSkill || searchTerm)
    
    if (!skillToAdd.trim() || !selectedCategory) {
      toast.error("Veuillez saisir une compétence et sélectionner une catégorie")
      return
    }

    const skillExists = skills.some(skill => 
      skill.name.toLowerCase() === skillToAdd.toLowerCase()
    )

    if (skillExists) {
      toast.error("Cette compétence existe déjà")
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          section: 'professional',
          data: {
            skills: [
              ...skills,
              {
                id: Date.now().toString(),
                name: skillToAdd.trim(),
                category: selectedCategory,
                level: skillLevel,
                yearsOfExperience,
                featured: false
              }
            ]
          }
        })
      })

      if (response.ok) {
        await fetchSkills()
        setNewSkill("")
        setSearchTerm("")
        setSelectedCategory("")
        setSkillLevel("intermediate")
        setYearsOfExperience(1)
        setShowCustomInput(false)
        toast.success("Compétence ajoutée avec succès!")
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add skill')
      }
    } catch (error) {
      console.error('Error adding skill:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'ajout de la compétence")
    } finally {
      setLoading(false)
    }
  }

  const removeSkill = async (skillId: string) => {
    setLoading(true)
    try {
      const updatedSkills = skills.filter(skill => skill.id !== skillId)
      
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          section: 'professional',
          data: { skills: updatedSkills }
        })
      })

      if (response.ok) {
        setSkills(updatedSkills)
        toast.success("Compétence supprimée avec succès!")
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove skill')
      }
    } catch (error) {
      console.error('Error removing skill:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression de la compétence")
    } finally {
      setLoading(false)
    }
  }

  const toggleFeatured = async (skillId: string) => {
    setLoading(true)
    try {
      const updatedSkills = skills.map(skill => 
        skill.id === skillId 
          ? { ...skill, featured: !skill.featured }
          : skill
      )
      
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          section: 'professional',
          data: { skills: updatedSkills }
        })
      })

      if (response.ok) {
        setSkills(updatedSkills)
        toast.success("Compétence mise à jour!")
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update skill')
      }
    } catch (error) {
      console.error('Error updating skill:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour")
    } finally {
      setLoading(false)
    }
  }

  const getLevelColor = (level: Skill["level"]) => {
    switch (level) {
      case "beginner": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "intermediate": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "advanced": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
      case "expert": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    }
  }

  const getLevelText = (level: Skill["level"]) => {
    switch (level) {
      case "beginner": return "Débutant"
      case "intermediate": return "Intermédiaire"
      case "advanced": return "Avancé"
      case "expert": return "Expert"
    }
  }

  const featuredSkills = skills.filter(skill => skill.featured)
  const otherSkills = skills.filter(skill => !skill.featured)

  return (
    <div className="space-y-6">
      {/* Ajout de compétences */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Ajouter une Compétence
          </CardTitle>
          <CardDescription>
            Ajoutez vos compétences pour être trouvé par les clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="skill-select" className="text-sm font-medium">
                Compétence
              </Label>
              
              {showCustomInput ? (
                <div className="space-y-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Entrez votre compétence"
                    className="border-slate-200 dark:border-slate-700"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCustomInput(false)}
                    className="text-xs h-7"
                  >
                    ← Choisir dans la liste
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Select value={newSkill} onValueChange={setNewSkill}>
                    <SelectTrigger className="border-slate-200 dark:border-slate-700">
                      <SelectValue placeholder="Sélectionner une compétence" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <Input
                          placeholder="Rechercher..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="mb-2"
                        />
                      </div>
                      <div className="max-h-60 overflow-auto">
                        {filteredSkills.map((skill) => (
                          <SelectItem key={skill} value={skill} className="cursor-pointer">
                            {skill}
                          </SelectItem>
                        ))}
                      </div>
                      <div className="border-t p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCustomInput(true)}
                          className="w-full justify-start text-xs h-8"
                        >
                          + Ajouter une compétence personnalisée
                        </Button>
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="category" className="text-sm font-medium">
                Catégorie
              </Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {skillCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="level" className="text-sm font-medium">
                Niveau
              </Label>
              <Select value={skillLevel} onValueChange={(value: Skill["level"]) => setSkillLevel(value)}>
                <SelectTrigger className="border-slate-200 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Débutant</SelectItem>
                  <SelectItem value="intermediate">Intermédiaire</SelectItem>
                  <SelectItem value="advanced">Avancé</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="years" className="text-sm font-medium">
                Années d'expérience
              </Label>
              <Input
                id="years"
                type="number"
                min="0"
                max="50"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(parseInt(e.target.value) || 0)}
                className="border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <Button 
            onClick={addSkill}
            disabled={loading || (!newSkill.trim() && !searchTerm.trim()) || !selectedCategory}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
          >
            <Plus className="h-4 w-4 mr-2" />
            {loading ? "Ajout..." : "Ajouter la compétence"}
          </Button>
        </CardContent>
      </Card>

      {/* Le reste du code reste inchangé */}
      {/* Compétences en vedette */}
      {featuredSkills.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Compétences en Vedette
            </CardTitle>
            <CardDescription>
              Ces compétences seront mises en avant sur votre profil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {featuredSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border border-yellow-200 dark:border-yellow-800 rounded-full px-4 py-2 group"
                >
                  <span className="font-medium text-yellow-800 dark:text-yellow-200">
                    {skill.name}
                  </span>
                  <Badge variant="outline" className={cn("text-xs", getLevelColor(skill.level))}>
                    {getLevelText(skill.level)}
                  </Badge>
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">
                    {skill.yearsOfExperience} an{skill.yearsOfExperience > 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFeatured(skill.id)}
                      className="h-6 w-6 p-0 hover:bg-yellow-200 dark:hover:bg-yellow-800"
                    >
                      <Star className="h-3 w-3 fill-current" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSkill(skill.id)}
                      className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toutes les compétences */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle>Mes Compétences</CardTitle>
          <CardDescription>
            {skills.length} compétence{skills.length > 1 ? 's' : ''} au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {skills.length > 0 ? (
            <div className="space-y-4">
              {otherSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                          {skill.name}
                        </h4>
                        <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-slate-800">
                          {skill.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <Badge variant="outline" className={cn("text-xs", getLevelColor(skill.level))}>
                          {getLevelText(skill.level)}
                        </Badge>
                        <span>{skill.yearsOfExperience} an{skill.yearsOfExperience > 1 ? 's' : ''} d'expérience</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleFeatured(skill.id)}
                      className="h-8"
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Vedette
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSkill(skill.id)}
                      className="h-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Aucune compétence ajoutée
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Ajoutez vos compétences pour montrer votre expertise aux clients
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques des compétences */}
      {skills.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Statistiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {skills.length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Compétences</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {featuredSkills.length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">En vedette</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(skills.reduce((acc, skill) => acc + skill.yearsOfExperience, 0) / skills.length * 10) / 10}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Moyenne d'expérience</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}