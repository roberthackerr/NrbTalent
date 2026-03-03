import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { aiArchitect } from '@/services/ai-architect'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

function getLimitsForSubscription(plan: string): {
  maxTokens: number;
  maxProjectsPerDay: number;
  costWarning: number;
} {
  const limits = {
    free: { maxTokens: 4000, maxProjectsPerDay: 3, costWarning: 0.50 },
    pro: { maxTokens: 8000, maxProjectsPerDay: 10, costWarning: 2.00 },
    business: { maxTokens: 16000, maxProjectsPerDay: 50, costWarning: 10.00 },
    enterprise: { maxTokens: 32000, maxProjectsPerDay: 1000, costWarning: 100.00 }
  }
  
  return limits[plan as keyof typeof limits] || limits.free
}
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, options = {} } = body
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    // Vérifier si le projet existe et appartient à l'utilisateur
    const db = await getDatabase()
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId),
      clientId: new ObjectId(session.user.id)
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      )
    }

    // Limiter les générations fréquentes (max 1 par 5 minutes)
    if (!options.forceRegenerate && project.metadata?.lastAIGeneration) {
      const lastGen = new Date(project.metadata.lastAIGeneration)
      const now = new Date()
      const minutesDiff = (now.getTime() - lastGen.getTime()) / (1000 * 60)
      
      if (minutesDiff < 5) {
        return NextResponse.json({
          error: 'Please wait before regenerating',
          waitMinutes: Math.ceil(5 - minutesDiff),
          existingBlueprint: project.aiGenerated?.blueprint
        }, { status: 429 })
      }
    }

    // Générer le blueprint
    const result = await aiArchitect.generateForProject({
      projectId,
      userId: session.user.id,
      options
    })

    return NextResponse.json({
      message: 'AI blueprint generated successfully',
      ...result,
      warning: result.metadata.isFallback ? 
        'Generated with fallback model due to API issues' : undefined
    })

  } catch (error: any) {
    console.error('AI Architect Error:', error)
    
    if (error.message.includes('unauthorized') || error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate AI blueprint',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        suggestion: 'Try a different AI model or check your API key'
      },
      { status: 500 }
    )
  }
}
// app/api/ai/architect/route.ts - Corriger la méthode OPTIONS

export async function OPTIONS(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer les modèles disponibles
    const { aiArchitect } = await import('@/services/ai-architect')
    const models = await aiArchitect.getAvailableModels()
    
    // Tester la connexion OpenRouter
    const connectionTest = await aiArchitect.testConnection()
    
    // Obtenir les infos de l'utilisateur pour les limites
    const db = await getDatabase()
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(session.user.id) },
      { projection: { subscription: 1, aiUsage: 1 } }
    )

    // Calculer les limites basées sur l'abonnement
    const subscription = user?.subscription?.plan || 'free'
    const limits = getLimitsForSubscription(subscription)

    return NextResponse.json({
      availableModels: models,
      apiConnected: connectionTest,
      defaultModel: 'deepseek/deepseek-chat',
      recommendedFor: {
        'budget': 'deepseek/deepseek-chat',
        'balanced': 'openai/gpt-4o-mini',
        'quality': 'anthropic/claude-3.5-sonnet',
        'speed': 'google/gemini-2.0-flash-exp',
        'open-source': 'meta-llama/llama-3.3-70b-instruct'
      },
      limits: {
        maxTokens: limits.maxTokens,
        maxProjectsPerDay: limits.maxProjectsPerDay,
        costWarning: limits.costWarning,
        canUsePremiumModels: subscription !== 'free'
      },
      user: {
        subscription: subscription,
        remainingGenerations: limits.maxProjectsPerDay - (user?.aiUsage?.today || 0)
      }
    })

  } catch (error: any) {
    console.error('Options Error:', error)
    
    // Fallback en cas d'erreur
    return NextResponse.json({
      availableModels: [
        {
          id: "deepseek/deepseek-chat",
          name: "DeepSeek Chat",
          provider: "DeepSeek",
          costPerMillion: { input: 0.14, output: 0.28 },
          maxTokens: 32768,
          capabilities: ["code", "analysis", "planning"],
          bestFor: ["MVP", "Budget projects", "Technical planning"]
        }
      ],
      apiConnected: false,
      defaultModel: 'deepseek/deepseek-chat',
      error: 'Unable to fetch models, using fallback',
      warning: 'Check your OPENROUTER_API_KEY environment variable'
    })
  }
}

// Helper function pour les limites

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const includeFreelancers = searchParams.get('includeFreelancers') === 'true'
    const refresh = searchParams.get('refresh') === 'true'
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Construire le filtre de base
    const baseFilter: any = { _id: new ObjectId(projectId) }
    
    // Construire les conditions d'accès
    const accessConditions: any[] = [
      { clientId: new ObjectId(session.user.id) },
      { freelancerId: new ObjectId(session.user.id) },
      { 'collaborators.userId': new ObjectId(session.user.id) }
    ]
    
    // Pour les admins, on n'ajoute pas de filtre supplémentaire (ils peuvent tout voir)
    if (session.user.role !== 'admin') {
      baseFilter.$or = accessConditions
    }
    
    const project = await db.collection('projects').findOne(
      baseFilter,
      {
        projection: {
          aiGenerated: 1,
          title: 1,
          clientId: 1,
          metadata: 1,
          freelancerId: 1,
          collaborators: 1,
          status: 1,
          budget: 1
        }
      }
    )

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      )
    }

    // Si refresh demandé et autorisé, regénérer les freelances
    let suggestedFreelancers = []
    const isClient = project.clientId?.toString() === session.user.id
    const isAdmin = session.user.role === 'admin'
    
    if (refresh && (isClient || isAdmin)) {
      if (project.aiGenerated?.blueprint) {
        // Note: Nous devons importer aiArchitect depuis services/ai-architect
        // Si tu veux éviter les imports circulaires, tu peux créer une instance ici
        const { aiArchitect } = await import('@/services/ai-architect')
        const architect = new (aiArchitect.constructor as any)()
        suggestedFreelancers = await architect['findMatchingFreelancers'](project.aiGenerated.blueprint)
        
        // Mettre à jour la liste
        await db.collection('projects').updateOne(
          { _id: new ObjectId(projectId) },
          {
            $set: {
              'aiGenerated.suggestedFreelancers': suggestedFreelancers.map((f:any) => f._id),
              'aiGenerated.lastRefresh': new Date()
            }
          }
        )
      }
    } else if (includeFreelancers && project.aiGenerated?.suggestedFreelancers?.length > 0) {
      suggestedFreelancers = await db.collection('users').find(
        { _id: { $in: project.aiGenerated.suggestedFreelancers } },
        { 
          projection: { 
            name: 1, 
            avatar: 1, 
            title: 1, 
            skills: 1, 
            hourlyRate: 1,
            'statistics.clientSatisfaction': 1,
            'availability.status': 1,
            portfolio: { $slice: ["$portfolio", 2] }
          } 
        }
      ).toArray()
    }

    if (!project.aiGenerated?.blueprint) {
      return NextResponse.json(
        { 
          message: 'No AI blueprint found for this project',
          canGenerate: isClient || isAdmin,
          projectTitle: project.title,
          userRole: session.user.role
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      blueprint: project.aiGenerated.blueprint,
      suggestedFreelancers: suggestedFreelancers.map(f => ({
        _id: f._id,
        name: f.name,
        avatar: f.avatar,
        title: f.title,
        skills: f.skills,
        hourlyRate: f.hourlyRate,
        rating: f.statistics?.clientSatisfaction,
        availability: f.availability?.status,
        portfolioPreview: f.portfolio?.slice(0, 2)
      })),
      metadata: {
        generatedAt: project.aiGenerated.generatedAt,
        modelUsed: project.aiGenerated.modelUsed,
        confidenceScore: project.aiGenerated.confidenceScore,
        version: project.aiGenerated.version,
        isFallback: project.aiGenerated.isFallback,
        lastRefresh: project.aiGenerated.lastRefresh,
        canRegenerate: isClient || isAdmin,
        lastGenerated: project.metadata?.lastAIGeneration
      },
      project: {
        title: project.title,
        clientId: project.clientId,
        freelancerId: project.freelancerId,
        status: project.status,
        budget: project.budget
      },
      accessInfo: {
        isClient,
        isAdmin,
        isFreelancer: project.freelancerId?.toString() === session.user.id,
        isCollaborator: project.collaborators?.some((c: any) => 
          c.userId?.toString() === session.user.id
        )
      }
    })

  } catch (error: any) {
    console.error('Get AI Blueprint Error:', error)
    
    // Erreur plus spécifique pour ObjectId invalide
    if (error.message.includes('ObjectId') || error.message.includes('hex string')) {
      return NextResponse.json(
        { error: 'Invalid project ID format' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to retrieve AI blueprint', details: error.message },
      { status: 500 }
    )
  }
}
