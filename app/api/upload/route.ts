// app/api/upload/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { notificationService } from '@/services/NotificationService'

// Messages d'erreur multilingues
const messages = {
  fr: {
    unauthorized: 'Non autorisé',
    noFile: 'Aucun fichier fourni',
    invalidType: 'Le fichier doit être une image',
    tooLarge: 'La taille du fichier ne doit pas dépasser 5MB',
    uploadFailed: 'Échec du téléchargement',
    success: 'Fichier téléchargé avec succès',
    notification: {
      title: '📁 Fichier téléchargé',
      message: 'Votre fichier a été téléchargé avec succès',
      errorTitle: '❌ Échec du téléchargement',
      errorMessage: 'Une erreur est survenue lors du téléchargement de votre fichier'
    }
  },
  en: {
    unauthorized: 'Unauthorized',
    noFile: 'No file provided',
    invalidType: 'File must be an image',
    tooLarge: 'File size must be less than 5MB',
    uploadFailed: 'Upload failed',
    success: 'File uploaded successfully',
    notification: {
      title: '📁 File uploaded',
      message: 'Your file has been uploaded successfully',
      errorTitle: '❌ Upload failed',
      errorMessage: 'An error occurred while uploading your file'
    }
  },
  mg: {
    unauthorized: 'Tsy nahazo alalana',
    noFile: 'Tsy misy rakitra nampidirina',
    invalidType: 'Ny rakitra dia tsy maintsy sary',
    tooLarge: 'Tsy mihoatra ny 5MB ny haben\'ny rakitra',
    uploadFailed: 'Tsy nahomby ny fampidirana',
    success: 'Vita soa aman-tsara ny fampidirana rakitra',
    notification: {
      title: '📁 Rakitra nampidirina',
      message: 'Nampidirina soa aman-tsara ny rakitrao',
      errorTitle: '❌ Tsy nahomby ny fampidirana',
      errorMessage: 'Nisy hadisoana nandritra ny fampidirana ny rakitrao'
    }
  }
}

// Récupérer la langue de l'utilisateur depuis la base de données
async function getUserLanguage(userId: string): Promise<'fr' | 'en' | 'mg'> {
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
    
    // Priorité: 1. language dans le profil, 2. preferences.language, 3. fr par défaut
    const userLang = user?.language || user?.preferences?.language || 'fr'
    
    // Valider que la langue est supportée
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
  let uploadSuccess = false
  let fileUrl = ''
  let fileName = ''
  let userLang = 'fr'

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: messages.fr.unauthorized }, { status: 401 })
    }

    // Récupérer l'ID utilisateur
    userId = (session.user as any).id || session.user.email
    
    // Récupérer la langue de l'utilisateur depuis la base de données
    if (userId) {
      userLang = await getUserLanguage(userId)
    }

    const langMessages = messages[userLang]
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: langMessages.noFile }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: langMessages.invalidType }, { status: 400 })
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: langMessages.tooLarge }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const fileExtension = path.extname(file.name)
    fileName = `${uuidv4()}${fileExtension}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'gigs')
    const filePath = path.join(uploadDir, fileName)

    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true })

    // Write file to disk
    await writeFile(filePath, buffer)

    // Return the public URL
    fileUrl = `/uploads/gigs/${fileName}`
    uploadSuccess = true

    // ──────────────────────────────────────────────────────────────────────────
    // 📢 ENVOYER UNE NOTIFICATION DE SUCCÈS (dans la langue de l'utilisateur)
    // ──────────────────────────────────────────────────────────────────────────
    if (userId) {
      try {
        await notificationService.send({
          userId: userId,
          category: 'SYSTEM',
          priority: 'LOW',
          title: langMessages.notification.title,
          message: langMessages.notification.message,
          actionUrl: fileUrl,
          data: {
            entityType: 'file',
            action: 'upload',
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            fileUrl: fileUrl,
            timestamp: new Date().toISOString()
          },
          checkPreferences: true
        })
        console.log('✅ Upload success notification sent to user:', userId)
      } catch (notifError) {
        console.error('⚠️ Failed to send upload success notification:', notifError)
      }
    }

    return NextResponse.json({
      url: fileUrl,
      publicId: fileName,
      message: langMessages.success
    })

  } catch (error) {
    console.error('Upload error:', error)
    
    // ──────────────────────────────────────────────────────────────────────────
    // 📢 ENVOYER UNE NOTIFICATION D'ERREUR (dans la langue de l'utilisateur)
    // ──────────────────────────────────────────────────────────────────────────
    if (userId && !uploadSuccess) {
      try {
        const langMessages = messages[userLang]
        await notificationService.send({
          userId: userId,
          category: 'SYSTEM',
          priority: 'MEDIUM',
          title: langMessages.notification.errorTitle,
          message: langMessages.notification.errorMessage,
          data: {
            entityType: 'file',
            action: 'upload_failed',
            error: error instanceof Error ? error.message : 'Unknown error',
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
      { error: messages[errorLang].uploadFailed }, 
      { status: 500 }
    )
  }
}