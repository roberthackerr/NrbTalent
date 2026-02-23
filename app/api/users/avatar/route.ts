// app/api/users/avatar/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { storage } from "@/lib/firebase/config"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
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
    // Détecter la langue
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

    // Valider le type de fichier
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

    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `avatars/${session.user.id}/${uuidv4()}.${fileExtension}`
    
    // Référence Firebase Storage
    const storageRef = ref(storage, fileName)

    // Upload vers Firebase Storage
    await uploadBytes(storageRef, buffer, {
      contentType: file.type,
      customMetadata: {
        userId: session.user.id,
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    })

    // Récupérer l'URL de téléchargement
    const downloadUrl = await getDownloadURL(storageRef)

    // Mettre à jour la base de données MongoDB avec l'URL Firebase
    const db = await getDatabase()
    
    // Trouver l'utilisateur (par ID ou email)
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

    await db.collection("users").updateOne(
      { _id: userId },
      { 
        $set: { 
          avatar: downloadUrl,
          updatedAt: new Date()
        } 
      }
    )

    // Retourner l'URL de l'avatar
    return NextResponse.json({ 
      avatarUrl: downloadUrl,
      message: lang === 'fr' ? 'Avatar mis à jour avec succès' : 
               lang === 'mg' ? 'Vita soa aman-tsara ny fanovana sary' : 
               'Avatar updated successfully'
    })

  } catch (error: any) {
    console.error('❌ Error uploading avatar to Firebase:', error)
    
    const lang = getLanguageFromRequest(request)
    const messages = errorMessages[lang]

    // Gérer les erreurs Firebase spécifiques
    if (error.code === 'storage/unauthorized') {
      return NextResponse.json(
        { error: "Firebase: Unauthorized", details: error.message }, 
        { status: 403 }
      )
    }
    
    if (error.code === 'storage/quota-exceeded') {
      return NextResponse.json(
        { error: "Storage quota exceeded", details: error.message }, 
        { status: 507 }
      )
    }

    return NextResponse.json(
      { error: messages.serverError, details: error.message }, 
      { status: 500 }
    )
  }
}