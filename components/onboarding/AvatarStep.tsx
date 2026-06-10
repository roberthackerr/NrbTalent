// components/onboarding/AvatarStep.tsx

'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Upload, User, Camera, CheckCircle, X, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface AvatarStepProps {
  onComplete: () => void
  onSkip: () => void
  dict: any
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
        toast.error(dict.errors?.invalidImage || 'Please select a valid image')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error(dict.errors?.fileTooLarge || 'Image must be less than 5MB')
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
            image: data.avatarUrl,
            avatar: data.avatarUrl
          }
        })
        
        toast.success(dict.success || 'Photo updated!')
        onComplete()
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(dict.errors?.upload || 'Error uploading image')
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
    <div>
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Upload Area */}
        <div className="flex-shrink-0 w-full sm:w-auto">
          <div 
            className="relative group cursor-pointer"
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
              <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-white dark:ring-gray-700 shadow-lg">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      fileInputRef.current?.click()
                    }}
                    className="p-1.5 bg-white rounded-full hover:bg-gray-100"
                  >
                    <Camera className="h-3 w-3 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeImage()
                    }}
                    className="p-1.5 bg-red-500 rounded-full hover:bg-red-600"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex flex-col items-center justify-center cursor-pointer hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all">
                <Upload className="h-6 w-6 text-gray-400 mb-1" />
                <span className="text-[10px] text-gray-500">Upload</span>
              </div>
            )}
          </div>
        </div>

        {/* Tips and Actions */}
        <div className="flex-1 space-y-4">
          {/* Tips */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              {dict.tipsTitle || "Quick tips"}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(dict.tips || [
                "Clear face",
                "Good lighting",
                "Recent photo",
                "Professional look"
              ]).slice(0, 4).map((tip: string, index: number) => (
                <div key={index} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="w-1 h-1 bg-blue-500 rounded-full" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!selectedImage || uploading}
              size="sm"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {uploading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {dict.uploading || "Uploading..."}
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-2" />
                  {selectedImage ? (dict.confirm || "Confirm") : (dict.upload || "Upload")}
                </>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={onSkip}
              size="sm"
              className="text-gray-600"
            >
              {dict.skip || "Skip"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}