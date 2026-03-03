// lib/services/project.service.ts
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from "mongodb"
import { 
  Project, 
  CreateProjectDTO, 
  toProjectResponseDTO,
  ProjectResponseDTO,
  ProjectStatus 
} from "@/types/project"

export interface ProjectFilterOptions {
  page?: number
  limit?: number
  category?: string
  skills?: string[]
  budgetMin?: number
  budgetMax?: number
  type?: 'fixed' | 'hourly'
  status?: ProjectStatus
  search?: string
  clientId?: string
  excludeClient?: boolean
  lang?: string
  userSkills?: string[]
  visibility?: 'public' | 'private'
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: any
}

export class ProjectService {
  private collection = "projects"
  
  async createProject(data: CreateProjectDTO): Promise<ObjectId> {
    const db = await getDatabase()
    const project = this.createProject(data)
    
    const result = await db.collection(this.collection).insertOne(project)
    return result.insertedId
  }
  
  async getProjects(options: ProjectFilterOptions = {}): Promise<PaginatedResult<ProjectResponseDTO>> {
    const db = await getDatabase()
    
    const {
      page = 1,
      limit = 12,
      category,
      skills,
      budgetMin = 0,
      budgetMax = 1000000,
      type,
      status = 'open',
      search,
      clientId,
      excludeClient = false,
      lang = 'fr',
      userSkills = [],
      visibility = 'public'
    } = options
    
    // Construire le filtre
    const filter: any = { status, visibility }
    
    if (category) {
      filter.$or = [
        { category },
        { subcategory: category }
      ]
    }
    
    if (skills && skills.length > 0) {
      filter.skills = { $all: skills }
    }
    
    if (budgetMin > 0 || budgetMax < 1000000) {
      filter.$and = [
        { "budget.min": { $gte: budgetMin } },
        { "budget.max": { $lte: budgetMax } }
      ]
    }
    
    if (type) {
      filter["budget.type"] = type
    }
    
    if (search) {
      const searchRegex = { $regex: search, $options: "i" }
      filter.$or = [
        { "localized.title.fr": searchRegex },
        { "localized.title.en": searchRegex },
        { "localized.description.fr": searchRegex },
        { "localized.description.en": searchRegex },
        { skills: searchRegex },
        { category: searchRegex }
      ]
    }
    
    if (clientId && !excludeClient) {
      filter.clientId = new ObjectId(clientId)
    } else if (excludeClient && clientId) {
      filter.clientId = { $ne: new ObjectId(clientId) }
    }
    
    // Pagination
    const skip = (page - 1) * limit
    
    // Exécuter les requêtes
    const [projects, total] = await Promise.all([
      db.collection(this.collection)
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray() as Promise<Project[]>,
      db.collection(this.collection).countDocuments(filter)
    ])
    
    // Enrichir avec les infos clients
    await this.enrichWithClientInfo(projects)
    
    // Convertir en DTO
    const data = projects.map(p => toProjectResponseDTO(p, lang, userSkills))
    
    const totalPages = Math.ceil(total / limit)
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: { category, skills, budgetMin, budgetMax, type }
    }
  }
  
  async getProjectById(id: string, lang: string = 'fr', userSkills: string[] = []): Promise<ProjectResponseDTO | null> {
    const db = await getDatabase()
    
    const project = await db.collection(this.collection).findOne({
      _id: new ObjectId(id)
    }) as Project | null
    
    if (!project) return null
    
    await this.enrichWithClientInfo([project])
    
    return toProjectResponseDTO(project, lang, userSkills)
  }
  
  private async enrichWithClientInfo(projects: Project[]): Promise<void> {
    if (projects.length === 0) return
    
    const clientIds = [...new Set(projects.map(p => p.clientId.toString()))]
    
    const db = await getDatabase()
    const clients = await db.collection("users")
      .find({ _id: { $in: clientIds.map(id => new ObjectId(id)) } })
      .project({ 
        _id: 1, 
        name: 1, 
        avatar: 1, 
        title: 1,
        rating: 1,
        completedProjects: 1,
        verified: 1 
      })
      .toArray()
    
    const clientMap = new Map(clients.map(c => [c._id.toString(), c]))
    
    projects.forEach(project => {
      project.client = clientMap.get(project.clientId.toString())
    })
  }
  
  async incrementViews(id: string): Promise<void> {
    const db = await getDatabase()
    await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      { $inc: { views: 1 } }
    )
  }
  
  async saveProject(userId: string, projectId: string): Promise<boolean> {
    const db = await getDatabase()
    const result = await db.collection(this.collection).updateOne(
      { _id: new ObjectId(projectId) },
      { $addToSet: { savedBy: new ObjectId(userId) } }
    )
    return result.modifiedCount > 0
  }
  
  async unsaveProject(userId: string, projectId: string): Promise<boolean> {
    const db = await getDatabase()
    const result = await db.collection(this.collection).updateOne(
      { _id: new ObjectId(projectId) },
      { $pull: { savedBy: new ObjectId(userId) } }
    )
    return result.modifiedCount > 0
  }
}

export const projectService = new ProjectService()