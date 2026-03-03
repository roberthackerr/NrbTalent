// /app/api/groups/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { GroupService } from "@/lib/services/group-service"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') as any
    const skills = searchParams.get('skills')?.split(',') || []
    const location = searchParams.get('location')
    const tags = searchParams.get('tags')?.split(',') || []
    const sortBy = searchParams.get('sortBy') as any || 'relevance'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const groupService = GroupService.getInstance()
    const result = await groupService.searchGroups({
      query,
      type,
      skills,
      location,
      tags,
      sortBy,
      page,
      limit
    })

    return NextResponse.json({
      groups: result.groups,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    })
  } catch (error: any) {
    console.error("Error fetching groups:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// /app/api/groups/route.ts - VERSION CORRIGÉE
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contentType = request.headers.get("content-type") || ""
    let groupData: any = {}
    let avatarUrl: string | undefined

    if (contentType.includes("multipart/form-data")) {
      // Gérer FormData avec image
      const formData = await request.formData()
      
      // Extraire les données textuelles
      const name = formData.get("name") as string
      const description = formData.get("description") as string
      const type = formData.get("type") as string
      const visibility = formData.get("visibility") as string
      const location = formData.get("location") as string
      const company = formData.get("company") as string
      
      // Extraire et parser les tableaux
      const tags = JSON.parse(formData.get("tags") as string || "[]")
      const skills = JSON.parse(formData.get("skills") as string || "[]")
      
      // Gérer l'image uploadée
      const imageFile = formData.get("image") as File | null
      
      if (imageFile && imageFile.size > 0) {
        // Sauvegarder l'image
        avatarUrl = await saveUploadedImage(imageFile)
      }
      
      groupData = {
        name,
        description,
        type,
        visibility,
        location: location || undefined,
        company: company || undefined,
        tags,
        skills,
        avatar: avatarUrl // Passer l'URL de l'image au service
      }
    } else {
      // Gérer JSON standard (sans image)
      groupData = await request.json()
    }

    const groupService = GroupService.getInstance()
    const group = await groupService.createGroup(
      (session.user as any).id,
      groupData
    )

    return NextResponse.json(group, { status: 201 })
  } catch (error: any) {
    console.error("Error creating group:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// Fonction pour sauvegarder l'image uploadée
async function saveUploadedImage(file: File): Promise<string> {
  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop() || 'png'
    const fileName = `${uuidv4()}.${fileExtension}`
    
    // Définir le chemin de sauvegarde
    // Pour Vercel, utilisez /tmp pour le stockage temporaire
    const uploadDir = join(process.cwd(), "public", "uploads", "groups")
    
    // Créer le répertoire s'il n'existe pas (à faire)
    // await mkdir(uploadDir, { recursive: true })
    
    const path = join(uploadDir, fileName)
    await writeFile(path, buffer)
    
    // Retourner l'URL publique
    return `/uploads/groups/${fileName}`
    
  } catch (error) {
    console.error("Error saving image:", error)
    throw new Error("Erreur lors du téléchargement de l'image")
  }
}