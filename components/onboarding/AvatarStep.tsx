// components/onboarding/AvatarStep.tsx
'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, User, Camera, CheckCircle, X } from 'lucide-react'
import { toast } from 'sonner'

interface AvatarStepProps {
  onComplete: () => void
  onSkip: () => void
}

export function AvatarStep({ onComplete, onSkip }: AvatarStepProps) {
  const { data: session, update } = useSession()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image valide')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5MB')
        return
      }

      setSelectedImage(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleUpload = async () => {
    if (!selectedImage || !session?.user) return

    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('avatar', selectedImage)

      const response = await fetch('/api/users/upload-avatar', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        
        await update({
          ...session,
          user: {
            ...session.user,
            image: data.avatarUrl
          }
        })
        
        toast.success('Photo de profil mise à jour avec succès!')
        onComplete()
      } else {
        throw new Error('Erreur lors du téléchargement')
      }
    } catch (error) {
      console.error('Erreur upload:', error)
      toast.error('Erreur lors du téléchargement de l\'image')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setPreviewUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Zone de téléchargement */}
        <Card>
          <CardHeader>
            <CardTitle>Ajouter une photo</CardTitle>
            <CardDescription>
              Téléchargez une photo pour personnaliser votre profil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              
              {previewUrl ? (
                <div className="relative">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-lg">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeImage()
                    }}
                    className="absolute top-0 right-1/2 translate-x-12 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto">
                    <User className="h-10 w-10 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Cliquez pour ajouter une photo
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-500">
                      PNG, JPG jusqu'à 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={!selectedImage || uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmer
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onSkip}>
                Passer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conseils */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Conseils pour une bonne photo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                <span>Visage bien visible et éclairé</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                <span>Fond neutre et professionnel</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                <span>Format carré recommandé</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                <span>Sourire toujours apprécié 😊</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}