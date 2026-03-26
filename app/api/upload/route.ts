// app/api/upload/route.ts - Version corrigée
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import cloudinary from "@/lib/cloudinary/config"
import { v4 as uuidv4 } from "uuid"
import { getDatabase } from "@/lib/mongodb"
import { notificationService } from "@/services/NotificationService"

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/markdown', 'text/csv',
  'application/zip', 'application/x-rar-compressed',
  'application/json', 'application/xml', 'text/html', 'text/css', 'text/javascript', 'application/javascript'
]

const messages = {
  fr: {
    unauthorized: "Non autorisé",
    noFile: "Aucun fichier fourni",
    invalidType: "Type de fichier non supporté",
    tooLarge: "La taille du fichier ne doit pas dépasser 10MB",
    uploadFailed: "Erreur lors du téléchargement",
    success: "Fichier téléchargé avec succès"
  },
  en: {
    unauthorized: "Unauthorized",
    noFile: "No file provided",
    invalidType: "File type not supported",
    tooLarge: "File size must be less than 10MB",
    uploadFailed: "Upload failed",
    success: "File uploaded successfully"
  },
  mg: {
    unauthorized: "Tsy nahazo alalana",
    noFile: "Tsy misy rakitra nampidirina",
    invalidType: "Karazana rakitra tsy azo ekena",
    tooLarge: "Tsy mihoatra ny 10MB ny haben'ny rakitra",
    uploadFailed: "Tsy nahomby ny fampidirana",
    success: "Vita soa aman-tsara ny fampidirana rakitra"
  }
}

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
    return userLang === 'fr' || userLang === 'en' || userLang === 'mg' ? userLang : 'fr'
  } catch {
    return 'fr'
  }
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

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      const lang = await getUserLanguage(userId)
      return NextResponse.json({ error: messages[lang].invalidType }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      const lang = await getUserLanguage(userId)
      return NextResponse.json({ error: messages[lang].tooLarge }, { status: 400 })
    }

    const sessionLang = (session.user as any).language || (session.user as any).preferences?.language
    userLang = await getUserLanguage(userId, sessionLang)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64File = `data:${file.type};base64,${buffer.toString('base64')}`
    
    const isImage = file.type.startsWith('image/')
    const isPDF = file.type === 'application/pdf'

    // Configuration CRITIQUE pour l'accès public
    const uploadOptions: any = {
      public_id: `${folder}/${session.user.id}/${uuidv4()}`,
      folder: `nrbtalents/${folder}`,
      resource_type: 'auto', // 👈 CHANGEMENT: 'auto' permet à Cloudinary de détecter automatiquement
      type: 'upload', // 👈 IMPORTANT: pour un accès public
      access_mode: 'public', // 👈 RENDRE LE FICHIER PUBLIC
      tags: [folder, session.user.id],
      context: {
        userId: session.user.id,
        folder: folder,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString()
      }
    }

    // Pour les PDF, ajouter des transformations pour forcer l'affichage
    if (isPDF) {
      uploadOptions.transformation = [
        { flags: "attachment" } // Force le téléchargement plutôt que l'affichage
      ]
      uploadOptions.format = 'pdf'
    }

    // Pour les images, ajouter des transformations
    if (isImage) {
      uploadOptions.transformation = [
        { width: 1200, crop: 'limit', quality: 'auto' },
        { width: 400, crop: 'fill', gravity: 'auto' }
      ]
    }

    console.log('📤 Uploading to Cloudinary:', {
      folder,
      fileName: file.name,
      fileType: file.type,
      resource_type: uploadOptions.resource_type,
      type: uploadOptions.type,
      access_mode: uploadOptions.access_mode
    })

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

    console.log('✅ Upload successful:', {
      url: uploadedUrl,
      publicId: uploadedPublicId,
      resource_type: (uploadResult as any).resource_type
    })

    let thumbnailUrl: string | undefined
    if (isImage) {
      thumbnailUrl = uploadedUrl.replace('/upload/', '/upload/w_400,h_400,c_fill,g_auto/')
    }

    // Notification
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
      } catch (notifError) {
        console.error('⚠️ Failed to send upload error notification:', notifError)
      }
    }
    
    const errorLang = userId ? userLang : 'fr'
    return NextResponse.json(
      { success: false, error: messages[errorLang].uploadFailed }, 
      { status: 500 }
    )
  }
}