// app/test-storage/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, STORAGE_BUCKET } from '@/lib/supabase' // <-- CORRECTION ICI
import { 
  Upload, 
  Download, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  FolderOpen,
  Image,
  FileText,
  Video,
  Music,
  RefreshCw,
  ExternalLink,
  Copy,
  AlertTriangle
} from 'lucide-react'

export default function TestStoragePage() {
  // États
  const [buckets, setBuckets] = useState<any[]>([])
  const [currentBucket, setCurrentBucket] = useState<string>(STORAGE_BUCKET) // <-- Utilisez votre bucket par défaut
  const [files, setFiles] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [folderPath, setFolderPath] = useState<string>('')
  const [folderHistory, setFolderHistory] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Charger les buckets au démarrage
  useEffect(() => {
    loadBuckets()
  }, [])

  // Charger les fichiers quand le bucket change
  useEffect(() => {
    if (currentBucket) {
      loadFiles(currentBucket, folderPath)
    }
  }, [currentBucket, folderPath])

  // Charger la liste des buckets
  const loadBuckets = async () => {
    try {
      setLoading(true)
      setConnectionStatus('checking')
      
      const { data, error } = await supabase.storage.listBuckets()
      
      if (error) {
        console.error('Erreur Supabase:', error)
        setError(`Erreur API: ${error.message}`)
        setConnectionStatus('error')
        return
      }
      
      setBuckets(data || [])
      setConnectionStatus('connected')
      
      // Vérifier si votre bucket existe
      const yourBucket = data?.find(b => b.name === STORAGE_BUCKET)
      
      if (yourBucket) {
        setCurrentBucket(STORAGE_BUCKET)
        setSuccess(`✅ Bucket "${STORAGE_BUCKET}" trouvé et sélectionné`)
      } else if (data && data.length > 0) {
        // Utiliser un autre bucket si disponible
        setCurrentBucket(data[0].name)
        setError(`⚠️ Bucket "${STORAGE_BUCKET}" non trouvé. Utilisation de "${data[0].name}"`)
      }
      
    } catch (err: any) {
      console.error('Erreur chargement buckets:', err)
      setError(`Erreur: ${err.message}`)
      setConnectionStatus('error')
    } finally {
      setLoading(false)
    }
  }

  // Charger les fichiers d'un bucket
  const loadFiles = async (bucket: string, path: string = '') => {
    try {
      setLoading(true)
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        })
      
      if (error) throw error
      
      setFiles(data || [])
      setError('')
    } catch (err: any) {
      setError(`Erreur chargement fichiers: ${err.message}`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // MODIFIEZ la fonction createBucket pour éviter l'erreur RLS
  const createBucket = async (bucketName: string, isPublic: boolean = true) => {
    setError('❌ Impossible de créer un bucket avec la clé publique (RLS policy).')
    setSuccess('Utilisez le dashboard Supabase pour créer des buckets:')
    
    // Ouvrir le dashboard
    window.open(
      `https://app.supabase.com/project/ovpkotqiohxdsjejavms/storage`,
      '_blank'
    )
    
    // Optionnel: message avec instructions
    setTimeout(() => {
      setSuccess(`Créez le bucket "${bucketName}" dans le dashboard, puis rafraîchissez cette page.`)
    }, 2000)
  }

  // Upload un fichier
  const uploadFile = async () => {
    if (!selectedFile || !currentBucket) {
      setError('Sélectionnez un fichier et un bucket')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    
    try {
      // Simuler la progression
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      // Générer un nom de fichier unique avec structure de dossiers
      const timestamp = Date.now()
      const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      
      // Créer une structure organisée
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      
      const filePath = folderPath 
        ? `${folderPath}/${timestamp}-${safeFileName}`
        : `${year}/${month}/${day}/${timestamp}-${safeFileName}`

      // Upload
      const { data, error } = await supabase.storage
        .from(currentBucket)
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (error) {
        if (error.message.includes('Bucket not found')) {
          throw new Error(`Bucket "${currentBucket}" non trouvé. Créez-le via le dashboard.`)
        }
        throw error
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(currentBucket)
        .getPublicUrl(data.path)

      setUploadedUrls(prev => [...prev, publicUrl])
      setSuccess(`✅ Fichier uploadé avec succès!`)
      
      // Recharger la liste
      await loadFiles(currentBucket, folderPath)
      setSelectedFile(null)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(`❌ Erreur upload: ${err.message}`)
      console.error(err)
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  // Télécharger un fichier
  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(currentBucket)
        .download(filePath)
      
      if (error) throw error
      
      // Créer un lien de téléchargement
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setSuccess(`📥 Téléchargement de "${fileName}" démarré`)
    } catch (err: any) {
      setError(`❌ Erreur téléchargement: ${err.message}`)
    }
  }

  // Supprimer un fichier
  const deleteFile = async (filePath: string, fileName: string) => {
    if (!confirm(`Supprimer "${fileName}" ? Cette action est irréversible.`)) return
    
    try {
      const { data, error } = await supabase.storage
        .from(currentBucket)
        .remove([filePath])
      
      if (error) throw error
      
      setSuccess(`🗑️ Fichier "${fileName}" supprimé`)
      loadFiles(currentBucket, folderPath)
    } catch (err: any) {
      setError(`❌ Erreur suppression: ${err.message}`)
    }
  }

  // Entrer dans un dossier
  const enterFolder = (folderName: string) => {
    const newPath = folderPath ? `${folderPath}/${folderName}` : folderName
    setFolderPath(newPath)
    setFolderHistory(prev => [...prev, folderName])
  }

  // Remonter d'un niveau
  const goUp = () => {
    if (!folderPath) return
    
    const pathParts = folderPath.split('/')
    pathParts.pop()
    const newPath = pathParts.join('/')
    
    setFolderPath(newPath)
    setFolderHistory(prev => prev.slice(0, -1))
  }

  // Obtenir l'icône pour un fichier
  const getFileIcon = (fileName: string, isFolder: boolean = false) => {
    if (isFolder) return <FolderOpen className="h-5 w-5 text-blue-500" />
    
    const ext = fileName.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return <Image className="h-5 w-5 text-green-500" />
    } else if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '')) {
      return <FileText className="h-5 w-5 text-red-500" />
    } else if (['mp4', 'mov', 'avi', 'webm'].includes(ext || '')) {
      return <Video className="h-5 w-5 text-purple-500" />
    } else if (['mp3', 'wav', 'ogg'].includes(ext || '')) {
      return <Music className="h-5 w-5 text-yellow-500" />
    }
    
    return <FileText className="h-5 w-5 text-gray-500" />
  }

  // Copier une URL
  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setSuccess('📋 URL copiée dans le presse-papier!')
  }

  // Formater la taille des fichiers
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Indicateur de connexion
  const ConnectionIndicator = () => (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
      connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
      connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
      'bg-yellow-100 text-yellow-800'
    }`}>
      {connectionStatus === 'connected' && <CheckCircle className="h-3 w-3" />}
      {connectionStatus === 'error' && <AlertTriangle className="h-3 w-3" />}
      {connectionStatus === 'checking' && <RefreshCw className="h-3 w-3 animate-spin" />}
      
      {connectionStatus === 'connected' ? 'Connecté' :
       connectionStatus === 'error' ? 'Erreur' : 'Connexion...'}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              🧪 Supabase Storage Tester
            </h1>
            <ConnectionIndicator />
          </div>
          <p className="text-gray-600">
            Projet: <code className="bg-gray-100 px-2 py-1 rounded">ovpkotqiohxdsjejavms.supabase.co</code>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Bucket cible: <code className="font-medium">{STORAGE_BUCKET}</code>
          </p>
        </div>

        {/* Messages d'alerte */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 font-medium">{error}</p>
              {error.includes('Bucket not found') && (
                <button
                  onClick={() => window.open('https://app.supabase.com/project/ovpkotqiohxdsjejavms/storage', '_blank')}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Créer le bucket dans le dashboard
                </button>
              )}
            </div>
            <button 
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700 flex-shrink-0"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
            <button 
              onClick={() => setSuccess('')}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche: Buckets et Upload */}
          <div className="lg:col-span-1 space-y-6">
            {/* Section Buckets */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  📦 Buckets
                  <button 
                    onClick={loadBuckets}
                    disabled={loading}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                    title="Rafraîchir"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </h2>
                <span className="text-sm text-gray-500">
                  {buckets.length} bucket(s)
                </span>
              </div>

              {/* Liste des buckets */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {buckets.map(bucket => (
                  <button
                    key={bucket.id}
                    onClick={() => {
                      setCurrentBucket(bucket.name)
                      setFolderPath('')
                      setFolderHistory([])
                    }}
                    className={`w-full p-3 rounded-lg text-left flex items-center justify-between transition-colors ${
                      currentBucket === bucket.name 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    disabled={loading}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${bucket.public ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="font-medium">{bucket.name}</p>
                        <p className="text-xs text-gray-500">
                          {bucket.public ? 'Public' : 'Privé'}
                          {bucket.name === STORAGE_BUCKET && ' • Votre bucket'}
                        </p>
                      </div>
                    </div>
                    {currentBucket === bucket.name && (
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    )}
                  </button>
                ))}
              </div>

              {/* Créer un nouveau bucket - MODIFIÉ */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-3">Créer un bucket</h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Les buckets doivent être créés via le dashboard Supabase.
                  </p>
                  <button
                    onClick={() => window.open(
                      'https://app.supabase.com/project/ovpkotqiohxdsjejavms/storage',
                      '_blank'
                    )}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ouvrir le Dashboard Supabase
                  </button>
                </div>
              </div>
            </div>

            {/* Section Upload */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload de fichier
              </h2>

              {/* Bucket sélectionné */}
              {currentBucket && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Bucket actuel:</p>
                      <p className="font-medium">{currentBucket}</p>
                    </div>
                    {currentBucket === STORAGE_BUCKET && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Votre bucket
                      </span>
                    )}
                  </div>
                  {folderPath && (
                    <p className="text-sm text-gray-500 mt-1">
                      Dossier: <code className="bg-white px-1 rounded">{folderPath}</code>
                    </p>
                  )}
                </div>
              )}

              {/* Sélection de fichier */}
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="font-medium mb-1">Glissez-déposez votre fichier</p>
                  <p className="text-sm text-gray-500 mb-3">ou</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-gray-100 file:text-gray-700
                      hover:file:bg-gray-200"
                    disabled={!currentBucket}
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Max 50MB • Images, PDF, Documents
                  </p>
                </div>

                {/* Fichier sélectionné */}
                {selectedFile && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getFileIcon(selectedFile.name)}
                        <div>
                          <p className="font-medium text-sm truncate max-w-[200px]">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(selectedFile.size)} • {selectedFile.type}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Progression */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-center text-gray-600">
                      Upload en cours... {uploadProgress}%
                    </p>
                  </div>
                )}

                {/* Bouton Upload */}
                <button
                  onClick={uploadFile}
                  disabled={!selectedFile || !currentBucket || uploading}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload vers {currentBucket}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Colonne droite: Explorateur de fichiers */}
          <div className="lg:col-span-2 space-y-6">
            {/* Explorer de fichiers */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  📁 Fichiers dans <code>{currentBucket}</code>
                  {currentBucket && (
                    <span className="text-sm font-normal text-gray-500">
                      ({files.length} élément{files.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  {folderPath && (
                    <button
                      onClick={goUp}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
                      disabled={loading}
                    >
                      ↑ Retour
                    </button>
                  )}
                  <button 
                    onClick={() => loadFiles(currentBucket, folderPath)}
                    disabled={loading}
                    className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                    title="Rafraîchir"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Chemin actuel */}
              {folderHistory.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center gap-2 flex-wrap">
                  <span className="text-gray-500">Chemin:</span>
                  <button 
                    onClick={() => {
                      setFolderPath('')
                      setFolderHistory([])
                    }}
                    className="text-blue-500 hover:text-blue-700 text-sm"
                  >
                    {currentBucket}
                  </button>
                  {folderHistory.map((folder, index) => (
                    <span key={index} className="flex items-center">
                      <span className="mx-1 text-gray-300">/</span>
                      <button 
                        onClick={() => {
                          const newPath = folderHistory.slice(0, index + 1).join('/')
                          setFolderPath(newPath)
                          setFolderHistory(folderHistory.slice(0, index + 1))
                        }}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        {folder}
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Liste des fichiers */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">Chargement...</p>
                  </div>
                ) : files.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Aucun fichier dans ce dossier</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {currentBucket ? 'Uploader un fichier pour commencer' : 'Sélectionnez un bucket'}
                    </p>
                    {currentBucket && currentBucket !== STORAGE_BUCKET && (
                      <button
                        onClick={() => setCurrentBucket(STORAGE_BUCKET)}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                      >
                        Utiliser mon bucket ({STORAGE_BUCKET})
                      </button>
                    )}
                  </div>
                ) : (
                  files.map((file) => (
                    <div
                      key={file.id || file.name}
                      className="p-3 border rounded-lg hover:bg-gray-50 group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.name, !file.id)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          {file.metadata && (
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.metadata.size)}
                              {file.metadata.mimetype && ` • ${file.metadata.mimetype}`}
                              {file.metadata.last_modified && ` • ${new Date(file.metadata.last_modified).toLocaleDateString()}`}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!file.id ? (
                          // Dossier
                          <button
                            onClick={() => enterFolder(file.name)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                            title="Ouvrir le dossier"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        ) : (
                          // Fichier
                          <>
                            <button
                              onClick={() => {
                                const fullPath = folderPath ? `${folderPath}/${file.name}` : file.name
                                downloadFile(fullPath, file.name)
                              }}
                              className="p-2 text-green-500 hover:bg-green-50 rounded-lg"
                              title="Télécharger"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const fullPath = folderPath ? `${folderPath}/${file.name}` : file.name
                                const url = supabase.storage
                                  .from(currentBucket)
                                  .getPublicUrl(fullPath).data.publicUrl
                                copyUrl(url)
                              }}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                              title="Copier l'URL"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const fullPath = folderPath ? `${folderPath}/${file.name}` : file.name
                                deleteFile(fullPath, file.name)
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* URLs uploadées */}
            {uploadedUrls.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">🔗 URLs générées</h2>
                  <button
                    onClick={() => setUploadedUrls([])}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Effacer la liste
                  </button>
                </div>
                <div className="space-y-3">
                  {uploadedUrls.map((url, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Fichier {index + 1}</span>
                        <div className="flex items-center gap-2">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:text-blue-700 flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ouvrir
                          </a>
                          <button
                            onClick={() => copyUrl(url)}
                            className="text-sm text-blue-500 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Copy className="h-3 w-3" />
                            Copier
                          </button>
                        </div>
                      </div>
                      <code className="block text-sm bg-white p-2 rounded border break-all font-mono">
                        {url}
                      </code>
                      {url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) && (
                        <div className="mt-2">
                          <img 
                            src={url} 
                            alt="Preview" 
                            className="max-w-full h-32 object-contain rounded-lg bg-gray-100"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            Storage URL: <code>https://ovpkotqiohxdsjejavms.supabase.co/storage/v1</code>
          </p>
          <p className="mt-1">
            Bucket cible: <code className="font-medium">{STORAGE_BUCKET}</code> • 
            {buckets.length} bucket(s) disponible(s)
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={() => window.open('https://app.supabase.com/project/ovpkotqiohxdsjejavms/storage', '_blank')}
              className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Dashboard Supabase
            </button>
            <button
              onClick={loadBuckets}
              className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Rafraîchir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}