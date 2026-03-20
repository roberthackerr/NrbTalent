// components/settings/languages-tab.tsx
'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Languages, 
  Plus, 
  X, 
  Edit, 
  Trash2,
  CheckCircle2,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Language {
  id: string
  name: string
  level: 'native' | 'fluent' | 'advanced' | 'intermediate' | 'beginner'
}

interface LanguagesTabProps {
  user: any
  dict: any
  lang: string
  onUpdate?: () => void
}

const levelOptions = [
  { value: 'native', label: 'Natif' },
  { value: 'fluent', label: 'Courant' },
  { value: 'advanced', label: 'Avancé' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'beginner', label: 'Débutant' }
]

export function LanguagesTab({ user, dict, lang, onUpdate }: LanguagesTabProps) {
  const [loading, setLoading] = useState(false)
  const [languages, setLanguages] = useState<Language[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Language>>({
    name: "",
    level: "intermediate"
  })

  useEffect(() => {
    if (user?.languages) {
      const formattedLanguages = Array.isArray(user.languages) 
        ? user.languages.map((lang: any, index: number) => ({
            id: lang.id || index.toString(),
            name: typeof lang === 'string' ? lang : lang.name,
            level: typeof lang === 'string' ? 'intermediate' : (lang.level || 'intermediate')
          }))
        : []
      setLanguages(formattedLanguages)
    }
  }, [user])

  const resetForm = () => {
    setFormData({
      name: "",
      level: "intermediate"
    })
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error(dict?.languages?.errors?.missingName || "Veuillez saisir une langue")
      return
    }

    setLoading(true)
    try {
      let updatedLanguages: Language[]
      
      if (editingId) {
        updatedLanguages = languages.map(lang => 
          lang.id === editingId 
            ? { ...lang, name: formData.name!, level: formData.level as Language['level'] }
            : lang
        )
      } else {
        const newLanguage: Language = {
          id: new Date().getTime().toString(),
          name: formData.name!,
          level: formData.level as Language['level']
        }
        updatedLanguages = [...languages, newLanguage]
      }

      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: 'professional',
          data: { languages: updatedLanguages }
        })
      })

      if (response.ok) {
        setLanguages(updatedLanguages)
        toast.success(editingId 
          ? (dict?.languages?.success?.updated || "Langue mise à jour avec succès")
          : (dict?.languages?.success?.added || "Langue ajoutée avec succès"))
        
        resetForm()
        setShowForm(false)
        if (onUpdate) onUpdate()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update languages')
      }
    } catch (error) {
      console.error('Error updating languages:', error)
      toast.error(dict?.languages?.errors?.update || "Erreur lors de la mise à jour")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(dict?.languages?.confirmDelete || "Êtes-vous sûr de vouloir supprimer cette langue ?")) {
      return
    }

    setLoading(true)
    try {
      const updatedLanguages = languages.filter(lang => lang.id !== id)

      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: 'professional',
          data: { languages: updatedLanguages }
        })
      })

      if (response.ok) {
        setLanguages(updatedLanguages)
        toast.success(dict?.languages?.success?.deleted || "Langue supprimée avec succès")
        if (onUpdate) onUpdate()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete language')
      }
    } catch (error) {
      console.error('Error deleting language:', error)
      toast.error(dict?.languages?.errors?.delete || "Erreur lors de la suppression")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (lang: Language) => {
    setFormData({
      name: lang.name,
      level: lang.level
    })
    setEditingId(lang.id)
    setShowForm(true)
  }

  const getLevelBadge = (level: string) => {
    const config: Record<string, { color: string; label: string }> = {
      native: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", label: dict?.languages?.levels?.native || "Natif" },
      fluent: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", label: dict?.languages?.levels?.fluent || "Courant" },
      advanced: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300", label: dict?.languages?.levels?.advanced || "Avancé" },
      intermediate: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", label: dict?.languages?.levels?.intermediate || "Intermédiaire" },
      beginner: { color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300", label: dict?.languages?.levels?.beginner || "Débutant" }
    }
    return config[level] || config.intermediate
  }

  const t = dict?.languages || {}

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-blue-500" />
              {t.title || "Langues"}
            </CardTitle>
            <CardDescription>
              {t.description || "Ajoutez les langues que vous parlez"}
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
                {t.addLanguage || "Ajouter une langue"}
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Formulaire d'ajout/modification */}
          {showForm && (
            <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                {editingId ? (t.editLanguage || "Modifier la langue") : (t.addLanguage || "Ajouter une langue")}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="language-name" className="text-sm font-medium">
                    {t.language || "Langue"} *
                  </Label>
                  <Input
                    id="language-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t.languagePlaceholder || "Ex: Français, Anglais, Espagnol..."}
                    className="border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language-level" className="text-sm font-medium">
                    {t.level || "Niveau"} *
                  </Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}
                  >
                    <SelectTrigger className="border-slate-200 dark:border-slate-700">
                      <SelectValue placeholder={t.selectLevel || "Sélectionnez un niveau"} />
                    </SelectTrigger>
                    <SelectContent>
                      {levelOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {t.levels?.[option.value as keyof typeof t.levels] || option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

          {/* Liste des langues */}
          {languages.length === 0 && !showForm ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Languages className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                {t.noLanguages || "Aucune langue"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                {t.noLanguagesDesc || "Ajoutez les langues que vous parlez pour attirer plus de clients"}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {languages.map((lang) => {
                const levelBadge = getLevelBadge(lang.level)
                return (
                  <div
                    key={lang.id}
                    className="group relative p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                        <Languages className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {lang.name}
                        </p>
                        <Badge className={cn("mt-1 text-xs", levelBadge.color)}>
                          {levelBadge.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(lang)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="h-3 w-3 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(lang.id)}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}