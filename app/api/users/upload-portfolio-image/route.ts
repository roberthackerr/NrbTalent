// app/api/users/upload-portfolio-image/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import cloudinary from "@/lib/cloudinary/config"
import { v4 as uuidv4 } from "uuid"

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Messages d'erreur multilingues
const errorMessages = {
  fr: {
    unauthorized: "Non autorisé",
    noFile: "Aucun fichier fourni",
    invalidType: "Type de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP",
    tooLarge: "L'image doit faire moins de 5MB",
    uploadFailed: "Échec de l'upload de l'image",
    serverError: "Erreur interne du serveur"
  },
  en: {
    unauthorized: "Unauthorized",
    noFile: "No file provided",
    invalidType: "Unsupported file type. Use JPEG, PNG, GIF or WebP",
    tooLarge: "Image must be less than 5MB",
    uploadFailed: "Failed to upload image",
    serverError: "Internal server error"
  },
  mg: {
    unauthorized: "Tsy nahazo alalana",
    noFile: "Tsy misy rakitra nampidirina",
    invalidType: "Tsy mety ny karazana rakitra. Mampiasà JPEG, PNG, GIF na WebP",
    tooLarge: "Tsy mihoatra ny 5MB ny sary",
    uploadFailed: "Tsy nahomby ny fampidirana sary",
    serverError: "Hadisoana anatiny"
  }
}

// Détecter la langue
function getLanguageFromRequest(request: NextRequest): 'fr' | 'en' | 'mg' {
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage?.startsWith('fr')) return 'fr'
  if (acceptLanguage?.startsWith('mg')) return 'mg'
  return 'en'
}

// Types de fichiers autorisés
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
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

    // Récupérer les données du formulaire
    const formData = await request.formData()
    const file = formData.get("image") as File
    const portfolioId = formData.get("portfolioId") as string

    if (!file) {
      return NextResponse.json(
        { error: messages.noFile }, 
        { status: 400 }
      )
    }

    // Validation du type de fichier
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: messages.invalidType },
        { status: 400 }
      )
    }

    // Validation de la taille
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

    console.log('🔄 Uploading portfolio image to Cloudinary...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      portfolioId: portfolioId || 'new'
    })

    // Déterminer le dossier et le nom
    const folder = `nrbtalents/portfolio/${session.user.id}`
    const publicId = portfolioId || uuidv4()

    // Upload vers Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64Image,
        {
          public_id: publicId,
          folder: folder,
          transformation: [
            { width: 1200, height: 800, crop: 'fill', gravity: 'auto' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ],
          tags: ['portfolio', session.user.id, portfolioId ? 'update' : 'new'],
          context: {
            userId: session.user.id,
            email: session.user.email || '',
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
            portfolioId: portfolioId || 'new'
          }
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
    })

    console.log('✅ Portfolio image uploaded to Cloudinary:', (uploadResult as any).secure_url)

    // Mettre à jour la base de données MongoDB si un portfolioId est fourni
    if (portfolioId) {
      const db = await getDatabase()
      const userId = new ObjectId((session.user as any).id)

      // Vérifier si l'élément de portfolio existe
      const existingItem = await db.collection("users").findOne({
        _id: userId,
        "portfolio.id": portfolioId
      })

      if (existingItem) {
        // Mettre à jour l'image du portfolio existant
        await db.collection("users").updateOne(
          { 
            _id: userId,
            "portfolio.id": portfolioId 
          },
          {
            $set: {
              "portfolio.$.image": (uploadResult as any).secure_url,
              "portfolio.$.updatedAt": new Date(),
              updatedAt: new Date()
            }
          }
        )
        console.log('✅ Portfolio item updated in database')
      } else {
        console.log('⚠️ Portfolio item not found, skipping database update')
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: (uploadResult as any).secure_url,
      publicId: (uploadResult as any).public_id,
      message: lang === 'fr' ? 'Image uploadée avec succès' : 
               lang === 'mg' ? 'Vita soa aman-tsara ny fampidirana sary' : 
               'Image uploaded successfully'
    })

  } catch (error: any) {
    console.error("❌ Erreur lors de l'upload de l'image:", {
      message: error.message,
      name: error.name,
      http_code: error.http_code
    })

    const lang = getLanguageFromRequest(request)
    const messages = errorMessages[lang]

    return NextResponse.json(
      { 
        error: messages.uploadFailed,
        details: error.message,
        code: error.http_code || 'UNKNOWN'
      },
      { status: 500 }
    )
  }
}

// ✅ NOUVEAU: Endpoint pour supprimer une image du portfolio
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const lang = getLanguageFromRequest(request)
    const messages = errorMessages[lang]

    if (!session?.user) {
      return NextResponse.json(
        { error: messages.unauthorized }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get('publicId')

    if (!publicId) {
      return NextResponse.json(
        { error: "Public ID requis" }, 
        { status: 400 }
      )
    }

    // Supprimer l'image de Cloudinary
    await cloudinary.uploader.destroy(publicId)

    return NextResponse.json({
      success: true,
      message: "Image supprimée avec succès"
    })

  } catch (error) {
    console.error("❌ Erreur lors de la suppression:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    )
  }
}