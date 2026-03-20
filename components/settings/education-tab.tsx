// components/settings/education-tab.tsx
'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  GraduationCap, 
  Plus, 
  X, 
  Calendar, 
  Edit, 
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { fr, en  , mg } from "date-fns/locale"

interface Education {
  id: string
  degree: string
  school: string
  field: string
  startDate: string
  endDate?: string
  current: boolean
  description?: string
}

interface EducationTabProps {
  user: any
  dict: any
  lang: string
  onUpdate?: () => void
}

const locales = { fr, en, mg }

export function EducationTab({ user, dict, lang, onUpdate }: EducationTabProps) {
  const [loading, setLoading] = useState(false)
  const [educations, setEducations] = useState<Education[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Education>>({
    degree: "",
    school: "",
    field: "",
    startDate: "",
    endDate: "",
    current: false,
    description: ""
  })

  useEffect(() => {
    if (user?.education) {
      setEducations(user.education)
    }
  }, [user])

  const resetForm = () => {
    setFormData({
      degree: "",
      school: "",
      field: "",
      startDate: "",
      endDate: "",
      current: false,
      description: ""
    })
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!formData.degree || !formData.school || !formData.field || !formData.startDate) {
      toast.error(dict?.education?.errors?.missingFields || "Veuillez remplir tous les champs obligatoires")
      return
    }

    setLoading(true)
    try {
      const educationData = {
        ...formData,
        id: editingId || new Date().getTime().toString(),
        endDate: formData.current ? null : formData.endDate
      }

      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: 'education',
          data: educationData
        })
      })

      if (response.ok) {
        toast.success(editingId 
          ? (dict?.education?.success?.updated || "Formation mise à jour avec succès")
          : (dict?.education?.success?.added || "Formation ajoutée avec succès"))
        
        resetForm()
        setShowForm(false)
        if (onUpdate) onUpdate()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update education')
      }
    } catch (error) {
      console.error('Error updating education:', error)
      toast.error(dict?.education?.errors?.update || "Erreur lors de la mise à jour")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(dict?.education?.confirmDelete || "Êtes-vous sûr de vouloir supprimer cette formation ?")) {
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
          section: 'education',
          data: { id, _delete: true }
        })
      })

      if (response.ok) {
        toast.success(dict?.education?.success?.deleted || "Formation supprimée avec succès")
        if (onUpdate) onUpdate()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete education')
      }
    } catch (error) {
      console.error('Error deleting education:', error)
      toast.error(dict?.education?.errors?.delete || "Erreur lors de la suppression")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (edu: Education) => {
    setFormData({
      degree: edu.degree,
      school: edu.school,
      field: edu.field,
      startDate: edu.startDate?.split('T')[0] || "",
      endDate: edu.endDate?.split('T')[0] || "",
      current: edu.current,
      description: edu.description || ""
    })
    setEditingId(edu.id)
    setShowForm(true)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      const locale = locales[lang as keyof typeof locales] || fr
      return format(date, 'MMM yyyy', { locale })
    } catch {
      return dateString.split('T')[0] || dateString
    }
  }

  const t = dict?.education || {}

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-500" />
              {t.title || "Formation"}
            </CardTitle>
            <CardDescription>
              {t.description || "Ajoutez vos diplômes et formations"}
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setShowForm(!showForm)
            }}
            variant={showForm ? "outline" : "default"}
            className={showForm ? "text-red-600 hover:text-red-700" : "bg-blue-600 hover:bg-blue-700"}
          >
            {showForm ? (
              <>
                <X className="h-4 w-4 mr-2" />
                {dict?.common?.cancel || "Annuler"}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                {t.addEducation || "Ajouter une formation"}
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Formulaire d'ajout/modification */}
          {showForm && (
            <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                {editingId ? (t.editEducation || "Modifier la formation") : (t.addEducation || "Ajouter une formation")}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="degree" className="text-sm font-medium">
                    {t.degree || "Diplôme"} *
                  </Label>
                  <Input
                    id="degree"
                    value={formData.degree}
                    onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
                    placeholder={t.degreePlaceholder || "Ex: Master en Informatique"}
                    className="border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field" className="text-sm font-medium">
                    {t.field || "Domaine"} *
                  </Label>
                  <Input
                    id="field"
                    value={formData.field}
                    onChange={(e) => setFormData(prev => ({ ...prev, field: e.target.value }))}
                    placeholder={t.fieldPlaceholder || "Ex: Développement Web"}
                    className="border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school" className="text-sm font-medium">
                    {t.school || "Établissement"} *
                  </Label>
                  <Input
                    id="school"
                    value={formData.school}
                    onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
                    placeholder={t.schoolPlaceholder || "Ex: Université Paris-Saclay"}
                    className="border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm font-medium">
                    {t.startDate || "Date de début"} *
                  </Label>
                  <Input
                    id="startDate"
                    type="month"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="border-slate-200 dark:border-slate-700"
                  />
                </div>
                {!formData.current && (
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-sm font-medium">
                      {t.endDate || "Date de fin"}
                    </Label>
                    <Input
                      id="endDate"
                      type="month"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="border-slate-200 dark:border-slate-700"
                    />
                  </div>
                )}
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="current"
                    checked={formData.current}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, current: checked, endDate: checked ? "" : prev.endDate }))}
                  />
                  <Label htmlFor="current" className="text-sm font-medium">
                    {t.current || "En cours"}
                  </Label>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    {t.description || "Description (optionnel)"}
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t.descriptionPlaceholder || "Décrivez votre parcours, les spécialisations, etc."}
                    rows={3}
                    className="border-slate-200 dark:border-slate-700 resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" onClick={() => { resetForm(); setShowForm(false) }} disabled={loading}>
                  {dict?.common?.cancel || "Annuler"}
                </Button>
                <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {dict?.common?.saving || "Enregistrement..."}
                    </>
                  ) : (
                    dict?.common?.save || "Enregistrer"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Liste des formations */}
          {educations.length === 0 && !showForm ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                {t.noEducation || "Aucune formation"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                {t.noEducationDesc || "Ajoutez vos diplômes et formations pour renforcer votre profil"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {educations.map((edu) => (
                <div
                  key={edu.id}
                  className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                          <GraduationCap className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-lg">
                          {edu.degree}
                        </h4>
                        {edu.current && (
                          <Badge className="bg-green-500 text-white border-0">
                            {t.inProgress || "En cours"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium mb-1">
                        {edu.school} • {edu.field}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-500 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(edu.startDate)} - {edu.current ? (t.present || "Présent") : formatDate(edu.endDate || "")}
                        </span>
                      </div>
                      {edu.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                          {edu.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(edu)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(edu.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}