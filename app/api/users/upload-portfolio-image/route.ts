// app/api/users/upload-portfolio-image/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

// ❌ ANCIENNE SYNTAXE (dépréciée)
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// }

// ✅ NOUVELLE SYNTAXE (Next.js 13/14)
export const dynamic = 'force-dynamic' // Optionnel, pour éviter la mise en cache
export const maxDuration = 30 // Optionnel, durée max en secondes

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Dans Next.js 14, le bodyParser est désactivé par défaut pour FormData
    // Pas besoin de le configurer manuellement
    const formData = await request.formData()
    const file = formData.get("image") as File
    const portfolioId = formData.get("portfolioId") as string

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    // Validation du type de fichier
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP" },
        { status: 400 }
      )
    }

    // Validation de la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "L'image doit faire moins de 5MB" },
        { status: 400 }
      )
    }

    // Créer un nom de fichier unique
    const timestamp = Date.now()
    const fileName = `${session.user.id}_${portfolioId || timestamp}_${file.name.replace(/\s+/g, '_')}`
    const fileExtension = file.name.split('.').pop()
    const finalFileName = `${fileName}.${fileExtension}`

    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Définir le chemin de sauvegarde
    const uploadDir = join(process.cwd(), "public", "uploads", "portfolio")
    
    // Créer le dossier s'il n'existe pas
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const filePath = join(uploadDir, finalFileName)

    // Sauvegarder le fichier
    await writeFile(filePath, buffer)

    // Créer l'URL publique
    const imageUrl = `/uploads/portfolio/${finalFileName}`

    // Si un portfolioId est fourni, mettre à jour l'image dans la base de données
    if (portfolioId) {
      const db = await getDatabase()
      const userId = new ObjectId((session.user as any).id)

      await db.collection("users").updateOne(
        { 
          _id: userId,
          "portfolio.id": portfolioId 
        },
        {
          $set: {
            "portfolio.$.image": imageUrl,
            "portfolio.$.updatedAt": new Date(),
            updatedAt: new Date()
          }
        }
      )
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      fileName: finalFileName,
      message: "Image uploadée avec succès"
    })

  } catch (error) {
    console.error("Erreur lors de l'upload de l'image:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'upload de l'image" },
      { status: 500 }
    )
  }
}