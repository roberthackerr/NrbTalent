// app/api/users/company-logo/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import cloudinary from "@/lib/cloudinary/config"
import { v4 as uuidv4 } from "uuid"

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']

const errorMessages = {
  fr: {
    unauthorized: "Non autorisé",
    noFile: "Aucun fichier fourni",
    invalidType: "Le fichier doit être une image (JPEG, PNG, GIF, WEBP, SVG)",
    tooLarge: "La taille du fichier ne doit pas dépasser 5MB",
    uploadFailed: "Échec de l'upload du logo",
    serverError: "Erreur interne du serveur",
    notFound: "Utilisateur non trouvé"
  },
  en: {
    unauthorized: "Unauthorized",
    noFile: "No file provided",
    invalidType: "File must be an image (JPEG, PNG, GIF, WEBP, SVG)",
    tooLarge: "File size must be less than 5MB",
    uploadFailed: "Failed to upload logo",
    serverError: "Internal server error",
    notFound: "User not found"
  },
  mg: {
    unauthorized: "Tsy nahazo alalana",
    noFile: "Tsy misy rakitra nampidirina",
    invalidType: "Ny rakitra dia tsy maintsy sary (JPEG, PNG, GIF, WEBP, SVG)",
    tooLarge: "Tsy mihoatra ny 5MB ny haben'ny rakitra",
    uploadFailed: "Tsy nahomby ny fampidirana logo",
    serverError: "Hadisoana anatiny",
    notFound: "Tsy hita ny mpampiasa"
  }
}

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

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: messages.unauthorized }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('logo') as File

    if (!file) {
      return NextResponse.json({ error: messages.noFile }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: messages.invalidType }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: messages.tooLarge }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`

    // Upload to Cloudinary with company logo specific settings
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64Image,
        {
          public_id: `company-logo/${session.user.id}/${uuidv4()}`,
          folder: 'nrbtalents/company-logos',
          transformation: [
            { width: 200, height: 200, crop: 'limit', gravity: 'center' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ],
          tags: ['company-logo', session.user.id],
          allowed_formats: ['jpg', 'png', 'gif', 'webp', 'svg']
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
    })

    const db = await getDatabase()
    
    // Get user ID
    let userId
    try {
      userId = new ObjectId((session.user as any).id)
    } catch {
      const userByEmail = await db.collection("users").findOne({
        email: session.user.email
      })
      if (!userByEmail) {
        return NextResponse.json({ error: messages.notFound }, { status: 404 })
      }
      userId = userByEmail._id
    }

    const user = await db.collection("users").findOne({ _id: userId })

    // Delete old company logo if exists
    if (user?.clientProfile?.company?.logo && user.clientProfile.company.logo.includes('cloudinary')) {
      try {
        const publicId = user.clientProfile.company.logo.split('/').pop()?.split('.')[0]
        if (publicId) {
          await cloudinary.uploader.destroy(`nrbtalents/company-logos/${publicId}`)
        }
      } catch (deleteError) {
        console.log('⚠️ Could not delete old company logo:', deleteError)
      }
    }

    // Update user with new company logo
    const updateResult = await db.collection("users").updateOne(
      { _id: userId },
      { 
        $set: { 
          'clientProfile.company.logo': (uploadResult as any).secure_url,
          updatedAt: new Date()
        } 
      }
    )

    if (updateResult.matchedCount === 0) {
      // If clientProfile doesn't exist yet, create it
      await db.collection("users").updateOne(
        { _id: userId },
        { 
          $set: { 
            clientProfile: {
              company: {
                logo: (uploadResult as any).secure_url
              }
            },
            updatedAt: new Date()
          } 
        }
      )
    }

    return NextResponse.json({ 
      success: true,
      logoUrl: (uploadResult as any).secure_url,
      publicId: (uploadResult as any).public_id,
      message: lang === 'fr' ? 'Logo de l\'entreprise mis à jour avec succès' : 
               lang === 'mg' ? 'Vita soa aman-tsara ny fanovana logo' : 
               'Company logo updated successfully'
    })

  } catch (error: any) {
    console.error('❌ Error uploading company logo:', error)
    const lang = getLanguageFromRequest(request)
    const messages = errorMessages[lang]

    return NextResponse.json(
      { error: messages.uploadFailed, details: error.message }, 
      { status: 500 }
    )
  }
}

// Optional: DELETE endpoint to remove company logo
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
        return NextResponse.json({ error: messages.notFound }, { status: 404 })
      }
      userId = userByEmail._id
    }

    const user = await db.collection("users").findOne({ _id: userId })

    // Delete logo from Cloudinary
    if (user?.clientProfile?.company?.logo && user.clientProfile.company.logo.includes('cloudinary')) {
      try {
        const publicId = user.clientProfile.company.logo.split('/').pop()?.split('.')[0]
        if (publicId) {
          await cloudinary.uploader.destroy(`nrbtalents/company-logos/${publicId}`)
        }
      } catch (deleteError) {
        console.log('⚠️ Could not delete company logo:', deleteError)
      }
    }

    // Remove logo from user profile
    await db.collection("users").updateOne(
      { _id: userId },
      { 
        $unset: { 'clientProfile.company.logo': "" },
        $set: { updatedAt: new Date() }
      }
    )

    return NextResponse.json({ 
      success: true,
      message: lang === 'fr' ? 'Logo supprimé avec succès' : 
               lang === 'mg' ? 'Vita soa aman-tsara ny famafana logo' : 
               'Logo removed successfully'
    })

  } catch (error: any) {
    console.error('❌ Error deleting company logo:', error)
    const lang = getLanguageFromRequest(request)
    const messages = errorMessages[lang]

    return NextResponse.json(
      { error: messages.serverError, details: error.message }, 
      { status: 500 }
    )
  }
}