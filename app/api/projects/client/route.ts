// app/api/projects/client/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5')
    const status = searchParams.get('status')
    const projectId = searchParams.get('id') // NOUVEAU : Support pour ID spécifique
    const db = await getDatabase()
    const clientId = new ObjectId((session.user as any).id)

    // **NOUVEAU : Si un ID spécifique est demandé**
    if (projectId && ObjectId.isValid(projectId)) {
      const project = await db.collection("projects").findOne({
        _id: new ObjectId(projectId),
        clientId
      })

      if (!project) {
        return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 })
      }

      // **RETOUR COMPATIBLE** : Garde le même format que l'ancienne API
      return NextResponse.json({ 
        projects: [project], // Array pour compatibilité
        singleProject: project, // Ajout pour les nouveaux appels
        success: true 
      })
    }

    // **ANCIEN CODE PRÉSERVÉ** : Récupération de la liste
    const filter: any = { clientId }
    if (status && status !== 'all') {
      filter.status = status
    }

    const projects = await db.collection("projects")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    // **RETOUR 100% COMPATIBLE** avec l'ancien format
    return NextResponse.json({ 
      projects, // Même clé que l'ancienne API
      success: true // Ajout optionnel
    })
    
  } catch (error) {
    console.error("Erreur récupération projets client:", error)
    return NextResponse.json(
      { 
        error: "Erreur interne du serveur",
        projects: [] // Retourne un tableau vide pour compatibilité
      },
      { status: 500 }
    )
  }
}