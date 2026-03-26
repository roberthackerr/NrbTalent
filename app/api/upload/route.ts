// app/api/upload/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import cloudinary from "@/lib/cloudinary/config"
import { v4 as uuidv4 } from "uuid"
import { getDatabase } from "@/lib/mongodb"
import { notificationService } from "@/services/NotificationService"

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// Messages d'erreur multilingues
const messages = {
  fr: {
    unauthorized: "Non autorisé",
    noFile: "Aucun fichier fourni",
    invalidType: "Le fichier doit être une image (JPEG, PNG, WEBP)",
    tooLarge: "La taille du fichier ne doit pas dépasser 5MB",
    uploadFailed: "Erreur lors du téléchargement",
    success: "Fichier téléchargé avec succès"
  },
  en: {
    unauthorized: "Unauthorized",
    noFile: "No file provided",
    invalidType: "File must be an image (JPEG, PNG, WEBP)",
    tooLarge: "File size must be less than 5MB",
    uploadFailed: "Upload failed",
    success: "File uploaded successfully"
  },
  mg: {
    unauthorized: "Tsy nahazo alalana",
    noFile: "Tsy misy rakitra nampidirina",
    invalidType: "Ny rakitra dia tsy maintsy sary (JPEG, PNG, WEBP)",
    tooLarge: "Tsy mihoatra ny 5MB ny haben'ny rakitra",
    uploadFailed: "Tsy nahomby ny fampidirana",
    success: "Vita soa aman-tsara ny fampidirana rakitra"
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
        messages: "💬 Pièce jointe"
      }
      return titles[folder] || "📁 Fichier téléchargé"
    },
    message: (folder: string) => {
      const msgs: Record<string, string> = {
        gigs: "L'image de votre service a été téléchargée",
        projects: "Le document de votre projet a été téléchargé",
        avatar: "Votre photo de profil a été mise à jour",
        portfolio: "Votre portfolio a été mis à jour",
        documents: "Votre document a été téléchargé",
        messages: "Votre pièce jointe a été téléchargée"
      }
      return msgs[folder] || "Votre fichier a été téléchargé avec succès"
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
        messages: "💬 Attachment"
      }
      return titles[folder] || "📁 File uploaded"
    },
    message: (folder: string) => {
      const msgs: Record<string, string> = {
        gigs: "Your gig image has been uploaded",
        projects: "Your project document has been uploaded",
        avatar: "Your profile picture has been updated",
        portfolio: "Your portfolio has been updated",
        documents: "Your document has been uploaded",
        messages: "Your attachment has been uploaded"
      }
      return msgs[folder] || "Your file has been uploaded successfully"
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
        messages: "💬 Firaketana"
      }
      return titles[folder] || "📁 Rakitra nampidirina"
    },
    message: (folder: string) => {
      const msgs: Record<string, string> = {
        gigs: "Nampidirina soa aman-tsara ny sarin'ny serivisinao",
        projects: "Nampidirina soa aman-tsara ny antontan-taratasin'ny tetikasanao",
        avatar: "Nohavaozina soa aman-tsara ny sary momba anao",
        portfolio: "Nohavaozina soa aman-tsara ny portfolio-nao",
        documents: "Nampidirina soa aman-tsara ny antontan-taratasinao",
        messages: "Nampidirina soa aman-tsara ny firaketanao"
      }
      return msgs[folder] || "Nampidirina soa aman-tsara ny rakitrao"
    }
  }
}

// Récupérer la langue de l'utilisateur depuis la session
async function getUserLanguage(userId: string, sessionLang?: string): Promise<'fr' | 'en' | 'mg'> {
  // Si la langue est déjà dans la session, l'utiliser
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

export async function POST(request: Request) {
  let userId: string | null = null
  let userLang = 'fr'
  let folder = 'gigs'
  let uploadSuccess = false
  let uploadedUrl = ''
  let uploadedPublicId = ''

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: messages.fr.unauthorized }, { status: 401 })
    }

    // Récupérer l'ID utilisateur
    userId = (session.user as any).id || session.user.email
    if (!userId) {
      return NextResponse.json({ error: messages.fr.unauthorized }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    folder = formData.get('folder') as string || 'gigs'

    if (!file) {
      return NextResponse.json({ error: messages.fr.noFile }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: messages.fr.invalidType }, 
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: messages.fr.tooLarge }, 
        { status: 400 }
      )
    }

    // Récupérer la langue de l'utilisateur
    const sessionLang = (session.user as any).language || (session.user as any).preferences?.language
    userLang = await getUserLanguage(userId, sessionLang)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`

    // Upload vers Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64Image,
        {
          public_id: `${folder}/${session.user.id}/${uuidv4()}`,
          folder: `nrbtalents/${folder}`,
          transformation: [
            { width: 1200, crop: 'limit', quality: 'auto' },
            { width: 400, crop: 'fill', gravity: 'auto' }
          ],
          tags: [folder, session.user.id],
          context: {
            userId: session.user.id,
            folder: folder,
            uploadedAt: new Date().toISOString()
          }
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
    })

    uploadedUrl = (uploadResult as any).secure_url
    uploadedPublicId = (uploadResult as any).public_id
    uploadSuccess = true

    // Générer l'URL de la miniature
    const thumbnailUrl = uploadedUrl.replace(
      '/upload/',
      '/upload/w_400,h_400,c_fill,g_auto/'
    )

    // ──────────────────────────────────────────────────────────────────────────
    // 📢 ENVOYER UNE NOTIFICATION (dans la langue de l'utilisateur)
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const notifMsgs = notificationMessages[userLang] || notificationMessages.fr
      const title = notifMsgs.title(folder)
      const message = notifMsgs.message(folder)

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
          timestamp: new Date().toISOString()
        },
        checkPreferences: true
      })
      console.log(`✅ Upload notification sent to user: ${userId} for folder: ${folder}`)
    } catch (notifError) {
      console.error('⚠️ Failed to send upload notification:', notifError)
    }

    return NextResponse.json({ 
      success: true,
      url: uploadedUrl,
      thumbnail: thumbnailUrl,
      publicId: uploadedPublicId,
      folder: folder,
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