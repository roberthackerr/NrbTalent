// /app/api/groups/[id]/posts/upload/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"
import { mkdir } from "fs/promises"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      )
    }

    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'groups', id, 'posts')
    
    // Créer le dossier s'il n'existe pas
    await mkdir(uploadsDir, { recursive: true })

    const uploadedFiles = []

    for (const file of files) {
      // Validation du type de fichier
      if (!ALLOWED_TYPES.includes(file.type)) {
        continue // Skip les fichiers non autorisés
      }

      // Validation de la taille
      if (file.size > MAX_SIZE) {
        continue // Skip les fichiers trop gros
      }

      // Générer un nom de fichier unique
      const fileName = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = join(uploadsDir, fileName)
      
      // Convertir le fichier en buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Écrire le fichier
      await writeFile(filePath, buffer)

      // Déterminer le type de fichier
      const isImage = file.type.startsWith('image/')
      const fileType = isImage ? 'image' : 'document'

      uploadedFiles.push({
        originalName: file.name,
        fileName,
        url: `/uploads/groups/${id}/posts/${fileName}`,
        type: fileType,
        mimeType: file.type,
        size: file.size,
        uploadedAt: new Date()
      })
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier valide n'a été uploadé" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles
    })

  } catch (error: any) {
    console.error("Error uploading files:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'upload" },
      { status: 500 }
    )
  }
}