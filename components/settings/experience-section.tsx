"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Building, Calendar, MapPin, Plus, Edit, Trash2, X, Briefcase } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Experience {
  id: string
  company: string
  position: string
  location?: string
  startDate: string
  endDate?: string
  current: boolean
  description: string
  technologies: string[]
  achievement: string
}

interface ExperienceSectionProps {
  experiences: Experience[]
  onUpdate: () => void
  loading: boolean
  dict: any
  lang: string
}

export function ExperienceSection({ experiences, onUpdate, loading, dict, lang }: ExperienceSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null)
  const [formData, setFormData] = useState<Omit<Experience, "id">>({
    company: "",
    position: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
    technologies: [],
    achievement: ""
  })
  const [newTechnology, setNewTechnology] = useState("")

  const resetForm = () => {
    setFormData({
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      technologies: [],
      achievement: ""
    })
    setNewTechnology("")
    setEditingExperience(null)
  }

  const openAddDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (experience: Experience) => {
    setFormData({
      company: experience.company,
      position: experience.position,
      location: experience.location || "",
      startDate: experience.startDate.split('T')[0],
      endDate: experience.current ? "" : experience.endDate?.split('T')[0] || "",
      current: experience.current,
      description: experience.description,
      technologies: experience.technologies,
      achievement: experience.achievement
    })
    setEditingExperience(experience)
    setIsDialogOpen(true)
  }

  const addTechnology = () => {
    if (newTechnology.trim() && !formData.technologies.includes(newTechnology.trim())) {
      setFormData(prev => ({
        ...prev,
        technologies: [...prev.technologies, newTechnology.trim()]
      }))
      setNewTechnology("")
    }
  }

  const removeTechnology = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tech)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.company || !formData.position || !formData.startDate) {
      toast.error(dict.errors?.missingFields || "Veuillez remplir les champs obligatoires")
      return
    }

    try {
      const experienceData = {
        company: formData.company,
        position: formData.position,
        location: formData.location,
        startDate: formData.startDate,
        endDate: formData.current ? undefined : formData.endDate,
        current: formData.current,
        description: formData.description,
        technologies: formData.technologies,
        achievement: formData.achievement
      }

      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          section: 'experience',
          data: editingExperience 
            ? { ...experienceData, id: editingExperience.id }
            : experienceData
        })
      })

      if (response.ok) {
        toast.success(editingExperience ? dict.success?.updated : dict.success?.added)
        setIsDialogOpen(false)
        resetForm()
        onUpdate()
      } else {
        const error = await response.json()
        throw new Error(error.error || dict.errors?.save || 'Failed to save experience')
      }
    } catch (error) {
      console.error('Error saving experience:', error)
      toast.error(error instanceof Error ? error.message : dict.errors?.save || "Erreur lors de la sauvegarde")
    }
  }

  const deleteExperience = async (experienceId: string) => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          section: 'experience',
          data: { id: experienceId, _delete: true }
        })
      })

      if (response.ok) {
        toast.success(dict.success?.removed || "Expérience supprimée!")
        onUpdate()
      } else {
        const error = await response.json()
        throw new Error(error.error || dict.errors?.remove || 'Failed to delete experience')
      }
    } catch (error) {
      console.error('Error deleting experience:', error)
      toast.error(error instanceof Error ? error.message : dict.errors?.remove || "Erreur lors de la suppression")
    }
  }

const formatDate = (dateString: string) => {
  // mg has no native locale support, fallback to fr-FR
  const locale = lang === 'en' ? 'en-US' : 'fr-FR'
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long'
  })
}

  const getDuration = (startDate: string, endDate?: string, current?: boolean) => {
    const start = new Date(startDate)
    const end = current ? new Date() : new Date(endDate || start)
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    
    if (years === 0) {
      return `${remainingMonths} ${dict.months || 'mois'}`
    } else if (remainingMonths === 0) {
      return `${years} ${years > 1 ? dict.years : dict.year}`
    } else {
      return `${years} ${years > 1 ? dict.years : dict.year} ${remainingMonths} ${dict.months || 'mois'}`
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton d'ajout */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-500" />
              {dict.title || "Expériences Professionnelles"}
            </CardTitle>
            <CardDescription>
              {dict.description || "Ajoutez votre parcours professionnel pour renforcer votre crédibilité"}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                {dict.addExperience || "Ajouter une expérience"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingExperience ? dict.editTitle || "Modifier l'expérience" : dict.addTitle || "Nouvelle expérience"}
                </DialogTitle>
                <DialogDescription>
                  {dict.formDescription || "Renseignez vos informations professionnelles"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="company" className="text-sm font-medium">
                      {dict.company || "Entreprise"} *
                    </Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      placeholder={dict.companyPlaceholder || "Nom de l'entreprise"}
                      required
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="position" className="text-sm font-medium">
                      {dict.position || "Poste"} *
                    </Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      placeholder={dict.positionPlaceholder || "Votre poste"}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {dict.location || "Localisation"}
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder={dict.locationPlaceholder || "Ville, Pays"}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="startDate" className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {dict.startDate || "Date de début"} *
                    </Label>
                    <Input
                      id="startDate"
                      type="month"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="endDate" className="text-sm font-medium">
                      {dict.endDate || "Date de fin"}
                    </Label>
                    <Input
                      id="endDate"
                      type="month"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      disabled={formData.current}
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.current}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, current: checked }))}
                      />
                      <Label htmlFor="current" className="text-sm">
                        {dict.currentPosition || "Poste actuel"}
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-medium">
                    {dict.description || "Description"}
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={dict.descriptionPlaceholder || "Décrivez vos responsabilités et réalisations..."}
                    rows={4}
                    maxLength={1000}
                  />
                  <p className="text-xs text-slate-500">
                    {formData.description.length}/1000 {dict.characters || "caractères"}
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="technologies" className="text-sm font-medium">
                    {dict.technologiesUsed || "Technologies utilisées"}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="technologies"
                      value={newTechnology}
                      onChange={(e) => setNewTechnology(e.target.value)}
                      placeholder={dict.addTechnology || "Ajouter une technologie"}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTechnology()
                        }
                      }}
                    />
                    <Button type="button" onClick={addTechnology} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {formData.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary" className="flex items-center gap-1">
                          {tech}
                          <button
                            type="button"
                            onClick={() => removeTechnology(tech)}
                            className="hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="achievement" className="text-sm font-medium">
                    {dict.achievement || "Réalisation"} *
                  </Label>
                  <Input
                    id="achievement"
                    value={formData.achievement}
                    onChange={(e) => setFormData(prev => ({ ...prev, achievement: e.target.value }))}
                    placeholder={dict.achievementPlaceholder || "Votre réalisation principale"}
                    required
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {dict.cancel || "Annuler"}
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingExperience ? dict.update || "Mettre à jour" : dict.add || "Ajouter"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {/* Liste des expériences */}
      {experiences.length > 0 ? (
        <div className="space-y-4">
          {experiences.map((experience, index) => (
            <Card key={experience.id} className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {experience.position}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Building className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            {experience.company}
                          </span>
                          {experience.location && (
                            <>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500 dark:text-slate-500">
                                {experience.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {experience.current && (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
                            {dict.current || "Actuel"}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(experience)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteExperience(experience.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(experience.startDate)} - {experience.current ? dict.present || "Présent" : formatDate(experience.endDate!)}
                        </span>
                      </div>
                      <span>•</span>
                      <span>
                        {getDuration(experience.startDate, experience.endDate, experience.current)}
                      </span>
                    </div>

                    {experience.description && (
                      <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                        {experience.description}
                      </p>
                    )}

                    {experience.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {experience.technologies.map((tech) => (
                          <Badge key={tech} variant="outline" className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {experience.achievement && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                          🏆 {experience.achievement}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="text-center py-12">
            <Building className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {dict.noExperiences || "Aucune expérience professionnelle"}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
              {dict.noExperiencesDescription || "Ajoutez votre parcours professionnel pour montrer votre expertise et renforcer votre crédibilité auprès des clients."}
            </p>
            <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              {dict.addFirstExperience || "Ajouter votre première expérience"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      {experiences.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle>{dict.statsTitle || "Statistiques"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {experiences.length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{dict.experiences || "Expériences"}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {experiences.filter(exp => exp.current).length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{dict.currentPositions || "Postes actuels"}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {new Set(experiences.flatMap(exp => exp.technologies)).size}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{dict.technologies || "Technologies"}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(experiences.reduce((acc, exp) => {
                    const start = new Date(exp.startDate)
                    const end = exp.current ? new Date() : new Date(exp.endDate!)
                    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
                    return acc + months
                  }, 0) / 12 * 10) / 10}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{dict.totalYears || "Années totales"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}