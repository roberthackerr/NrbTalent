// /components/groups/CreatePostForm.tsx - VERSION AVEC UPLOAD
'use client'

import { useState, useRef } from 'react'
import { 
  X, Type, Calendar, Briefcase, Users, MessageSquare, Hash, 
  Image as ImageIcon, Paperclip, XCircle, Upload, FileText 
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
  originalName: string
  type: 'image' | 'document'
  mimeType: string
  size: number
  fileName: string
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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'discussion',
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

  // Gestion de l'upload de fichiers
  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return
    
    setUploading(true)
    
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('files', file)
      })

      // Upload vers le serveur
      const response = await fetch(`/api/groups/${groupId}/posts/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setUploadedFiles(prev => [...prev, ...result.files])
        toast.success(`${result.files.length} fichier(s) uploadé(s)`)
      } else {
        toast.error('Erreur lors de l\'upload')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'upload')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Supprimer un fichier uploadé
  const removeFile = (index: number) => {
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
    }
  }

  const removeTag = (tag: string) => {
    const newTags = tags.filter(t => t !== tag)
    setTags(newTags)
    setFormData(prev => ({ ...prev, tags: newTags }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)
    
    try {
      // Séparer images et documents
      const images = uploadedFiles.filter(f => f.type === 'image').map(f => f.url)
      const attachments = uploadedFiles.filter(f => f.type === 'document').map(f => ({
        url: f.url,
        name: f.originalName,
        size: f.size,
        type: f.mimeType
      }))

      const postData = {
        type: postType,
        title: formData.title,
        content: formData.content,
        tags: formData.tags,
        images,
        attachments,
        ...(postType === 'event' && {
          event: {
            title: formData.eventTitle,
            description: formData.eventDescription,
            startDate: formData.eventStartDate,
            endDate: formData.eventEndDate,
            location: formData.eventLocation,
            isOnline: formData.eventIsOnline
          }
        }),
        ...(postType === 'job' && {
          job: {
            title: formData.jobTitle,
            company: formData.jobCompany,
            location: formData.jobLocation,
            type: formData.jobType,
            description: formData.jobDescription,
            salary: formData.jobSalaryMin ? {
              min: parseFloat(formData.jobSalaryMin),
              max: parseFloat(formData.jobSalaryMax),
              currency: formData.jobCurrency
            } : undefined
          }
        })
      }

      const response = await fetch(`/api/groups/${groupId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      })

      if (response.ok) {
        toast.success('Post créé avec succès !')
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la création')
      }
    } catch (error) {
      toast.error('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Créer un nouveau post</h3>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type de post */}
          <div>
            <Label className="mb-3 block">Type de post</Label>
            <Tabs value={postType} onValueChange={setPostType}>
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="discussion" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Discussion</span>
                </TabsTrigger>
                <TabsTrigger value="question" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  <span className="hidden sm:inline">Question</span>
                </TabsTrigger>
                <TabsTrigger value="event" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Événement</span>
                </TabsTrigger>
                <TabsTrigger value="job" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Offre</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Titre */}
          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Donnez un titre clair à votre post"
              className="mt-2"
            />
          </div>

          {/* Contenu */}
          <div>
            <Label htmlFor="content">Contenu *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Partagez vos pensées, questions ou annonces..."
              rows={6}
              className="mt-2"
            />
          </div>

          {/* Upload de fichiers */}
          <div>
            <Label className="mb-2 block">Médias et fichiers joints</Label>
            
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={(e) => handleFileUpload(e.target.files!)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 mb-2">
                    Glissez-déposez vos fichiers ou cliquez pour sélectionner
                  </p>
                  <p className="text-xs text-slate-500">
                    Images (JPG, PNG, GIF, WEBP) et documents (PDF, DOC, TXT) jusqu'à 10MB
                  </p>
                </div>
              </label>
            </div>

            {/* Liste des fichiers uploadés */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    {uploadedFiles.length} fichier(s) • {formattedSize(totalFileSize)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedFiles([])}
                    disabled={uploading}
                  >
                    Tout supprimer
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="relative border rounded-lg p-3 group hover:bg-slate-50 transition-colors"
                    >
                      {file.type === 'image' ? (
                        <div className="aspect-video relative mb-2">
                          <Image
                            src={file.url}
                            alt={file.originalName}
                            fill
                            className="object-cover rounded"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-24 bg-slate-100 rounded mb-2">
                          <FileText className="h-12 w-12 text-slate-400" />
                        </div>
                      )}
                      
                      <div className="text-xs truncate" title={file.originalName}>
                        {file.originalName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formattedSize(file.size)}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {uploading && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-sm text-slate-600 mt-2">Upload en cours...</p>
              </div>
            )}
          </div>

          {/* Tags (reste le même) */}
          <div>
            <Label className="mb-2 block">Tags</Label>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Ajouter des tags..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag(tagInput)
                      setTagInput('')
                    }
                  }}
                  className="pl-9"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addTag(tagInput)
                  setTagInput('')
                }}
                disabled={!tagInput.trim()}
              >
                Ajouter
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Formulaires spécifiques pour événements et offres (reste le même) */}
          {postType === 'event' && (
            <div className="space-y-4 border-t pt-4">
              {/* ... ton code existant pour les événements ... */}
            </div>
          )}

          {postType === 'job' && (
            <div className="space-y-4 border-t pt-4">
              {/* ... ton code existant pour les offres d'emploi ... */}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading || uploading}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading || uploading}
            >
              {loading ? 'Publication...' : uploading ? 'Upload en cours...' : 'Publier'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}