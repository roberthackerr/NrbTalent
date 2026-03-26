// app/api/upload/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import cloudinary from "@/lib/cloudinary/config"
import { v4 as uuidv4 } from "uuid"
import { getDatabase } from "@/lib/mongodb"
import { notificationService } from "@/services/NotificationService"

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB (augmenté pour les documents)
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Textes
  'text/plain',
  'text/markdown',
  'text/csv',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  // Code
  'application/json',
  'application/xml',
  'text/html',
  'text/css',
  'text/javascript',
  'application/javascript'
]

// Messages d'erreur multilingues
const messages = {
  fr: {
    unauthorized: "Non autorisé",
    noFile: "Aucun fichier fourni",
    invalidType: "Type de fichier non supporté",
    tooLarge: "La taille du fichier ne doit pas dépasser 10MB",
    uploadFailed: "Erreur lors du téléchargement",
    success: "Fichier téléchargé avec succès",
    multipleFiles: "Upload multiple non supporté, utilisez un seul fichier"
  },
  en: {
    unauthorized: "Unauthorized",
    noFile: "No file provided",
    invalidType: "File type not supported",
    tooLarge: "File size must be less than 10MB",
    uploadFailed: "Upload failed",
    success: "File uploaded successfully",
    multipleFiles: "Multiple upload not supported, use single file"
  },
  mg: {
    unauthorized: "Tsy nahazo alalana",
    noFile: "Tsy misy rakitra nampidirina",
    invalidType: "Karazana rakitra tsy azo ekena",
    tooLarge: "Tsy mihoatra ny 10MB ny haben'ny rakitra",
    uploadFailed: "Tsy nahomby ny fampidirana",
    success: "Vita soa aman-tsara ny fampidirana rakitra",
    multipleFiles: "Tsy azo atao ny fampidirana rakitra maro miaraka"
  }
}

// Messages de notification multilingues
const notificationMessages = {
  fr: {
    title: (folder: string) => {
      const titles: Record<string, string> = {
        gigs: "📁 Image de service",
        projects: "📁 Document de projet",
        avatar: "🖼️ Photo de profil",
        portfolio: "🎨 Portfolio",
        documents: "📄 Document",
        messages: "💬 Pièce jointe",
        groups: "📁 Fichier de groupe"
      }
      return titles[folder] || "📁 Fichier téléchargé"
    },
    message: (folder: string, fileName: string) => {
      const msgs: Record<string, string> = {
        gigs: `L'image "${fileName}" a été téléchargée`,
        projects: `Le document "${fileName}" a été téléchargé`,
        avatar: "Votre photo de profil a été mise à jour",
        portfolio: "Votre portfolio a été mis à jour",
        documents: `Le document "${fileName}" a été téléchargé`,
        messages: `La pièce jointe "${fileName}" a été téléchargée`,
        groups: `Le fichier "${fileName}" a été téléchargé`
      }
      return msgs[folder] || `Le fichier "${fileName}" a été téléchargé avec succès`
    }
  },
  en: {
    title: (folder: string) => {
      const titles: Record<string, string> = {
        gigs: "📁 Gig image",
        projects: "📁 Project document",
        avatar: "🖼️ Profile picture",
        portfolio: "🎨 Portfolio",
        documents: "📄 Document",
        messages: "💬 Attachment",
        groups: "📁 Group file"
      }
      return titles[folder] || "📁 File uploaded"
    },
    message: (folder: string, fileName: string) => {
      const msgs: Record<string, string> = {
        gigs: `Image "${fileName}" uploaded`,
        projects: `Document "${fileName}" uploaded`,
        avatar: "Your profile picture has been updated",
        portfolio: "Your portfolio has been updated",
        documents: `Document "${fileName}" uploaded`,
        messages: `Attachment "${fileName}" uploaded`,
        groups: `File "${fileName}" uploaded`
      }
      return msgs[folder] || `File "${fileName}" uploaded successfully`
    }
  },
  mg: {
    title: (folder: string) => {
      const titles: Record<string, string> = {
        gigs: "📁 Sarin'ny serivisy",
        projects: "📁 Antontan-taratasin'ny tetikasa",
        avatar: "🖼️ Sary momba anao",
        portfolio: "🎨 Portfolio",
        documents: "📄 Antontan-taratasy",
        messages: "💬 Firaketana",
        groups: "📁 Rakitra vondrona"
      }
      return titles[folder] || "📁 Rakitra nampidirina"
    },
    message: (folder: string, fileName: string) => {
      const msgs: Record<string, string> = {
        gigs: `Nampidirina soa aman-tsara ny sarin'ny serivisy "${fileName}"`,
        projects: `Nampidirina soa aman-tsara ny antontan-taratasin'ny tetikasa "${fileName}"`,
        avatar: "Nohavaozina soa aman-tsara ny sary momba anao",
        portfolio: "Nohavaozina soa aman-tsara ny portfolio-nao",
        documents: `Nampidirina soa aman-tsara ny antontan-taratasy "${fileName}"`,
        messages: `Nampidirina soa aman-tsara ny firaketana "${fileName}"`,
        groups: `Nampidirina soa aman-tsara ny rakitra "${fileName}"`
      }
      return msgs[folder] || `Nampidirina soa aman-tsara ny rakitra "${fileName}"`
    }
  }
}

// Récupérer la langue de l'utilisateur depuis la session
async function getUserLanguage(userId: string, sessionLang?: string): Promise<'fr' | 'en' | 'mg'> {
  if (sessionLang && (sessionLang === 'fr' || sessionLang === 'en' || sessionLang === 'mg')) {
    return sessionLang
  }
  
  try {
    const db = await getDatabase()
    let objectId
    try {
      objectId = new ObjectId(userId)
    } catch {
      return 'fr'
    }
    
    const user = await db.collection("users").findOne(
      { _id: objectId },
      { projection: { language: 1, preferences: 1 } }
    )
    
    const userLang = user?.language || user?.preferences?.language || 'fr'
    if (userLang === 'fr' || userLang === 'en' || userLang === 'mg') {
      return userLang
    }
    return 'fr'
  } catch (error) {
    console.error('Error getting user language:', error)
    return 'fr'
  }
}

// Déterminer le type de fichier pour Cloudinary
function getResourceType(file: File): 'image' | 'raw' | 'auto' {
  if (file.type.startsWith('image/')) {
    return 'image'
  }
  if (file.type === 'application/pdf') {
    return 'image' // PDF peut être traité comme image avec la bonne configuration
  }
  return 'raw'
}

export async function POST(request: Request) {
  let userId: string | null = null
  let userLang = 'fr'
  let folder = 'documents'
  let uploadSuccess = false
  let uploadedUrl = ''
  let uploadedPublicId = ''

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: messages.fr.unauthorized }, { status: 401 })
    }

    userId = (session.user as any).id || session.user.email
    if (!userId) {
      return NextResponse.json({ error: messages.fr.unauthorized }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    folder = formData.get('folder') as string || 'documents'

    if (!file) {
      return NextResponse.json({ error: messages.fr.noFile }, { status: 400 })
    }

    // Vérifier le type de fichier
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      const lang = await getUserLanguage(userId)
      return NextResponse.json(
        { error: messages[lang].invalidType }, 
        { status: 400 }
      )
    }

    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      const lang = await getUserLanguage(userId)
      return NextResponse.json(
        { error: messages[lang].tooLarge }, 
        { status: 400 }
      )
    }

    // Récupérer la langue de l'utilisateur
    const sessionLang = (session.user as any).language || (session.user as any).preferences?.language
    userLang = await getUserLanguage(userId, sessionLang)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64File = `data:${file.type};base64,${buffer.toString('base64')}`
    
    const isImage = file.type.startsWith('image/')
    const resourceType = getResourceType(file)

    // Configuration de l'upload selon le type
    const uploadOptions: any = {
      public_id: `${folder}/${session.user.id}/${uuidv4()}`,
      folder: `nrbtalents/${folder}`,
      resource_type: resourceType,
      tags: [folder, session.user.id, file.type.split('/')[0]],
      context: {
        userId: session.user.id,
        folder: folder,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString()
      }
    }

    // Ajouter des transformations pour les images
    if (isImage) {
      uploadOptions.transformation = [
        { width: 1200, crop: 'limit', quality: 'auto' },
        { width: 400, crop: 'fill', gravity: 'auto' }
      ]
    }

    // Upload vers Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64File,
        uploadOptions,
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
    })

    uploadedUrl = (uploadResult as any).secure_url
    uploadedPublicId = (uploadResult as any).public_id
    uploadSuccess = true

    // Générer l'URL de la miniature uniquement pour les images
    let thumbnailUrl: string | undefined
    if (isImage) {
      thumbnailUrl = uploadedUrl.replace(
        '/upload/',
        '/upload/w_400,h_400,c_fill,g_auto/'
      )
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 📢 ENVOYER UNE NOTIFICATION (dans la langue de l'utilisateur)
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const notifMsgs = notificationMessages[userLang] || notificationMessages.fr
      const title = notifMsgs.title(folder)
      const message = notifMsgs.message(folder, file.name)

      await notificationService.send({
        userId: userId,
        category: 'SYSTEM',
        priority: 'LOW',
        title: title,
        message: message,
        actionUrl: uploadedUrl,
        data: {
          entityType: folder,
          action: 'upload',
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileUrl: uploadedUrl,
          thumbnailUrl: thumbnailUrl,
          folder: folder,
          isImage: isImage,
          timestamp: new Date().toISOString()
        },
        checkPreferences: true
      })
      console.log(`✅ Upload notification sent to user: ${userId} for folder: ${folder}, file: ${file.name}`)
    } catch (notifError) {
      console.error('⚠️ Failed to send upload notification:', notifError)
    }

    return NextResponse.json({ 
      success: true,
      url: uploadedUrl,
      thumbnail: thumbnailUrl,
      publicId: uploadedPublicId,
      folder: folder,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      isImage: isImage,
      message: messages[userLang].success
    })

  } catch (error) {
    console.error('❌ Upload error:', error)
    
    // ──────────────────────────────────────────────────────────────────────────
    // 📢 ENVOYER UNE NOTIFICATION D'ERREUR
    // ──────────────────────────────────────────────────────────────────────────
    if (userId && !uploadSuccess) {
      try {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        await notificationService.send({
          userId: userId,
          category: 'SYSTEM',
          priority: 'MEDIUM',
          title: messages[userLang].uploadFailed,
          message: `Erreur: ${errorMsg.substring(0, 100)}`,
          data: {
            entityType: folder,
            action: 'upload_failed',
            fileName: 'unknown',
            error: errorMsg,
            timestamp: new Date().toISOString()
          },
          checkPreferences: true
        })
        console.log('❌ Upload error notification sent to user:', userId)
      } catch (notifError) {
        console.error('⚠️ Failed to send upload error notification:', notifError)
      }
    }
    
    const errorLang = userId ? userLang : 'fr'
    return NextResponse.json(
      { 
        success: false,
        error: messages[errorLang].uploadFailed 
      }, 
      { status: 500 }
    )
  }
}