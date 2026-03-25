// components/groups/CreatePostForm.tsx
'use client'

import { useState, useRef } from 'react'
import { 
  X, Type, Calendar, Briefcase, MessageSquare, Hash, 
  Image as ImageIcon, Paperclip, XCircle, Upload, FileText,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import Image from 'next/image'

interface UploadedFile {
  url: string
  publicId?: string
  name: string
  type: string
  size: number
  thumbnail?: string
  preview?: string
}

interface CreatePostFormProps {
  groupId: string
  onSuccess: () => void
  onCancel: () => void
}

export function CreatePostForm({ groupId, onSuccess, onCancel }: CreatePostFormProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [postType, setPostType] = useState('discussion')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    // Pour les événements
    eventTitle: '',
    eventDescription: '',
    eventStartDate: '',
    eventEndDate: '',
    eventLocation: '',
    eventIsOnline: false,
    // Pour les offres d'emploi
    jobTitle: '',
    jobCompany: '',
    jobLocation: '',
    jobType: 'full-time',
    jobDescription: '',
    jobSalaryMin: '',
    jobSalaryMax: '',
    jobCurrency: 'EUR'
  })

  // Prévisualisation des images
  const handleFileSelect = (files: FileList) => {
    if (files.length === 0) return
    
    const newFiles = Array.from(files)
    setSelectedFiles(prev => [...prev, ...newFiles])
    
    // Créer des prévisualisations pour les images
    newFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setUploadedFiles(prev => [
            ...prev,
            {
              url: e.target?.result as string,
              name: file.name,
              type: file.type,
              size: file.size,
              preview: e.target?.result as string
            }
          ])
        }
        reader.readAsDataURL(file)
      } else {
        setUploadedFiles(prev => [
          ...prev,
          {
            url: '',
            name: file.name,
            type: file.type,
            size: file.size
          }
        ])
      }
    })
    
    toast.success(`${newFiles.length} fichier(s) sélectionné(s)`)
  }

  // Supprimer un fichier sélectionné
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Calculer la taille totale des fichiers
  const totalFileSize = uploadedFiles.reduce((sum, file) => sum + file.size, 0)
  const formattedSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      const newTags = [...tags, tag.trim()]
      setTags(newTags)
      setFormData(prev => ({ ...prev, tags: newTags }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    const newTags = tags.filter(t => t !== tag)
    setTags(newTags)
    setFormData(prev => ({ ...prev, tags: newTags }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Veuillez entrer un titre')
      return
    }

    if (!formData.content.trim()) {
      toast.error('Veuillez entrer un contenu')
      return
    }

    setLoading(true)
    
    try {
      // Créer FormData pour l'upload des fichiers
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('content', formData.content)
      formDataToSend.append('type', postType)
      formDataToSend.append('tags', JSON.stringify(formData.tags))
      
      // Ajouter les fichiers
      selectedFiles.forEach(file => {
        formDataToSend.append('files', file)
      })
      
      // Ajouter les données spécifiques selon le type
      if (postType === 'event') {
        formDataToSend.append('eventTitle', formData.eventTitle)
        formDataToSend.append('eventDescription', formData.eventDescription)
        formDataToSend.append('eventStartDate', formData.eventStartDate)
        formDataToSend.append('eventEndDate', formData.eventEndDate)
        formDataToSend.append('eventLocation', formData.eventLocation)
        formDataToSend.append('eventIsOnline', String(formData.eventIsOnline))
      }
      
      if (postType === 'job') {
        formDataToSend.append('jobTitle', formData.jobTitle)
        formDataToSend.append('jobCompany', formData.jobCompany)
        formDataToSend.append('jobLocation', formData.jobLocation)
        formDataToSend.append('jobType', formData.jobType)
        formDataToSend.append('jobDescription', formData.jobDescription)
        if (formData.jobSalaryMin) formDataToSend.append('jobSalaryMin', formData.jobSalaryMin)
        if (formData.jobSalaryMax) formDataToSend.append('jobSalaryMax', formData.jobSalaryMax)
        formDataToSend.append('jobCurrency', formData.jobCurrency)
      }

      const response = await fetch(`/api/groups/${groupId}/posts`, {
        method: 'POST',
        body: formDataToSend
      })

      if (response.ok) {
        toast.success('Post créé avec succès !')
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Create post error:', error)
      toast.error('Erreur lors de la création du post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto border-0 shadow-xl">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-700 to-fuchsia-700 bg-clip-text text-transparent">
            Créer un nouveau post
          </h3>
          <Button variant="ghost" size="sm" onClick={onCancel} className="hover:bg-purple-50">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type de post */}
          <div>
            <Label className="mb-3 block text-purple-700 dark:text-purple-300">Type de post</Label>
            <Tabs value={postType} onValueChange={setPostType}>
              <TabsList className="grid grid-cols-4 bg-purple-50 dark:bg-purple-950/30">
                <TabsTrigger value="discussion" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Discussion</span>
                </TabsTrigger>
                <TabsTrigger value="question" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                  <Type className="h-4 w-4" />
                  <span className="hidden sm:inline">Question</span>
                </TabsTrigger>
                <TabsTrigger value="event" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Événement</span>
                </TabsTrigger>
                <TabsTrigger value="job" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Offre</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Titre */}
          <div>
            <Label htmlFor="title" className="text-purple-700 dark:text-purple-300">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Donnez un titre clair à votre post"
              className="mt-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500"
              maxLength={200}
            />
          </div>

          {/* Contenu */}
          <div>
            <Label htmlFor="content" className="text-purple-700 dark:text-purple-300">Contenu *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Partagez vos pensées, questions ou annonces..."
              rows={6}
              className="mt-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-purple-500"
              maxLength={5000}
            />
            <p className="text-xs text-purple-500 mt-1">
              {formData.content.length}/5000 caractères
            </p>
          </div>

          {/* Upload de fichiers */}
          <div>
            <Label className="mb-2 block text-purple-700 dark:text-purple-300">Médias et fichiers joints</Label>
            
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={(e) => handleFileSelect(e.target.files!)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-purple-200 dark:border-purple-800 rounded-lg p-8 text-center hover:border-purple-400 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-all">
                  <Upload className="h-8 w-8 text-purple-400 mx-auto mb-3" />
                  <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">
                    Glissez-déposez vos fichiers ou cliquez pour sélectionner
                  </p>
                  <p className="text-xs text-purple-500 dark:text-purple-500">
                    Images (JPG, PNG, GIF, WEBP) et documents (PDF, DOC, TXT) jusqu'à 10MB
                  </p>
                  <p className="text-xs text-purple-400 mt-2">
                    Max 10 fichiers à la fois
                  </p>
                </div>
              </label>
            </div>

            {/* Liste des fichiers uploadés */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-600 dark:text-purple-400">
                    {uploadedFiles.length} fichier(s) • {formattedSize(totalFileSize)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFiles([])
                      setUploadedFiles([])
                    }}
                    disabled={uploading}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    Tout supprimer
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="relative border border-purple-200 dark:border-purple-800 rounded-lg p-3 group hover:bg-purple-50/30 dark:hover:bg-purple-950/20 hover:shadow-md transition-all"
                    >
                      {file.preview ? (
                        <div className="aspect-video relative mb-2 rounded overflow-hidden bg-purple-50 dark:bg-purple-950/30">
                          <Image
                            src={file.preview}
                            alt={file.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-24 bg-purple-50 dark:bg-purple-950/30 rounded mb-2">
                          <FileText className="h-12 w-12 text-purple-400" />
                        </div>
                      )}
                      
                      <div className="text-xs truncate font-medium text-purple-900 dark:text-purple-300" title={file.name}>
                        {file.name}
                      </div>
                      <div className="text-xs text-purple-500 dark:text-purple-400">
                        {formattedSize(file.size)}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <Label className="mb-2 block text-purple-700 dark:text-purple-300">Tags</Label>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Ajouter des tags (appuyez sur Entrée)..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag(tagInput)
                    }
                  }}
                  className="pl-9 border-purple-200 dark:border-purple-800 focus:border-purple-500"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => addTag(tagInput)}
                disabled={!tagInput.trim()}
                className="border-purple-200 dark:border-purple-800 hover:bg-purple-50"
              >
                Ajouter
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 hover:text-red-500 focus:outline-none"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-purple-400">Aucun tag ajouté</p>
              )}
            </div>
          </div>

          {/* Formulaires spécifiques pour événements */}
          {postType === 'event' && (
            <div className="space-y-4 border-t border-purple-200 dark:border-purple-800 pt-4">
              <h4 className="font-medium text-purple-700 dark:text-purple-300">Détails de l'événement</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-purple-600 dark:text-purple-400">Titre de l'événement</Label>
                  <Input
                    value={formData.eventTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventTitle: e.target.value }))}
                    placeholder="Titre de l'événement"
                    className="border-purple-200 dark:border-purple-800"
                  />
                </div>
                <div>
                  <Label className="text-purple-600 dark:text-purple-400">Lieu</Label>
                  <Input
                    value={formData.eventLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventLocation: e.target.value }))}
                    placeholder="Lieu (ou 'En ligne')"
                    className="border-purple-200 dark:border-purple-800"
                  />
                </div>
                <div>
                  <Label className="text-purple-600 dark:text-purple-400">Date de début</Label>
                  <Input
                    type="datetime-local"
                    value={formData.eventStartDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventStartDate: e.target.value }))}
                    className="border-purple-200 dark:border-purple-800"
                  />
                </div>
                <div>
                  <Label className="text-purple-600 dark:text-purple-400">Date de fin</Label>
                  <Input
                    type="datetime-local"
                    value={formData.eventEndDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventEndDate: e.target.value }))}
                    className="border-purple-200 dark:border-purple-800"
                  />
                </div>
              </div>
              <div>
                <Label className="text-purple-600 dark:text-purple-400">Description de l'événement</Label>
                <Textarea
                  value={formData.eventDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, eventDescription: e.target.value }))}
                  placeholder="Décrivez l'événement..."
                  rows={3}
                  className="border-purple-200 dark:border-purple-800"
                />
              </div>
            </div>
          )}

          {/* Formulaires spécifiques pour offres d'emploi */}
          {postType === 'job' && (
            <div className="space-y-4 border-t border-purple-200 dark:border-purple-800 pt-4">
              <h4 className="font-medium text-purple-700 dark:text-purple-300">Détails de l'offre</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-purple-600 dark:text-purple-400">Poste</Label>
                  <Input
                    value={formData.jobTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                    placeholder="Intitulé du poste"
                    className="border-purple-200 dark:border-purple-800"
                  />
                </div>
                <div>
                  <Label className="text-purple-600 dark:text-purple-400">Entreprise</Label>
                  <Input
                    value={formData.jobCompany}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobCompany: e.target.value }))}
                    placeholder="Nom de l'entreprise"
                    className="border-purple-200 dark:border-purple-800"
                  />
                </div>
                <div>
                  <Label className="text-purple-600 dark:text-purple-400">Lieu</Label>
                  <Input
                    value={formData.jobLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobLocation: e.target.value }))}
                    placeholder="Lieu (ou 'Télétravail')"
                    className="border-purple-200 dark:border-purple-800"
                  />
                </div>
                <div>
                  <Label className="text-purple-600 dark:text-purple-400">Type de contrat</Label>
                  <select
                    value={formData.jobType}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobType: e.target.value }))}
                    className="w-full border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="full-time">CDI - Temps plein</option>
                    <option value="part-time">CDI - Temps partiel</option>
                    <option value="contract">CDD / Contrat</option>
                    <option value="freelance">Freelance / Indépendant</option>
                    <option value="internship">Stage</option>
                  </select>
                </div>
                <div>
                  <Label className="text-purple-600 dark:text-purple-400">Salaire minimum</Label>
                  <Input
                    type="number"
                    value={formData.jobSalaryMin}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobSalaryMin: e.target.value }))}
                    placeholder="Minimum"
                    className="border-purple-200 dark:border-purple-800"
                  />
                </div>
                <div>
                  <Label className="text-purple-600 dark:text-purple-400">Salaire maximum</Label>
                  <Input
                    type="number"
                    value={formData.jobSalaryMax}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobSalaryMax: e.target.value }))}
                    placeholder="Maximum"
                    className="border-purple-200 dark:border-purple-800"
                  />
                </div>
              </div>
              <div>
                <Label className="text-purple-600 dark:text-purple-400">Description du poste</Label>
                <Textarea
                  value={formData.jobDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                  placeholder="Description des missions, prérequis, etc..."
                  rows={4}
                  className="border-purple-200 dark:border-purple-800"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-purple-200 dark:border-purple-800">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="border-purple-200 dark:border-purple-800 hover:bg-purple-50"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 shadow-lg shadow-purple-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publication...
                </>
              ) : (
                'Publier'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}