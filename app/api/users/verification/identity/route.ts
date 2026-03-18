// app/api/users/verification/identity/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import cloudinary from "@/lib/cloudinary/config"
import { v4 as uuidv4 } from "uuid"

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf'
]

// Messages d'erreur multilingues
const errorMessages = {
  fr: {
    unauthorized: "Non autorisé",
    noFile: "Aucun fichier fourni",
    invalidType: "Type de fichier non autorisé. Formats acceptés : JPG, PNG, PDF",
    tooLarge: "La taille du fichier ne doit pas dépasser 5MB",
    uploadFailed: "Échec de l'upload des documents",
    serverError: "Erreur interne du serveur",
    dbError: "Erreur lors de l'enregistrement en base de données"
  },
  en: {
    unauthorized: "Unauthorized",
    noFile: "No file provided",
    invalidType: "Invalid file type. Accepted formats: JPG, PNG, PDF",
    tooLarge: "File size must be less than 5MB",
    uploadFailed: "Failed to upload documents",
    serverError: "Internal server error",
    dbError: "Database error"
  },
  mg: {
    unauthorized: "Tsy nahazo alalana",
    noFile: "Tsy misy rakitra nampidirina",
    invalidType: "Tsy mety ny karazan-tsoratra. Ekena: JPG, PNG, PDF",
    tooLarge: "Tsy mihoatra ny 5MB ny haben'ny rakitra",
    uploadFailed: "Tsy nahomby ny fampidirana antontan-taratasy",
    serverError: "Hadisoana anatiny",
    dbError: "Hadisoana tamin'ny fitehirizana"
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

    const userId = new ObjectId((session.user as any).id)
    const formData = await request.formData()
    
    // Récupérer tous les fichiers
    const files: File[] = []
    for (let i = 0; i < 10; i++) { // Max 10 fichiers
      const file = formData.get(`document_${i}`) as File
      if (file) files.push(file)
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: messages.noFile }, 
        { status: 400 }
      )
    }

    // Valider les fichiers
    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json({ 
          error: messages.invalidType
        }, { status: 400 })
      }
      
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: messages.tooLarge
        }, { status: 400 })
      }
    }

    console.log('🔄 Uploading verification documents to Cloudinary...', {
      userId: userId.toString(),
      fileCount: files.length,
      fileNames: files.map(f => f.name)
    })

    // Upload chaque fichier vers Cloudinary
    const uploadedDocuments = []
    const requestId = uuidv4()

    for (const [index, file] of files.entries()) {
      // Convertir le fichier en buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Déterminer le type de ressource
      const isPdf = file.type === 'application/pdf'
      const base64Data = isPdf 
        ? `data:application/pdf;base64,${buffer.toString('base64')}`
        : `data:${file.type};base64,${buffer.toString('base64')}`

      // Upload vers Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          base64Data,
          {
            public_id: `verification/${userId}/${requestId}/document_${index + 1}`,
            folder: 'nrbtalents/verification',
            resource_type: isPdf ? 'raw' : 'image',
            tags: ['verification', userId.toString(), requestId],
            context: {
              userId: userId.toString(),
              documentType: isPdf ? 'pdf' : 'image',
              originalName: file.name,
              uploadedAt: new Date().toISOString()
            }
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
      })

      uploadedDocuments.push({
        url: (uploadResult as any).secure_url,
        publicId: (uploadResult as any).public_id,
        type: file.type,
        name: file.name,
        size: file.size
      })

      console.log(`✅ Document ${index + 1}/${files.length} uploaded:`, (uploadResult as any).secure_url)
    }

    const db = await getDatabase()

    // Créer la demande de vérification
    const verificationRequest = {
      userId,
      requestId,
      documents: uploadedDocuments.map(doc => ({
        url: doc.url,
        publicId: doc.publicId,
        type: doc.type,
        name: doc.name,
        size: doc.size
      })),
      status: "pending",
      submittedAt: new Date(),
      updatedAt: new Date(),
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      metadata: {
        fileCount: files.length,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      }
    }

    await db.collection("verification_requests").insertOne(verificationRequest)

    // Mettre à jour le profil utilisateur
    await db.collection("users").updateOne(
      { _id: userId },
      { 
        $set: { 
          verificationStatus: "pending",
          verificationSubmittedAt: new Date(),
          verificationRequestId: requestId,
          updatedAt: new Date()
        } 
      }
    )

    // Notifier les admins
    const admins = await db.collection("users").find({ role: "admin" }).toArray()
    const notifications = admins.map(admin => ({
      userId: admin._id,
      type: "verification_request",
      title: lang === 'fr' ? "Nouvelle demande de vérification" :
             lang === 'mg' ? "Fangatahana fanamarinana vaovao" :
             "New verification request",
      message: lang === 'fr' ? `Un utilisateur a soumis ${files.length} document(s) pour vérification.` :
               lang === 'mg' ? `Mpampiasa iray nandefa antontan-taratasy ${files.length} ho fanamarinana.` :
               `A user submitted ${files.length} document(s) for verification.`,
      data: { 
        userId: userId.toString(),
        requestId,
        documentCount: files.length
      },
      read: false,
      createdAt: new Date()
    }))

    if (notifications.length > 0) {
      await db.collection("notifications").insertMany(notifications)
    }

    return NextResponse.json({ 
      success: true,
      message: lang === 'fr' ? 'Documents soumis avec succès' :
               lang === 'mg' ? 'Voaray soa aman-tsara ny antontan-taratasy' :
               'Documents submitted successfully',
      requestId,
      fileCount: files.length,
      documents: uploadedDocuments.map(d => ({
        url: d.url,
        name: d.name,
        type: d.type
      }))
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
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = new ObjectId((session.user as any).id)
    const db = await getDatabase()

    // Trouver la demande de vérification la plus récente
    const verificationRequest = await db.collection("verification_requests")
      .findOne(
        { userId },
        { sort: { submittedAt: -1 } }
      )

    if (!verificationRequest) {
      return NextResponse.json({ status: "none" })
    }

    return NextResponse.json({ 
      status: verificationRequest.status,
      submittedAt: verificationRequest.submittedAt,
      reviewedAt: verificationRequest.reviewedAt,
      rejectionReason: verificationRequest.rejectionReason,
      documents: verificationRequest.documents || [], // ✅ Renvoyer les documents
      requestId: verificationRequest.requestId
    })

  } catch (error) {
    console.error("Error fetching verification status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}