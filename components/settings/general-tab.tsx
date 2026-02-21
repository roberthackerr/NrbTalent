"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Edit, Upload, MapPin, Briefcase, Globe, Linkedin, Github, Twitter } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface GeneralTabProps {
  user: any
}

interface UserProfile {
  name: string
  email: string
  title?: string
  bio?: string
  location?: string
  socialLinks?: {
    website?: string
    linkedin?: string
    github?: string
    twitter?: string
  }
}

export function GeneralTab({ user }: GeneralTabProps) {
  const { update } = useSession()
  const [loading, setLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [completionScore, setCompletionScore] = useState(0)
  const [formData, setFormData] = useState<UserProfile>({
    name: "",
    email: "",
    title: "",
    bio: "",
    location: "",
    socialLinks: {
      website: "",
      linkedin: "",
      github: "",
      twitter: "",
    }
  })

  // Charger les données du profil
  useEffect(() => {
    if (user) {
      fetchUserProfile()
    }
  }, [user])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/users/profile')
      if (response.ok) {
        const userData = await response.json()
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          title: userData.title || "",
          bio: userData.bio || "",
          location: userData.location || "",
          socialLinks: {
            website: userData.socialLinks?.website || "",
            linkedin: userData.socialLinks?.linkedin || "",
            github: userData.socialLinks?.github || "",
            twitter: userData.socialLinks?.twitter || "",
          }
        })
        setCompletionScore(userData.completionScore || 0)
      } else {
        throw new Error('Failed to fetch profile')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error("Erreur lors du chargement du profil")
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          section: 'basic', 
          data: {
            name: formData.name,
            title: formData.title,
            bio: formData.bio,
            location: formData.location,
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Mettre à jour les liens sociaux séparément
        await updateSocialLinks()
        
        // Recharger les données pour avoir le score à jour
        await fetchUserProfile()
        
        // Mettre à jour la session
        await update({
          ...user,
          name: formData.name
        })
        
        toast.success("Profil mis à jour avec succès!")
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour du profil")
    } finally {
      setLoading(false)
    }
  }

  const updateSocialLinks = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          section: 'social', 
          data: formData.socialLinks
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update social links')
      }
    } catch (error) {
      console.error('Error updating social links:', error)
      throw error
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validation
    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image valide")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image doit faire moins de 5MB")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        
        // Mettre à jour la session avec la nouvelle image
        await update({
          ...user,
          image: data.avatarUrl
        })
        
        // Recharger le profil pour le score à jour
        await fetchUserProfile()
        
        toast.success("Photo de profil mise à jour avec succès!")
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors du téléchargement de l'image")
    } finally {
      setIsUploading(false)
      // Reset the input
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const calculateFormChanges = () => {
    const originalData = {
      name: user?.name || "",
      email: user?.email || "",
      title: user?.title || "",
      bio: user?.bio || "",
      location: user?.location || "",
      socialLinks: {
        website: user?.socialLinks?.website || "",
        linkedin: user?.socialLinks?.linkedin || "",
        github: user?.socialLinks?.github || "",
        twitter: user?.socialLinks?.twitter || "",
      }
    }

    return JSON.stringify(originalData) !== JSON.stringify(formData)
  }

  const hasChanges = calculateFormChanges()

  return (
    <div className="space-y-6">
      {/* En-tête du profil */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span>Profil Public</span>
            <Badge variant="outline" className={cn(
              "text-xs",
              completionScore >= 80 
                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800"
                : completionScore >= 60
                ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800"
                : "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800"
            )}>
              {completionScore >= 80 ? "Excellent" : completionScore >= 60 ? "Bon" : "À améliorer"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Ces informations seront visibles par les autres utilisateurs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score de complétion */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Complétion du profil</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{completionScore}%</span>
            </div>
            <Progress value={completionScore} className="h-2 bg-slate-200 dark:bg-slate-800" />
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Complétez votre profil pour augmenter votre visibilité de 40%
            </p>
          </div>

          {/* Photo de profil */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-4 border-white dark:border-slate-900 shadow-lg">
                <AvatarImage src={user?.image} alt={formData.name} />
                <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-purple-600 font-semibold">
                  {formData.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <label 
                htmlFor="avatar-upload"
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm"
              >
                <Edit className="h-5 w-5 text-white" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
              </label>
              
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Photo de profil</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                PNG, JPG jusqu'à 5MB
              </p>
              <label htmlFor="avatar-upload">
                <Button variant="outline" size="sm" disabled={isUploading} className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "Téléchargement..." : "Changer la photo"}
                </Button>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire d'information */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle>Informations Personnelles</CardTitle>
          <CardDescription>
            Mettez à jour vos informations personnelles et professionnelles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nom Complet *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="border-slate-200 dark:border-slate-700 focus:border-blue-500"
                  placeholder="Votre nom complet"
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="border-slate-200 dark:border-slate-700 focus:border-blue-500 bg-slate-50 dark:bg-slate-800"
                  placeholder="votre@email.com"
                  required
                  disabled
                />
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  L'email ne peut pas être modifié
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Titre Professionnel
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="border-slate-200 dark:border-slate-700 focus:border-blue-500"
                placeholder="ex: Développeur Full-Stack Senior"
                maxLength={100}
              />
              <p className="text-xs text-slate-500 dark:text-slate-500">
                {formData.title?.length}/100 caractères
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="bio" className="text-sm font-medium">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
                className="border-slate-200 dark:border-slate-700 focus:border-blue-500 resize-none"
                placeholder="Décrivez votre expérience, vos compétences et vos spécialités..."
                maxLength={500}
              />
              <p className="text-xs text-slate-500 dark:text-slate-500">
                {formData.bio?.length}/500 caractères
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Localisation
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="border-slate-200 dark:border-slate-700 focus:border-blue-500"
                placeholder="Ville, Pays"
                maxLength={50}
              />
            </div>

            {/* Liens sociaux */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Liens Sociaux</h4>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="website" className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Site Web
                  </Label>
                  <Input
                    id="website"
                    value={formData.socialLinks?.website || ""}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, website: e.target.value }
                    }))}
                    className="border-slate-200 dark:border-slate-700 focus:border-blue-500"
                    placeholder="https://votre-site.com"
                    type="url"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="linkedin" className="text-sm font-medium flex items-center gap-2">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Label>
                  <Input
                    id="linkedin"
                    value={formData.socialLinks?.linkedin || ""}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                    }))}
                    className="border-slate-200 dark:border-slate-700 focus:border-blue-500"
                    placeholder="https://linkedin.com/in/username"
                    type="url"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="github" className="text-sm font-medium flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    GitHub
                  </Label>
                  <Input
                    id="github"
                    value={formData.socialLinks?.github || ""}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, github: e.target.value }
                    }))}
                    className="border-slate-200 dark:border-slate-700 focus:border-blue-500"
                    placeholder="https://github.com/username"
                    type="url"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="twitter" className="text-sm font-medium flex items-center gap-2">
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Label>
                  <Input
                    id="twitter"
                    value={formData.socialLinks?.twitter || ""}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                    }))}
                    className="border-slate-200 dark:border-slate-700 focus:border-blue-500"
                    placeholder="https://twitter.com/username"
                    type="url"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button 
                type="submit" 
                disabled={loading || !hasChanges}
                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer les modifications"
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={fetchUserProfile}
                disabled={loading || !hasChanges}
              >
                Annuler
              </Button>
              
              {!hasChanges && (
                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                  Aucune modification
                </Badge>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}