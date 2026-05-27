"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Edit, 
  Upload, 
  MapPin, 
  Briefcase, 
  Globe, 
  Linkedin, 
  Github, 
  Twitter,
  FileText,
  Download,
  Trash2,
  File,
  CheckCircle
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Label } from "../ui/label"

interface GeneralTabProps {
  user: any
  dict: any
  lang: string
}

interface CVData {
  url: string
  fileName: string
  uploadedAt: string
  fileSize: number
  publicId?: string
  fileType?: string
  version?: number
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
  cv?: CVData | null
}

export function GeneralTab({ user, dict, lang }: GeneralTabProps) {
  const { update } = useSession()
  const [loading, setLoading] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingCV, setIsUploadingCV] = useState(false)
  const [isDeletingCV, setIsDeletingCV] = useState(false)
  const [completionScore, setCompletionScore] = useState(0)
  
  // Refs for file inputs
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const cvInputRef = useRef<HTMLInputElement>(null)
  const replaceCVInputRef = useRef<HTMLInputElement>(null)
  
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
    },
    cv: null
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
        
        let cvData = null
        if (userData.cv) {
          cvData = {
            url: userData.cv.url || userData.cv.secure_url || '',
            fileName: userData.cv.fileName || userData.cv.original_filename || 'CV.pdf',
            uploadedAt: userData.cv.uploadedAt || userData.cv.created_at || new Date().toISOString(),
            fileSize: userData.cv.fileSize || userData.cv.bytes || 0,
            publicId: userData.cv.publicId || userData.cv.public_id,
            fileType: userData.cv.fileType || userData.cv.format,
            version: userData.cv.version
          }
        }
        
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
          },
          cv: cvData
        })
        setCompletionScore(userData.completionScore || 0)
        
        console.log('CV Data loaded:', cvData)
      } else {
        throw new Error('Failed to fetch profile')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error(dict?.general?.errors?.fetch || "Erreur lors du chargement du profil")
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
        await updateSocialLinks()
        await fetchUserProfile()
        
        await update({
          ...user,
          name: formData.name
        })
        
        toast.success(dict?.general?.success?.update || "Profil mis à jour avec succès!")
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error instanceof Error ? error.message : dict?.general?.errors?.update || "Erreur lors de la mise à jour du profil")
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

    if (!file.type.startsWith('image/')) {
      toast.error(dict?.general?.errors?.invalidImage || "Veuillez sélectionner une image valide")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(dict?.general?.errors?.fileTooLarge || "L'image doit faire moins de 5MB")
      return
    }

    setIsUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        
        await update({
          ...user,
          image: data.avatarUrl
        })
        
        await fetchUserProfile()
        
        toast.success(dict?.general?.success?.avatar || "Photo de profil mise à jour avec succès!")
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error(error instanceof Error ? error.message : dict?.general?.errors?.upload || "Erreur lors du téléchargement de l'image")
    } finally {
      setIsUploadingAvatar(false)
      if (avatarInputRef.current) {
        avatarInputRef.current.value = ''
      }
    }
  }

  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      toast.error(dict?.general?.errors?.invalidCVType || "Format non supporté. Utilisez PDF, DOC ou DOCX")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(dict?.general?.errors?.cvTooLarge || "Le CV doit faire moins de 10MB")
      return
    }

    setIsUploadingCV(true)

    try {
      const formData = new FormData()
      formData.append('cv', file)

      const response = await fetch('/api/users/cv', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        
        const cvData = data.cv ? {
          url: data.cv.url || '',
          fileName: data.cv.fileName || file.name,
          uploadedAt: data.cv.uploadedAt || new Date().toISOString(),
          fileSize: data.cv.fileSize || file.size,
          publicId: data.cv.publicId,
          fileType: data.cv.fileType
        } : null
        
        setFormData(prev => ({
          ...prev,
          cv: cvData
        }))
        
        toast.success(dict?.general?.success?.cvUpload || "CV téléchargé avec succès!")
        
        await fetchUserProfile()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading CV:', error)
      toast.error(error instanceof Error ? error.message : dict?.general?.errors?.cvUpload || "Erreur lors du téléchargement du CV")
    } finally {
      setIsUploadingCV(false)
      if (cvInputRef.current) {
        cvInputRef.current.value = ''
      }
      if (replaceCVInputRef.current) {
        replaceCVInputRef.current.value = ''
      }
    }
  }

  const handleDeleteCV = async () => {
    setIsDeletingCV(true)

    try {
      const response = await fetch('/api/users/cv', {
        method: 'DELETE',
      })

      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          cv: null
        }))
        
        toast.success(dict?.general?.success?.cvDelete || "CV supprimé avec succès!")
        
        await fetchUserProfile()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Delete failed')
      }
    } catch (error) {
      console.error('Error deleting CV:', error)
      toast.error(error instanceof Error ? error.message : dict?.general?.errors?.cvDelete || "Erreur lors de la suppression du CV")
    } finally {
      setIsDeletingCV(false)
    }
  }

  const handleDownloadCV = () => {
    if (formData.cv?.url) {
      window.open(formData.cv.url, '_blank')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

    return JSON.stringify(originalData) !== JSON.stringify({
      name: formData.name,
      email: formData.email,
      title: formData.title,
      bio: formData.bio,
      location: formData.location,
      socialLinks: formData.socialLinks
    })
  }

  const hasChanges = calculateFormChanges()

  const getCompletionLabel = () => {
    if (completionScore >= 80) return dict?.general?.completion?.excellent || "Excellent"
    if (completionScore >= 60) return dict?.general?.completion?.good || "Bon"
    return dict?.general?.completion?.needsImprovement || "À améliorer"
  }

  const isFreelancer = user?.role === 'freelance'

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* En-tête du profil */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-sm sm:text-base">{dict?.general?.publicProfile || "Profil Public"}</span>
            <Badge variant="outline" className={cn(
              "text-[10px] sm:text-xs w-fit",
              completionScore >= 80 
                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800"
                : completionScore >= 60
                ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800"
                : "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800"
            )}>
              {getCompletionLabel()}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {dict?.general?.publicProfileDesc || "Ces informations seront visibles par les autres utilisateurs"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Score de complétion */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-600 dark:text-slate-400">{dict?.general?.profileCompletion || "Complétion du profil"}</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{completionScore}%</span>
            </div>
            <Progress value={completionScore} className="h-1.5 sm:h-2 bg-slate-200 dark:bg-slate-800" />
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500">
              {dict?.general?.completionTip?.replace('{percent}', '40') || "Complétez votre profil pour augmenter votre visibilité de 40%"}
            </p>
          </div>

          {/* Photo de profil - Responsive */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="relative group">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-white dark:border-slate-900 shadow-lg">
                <AvatarImage src={user?.image} alt={formData.name} />
                <AvatarFallback className="text-xl sm:text-2xl bg-gradient-to-br from-blue-500 to-purple-600 font-semibold">
                  {formData.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm cursor-pointer"
                disabled={isUploadingAvatar}
              >
                <Edit className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </button>
              
              <input
                ref={avatarInputRef}
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploadingAvatar}
              />
              
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </div>
            
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                {dict?.general?.profilePhoto || "Photo de profil"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2">
                {dict?.general?.photoRequirements || "PNG, JPG jusqu'à 5MB"}
              </p>
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                disabled={isUploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                className="h-8 sm:h-9 px-2 sm:px-3"
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">
                  {isUploadingAvatar 
                    ? (dict?.common?.uploading || "Téléchargement...") 
                    : (dict?.general?.changePhoto || "Changer la photo")}
                </span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section CV pour les freelances - Responsive */}
      {isFreelancer && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              {dict?.general?.cvSection || "Curriculum Vitae (CV)"}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {dict?.general?.cvDescription || "Téléchargez votre CV pour augmenter vos chances d'être embauché. Les clients pourront voir votre parcours professionnel."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formData.cv && formData.cv.url ? (
              <div className="space-y-3 sm:space-y-4">
                {/* CV existant - Responsive */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                      <File className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
                        {formData.cv.fileName || 'CV.pdf'}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                        <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                          {formatFileSize(formData.cv.fileSize || 0)}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                          {formData.cv.uploadedAt 
                            ? new Date(formData.cv.uploadedAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')
                            : new Date().toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 text-[10px] sm:text-xs">
                          <CheckCircle className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                          {dict?.general?.uploaded || "Téléchargé"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadCV}
                      className="h-8 sm:h-9 px-2 sm:px-3"
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">{dict?.general?.download || "Télécharger"}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteCV}
                      disabled={isDeletingCV}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50 border-red-200 dark:border-red-800 h-8 sm:h-9 px-2 sm:px-3"
                    >
                      {isDeletingCV ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-red-600 border-t-transparent mr-1 sm:mr-2" />
                          <span className="text-xs sm:text-sm">{dict?.common?.deleting || "Suppression..."}</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="text-xs sm:text-sm">{dict?.general?.delete || "Supprimer"}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Remplacer le CV */}
                <div className="text-center">
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => replaceCVInputRef.current?.click()}
                    disabled={isUploadingCV}
                    className="h-8 sm:h-9 px-2 sm:px-3"
                  >
                    <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">
                      {isUploadingCV ? dict?.common?.uploading || "Téléchargement..." : (dict?.general?.replaceCV || "Remplacer le CV")}
                    </span>
                  </Button>
                  <input
                    ref={replaceCVInputRef}
                    id="cv-upload-replace"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleCVUpload}
                    disabled={isUploadingCV}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base mb-2">
                  {dict?.general?.noCV || "Aucun CV téléchargé"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 max-w-md mx-auto px-2">
                  {dict?.general?.cvBenefits || "Les freelances avec un CV ont 3 fois plus de chances d'être contactés par des clients"}
                </p>
                <Button 
                  type="button"
                  onClick={() => cvInputRef.current?.click()}
                  disabled={isUploadingCV}
                  className="h-8 sm:h-9 px-3 sm:px-4 bg-blue-600 hover:bg-blue-700"
                >
                  {isUploadingCV ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">{dict?.common?.uploading || "Téléchargement..."}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">{dict?.general?.uploadCV || "Télécharger mon CV"}</span>
                    </>
                  )}
                </Button>
                <input
                  ref={cvInputRef}
                  id="cv-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={handleCVUpload}
                  disabled={isUploadingCV}
                />
                <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-slate-500 dark:text-slate-500">
                  <span>📄 PDF</span>
                  <span>📝 DOC</span>
                  <span>📋 DOCX</span>
                  <span>⬆️ Max 10MB</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Formulaire d'information - Responsive */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">{dict?.general?.personalInfo || "Informations Personnelles"}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {dict?.general?.personalInfoDesc || "Mettez à jour vos informations personnelles et professionnelles"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="name" className="text-xs sm:text-sm font-medium">
                  {dict?.general?.fullName || "Nom Complet"} *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="border-slate-200 dark:border-slate-700 focus:border-blue-500 h-9 sm:h-10 text-sm"
                  placeholder={dict?.general?.fullNamePlaceholder || "Votre nom complet"}
                  required
                />
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="email" className="text-xs sm:text-sm font-medium">
                  {dict?.general?.email || "Email"} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="border-slate-200 dark:border-slate-700 focus:border-blue-500 bg-slate-50 dark:bg-slate-800 h-9 sm:h-10 text-sm"
                  placeholder={dict?.general?.emailPlaceholder || "votre@email.com"}
                  required
                  disabled
                />
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500">
                  {dict?.general?.emailNotEditable || "L'email ne peut pas être modifié"}
                </p>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="title" className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
                {dict?.general?.professionalTitle || "Titre Professionnel"}
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="border-slate-200 dark:border-slate-700 focus:border-blue-500 h-9 sm:h-10 text-sm"
                placeholder={dict?.general?.titlePlaceholder || "ex: Développeur Full-Stack Senior"}
                maxLength={100}
              />
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 text-right">
                {formData.title?.length || 0}/100 {dict?.common?.characters || "caractères"}
              </p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="bio" className="text-xs sm:text-sm font-medium">
                {dict?.general?.bio || "Bio"}
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
                className="border-slate-200 dark:border-slate-700 focus:border-blue-500 resize-none text-sm"
                placeholder={dict?.general?.bioPlaceholder || "Décrivez votre expérience, vos compétences et vos spécialités..."}
                maxLength={500}
              />
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 text-right">
                {formData.bio?.length || 0}/500 {dict?.common?.characters || "caractères"}
              </p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="location" className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                {dict?.general?.location || "Localisation"}
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="border-slate-200 dark:border-slate-700 focus:border-blue-500 h-9 sm:h-10 text-sm"
                placeholder={dict?.general?.locationPlaceholder || "Ville, Pays"}
                maxLength={50}
              />
            </div>

            {/* Liens sociaux - Responsive grid */}
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                {dict?.general?.socialLinks || "Liens Sociaux"}
              </h4>
              
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                    {dict?.general?.website || "Site Web"}
                  </Label>
                  <Input
                    id="website"
                    value={formData.socialLinks?.website || ""}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, website: e.target.value }
                    }))}
                    className="border-slate-200 dark:border-slate-700 focus:border-blue-500 h-9 sm:h-10 text-sm"
                    placeholder={dict?.general?.websitePlaceholder || "https://votre-site.com"}
                    type="url"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <Linkedin className="h-3 w-3 sm:h-4 sm:w-4" />
                    LinkedIn
                  </Label>
                  <Input
                    id="linkedin"
                    value={formData.socialLinks?.linkedin || ""}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                    }))}
                    className="border-slate-200 dark:border-slate-700 focus:border-blue-500 h-9 sm:h-10 text-sm"
                    placeholder={dict?.general?.linkedinPlaceholder || "https://linkedin.com/in/username"}
                    type="url"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github" className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <Github className="h-3 w-3 sm:h-4 sm:w-4" />
                    GitHub
                  </Label>
                  <Input
                    id="github"
                    value={formData.socialLinks?.github || ""}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, github: e.target.value }
                    }))}
                    className="border-slate-200 dark:border-slate-700 focus:border-blue-500 h-9 sm:h-10 text-sm"
                    placeholder={dict?.general?.githubPlaceholder || "https://github.com/username"}
                    type="url"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter" className="text-xs sm:text-sm font-medium flex items-center gap-2">
                    <Twitter className="h-3 w-3 sm:h-4 sm:w-4" />
                    Twitter
                  </Label>
                  <Input
                    id="twitter"
                    value={formData.socialLinks?.twitter || ""}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                    }))}
                    className="border-slate-200 dark:border-slate-700 focus:border-blue-500 h-9 sm:h-10 text-sm"
                    placeholder={dict?.general?.twitterPlaceholder || "https://twitter.com/username"}
                    type="url"
                  />
                </div>
              </div>
            </div>

            {/* Boutons d'action - Responsive */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button 
                type="submit" 
                disabled={loading || !hasChanges}
                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed h-9 sm:h-10 px-3 sm:px-4"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">{dict?.common?.saving || "Enregistrement..."}</span>
                  </>
                ) : (
                  <span className="text-xs sm:text-sm">{dict?.common?.saveChanges || "Enregistrer les modifications"}</span>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={fetchUserProfile}
                disabled={loading || !hasChanges}
                className="h-9 sm:h-10 px-3 sm:px-4"
              >
                <span className="text-xs sm:text-sm">{dict?.common?.cancel || "Annuler"}</span>
              </Button>
              
              {!hasChanges && (
                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 text-[10px] sm:text-xs px-2 py-1 w-fit">
                  {dict?.common?.noChanges || "Aucune modification"}
                </Badge>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}