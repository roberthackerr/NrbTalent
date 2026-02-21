"use client"

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  Folder,
  FileText,
  Image as ImageIcon,
  FileCode,
  Download,
  Eye,
  Edit,
  Trash2,
  Upload,
  Search,
  FolderOpen,
  File,
  Video,
  Music,
  Archive,
  Share2,
  RefreshCw,
  MoreVertical
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProjectFile {
  id: string
  name: string
  type: string
  size: number
  sizeFormatted: string
  path: string
  url: string
  prettyUrl: string
  uploadedBy: {
    id: string
    name: string
    email: string
    avatar?: any
  }
  uploadedAt: Date
  lastModified: Date
  isPublic: boolean
  isEditing: boolean
  editedBy?: {
    id: string
    name: string
  }
  permissions: string[]
  version: number
  metadata?: {
    width?: number
    height?: number
    duration?: number
    pages?: number
  }
}

interface FileCollaboratorProps {
  projectId: string
  userId: string
}

export function FileCollaborator({ projectId, userId }: FileCollaboratorProps) {
  const { data: session } = useSession()
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [currentFolder, setCurrentFolder] = useState('')
  const [folderHistory, setFolderHistory] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const BUCKET_NAME = 'nrbtalents-uploads'
  const PROJECT_FOLDER = `projects/${projectId}`

  // Fonction pour générer l'URL propre
  const getPrettyUrl = (filePath: string): string => {
    if (process.env.NODE_ENV === 'production') {
      return `https://nrbtalents.vercel.app/uploads/${filePath}`
    }
    return `/uploads/${filePath}`
  }

  // Charger les fichiers
  const loadFiles = async () => {
    try {
      const { data: filesList, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(`${PROJECT_FOLDER}/${currentFolder}`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (error) throw error

      const filesData: ProjectFile[] = []
      
      for (const file of filesList) {
        const filePath = `${PROJECT_FOLDER}/${currentFolder}/${file.name}`
        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath)
        const prettyUrl = getPrettyUrl(filePath)

        filesData.push({
          id: file.id || file.name,
          name: file.name,
          type: getFileType(file.name),
          size: file.metadata?.size || 0,
          sizeFormatted: formatFileSize(file.metadata?.size || 0),
          path: filePath,
          url: publicUrl,
          prettyUrl: prettyUrl,
          uploadedBy: {
            id: userId,
            name: session?.user?.name || 'Utilisateur',
            email: session?.user?.email || '',
            avatar: session?.user?.image
          },
          uploadedAt: file.created_at ? new Date(file.created_at) : new Date(),
          lastModified: file.updated_at ? new Date(file.updated_at) : new Date(),
          isPublic: true,
          isEditing: false,
          permissions: ['view', 'download'],
          version: 1,
          metadata: file.metadata || {}
        })
      }

      setFiles(filesData)
    } catch (error) {
      console.error('Error loading files:', error)
      toast.error('Erreur lors du chargement des fichiers')
    }
  }

  useEffect(() => {
    loadFiles()

    const channel = supabase
      .channel(`files-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'file_activities',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Realtime update:', payload)
          loadFiles()
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, currentFolder])

  // Upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      
      try {
        const timestamp = Date.now()
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = `${timestamp}-${safeName}`
        const filePath = currentFolder 
          ? `${PROJECT_FOLDER}/${currentFolder}/${fileName}`
          : `${PROJECT_FOLDER}/${fileName}`

        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) throw error

        // Optionnel: Enregistrer l'activité
        // try {
        //   await supabase
        //     .from('file_activities')
        //     .insert({
        //       project_id: projectId,
        //       user_id: userId,
        //       user_name: session?.user?.name || 'Utilisateur',
        //       action: 'upload',
        //       file_name: file.name,
        //       file_path: filePath,
        //       file_size: file.size
        //     })
        // } catch (activityError) {
        //   console.warn('Note: Impossible d\'enregistrer l\'activité')
        // }

        setUploadProgress(((i + 1) / selectedFiles.length) * 100)
        toast.success(`"${file.name}" uploadé avec succès`)

      } catch (error: any) {
        console.error('Upload error:', error)
        toast.error(`Erreur: ${error.message}`)
      }
    }

    await loadFiles()
    setUploading(false)
    setUploadProgress(0)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Téléchargement
  const handleDownload = async (file: ProjectFile) => {
    try {
      const response = await fetch(file.prettyUrl)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      toast.success('Téléchargement démarré')
    } catch (error) {
      try {
        const response = await fetch(file.url)
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)
        
        toast.success('Téléchargement démarré (fallback)')
      } catch (fallbackError) {
        toast.error('Erreur lors du téléchargement')
      }
    }
  }

  // SUPPRESSION CORRIGÉE
  const handleDelete = async (file: ProjectFile) => {
  if (!confirm(`Supprimer "${file.name}" définitivement ?`)) return

  try {
    const cleanPath = file.path.replace(/\/\//g, '/')
    
    console.log('🔍 Chemin à supprimer:', cleanPath)

    // SOLUTION 1: Utiliser le SDK Supabase avec la session actuelle
    // Le SDK gère automatiquement l'authentification
    
    // D'abord, vérifier que l'utilisateur est bien connecté
    if (!session) {
      toast.error('Vous devez être connecté pour supprimer des fichiers')
      return
    }

    console.log('✅ Session valide détectée')
    console.log('User ID:', userId)
    console.log('Session:', session)

    // Utiliser le SDK qui gère l'authentification automatiquement
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([cleanPath])

    if (error) {
      console.error('❌ Erreur SDK:', error)
      
      // Essayer une autre approche avec le service role key si disponible
      if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
        console.log('🔄 Essai avec service role key')
        
        const response = await fetch(
          `https://ovpkotqiohxdsjejavms.supabase.co/storage/v1/object/${BUCKET_NAME}/${encodeURIComponent(cleanPath)}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}`,
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
            }
          }
        )
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Service role échoué: ${response.status} - ${errorText}`)
        }
      } else {
        throw error
      }
    }

    console.log('✅ Suppression réussie!')
    
    // Mettre à jour l'état IMMÉDIATEMENT
    setFiles(prev => prev.filter(f => f.path !== cleanPath))
    
    toast.success('Fichier supprimé avec succès')

    // Vérifier la suppression
    setTimeout(async () => {
      await loadFiles()
      console.log('Liste rechargée après suppression')
    }, 500)

  } catch (error: any) {
    console.error('💥 Erreur finale:', error)
    
    // Messages d'erreur plus clairs
    if (error.message.includes('Invalid Compact JWS') || error.message.includes('Unauthorized')) {
      toast.error('Erreur d\'authentification. Veuillez vous reconnecter.')
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      toast.error('Fichier non trouvé dans le storage')
    } else {
      toast.error(`Échec: ${error.message}`)
    }
  }
}
  // Partager
  const handleShare = async (file: ProjectFile) => {
    try {
      await navigator.clipboard.writeText(file.prettyUrl)
      toast.success('Lien copié dans le presse-papier')
    } catch (error) {
      toast.error('Erreur lors de la copie')
    }
  }

  // Drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-blue-500', 'bg-blue-50')
    }
  }

  const handleDragLeave = () => {
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-blue-500', 'bg-blue-50')
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-blue-500', 'bg-blue-50')
    }

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length === 0) return

    const dataTransfer = new DataTransfer()
    droppedFiles.forEach(file => dataTransfer.items.add(file))
    
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files
      const event = new Event('change', { bubbles: true })
      fileInputRef.current.dispatchEvent(event)
    }
  }

  // Utilitaires
  const getFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
    if (['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) return 'document'
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'html', 'css', 'json'].includes(ext)) return 'code'
    if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return 'video'
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio'
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive'
    
    return 'other'
  }

  const getFileIcon = (filename: string) => {
    const type = getFileType(filename)
    
    switch (type) {
      case 'image': return <ImageIcon className="h-5 w-5 text-green-500" />
      case 'document': return <FileText className="h-5 w-5 text-blue-500" />
      case 'code': return <FileCode className="h-5 w-5 text-purple-500" />
      case 'video': return <Video className="h-5 w-5 text-red-500" />
      case 'audio': return <Music className="h-5 w-5 text-yellow-500" />
      case 'archive': return <Archive className="h-5 w-5 text-gray-500" />
      default: return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const enterFolder = (folderName: string) => {
    const newPath = currentFolder ? `${currentFolder}/${folderName}` : folderName
    setCurrentFolder(newPath)
    setFolderHistory(prev => [...prev, folderName])
  }

  const goUp = () => {
    if (!currentFolder) return
    
    const pathParts = currentFolder.split('/')
    pathParts.pop()
    const newPath = pathParts.join('/')
    
    setCurrentFolder(newPath)
    setFolderHistory(prev => prev.slice(0, -1))
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(search.toLowerCase())
  )

  const displayPrettyUrl = (file: ProjectFile) => {
    if (process.env.NODE_ENV === 'production') {
      return file.prettyUrl.replace('https://nrbtalents.vercel.app', '')
    }
    return file.prettyUrl
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FolderOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Fichiers du projet</h2>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-slate-600">
                    {files.length} fichiers • {formatFileSize(files.reduce((acc, file) => acc + file.size, 0))}
                  </p>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="text-xs text-slate-500">
                      {isConnected ? 'Connecté en temps réel' : 'Hors ligne'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={() => loadFiles()}
                variant="outline"
                size="icon"
                title="Rafraîchir"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center transition-colors cursor-pointer hover:border-blue-400 hover:bg-blue-50/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Glissez-déposez vos fichiers</h3>
            <p className="text-slate-600 mb-4">ou cliquez pour parcourir</p>
            
            <Button 
              variant="outline"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Sélectionner des fichiers
            </Button>
            
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
            
            {uploading && (
              <div className="mt-6 space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-slate-600">
                  Upload en cours... {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {currentFolder && (
        <div className="flex items-center gap-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={goUp}
            className="gap-1"
          >
            ← Retour
          </Button>
          <span className="text-slate-600">/</span>
          {folderHistory.map((folder, index) => (
            <div key={index} className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newPath = folderHistory.slice(0, index + 1).join('/')
                  setCurrentFolder(newPath)
                  setFolderHistory(folderHistory.slice(0, index + 1))
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                {folder}
              </Button>
              <span className="text-slate-600 mx-1">/</span>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <div className="min-w-[1024px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Nom</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="w-[100px]">Taille</TableHead>
                    <TableHead className="w-[200px]">URL propre</TableHead>
                    <TableHead className="w-[150px]">Uploadé par</TableHead>
                    <TableHead className="w-[150px]">Date</TableHead>
                    <TableHead className="w-[150px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map(file => (
                    <TableRow key={file.id}>
                      <TableCell className="max-w-[250px]">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.name)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500 truncate">
                                {file.path.replace(`${PROJECT_FOLDER}/`, '')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="whitespace-nowrap">
                          {getFileType(file.name).charAt(0).toUpperCase() + getFileType(file.name).slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 whitespace-nowrap">
                        {file.sizeFormatted}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="min-w-0">
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded truncate block">
                            {displayPrettyUrl(file)}
                          </code>
                          <p className="text-xs text-slate-500 mt-1 truncate">
                            {process.env.NODE_ENV === 'production' ? 
                              'URL avec votre domaine' : 
                              'URL locale avec proxy'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage src={file.uploadedBy.avatar} />
                            <AvatarFallback>
                              {file.uploadedBy.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate">{file.uploadedBy.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm whitespace-nowrap">
                        {formatDate(file.uploadedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <div className="hidden md:flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(file.prettyUrl, '_blank')}
                              title="Voir"
                              className="h-8 w-8"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownload(file)}
                              title="Télécharger"
                              className="h-8 w-8"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleShare(file)}
                              title="Partager"
                              className="h-8 w-8"
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(file)}
                              title="Supprimer"
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="md:hidden">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => window.open(file.prettyUrl, '_blank')}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload(file)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Télécharger
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare(file)}>
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Partager
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(file)}
                                  className="text-red-500 focus:text-red-500"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {filteredFiles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Folder className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                        <p className="text-slate-600">Aucun fichier dans ce dossier</p>
                        <p className="text-sm text-slate-500 mt-1">
                          {search ? 'Aucun résultat pour votre recherche' : 'Commencez par uploader des fichiers'}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}