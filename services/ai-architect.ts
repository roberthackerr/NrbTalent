import { openRouter, AI_MODELS, BlueprintGenerationOptions, AIModel } from '@/lib/openrouter'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { User, Project } from '@/lib/models/user.ts.bp'

export interface AIBlueprint {
  analysis: {
    domain: string
    complexity: 'low' | 'medium' | 'high'
    targetUsers: string[]
    keyFeatures: string[]
    technicalRequirements: string[]
    uniqueAspects: string[]
  }
  techStack: {
    frontend: { primary: string; alternatives: string[]; reasoning: string }
    backend: { primary: string; alternatives: string[]; reasoning: string }
    database: { primary: string; alternatives: string[]; reasoning: string }
    apis: string[]
    devops: string[]
    mobile: { primary: string; alternatives: string[]; reasoning: string }
    hosting: { primary: string; alternatives: string[]; reasoning: string }
  }
  architecture: {
    diagram: string
    components: Array<{ name: string; description: string; responsibility: string; tech: string }>
    patterns: string[]
    scalabilityConsiderations: string[]
  }
  timeline: {
    phases: Array<{ name: string; duration: number; tasks: string[]; deliverables: string[]; priority: 'high' | 'medium' | 'low' }>
    totalWeeks: number
    criticalPath: string[]
    milestones: Array<{ week: number; description: string; importance: 'high' | 'medium' | 'low' }>
  }
  team: {
    recommendedRoles: Array<{ role: string; experience: 'junior' | 'mid' | 'senior'; hours: number; responsibilities: string[]; skillsRequired: string[] }>
    totalHours: number
    teamSize: number
    collaborationTools: string[]
  }
  budget: {
    min: number
    recommended: number
    max: number
    breakdown: Array<{ role: string; hours: number; rate: number; total: number; justification: string }>
    currency: string
    hostingCosts: { monthly: number; annual: number }
    thirdPartyCosts: { monthly: number; annual: number }
  }
  risks: Array<{ risk: string; probability: 'low' | 'medium' | 'high'; impact: 'low' | 'medium' | 'high'; mitigation: string; owner: string }>
  successMetrics: string[]
  recommendations: string[]
  metadata?: {
    generatedAt: string
    briefLength: number
    projectType?: string
    hasMobile: boolean
    hasEcommerce: boolean
    complexityScore: number
  }
}

export interface AIArchitectResult {
  blueprint: AIBlueprint
  suggestedFreelancers: Array<{
    _id: ObjectId
    name: string
    avatar?: string
    title?: string
    skills: string[]
    hourlyRate?: number
    rating?: number
    matchScore: number
    matchReasons: string[]
  }>
  metadata: {
    generatedAt: Date
    modelUsed: string
    confidenceScore: number
    estimatedCost: number
    tokensUsed: number
    processingTime: number
    generationCost: number
    isFallback: boolean
  }
  options: {
    modelId: string
    forceRegenerate: boolean
    customizations: any
  }
}

export interface GenerationRequest {
  projectId: string
  userId: string
  options?: {
    modelId?: string
    forceRegenerate?: boolean
    customTemperature?: number
    customMaxTokens?: number
  }
}

export class AIProjectArchitect {
  private db = getDatabase()

  async generateForProject(request: GenerationRequest): Promise<AIArchitectResult> {
    try {
      const { projectId, userId, options = {} } = request
      
      // 1. Récupérer le projet
      const project = await this.getProject(projectId, userId)
      if (!project) {
        throw new Error('Project not found or unauthorized')
      }

      // 2. Vérifier si déjà généré (sauf si forceRegenerate)
      if (project.aiGenerated?.blueprint && !options.forceRegenerate) {
        return await this.getExistingBlueprint(projectId, project)
      }

      // 3. Préparer le brief
      const brief = this.buildProjectBrief(project)

      // 4. Options de génération
      const generationOptions: BlueprintGenerationOptions = {
        modelId: options.modelId,
        temperature: options.customTemperature,
        maxTokens: options.customMaxTokens
      }

      // 5. Générer le blueprint avec l'IA
      const { blueprint, stats } = await openRouter.generateBlueprint(
        brief, 
        project.category,
        generationOptions
      )

      // 6. Enrichir avec des données réelles
      const enrichedBlueprint = await this.enrichBlueprint(blueprint, project, stats)

      // 7. Trouver des freelances correspondants
      const suggestedFreelancers = await this.findMatchingFreelancers(enrichedBlueprint)

      // 8. Calculer la confiance
      const confidenceScore = this.calculateConfidenceScore(enrichedBlueprint, suggestedFreelancers)

      // 9. Sauvegarder les résultats
      await this.saveResults(projectId, enrichedBlueprint, suggestedFreelancers, stats, options)

      return {
        blueprint: enrichedBlueprint,
        suggestedFreelancers,
        metadata: {
          generatedAt: new Date(),
          modelUsed: stats.modelUsed,
          confidenceScore,
          estimatedCost: enrichedBlueprint.budget?.recommended || 0,
          tokensUsed: stats.inputTokens + stats.outputTokens,
          processingTime: stats.processingTime,
          generationCost: stats.cost,
          isFallback: stats.modelUsed === 'fallback'
        },
        options: {
          modelId: options.modelId || 'deepseek/deepseek-chat',
          forceRegenerate: options.forceRegenerate || false,
          customizations: options
        }
      }
    } catch (error) {
      console.error('Error in generateForProject:', error)
      throw error
    }
  }

  private async getProject(projectId: string, userId: string): Promise<Project | null> {
    try {
      const db = await this.db
      const project = await db.collection('projects').findOne({
        _id: new ObjectId(projectId),
        clientId: new ObjectId(userId)
      })
      return project as unknown as Project
    } catch (error) {
      console.error('Error getting project:', error)
      return null
    }
  }

  private async getExistingBlueprint(projectId: string, project: any): Promise<AIArchitectResult> {
    try {
      // Vérifier que le blueprint existe
      if (!project?.aiGenerated?.blueprint) {
        throw new Error('No existing blueprint found')
      }

      // Récupérer les freelances suggérés avec gestion d'erreur
      let freelancers = []
      try {
        freelancers = await this.findMatchingFreelancers(project.aiGenerated.blueprint)
      } catch (error) {
        console.error('Error finding matching freelancers:', error)
        // Continuer sans freelances plutôt que d'échouer
      }
      
      return {
        blueprint: project.aiGenerated.blueprint,
        suggestedFreelancers: freelancers,
        metadata: {
          generatedAt: project.aiGenerated.generatedAt || new Date(),
          modelUsed: project.aiGenerated.modelUsed || 'unknown',
          confidenceScore: project.aiGenerated.confidenceScore || 70,
          estimatedCost: project.aiGenerated.blueprint?.budget?.recommended || 0,
          tokensUsed: project.aiGenerated.tokensUsed || 0,
          processingTime: project.aiGenerated.processingTime || 0,
          generationCost: project.aiGenerated.generationCost || 0,
          isFallback: project.aiGenerated.isFallback || false
        },
        options: {
          modelId: project.aiGenerated.modelUsed || 'deepseek/deepseek-chat',
          forceRegenerate: false,
          customizations: {}
        }
      }
    } catch (error) {
      console.error('Error in getExistingBlueprint:', error)
      throw error
    }
  }

  private buildProjectBrief(project: Project): string {
    const title = project?.title || 'Non spécifié'
    const description = project?.description || 'Aucune description fournie'
    const category = project?.category || 'Non spécifiée'
    const subcategory = project?.subcategory || ''
    const deadline = project?.deadline ? new Date(project.deadline).toLocaleDateString('fr-FR') : ''
    const budgetType = project?.budget?.type || 'Non spécifié'
    const budgetMin = project?.budget?.min || 0
    const budgetMax = project?.budget?.max || 0
    const budgetCurrency = project?.budget?.currency || 'USD'
    const skills = project?.skills?.join(', ') || 'Aucune compétence spécifiée'
    const tags = project?.tags?.join(', ') || ''
    const attachmentsCount = project?.attachments?.length || 0
    const status = project?.status || 'Nouveau'
    const createdAt = new Date(project?.createdAt || Date.now()).toLocaleDateString('fr-FR')
    const location = project?.location || ''
    const preferredLanguages = project?.preferredLanguages?.join(', ') || ''

    return `
TITRE DU PROJET: ${title}
DESCRIPTION DÉTAILLÉE: ${description}

INFORMATIONS CLIENT:
- Catégorie: ${category}
${subcategory ? `- Sous-catégorie: ${subcategory}` : ''}
${deadline ? `- Deadline: ${deadline}` : ''}

CONTRAINTES BUDGÉTAIRES:
- Type: ${budgetType}
- Budget minimum: ${budgetMin} ${budgetCurrency}
- Budget maximum: ${budgetMax} ${budgetCurrency}

EXIGENCES TECHNIQUES:
- Compétences requises: ${skills}
${tags ? `- Tags: ${tags}` : ''}
${attachmentsCount > 0 ? `- ${attachmentsCount} pièce(s) jointe(s)` : ''}

CONTEXTE SUPPLÉMENTAIRE:
- Statut: ${status}
- Date de création: ${createdAt}
${location ? `- Localisation: ${location}` : ''}
${preferredLanguages ? `- Langues préférées: ${preferredLanguages}` : ''}

ATTENTES SPÉCIFIQUES:
${description?.length > 500 ? 'NOTE: Description détaillée fournie - projet probablement complexe' : 
   description?.length < 100 ? 'NOTE: Description brève - besoins à clarifier' : 
   'NOTE: Description standard'}

CRITÈRES IMPORTANTS POUR L'ARCHITECTURE:
1. Respecter le budget ${budgetMin > 0 ? `de ${budgetMin} ${budgetCurrency}` : 'non spécifié'}
2. ${deadline ? `Respecter la deadline du ${deadline}` : 'Pas de deadline stricte'}
3. Utiliser les compétences: ${skills}
4. ${tags?.includes('responsive') ? 'Design responsive obligatoire' : 'Design adaptatif recommandé'}
5. ${tags?.includes('scalable') ? 'Architecture scalable requise' : 'Évolutivité à considérer'}

MOTS-CLÉS IDENTIFIÉS: ${this.extractKeywords(project)}
`.trim()
  }

  private extractKeywords(project: Project): string {
    if (!project) return 'projet-technique-standard'
    
    const keywords = []
    const text = `${project.title || ''} ${project.description || ''} ${project.skills?.join(' ') || ''} ${project.tags?.join(' ') || ''}`.toLowerCase()
    
    if (text.includes('mobile') || text.includes('app')) keywords.push('mobile')
    if (text.includes('web') || text.includes('site')) keywords.push('web')
    if (text.includes('e-commerce') || text.includes('boutique') || text.includes('shop')) keywords.push('e-commerce')
    if (text.includes('saas') || text.includes('software') || text.includes('abonnement')) keywords.push('saas')
    if (text.includes('api') || text.includes('interface')) keywords.push('api')
    if (text.includes('database') || text.includes('base de données')) keywords.push('database')
    if (text.includes('real-time') || text.includes('temps réel')) keywords.push('real-time')
    if (text.includes('cloud') || text.includes('aws') || text.includes('azure')) keywords.push('cloud')
    
    return keywords.length > 0 ? keywords.join(', ') : 'projet-technique-standard'
  }

  private async enrichBlueprint(blueprint: any, project: Project, stats: any): Promise<AIBlueprint> {
    try {
      // Validation du blueprint
      if (!blueprint) {
        throw new Error('Blueprint is null or undefined')
      }

      // 1. Ajuster le budget selon le projet client
      if (project?.budget) {
        const projectBudgetMin = project.budget.min || 0
        const projectBudgetMax = project.budget.max || 0
        const projectBudgetAvg = (projectBudgetMin + projectBudgetMax) / 2
        const aiBudget = blueprint.budget?.recommended || 0
        
        if (aiBudget > 0 && projectBudgetAvg > 0) {
          // Si l'IA est trop éloignée du budget client, ajuster
          if (Math.abs(aiBudget - projectBudgetAvg) / projectBudgetAvg > 0.5) {
            const adjustmentFactor = projectBudgetAvg / aiBudget
            blueprint.budget.min = Math.round((blueprint.budget.min || 0) * adjustmentFactor)
            blueprint.budget.recommended = Math.round(projectBudgetAvg)
            blueprint.budget.max = Math.round((blueprint.budget.max || 0) * adjustmentFactor)
            
            // Ajuster le breakdown proportionnellement
            if (blueprint.budget.breakdown?.length) {
              blueprint.budget.breakdown.forEach((item: any) => {
                item.total = Math.round((item.total || 0) * adjustmentFactor)
              })
            }
          }
        }
        
        // Utiliser la devise du projet
        if (project.budget.currency) {
          blueprint.budget.currency = project.budget.currency
        }
      }

      // 2. Ajuster la timeline selon la deadline
      if (project?.deadline) {
        const today = new Date()
        const deadline = new Date(project.deadline)
        const weeksUntilDeadline = Math.max(1, Math.ceil((deadline.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000)))
        
        if (blueprint.timeline?.totalWeeks > weeksUntilDeadline) {
          // Réduire la timeline de manière intelligente
          const reductionFactor = weeksUntilDeadline / blueprint.timeline.totalWeeks
          blueprint.timeline.totalWeeks = Math.floor(weeksUntilDeadline * 0.9) // Laisser 10% de buffer
          
          if (blueprint.timeline.phases?.length) {
            blueprint.timeline.phases.forEach((phase: any) => {
              phase.duration = Math.max(1, Math.floor((phase.duration || 0) * reductionFactor))
            })
          }
          
          if (blueprint.timeline.milestones?.length) {
            blueprint.timeline.milestones.forEach((milestone: any) => {
              milestone.week = Math.max(1, Math.floor((milestone.week || 0) * reductionFactor))
            })
          }
        }
      }

      // 3. Filtrer les compétences selon celles demandées
      const requestedSkills = project?.skills?.map(s => s.toLowerCase()) || []
      if (requestedSkills.length > 0 && blueprint.team?.recommendedRoles?.length) {
        blueprint.team.recommendedRoles = blueprint.team.recommendedRoles.map((role: any) => ({
          ...role,
          skillsRequired: (role.skillsRequired || []).filter((skill: string) => 
            requestedSkills.some(requestedSkill => 
              skill?.toLowerCase().includes(requestedSkill.toLowerCase()) ||
              requestedSkill.toLowerCase().includes(skill?.toLowerCase() || '')
            )
          )
        }))
      }

      // 4. Ajouter des métadonnées de génération
      blueprint.generationStats = {
        model: stats?.modelUsed || 'unknown',
        tokens: (stats?.inputTokens || 0) + (stats?.outputTokens || 0),
        cost: stats?.cost || 0,
        processingTime: stats?.processingTime || 0,
        isFallback: stats?.modelUsed === 'fallback',
        generatedAt: new Date().toISOString()
      }

      return blueprint
    } catch (error) {
      console.error('Error in enrichBlueprint:', error)
      return blueprint
    }
  }

  private async findMatchingFreelancers(blueprint: AIBlueprint) {
    try {
      const db = await this.db
      
      // Vérifier que blueprint existe et a les propriétés nécessaires
      if (!blueprint || !blueprint.techStack || !blueprint.team) {
        console.warn('Blueprint incomplet pour le matching freelancer')
        return []
      }

      // Extraire les compétences requises avec des valeurs par défaut
      const requiredSkills = [
        blueprint.techStack.frontend?.primary?.toLowerCase() || '',
        blueprint.techStack.backend?.primary?.toLowerCase() || '',
        blueprint.techStack.database?.primary?.toLowerCase() || '',
        ...(blueprint.techStack.apis || []).map(api => api?.toLowerCase() || '').filter(api => api),
        ...(blueprint.team.recommendedRoles || []).flatMap(role => 
          (role.skillsRequired || []).map(skill => skill?.toLowerCase() || '').filter(skill => skill)
        )
      ].filter(skill => skill && skill.length > 0) // Filtrer les chaînes vides

      // Si pas de compétences, retourner un tableau vide
      if (requiredSkills.length === 0) {
        console.log('Aucune compétence trouvée dans le blueprint pour le matching')
        return []
      }

      // Chercher des freelances avec ces compétences
      const freelancers = await db.collection<User>('users').aggregate([
        {
          $match: {
            role: 'freelance',
            'availability.status': { $in: ['available', 'busy'] },
            $or: [
              { skills: { $in: requiredSkills } },
              { 'portfolio.technologies': { $in: requiredSkills } },
              { 'experience.technologies': { $in: requiredSkills } },
              { 'title': { $regex: new RegExp(requiredSkills.join('|'), 'i') } }
            ]
          }
        },
        {
          $addFields: {
            matchScore: {
              $add: [
                // Score pour les compétences exactes
                {
                  $multiply: [
                    { $size: { 
                      $setIntersection: [
                        { $map: { input: "$skills", as: "skill", in: { $toLower: "$$skill" } } },
                        requiredSkills
                      ] 
                    } },
                    25
                  ]
                },
                // Score pour l'expérience
                {
                  $cond: [
                    { $gt: [{ $size: '$experience' }, 3] },
                    20,
                    { $cond: [{ $gt: [{ $size: '$experience' }, 1] }, 10, 5] }
                  ]
                },
                // Score pour les avis
                {
                  $cond: [
                    { $gt: ['$statistics?.clientSatisfaction', 4.7] },
                    15,
                    { $cond: [{ $gt: ['$statistics?.clientSatisfaction', 4.0] }, 10, 5] }
                  ]
                },
                // Score pour la disponibilité
                {
                  $cond: [
                    { $eq: ['$availability.status', 'available'] },
                    10,
                    5
                  ]
                },
                // Score pour le taux horaire réaliste
                {
                  $cond: [
                    { $and: [
                      { $gte: ['$hourlyRate', 25] },
                      { $lte: ['$hourlyRate', 100] }
                    ]},
                    10,
                    0
                  ]
                },
                // Score pour les projets similaires
                {
                  $multiply: [
                    { $size: { 
                      $filter: {
                        input: "$portfolio",
                        as: "project",
                        cond: {
                          $regexMatch: {
                            input: "$$project.description",
                            regex: new RegExp(blueprint.analysis?.domain || '', "i")
                          }
                        }
                      }
                    }},
                    5
                  ]
                }
              ]
            },
            matchReasons: {
              $concatArrays: [
                { $cond: [{ $gt: [{ $size: { $setIntersection: ["$skills", requiredSkills] } }, 0] }, ["Skills matchés"], []] },
                { $cond: [{ $gt: ['$statistics?.clientSatisfaction', 4.5] }, ["Hautes notes"], []] },
                { $cond: [{ $eq: ['$availability.status', 'available'] }, ["Disponible maintenant"], []] }
              ]
            }
          }
        },
        { $sort: { matchScore: -1 } },
        { $limit: 8 },
        {
          $project: {
            _id: 1,
            name: 1,
            avatar: 1,
            title: 1,
            skills: 1,
            hourlyRate: 1,
            'statistics.clientSatisfaction': 1,
            'availability.status': 1,
            portfolio: { $slice: ["$portfolio", 2] },
            matchScore: 1,
            matchReasons: 1
          }
        }
      ]).toArray()

      return freelancers.map(f => ({
        _id: f._id!,
        name: f.name || '',
        avatar: f.avatar,
        title: f.title,
        skills: f.skills || [],
        hourlyRate: f.hourlyRate,
        rating: f.statistics?.clientSatisfaction,
        matchScore: f.matchScore || 0,
        matchReasons: f.matchReasons || []
      }))

    } catch (error) {
      console.error('Erreur lors de la recherche de freelances:', error)
      return []
    }
  }

  private calculateConfidenceScore(blueprint: AIBlueprint, freelancers: any[]): number {
    try {
      let score = 75 // Base score

      // Ajuster selon la complexité
      if (blueprint.analysis?.complexity === 'low') score += 5
      if (blueprint.analysis?.complexity === 'high') score -= 10

      // Ajuster selon la qualité du blueprint
      if (blueprint.analysis?.uniqueAspects?.length > 0) score += 5
      if (blueprint.metadata?.isFallback) score -= 20

      // Ajuster selon la disponibilité des freelances
      const goodMatches = freelancers.filter(f => f.matchScore > 70).length
      if (goodMatches >= 3) score += 15
      if (goodMatches >= 5) score += 10
      if (goodMatches === 0) score -= 25

      // Ajuster selon le réalisme du budget
      const estimatedCost = blueprint.budget?.recommended || 0
      const estimatedHours = blueprint.team?.totalHours || 0
      
      if (estimatedHours > 0) {
        const freelancersWithRate = freelancers.filter(f => f.hourlyRate && f.hourlyRate > 0)
        if (freelancersWithRate.length > 0) {
          const averageHourlyRate = freelancersWithRate
            .reduce((sum, f) => sum + f.hourlyRate!, 0) / freelancersWithRate.length
          
          if (averageHourlyRate > 0) {
            const realisticCost = averageHourlyRate * estimatedHours * 1.2 // 20% de buffer
            const costDifference = Math.abs(estimatedCost - realisticCost) / realisticCost
            
            if (costDifference < 0.2) score += 15
            else if (costDifference < 0.4) score += 5
            else score -= 10
          }
        }
      }

      // Ajuster selon la complétude
      const completenessChecks = [
        blueprint.architecture?.diagram?.length > 50,
        blueprint.timeline?.phases?.length >= 2,
        blueprint.team?.recommendedRoles?.length >= 1,
        blueprint.budget?.breakdown?.length >= 1,
        blueprint.risks?.length >= 2
      ]
      
      const completenessScore = completenessChecks.filter(Boolean).length / completenessChecks.length
      score += Math.round(completenessScore * 20)

      return Math.max(0, Math.min(100, Math.round(score)))
    } catch (error) {
      console.error('Error calculating confidence score:', error)
      return 70 // Score par défaut en cas d'erreur
    }
  }

  private async saveResults(
    projectId: string, 
    blueprint: AIBlueprint, 
    freelancers: any[], 
    stats: any,
    options: any
  ) {
    try {
      const db = await this.db
      
      await db.collection('projects').updateOne(
        { _id: new ObjectId(projectId) },
        {
          $set: {
            'aiGenerated': {
              blueprint,
              suggestedFreelancers: freelancers.map(f => f._id),
              generatedAt: new Date(),
              modelUsed: stats?.modelUsed || 'unknown',
              confidenceScore: this.calculateConfidenceScore(blueprint, freelancers),
              tokensUsed: (stats?.inputTokens || 0) + (stats?.outputTokens || 0),
              processingTime: stats?.processingTime || 0,
              generationCost: stats?.cost || 0,
              isFallback: stats?.modelUsed === 'fallback',
              options: options,
              version: '2.0'
            },
            'metadata.aiEnhanced': true,
            'metadata.lastAIGeneration': new Date(),
            'metadata.complexityScore': this.calculateComplexityScore(blueprint),
            updatedAt: new Date()
          },
          $push: {
            'metadata.aiGenerationHistory': {
              timestamp: new Date(),
              model: stats?.modelUsed || 'unknown',
              cost: stats?.cost || 0,
              isFallback: stats?.modelUsed === 'fallback'
            }
          }
        }
      )

      // Log l'utilisation
      await db.collection('ai_usage_logs').insertOne({
        projectId: new ObjectId(projectId),
        action: 'generate_blueprint',
        model: stats?.modelUsed || 'unknown',
        inputTokens: stats?.inputTokens || 0,
        outputTokens: stats?.outputTokens || 0,
        cost: stats?.cost || 0,
        processingTime: stats?.processingTime || 0,
        isFallback: stats?.modelUsed === 'fallback',
        options: options,
        timestamp: new Date(),
        confidenceScore: this.calculateConfidenceScore(blueprint, freelancers)
      })
    } catch (error) {
      console.error('Error saving results:', error)
      // Ne pas throw l'erreur pour ne pas faire échouer toute la génération
    }
  }

  private calculateComplexityScore(blueprint: AIBlueprint): number {
    try {
      let score = 5 // Base

      // Complexité analysée
      if (blueprint.analysis?.complexity === 'medium') score = 6
      if (blueprint.analysis?.complexity === 'high') score = 8

      // Nombre de technologies uniques
      const techSet = new Set([
        blueprint.techStack?.frontend?.primary,
        blueprint.techStack?.backend?.primary,
        blueprint.techStack?.database?.primary,
        ...(blueprint.techStack?.apis || []),
        ...(blueprint.techStack?.devops || [])
      ].filter(Boolean))
      
      score += Math.min(techSet.size, 4)

      // Durée du projet
      if (blueprint.timeline?.totalWeeks > 12) score += 2
      else if (blueprint.timeline?.totalWeeks > 8) score += 1

      // Taille de l'équipe
      if (blueprint.team?.teamSize > 3) score += 1
      if (blueprint.team?.teamSize > 5) score += 1

      return Math.min(10, Math.max(1, score))
    } catch (error) {
      console.error('Error calculating complexity score:', error)
      return 5 // Score par défaut
    }
  }

  async testConnection() {
    try {
      return await openRouter.testConnection()
    } catch (error) {
      console.error('Error testing connection:', error)
      return false
    }
  }
   async getAvailableModels(): Promise<AIModel[]> {
    try {
      return await openRouter.getAvailableModels()
    } catch (error) {
      console.error('Error getting available models:', error)
      // Fallback aux modèles statiques
      return [
        {
          id: "deepseek/deepseek-chat",
          name: "DeepSeek Chat",
          provider: "DeepSeek",
          costPerMillion: { input: 0.14, output: 0.28 },
          maxTokens: 32768,
          capabilities: ["code", "analysis", "planning"],
          bestFor: ["MVP", "Budget projects", "Technical planning"]
        },
        {
          id: "openai/gpt-4o-mini",
          name: "GPT-4o Mini",
          provider: "OpenAI",
          costPerMillion: { input: 0.15, output: 0.60 },
          maxTokens: 16384,
          capabilities: ["balanced", "efficient", "creative"],
          bestFor: ["General purpose", "Cost-effective", "Quick iterations"]
        }
      ]
    }
  }

}

export const aiArchitect = new AIProjectArchitect()