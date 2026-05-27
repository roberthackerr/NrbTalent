// app/api/users/cv/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import cloudinary from "@/lib/cloudinary/config"
import { v4 as uuidv4 } from "uuid"

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx']

const errorMessages = {
  fr: {
    unauthorized: "Non autorisé",
    noFile: "Aucun fichier fourni",
    invalidType: "Le fichier doit être un PDF, DOC ou DOCX",
    tooLarge: "La taille du fichier ne doit pas dépasser 10MB",
    uploadFailed: "Échec de l'upload du CV",
    serverError: "Erreur interne du serveur",
    deleteFailed: "Échec de la suppression du CV",
    notFound: "CV non trouvé"
  },
  en: {
    unauthorized: "Unauthorized",
    noFile: "No file provided",
    invalidType: "File must be PDF, DOC, or DOCX",
    tooLarge: "File size must be less than 10MB",
    uploadFailed: "Failed to upload CV",
    serverError: "Internal server error",
    deleteFailed: "Failed to delete CV",
    notFound: "CV not found"
  },
  mg: {
    unauthorized: "Tsy nahazo alalana",
    noFile: "Tsy misy rakitra nampidirina",
    invalidType: "Ny rakitra dia tsy maintsy PDF, DOC na DOCX",
    tooLarge: "Tsy mihoatra ny 10MB ny haben'ny rakitra",
    uploadFailed: "Tsy nahomby ny fampidirana CV",
    serverError: "Hadisoana anatiny",
    deleteFailed: "Tsy nahomby ny famafana CV",
    notFound: "Tsy hita ny CV"
  }
}

function getLanguageFromRequest(request: Request): 'fr' | 'en' | 'mg' {
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage?.startsWith('fr')) return 'fr'
  if (acceptLanguage?.startsWith('mg')) return 'mg'
  return 'en'
}

// Helper pour obtenir l'extension du fichier
function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase()
}

// Helper pour vérifier si l'extension est autorisée
function isAllowedExtension(filename: string): boolean {
  const ext = getFileExtension(filename)
  return ALLOWED_EXTENSIONS.includes(`.${ext}`)
}

export async function POST(request: Request) {
  try {
    const lang = getLanguageFromRequest(request)
    const messages = errorMessages[lang]

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: messages.unauthorized }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('cv') as File

    if (!file) {
      return NextResponse.json({ error: messages.noFile }, { status: 400 })
    }

    // Vérifier le type MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      // Vérifier également l'extension comme fallback
      if (!isAllowedExtension(file.name)) {
        return NextResponse.json({ error: messages.invalidType }, { status: 400 })
      }
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: messages.tooLarge }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Pour les fichiers raw (PDF, DOC, etc.), on utilise base64 sans le data:image prefix
    const base64File = buffer.toString('base64')
    const fileExtension = getFileExtension(file.name)
    
    // Construction du data URI pour le type raw
    const dataURI = `data:${file.type};base64,${base64File}`

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        dataURI,
        {
          public_id: `cvs/${session.user.id}/${uuidv4()}`,
          folder: 'nrbtalents/cvs',
          resource_type: 'raw',
          format: fileExtension,
          tags: ['cv', session.user.id, fileExtension],
          use_filename: true,
          unique_filename: true
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
    })

    const db = await getDatabase()
    
    let userId
    try {
      userId = new ObjectId((session.user as any).id)
    } catch {
      const userByEmail = await db.collection("users").findOne({
        email: session.user.email
      })
      if (!userByEmail) {
        return NextResponse.json({ error: messages.unauthorized }, { status: 401 })
      }
      userId = userByEmail._id
    }

    // Récupérer l'utilisateur pour supprimer l'ancien CV si existant
    const user = await db.collection("users").findOne({ _id: userId })

    // Supprimer l'ancien CV de Cloudinary
    if (user?.cv?.publicId) {
      try {
        await cloudinary.uploader.destroy(user.cv.publicId, { resource_type: 'raw' })
      } catch (deleteError) {
        console.log('⚠️ Could not delete old CV:', deleteError)
      }
    }

    // Sauvegarder les informations du CV dans la base de données
    const cvData = {
      url: (uploadResult as any).secure_url,
      publicId: (uploadResult as any).public_id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
      version: (uploadResult as any).version
    }

    await db.collection("users").updateOne(
      { _id: userId },
      { 
        $set: { 
          cv: cvData,
          updatedAt: new Date()
        } 
      }
    )

    return NextResponse.json({ 
      success: true, 
      cv: cvData,
      message: lang === 'fr' ? 'CV téléchargé avec succès' : 
               lang === 'mg' ? 'Vita soa aman-tsara ny fampidirana CV' : 
               'CV uploaded successfully'
    })

  } catch (error: any) {
    console.error('❌ Error uploading CV:', error)
    const lang = getLanguageFromRequest(request)
    const messages = errorMessages[lang]

    return NextResponse.json(
      { error: messages.uploadFailed, details: error.message }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const lang = getLanguageFromRequest(request)
    const messages = errorMessages[lang]

    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: messages.unauthorized }, { status: 401 })
    }

    const db = await getDatabase()
    
    let userId
    try {
      userId = new ObjectId((session.user as any).id)
    } catch {
      const userByEmail = await db.collection("users").findOne({
        email: session.user.email
      })
      if (!userByEmail) {
        return NextResponse.json({ error: messages.unauthorized }, { status: 401 })
      }
      userId = userByEmail._id
    }

    // Récupérer le CV pour supprimer de Cloudinary
    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { cv: 1 } }
    )

    if (!user?.cv?.publicId) {
      return NextResponse.json({ error: messages.notFound }, { status: 404 })
    }

    // Supprimer de Cloudinary
    try {
      await cloudinary.uploader.destroy(user.cv.publicId, { resource_type: 'raw' })
    } catch (cloudinaryError) {
      console.error('❌ Cloudinary deletion error:', cloudinaryError)
      // Continue avec la suppression de la BDD même si Cloudinary échoue
    }

    // Supprimer de la base de données
    await db.collection("users").updateOne(
      { _id: userId },
      { 
        $unset: { cv: "" },
        $set: { updatedAt: new Date() }
      }
    )

    return NextResponse.json({ 
      success: true, 
      message: lang === 'fr' ? 'CV supprimé avec succès' : 
               lang === 'mg' ? 'Vita soa aman-tsara ny famafana CV' : 
               'CV deleted successfully'
    })

  } catch (error: any) {
    console.error('❌ Error deleting CV:', error)
    const lang = getLanguageFromRequest(request)
    const messages = errorMessages[lang]

    return NextResponse.json(
      { error: messages.deleteFailed, details: error.message }, 
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const lang = getLanguageFromRequest(request)
    const messages = errorMessages[lang]

    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: messages.unauthorized }, { status: 401 })
    }

    const db = await getDatabase()
    
    let userId
    try {
      userId = new ObjectId((session.user as any).id)
    } catch {
      const userByEmail = await db.collection("users").findOne({
        email: session.user.email
      })
      if (!userByEmail) {
        return NextResponse.json({ error: messages.unauthorized }, { status: 401 })
      }
      userId = userByEmail._id
    }

    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { cv: 1 } }
    )

    return NextResponse.json({ 
      cv: user?.cv || null 
    })

  } catch (error: any) {
    console.error('❌ Error fetching CV:', error)
    const lang = getLanguageFromRequest(request)
    const messages = errorMessages[lang]

    return NextResponse.json(
      { error: messages.serverError, details: error.message }, 
      { status: 500 }
    )
  }
}