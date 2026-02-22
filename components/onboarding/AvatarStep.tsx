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
  dict: any // Dictionnaire pour cette étape
  lang: string
}

export function AvatarStep({ onComplete, onSkip, dict, lang }: AvatarStepProps) {
  const { data: session, update } = useSession()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error(dict.errors?.invalidImage || 'Veuillez sélectionner une image valide')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error(dict.errors?.fileTooLarge || 'L\'image ne doit pas dépasser 5MB')
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

      const response = await fetch('/api/users/avatar', {
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
        
        toast.success(dict.success || 'Photo de profil mise à jour avec succès!')
        onComplete()
      } else {
        throw new Error('Erreur lors du téléchargement')
      }
    } catch (error) {
      console.error('Erreur upload:', error)
      toast.error(dict.errors?.upload || 'Erreur lors du téléchargement de l\'image')
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
            <CardTitle>{dict.title}</CardTitle>
            <CardDescription>
              {dict.description}
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
                      {dict.clickToUpload}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-500">
                      {dict.requirements}
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
                    {dict.uploading}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {dict.confirm}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onSkip}>
                {dict.skip}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conseils */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {dict.tipsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              {dict.tips?.map((tip: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}