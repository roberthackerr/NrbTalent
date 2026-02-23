// app/api/users/avatar/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import cloudinary from "@/lib/cloudinary/config"
import { v4 as uuidv4 } from "uuid"

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

// Messages d'erreur multilingues
const errorMessages = {
  fr: {
    unauthorized: "Non autorisé",
    noFile: "Aucun fichier fourni",
    invalidType: "Le fichier doit être une image (JPEG, PNG, GIF, WEBP)",
    tooLarge: "La taille du fichier ne doit pas dépasser 5MB",
    uploadFailed: "Échec de l'upload de l'image",
    serverError: "Erreur interne du serveur"
  },
  en: {
    unauthorized: "Unauthorized",
    noFile: "No file provided",
    invalidType: "File must be an image (JPEG, PNG, GIF, WEBP)",
    tooLarge: "File size must be less than 5MB",
    uploadFailed: "Failed to upload image",
    serverError: "Internal server error"
  },
  mg: {
    unauthorized: "Tsy nahazo alalana",
    noFile: "Tsy misy rakitra nampidirina",
    invalidType: "Ny rakitra dia tsy maintsy sary (JPEG, PNG, GIF, WEBP)",
    tooLarge: "Tsy mihoatra ny 5MB ny haben'ny rakitra",
    uploadFailed: "Tsy nahomby ny fampidirana sary",
    serverError: "Hadisoana anatiny"
  }
}

// Détecter la langue
function getLanguageFromRequest(request: Request): 'fr' | 'en' | 'mg' {
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage?.startsWith('fr')) return 'fr'
  if (acceptLanguage?.startsWith('mg')) return 'mg'
  return 'en'
}

export async function POST(request: Request) {
  try {
    const lang = getLanguageFromRequest(request)
    const messages = errorMessages[lang]

    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: messages.unauthorized }, 
        { status: 401 }
      )
    }

    // Récupérer le fichier
    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json(
        { error: messages.noFile }, 
        { status: 400 }
      )
    }

    // Valider le type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: messages.invalidType }, 
        { status: 400 }
      )
    }

    // Valider la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: messages.tooLarge }, 
        { status: 400 }
      )
    }

    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Convertir en base64 pour Cloudinary
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`

    console.log('🔄 Uploading to Cloudinary...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })

    // Upload vers Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64Image,
        {
          public_id: `avatars/${session.user.id}/${uuidv4()}`,
          folder: 'nrbtalents/avatars',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ],
          tags: ['avatar', session.user.id],
          context: {
            userId: session.user.id,
            email: session.user.email || '',
            uploadedAt: new Date().toISOString()
          }
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
    })

    console.log('✅ Upload successful:', (uploadResult as any).secure_url)

    // Mettre à jour MongoDB
    const db = await getDatabase()
    
    let userId
    try {
      userId = new ObjectId((session.user as any).id)
    } catch {
      const userByEmail = await db.collection("users").findOne({
        email: session.user.email
      })
      if (!userByEmail) {
        return NextResponse.json(
          { error: messages.unauthorized }, 
          { status: 401 }
        )
      }
      userId = userByEmail._id
    }

    // Supprimer l'ancien avatar si existant
    const user = await db.collection("users").findOne({ _id: userId })
    if (user?.avatar && user.avatar.includes('cloudinary')) {
      try {
        const publicId = user.avatar.split('/').pop()?.split('.')[0]
        if (publicId) {
          await cloudinary.uploader.destroy(`nrbtalents/avatars/${publicId}`)
          console.log('✅ Old avatar deleted from Cloudinary')
        }
      } catch (deleteError) {
        console.log('⚠️ Could not delete old avatar:', deleteError)
      }
    }

    await db.collection("users").updateOne(
      { _id: userId },
      { 
        $set: { 
          avatar: (uploadResult as any).secure_url,
          updatedAt: new Date()
        } 
      }
    )

    return NextResponse.json({ 
      avatarUrl: (uploadResult as any).secure_url,
      publicId: (uploadResult as any).public_id,
      message: lang === 'fr' ? 'Avatar mis à jour avec succès' : 
               lang === 'mg' ? 'Vita soa aman-tsara ny fanovana sary' : 
               'Avatar updated successfully'
    })

  } catch (error: any) {
    console.error('❌ Cloudinary Upload Error:', {
      message: error.message,
      name: error.name,
      http_code: error.http_code
    })

    const lang = getLanguageFromRequest(request)
    const messages = errorMessages[lang]

    return NextResponse.json(
      { 
        error: messages.uploadFailed,
        details: error.message
      }, 
      { status: 500 }
    )
  }
}