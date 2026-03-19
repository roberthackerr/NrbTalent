// app/api/upload/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import cloudinary from "@/lib/cloudinary/config"
import { v4 as uuidv4 } from "uuid"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'gigs'

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Le fichier doit être une image (JPEG, PNG, WEBP)" }, 
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "La taille du fichier ne doit pas dépasser 5MB" }, 
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64Image,
        {
          public_id: `${folder}/${session.user.id}/${uuidv4()}`,
          folder: `nrbtalents/${folder}`,
          transformation: [
            { width: 1200, crop: 'limit', quality: 'auto' },
            { width: 400, crop: 'fill', gravity: 'auto' } // Pour les thumbnails
          ],
          tags: [folder, session.user.id],
          context: {
            userId: session.user.id,
            uploadedAt: new Date().toISOString()
          }
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
    })

    // Générer l'URL de la miniature
    const thumbnailUrl = (uploadResult as any).secure_url.replace(
      '/upload/',
      '/upload/w_400,h_400,c_fill,g_auto/'
    )

    return NextResponse.json({ 
      url: (uploadResult as any).secure_url,
      thumbnail: thumbnailUrl,
      publicId: (uploadResult as any).public_id
    })

  } catch (error) {
    console.error('❌ Upload error:', error)
    return NextResponse.json(
      { error: "Erreur lors du téléchargement" }, 
      { status: 500 }
    )
  }
}