// components/settings/portfolio-section.tsx
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
import { Image, Plus, Edit, Trash2, ExternalLink, Star, X, FolderOpen, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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

interface PortfolioSectionProps {
  items: PortfolioItem[]
  onUpdate: () => void
  loading: boolean
}

const portfolioCategories = [
  "Site Web",
  "Application Mobile",
  "Design UI/UX",
  "E-commerce",
  "API",
  "Outil",
  "Jeu",
  "Autre"
]

export function PortfolioSection({ items, onUpdate, loading }: PortfolioSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)
  const [formData, setFormData] = useState<Omit<PortfolioItem, "id">>({
    title: "",
    description: "",
    image: "",
    url: "",
    technologies: [],
    category: "",
    featured: false
  })
  const [newTechnology, setNewTechnology] = useState("")
  const [imagePreview, setImagePreview] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image: "",
      url: "",
      technologies: [],
      category: "",
      featured: false
    })
    setNewTechnology("")
    setImagePreview("")
    setImageFile(null)
    setEditingItem(null)
  }

  const openAddDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (item: PortfolioItem) => {
    setFormData({
      title: item.title,
      description: item.description,
      image: item.image,
      url: item.url || "",
      technologies: item.technologies,
      category: item.category,
      featured: item.featured
    })
    setImagePreview(item.image)
    setImageFile(null)
    setEditingItem(item)
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image valide")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image doit faire moins de 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    setImageFile(file)
  }

  const uploadImage = async (file: File, portfolioId?: string): Promise<string> => {
    const uploadFormData = new FormData()
    uploadFormData.append("image", file)
    
    if (portfolioId) {
      uploadFormData.append("portfolioId", portfolioId)
    }

    const response = await fetch('/api/users/upload-portfolio-image', {
      method: 'POST',
      body: uploadFormData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Échec de l\'upload de l\'image')
    }

    const data = await response.json()
    return data.imageUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.description || !formData.category) {
      toast.error("Veuillez remplir les champs obligatoires")
      return
    }

    if (editingItem && !imageFile && !formData.image) {
      toast.error("Une image est requise")
      return
    }

    if (!editingItem && !imageFile) {
      toast.error("Veuillez sélectionner une image")
      return
    }

    setUploading(true)

    try {
      let finalImageUrl = formData.image

      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile, editingItem?.id)
      }

      const portfolioData = {
        title: formData.title,
        description: formData.description,
        image: finalImageUrl,
        url: formData.url || undefined,
        technologies: formData.technologies,
        category: formData.category,
        featured: formData.featured,
        id: editingItem ? editingItem.id : Date.now().toString()
      }

      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: 'portfolio',
          data: portfolioData
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save portfolio item')
      }

      const message = editingItem ? "Projet mis à jour!" : "Projet ajouté avec succès!"
      toast.success(message)
      
      setIsDialogOpen(false)
      resetForm()
      
      await onUpdate()

    } catch (error) {
      console.error('Error saving portfolio item:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la sauvegarde")
    } finally {
      setUploading(false)
    }
  }

  // Trier les projets : featured d'abord, puis par date (plus récent en bas)
  const sortedItems = [...items].sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return dateA - dateB
  })

  // Identifier les projets récents (ajoutés dans les dernières 24h)
  const now = new Date().getTime()
  const oneDayAgo = now - (24 * 60 * 60 * 1000)
  const isRecentlyAdded = (item: PortfolioItem) => {
    if (!item.createdAt) return false
    const createdTime = new Date(item.createdAt).getTime()
    return createdTime > oneDayAgo
  }

  const featuredItems = sortedItems.filter(item => item.featured)
  const otherItems = sortedItems.filter(item => !item.featured)

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton d'ajout */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-purple-500" />
              Portfolio
            </CardTitle>
            <CardDescription>
              Montrez vos meilleurs projets pour impressionner les clients
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un projet
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Modifier le projet" : "Nouveau projet"}
                </DialogTitle>
                <DialogDescription>
                  Ajoutez les détails de votre projet portfolio
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Titre du projet *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Nom de votre projet"
                    required
                    maxLength={100}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Catégorie *
                  </Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {portfolioCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Décrivez votre projet, les défis relevés, les fonctionnalités..."
                    rows={4}
                    required
                    maxLength={500}
                  />
                  <p className="text-xs text-slate-500">
                    {formData.description.length}/500 caractères
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="image" className="text-sm font-medium">
                    Image du projet *
                  </Label>
                  <div className="space-y-4">
                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setImagePreview("")
                            setImageFile(null)
                            if (!editingItem) {
                              setFormData(prev => ({ ...prev, image: "" }))
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="border-slate-200 dark:border-slate-700"
                      required={!editingItem}
                    />
                    <p className="text-xs text-slate-500">
                      PNG, JPG jusqu'à 5MB. Format recommandé : 16:9
                    </p>
                    {editingItem && !imageFile && (
                      <p className="text-xs text-blue-600">
                        L'image actuelle sera conservée si aucune nouvelle image n'est sélectionnée
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="url" className="text-sm font-medium">
                    Lien vers le projet
                  </Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://votre-projet.com"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="technologies" className="text-sm font-medium">
                    Technologies utilisées
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="technologies"
                      value={newTechnology}
                      onChange={(e) => setNewTechnology(e.target.value)}
                      placeholder="Ajouter une technologie"
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

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                  />
                  <Label htmlFor="featured" className="text-sm font-medium">
                    Mettre en vedette
                  </Label>
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={uploading}
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        {editingItem ? "Mise à jour..." : "Ajout..."}
                      </>
                    ) : (
                      editingItem ? "Mettre à jour" : "Ajouter le projet"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {/* Projets en vedette */}
      {featuredItems.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Projets en Vedette
            </CardTitle>
            <CardDescription>
              Ces projets seront mis en avant sur votre profil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {featuredItems.map((item) => (
                <PortfolioCard
                  key={item.id}
                  item={item}
                  onEdit={openEditDialog}
                  onUpdate={onUpdate}
                  isNew={isRecentlyAdded(item)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tous les autres projets */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle>Tous les Projets</CardTitle>
          <CardDescription>
            {items.length} projet{items.length > 1 ? 's' : ''} au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {otherItems.length > 0 ? (
            <div className="space-y-6">
              {otherItems.map((item) => (
                <PortfolioCard
                  key={item.id}
                  item={item}
                  onEdit={openEditDialog}
                  onUpdate={onUpdate}
                  isNew={isRecentlyAdded(item)}
                  fullWidth
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Aucun projet portfolio
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                Montrez votre travail pour impressionner les clients et augmentez vos chances d'être embauché.
              </p>
              <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter votre premier projet
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Statistiques */}
      {items.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {items.length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Projets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {featuredItems.length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">En vedette</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {new Set(items.flatMap(item => item.technologies)).size}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Technologies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {items.filter(item => item.url).length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Avec lien</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Composant Carte de Portfolio
function PortfolioCard({
  item,
  onEdit,
  onUpdate,
  isNew = false,
  fullWidth = false
}: {
  item: PortfolioItem
  onEdit: (item: PortfolioItem) => void
  onUpdate: () => void
  isNew?: boolean
  fullWidth?: boolean
}) {
  const deletePortfolioItem = async (itemId: string) => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: 'portfolio',
          data: { id: itemId, _delete: true }
        })
      })

      if (response.ok) {
        toast.success("Projet supprimé!")
        onUpdate()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete portfolio item')
      }
    } catch (error) {
      console.error('Error deleting portfolio item:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression")
    }
  }

  const toggleFeatured = async (itemId: string) => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: 'portfolio',
          data: { ...item, featured: !item.featured }
        })
      })

      if (response.ok) {
        toast.success("Projet mis à jour!")
        onUpdate()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update portfolio item')
      }
    } catch (error) {
      console.error('Error updating portfolio item:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour")
    }
  }

  return (
    <div className={`group border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${fullWidth ? '' : 'max-w-full'}`}>
      <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isNew && (
            <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">
              <CheckCircle className="h-3 w-3 mr-1 fill-current" />
              Nouveau
            </Badge>
          )}
          {item.featured && (
            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Vedette
            </Badge>
          )}
          <Badge variant="outline" className="bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300">
            {item.category}
          </Badge>
        </div>

        {/* Actions */}
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toggleFeatured(item.id)}
            className="h-8 w-8 p-0 bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900"
          >
            <Star className={cn(
              "h-4 w-4",
              item.featured ? "fill-yellow-500 text-yellow-500" : "text-slate-600"
            )} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(item)}
            className="h-8 w-8 p-0 bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => deletePortfolioItem(item.id)}
            className="h-8 w-8 p-0 bg-white/90 dark:bg-slate-900/90 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-1">
          {item.title}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 line-clamp-2">
          {item.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-3">
          {item.technologies.slice(0, 3).map((tech) => (
            <Badge key={tech} variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800">
              {tech}
            </Badge>
          ))}
          {item.technologies.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{item.technologies.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          {item.url && (
            <Button variant="ghost" size="sm" asChild>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                <span className="text-xs">Voir le projet</span>
              </a>
            </Button>
          )}
          {item.createdAt && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Ajouté le {new Date(item.createdAt).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}