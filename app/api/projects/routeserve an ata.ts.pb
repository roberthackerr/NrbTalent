// app/api/projects/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { projectService } from "@/lib/services/project.service"
import { CreateProjectSchema, GetProjectsQuerySchema } from "@/lib/validation/project.schema"
import { ObjectId } from "mongodb"
import { z } from "zod"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    
    // Valider les paramètres
    const validation = GetProjectsQuerySchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: "Invalid parameters",
        details: validation.error.issues
      }, { status: 400 })
    }
    
    const query = validation.data
    const session = await getServerSession(authOptions)
    
    // Récupérer les compétences de l'utilisateur si connecté
    let userSkills: string[] = []
    if (session?.user) {
      // À implémenter: récupérer les compétences de l'utilisateur
    }
    
    const result = await projectService.getProjects({
      page: query.page,
      limit: query.limit,
      category: query.category,
      skills: query.skills,
      budgetMin: query.budgetMin,
      budgetMax: query.budgetMax,
      type: query.type,
      status: query.status as any,
      search: query.search,
      clientId: query.clientId,
      lang: query.lang,
      userSkills
    })
    
    return NextResponse.json({
      success: true,
      data: result
    })
    
  } catch (error) {
    console.error("❌ Error in GET /api/projects:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "Authentication required"
      }, { status: 401 })
    }
    
    if (session.user.role !== "client") {
      return NextResponse.json({
        success: false,
        error: "Only clients can create projects"
      }, { status: 403 })
    }
    
    const body = await request.json()
    
    // Valider les données
    const validation = CreateProjectSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: "Validation failed",
        details: validation.error.issues
      }, { status: 400 })
    }
    
    const data = validation.data
    
    // Créer le DTO
    const projectData = {
      ...data,
      clientId: new ObjectId(session.user.id),
      deadline: new Date(data.deadline)
    }
    
    const projectId = await projectService.createProject(projectData)
    
    return NextResponse.json({
      success: true,
      message: "Project created successfully",
      data: { projectId: projectId.toString() }
    }, { status: 201 })
    
  } catch (error) {
    console.error("❌ Error in POST /api/projects:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}