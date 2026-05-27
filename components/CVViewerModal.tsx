// components/CVViewerModal.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Eye, FileText, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface CVViewerModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
  dict: any
}

export function CVViewerModal({ isOpen, onClose, userId, userName, dict }: CVViewerModalProps) {
  const [cvData, setCvData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      fetchCV()
    }
  }, [isOpen, userId])

  const fetchCV = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Use the correct endpoint with userId
      const response = await fetch(`/api/users/${userId}/cv`)
      
      if (response.ok) {
        const data = await response.json()
        setCvData(data.cv)
      } else if (response.status === 404) {
        const errorData = await response.json()
        setError(errorData.error || dict?.profile?.noCVAvailable || "Ce freelance n'a pas encore téléchargé de CV")
      } else {
        throw new Error("Failed to fetch CV")
      }
    } catch (error) {
      console.error("Error fetching CV:", error)
      setError(dict?.profile?.cvFetchError || "Impossible de charger le CV")
      toast.error(dict?.profile?.cvFetchError || "Erreur lors du chargement du CV")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (cvData?.url) {
      window.open(cvData.url, '_blank')
      toast.success(dict?.profile?.downloadStarted || "Téléchargement démarré")
    }
  }

  const handleView = () => {
    if (cvData?.url) {
      window.open(cvData.url, '_blank')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            {dict?.profile?.cvOf || "CV de"} {userName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {dict?.profile?.loadingCV || "Chargement du CV..."}
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCV}
                className="mt-2"
              >
                {dict?.common?.retry || "Réessayer"}
              </Button>
            </div>
          ) : cvData ? (
            <>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {cvData.fileName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatFileSize(cvData.fileSize)} • {cvData.uploadedAt ? new Date(cvData.uploadedAt).toLocaleDateString() : 'Date inconnue'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleView}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {dict?.profile?.viewCV || "Voir le CV"}
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {dict?.profile?.downloadCV || "Télécharger"}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-center text-slate-500 dark:text-slate-400">
                {dict?.profile?.cvPrivacy || "Le CV est confidentiel et ne sera utilisé que pour l'évaluation de votre candidature"}
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}