// app/api/projects/[id]/onboarding/route.ts - CORRIGÉ
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { id } from 'date-fns/locale'

// Schéma de validation pour l'onboarding
const OnboardingSchema = z.object({
  action: z.enum(['start_tracking', 'update_details', 'complete_onboarding']),
  projectDetails: z.object({
    timeline: z.string().optional(),
    budget: z.number().min(0).optional(),
    milestones: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      dueDate: z.string().datetime(),
      amount: z.number().min(0).optional()
    })).optional(),
    communicationPreferences: z.object({
      frequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly']),
      channels: z.array(z.enum(['email', 'in_app', 'slack', 'whatsapp'])),
      meetingFrequency: z.enum(['weekly', 'bi-weekly', 'monthly', 'as_needed'])
    }).optional()
  }).optional()
}).strict()

export async function POST(
  request: NextRequest,
 { params }: { params: Promise<{id: string}>  }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('❌ Aucune session trouvée')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const {id}=await params
    // CORRECTION: Meilleure validation de l'ID
    let projectId: ObjectId
    try {
      projectId = new ObjectId(id)
    } catch (error) {
      console.log('❌ ID de projet invalide:', id)
      return NextResponse.json({ error: 'ID de projet invalide' }, { status: 400 })
    }

    const body = await request.json()
    const validationResult = OnboardingSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Données invalides', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const { action, projectDetails } = validationResult.data
    const db = await getDatabase()
    
    // CORRECTION CRITIQUE: Vérifier que l'ID utilisateur existe dans la session
    const sessionUserId = (session.user as any)?.id
    if (!sessionUserId) {
      console.log('❌ ID utilisateur manquant dans la session:', session.user)
      return NextResponse.json({ error: 'Session utilisateur invalide' }, { status: 401 })
    }

    let userId: ObjectId
    try {
      userId = new ObjectId(sessionUserId)
    } catch (error) {
      console.log('❌ ID utilisateur invalide dans la session:', sessionUserId)
      return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 401 })
    }

    console.log('🔍 Debug POST onboarding:')
    console.log('Session user ID:', sessionUserId)
    console.log('User ID (ObjectId):', userId)
    console.log('Project ID:', projectId)
    console.log('Action:', action)

    // CORRECTION: Vérifier d'abord si le projet existe
    const project = await db.collection('projects').findOne({ _id: projectId })
    console.log('Projet trouvé (sans filtre):', project ? {
      _id: project._id,
      title: project.title,
      status: project.status,
      clientId: project.clientId,
      freelancerId: project.freelancerId
    } : null)

    if (!project) {
      console.log('❌ Projet non trouvé avec ID:', projectId)
      return NextResponse.json(
        { error: 'Projet non trouvé' }, 
        { status: 404 }
      )
    }

    // CORRECTION: Vérifier les permissions
    const isClient = project.clientId?.toString() === userId.toString()
    const isFreelancer = project.freelancerId?.toString() === userId.toString()
    
    console.log('Permissions - isClient:', isClient, 'isFreelancer:', isFreelancer)
    console.log('Project clientId:', project.clientId?.toString())
    console.log('Project freelancerId:', project.freelancerId?.toString())
    console.log('User ID string:', userId.toString())

    if (!isClient && !isFreelancer) {
      console.log('❌ Utilisateur non autorisé pour ce projet')
      return NextResponse.json(
        { error: 'Accès non autorisé à ce projet' }, 
        { status: 403 }
      )
    }

    switch (action) {
      case 'start_tracking':
        return await startProjectTracking(db, projectId, project, userId)
      
      case 'update_details':
        return await updateProjectDetails(db, projectId, projectDetails, userId)
      
      case 'complete_onboarding':
        return await completeOnboarding(db, projectId, project, userId)
      
      default:
        return NextResponse.json(
          { error: 'Action non valide' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Erreur onboarding:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// GET - Récupérer les données d'onboarding - CORRIGÉ
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{id: string}>  }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('❌ Aucune session pour GET')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // CORRECTION: Meilleure validation de l'ID
    let projectId: ObjectId
    try {
      const {id}= await params 
      projectId = new ObjectId(id)
    } catch (error) {
      console.log('❌ ID de projet invalide pour GET:', id)
      return NextResponse.json({ error: 'ID de projet invalide' }, { status: 400 })
    }

    const db = await getDatabase()
    
    // CORRECTION: Vérifier l'ID utilisateur dans la session
    const sessionUserId = (session.user as any)?.id
    if (!sessionUserId) {
      console.log('❌ ID utilisateur manquant dans la session GET:', session.user)
      return NextResponse.json({ error: 'Session utilisateur invalide' }, { status: 401 })
    }

    let userId: ObjectId
    try {
      userId = new ObjectId(sessionUserId)
    } catch (error) {
      console.log('❌ ID utilisateur invalide dans la session GET:', sessionUserId)
      return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 401 })
    }

    // CORRECTION: Vérifier d'abord le projet sans aggregation pour debug
    const basicProject = await db.collection('projects').findOne({ _id: projectId })

    if (!basicProject) {
      console.log('❌ Projet non trouvé avec ID:', projectId)
      return NextResponse.json(
        { error: 'Projet non trouvé' }, 
        { status: 404 }
      )
    }

    // CORRECTION: Vérifier les permissions d'abord
    const isClient = basicProject.clientId?.toString() === userId.toString()
    const isFreelancer = basicProject.freelancerId?.toString() === userId.toString()
    
    console.log('Permissions GET - isClient:', isClient, 'isFreelancer:', isFreelancer)

    if (!isClient && !isFreelancer) {
      console.log('❌ Utilisateur non autorisé pour GET')
      return NextResponse.json(
        { error: 'Accès non autorisé à ce projet' }, 
        { status: 403 }
      )
    }

    // Maintenant faire l'aggregation avec les données complètes
    const project = await db.collection('projects').aggregate([
      { 
        $match: { 
          _id: projectId
        } 
      },
      {
        $lookup: {
          from: 'users',
          localField: 'clientId',
          foreignField: '_id',
          as: 'client'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'freelancerId',
          foreignField: '_id',
          as: 'freelancer'
        }
      },
      { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$freelancer', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          status: 1,
          budget: 1,
          finalBudget: 1,
          timeline: 1,
          milestones: 1,
          communicationPreferences: 1,
          onboardingCompleted: 1,
          trackingStartedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          clientId: 1,
          freelancerId: 1,
          'client._id': 1,
          'client.name': 1,
          'client.avatar': 1,
          'client.email': 1,
          'client.rating': 1,
          'freelancer._id': 1,
          'freelancer.name': 1,
          'freelancer.avatar': 1,
          'freelancer.email': 1,
          'freelancer.rating': 1,
          'freelancer.skills': 1
        }
      }
    ]).next()

    console.log('Projet après aggregation:', project)

    if (!project) {
      return NextResponse.json(
        { error: 'Erreur lors du chargement du projet' }, 
        { status: 500 }
      )
    }

    // Récupérer les messages récents
    const messages = await db.collection('messages')
      .find({
        projectId: projectId
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    console.log('Messages trouvés:', messages.length)

    return NextResponse.json({
      project,
      messages: messages.reverse(),
      onboardingEligible: ['open', 'onboarding'].includes(project.status),
      currentUserRole: isClient ? 'client' : 'freelancer'
    })

  } catch (error) {
    console.error('❌ Erreur récupération onboarding GET:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// Les fonctions helper restent les mêmes (startProjectTracking, updateProjectDetails, etc.)
async function startProjectTracking(db: any, projectId: ObjectId, project: any, userId: ObjectId) {
  // Vérifier que le projet est dans un état valide pour le tracking
  if (!['open', 'onboarding'].includes(project.status)) {
    return NextResponse.json(
      { error: 'Le projet ne peut pas être suivi dans son état actuel' },
      { status: 400 }
    )
  }

  const result = await db.collection('projects').updateOne(
    { _id: projectId },
    {
      $set: {
        status: 'in-progress',
        onboardingCompleted: true,
        trackingStartedAt: new Date(),
        updatedAt: new Date()
      }
    }
  )

  if (result.modifiedCount === 0) {
    return NextResponse.json(
      { error: 'Échec de la mise à jour du projet' },
      { status: 500 }
    )
  }

  await createOnboardingNotifications(db, projectId, project, userId, 'tracking_started')

  return NextResponse.json({
    success: true,
    message: 'Suivi du projet démarré avec succès',
    redirectUrl: `/projects/${projectId}/tracking`,
    project: {
      id: projectId,
      status: 'in-progress',
      trackingStartedAt: new Date().toISOString()
    }
  })
}

async function updateProjectDetails(db: any, projectId: ObjectId, projectDetails: any, userId: ObjectId) {
  const updates: any = {
    updatedAt: new Date()
  }

  if (projectDetails?.timeline) {
    updates.timeline = projectDetails.timeline
  }

  if (projectDetails?.budget) {
    updates.finalBudget = projectDetails.budget
  }

  if (projectDetails?.milestones && projectDetails.milestones.length > 0) {
    updates.milestones = projectDetails.milestones.map((milestone: any) => ({
      ...milestone,
      id: new ObjectId(),
      status: 'pending',
      createdAt: new Date()
    }))
  }

  if (projectDetails?.communicationPreferences) {
    updates.communicationPreferences = projectDetails.communicationPreferences
  }

  const result = await db.collection('projects').updateOne(
    { _id: projectId },
    { $set: updates }
  )

  if (result.modifiedCount === 0) {
    return NextResponse.json(
      { error: 'Échec de la mise à jour des détails du projet' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Détails du projet mis à jour avec succès',
    updatedFields: Object.keys(updates).filter(key => key !== 'updatedAt')
  })
}

async function completeOnboarding(db: any, projectId: ObjectId, project: any, userId: ObjectId) {
  const result = await db.collection('projects').updateOne(
    { _id: projectId },
    {
      $set: {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        status: 'in-progress',
        updatedAt: new Date()
      }
    }
  )

  if (result.modifiedCount === 0) {
    return NextResponse.json(
      { error: 'Échec de la complétion de l\'onboarding' },
      { status: 500 }
    )
  }

  await createOnboardingNotifications(db, projectId, project, userId, 'onboarding_completed')

  if (project.milestones && project.milestones.length > 0) {
    await createInitialTasks(db, projectId, project.milestones, userId)
  }

  return NextResponse.json({
    success: true,
    message: 'Onboarding complété avec succès',
    redirectUrl: `/projects/${projectId}/tracking`,
    project: {
      id: projectId,
      status: 'in-progress',
      onboardingCompleted: true
    }
  })
}

async function createOnboardingNotifications(db: any, projectId: ObjectId, project: any, userId: ObjectId, type: string) {
  const notifications = []
  const currentUserIsClient = project.clientId.toString() === userId.toString()

  if (type === 'tracking_started') {
    const targetUserId = currentUserIsClient ? project.freelancerId : project.clientId
    
    notifications.push({
      userId: targetUserId,
      type: 'project_tracking_started',
      title: 'Suivi de projet démarré',
      message: `Le suivi du projet "${project.title}" a été démarré`,
      projectId: projectId,
      read: false,
      createdAt: new Date()
    })
  }

  if (type === 'onboarding_completed') {
    const targetUserId = currentUserIsClient ? project.freelancerId : project.clientId
    
    notifications.push({
      userId: targetUserId,
      type: 'onboarding_completed',
      title: 'Onboarding complété',
      message: `L'onboarding du projet "${project.title}" est terminé`,
      projectId: projectId,
      read: false,
      createdAt: new Date()
    })
  }

  if (notifications.length > 0) {
    await db.collection('notifications').insertMany(notifications)
  }
}

async function createInitialTasks(db: any, projectId: ObjectId, milestones: any[], userId: ObjectId) {
  const tasks = milestones.map((milestone, index) => ({
    _id: new ObjectId(),
    projectId: projectId,
    title: milestone.title,
    description: milestone.description || `Tâche pour le jalon: ${milestone.title}`,
    dueDate: new Date(milestone.dueDate),
    estimatedHours: 8,
    priority: index === 0 ? 'high' : 'medium',
    status: 'todo',
    type: 'milestone',
    milestoneId: milestone.id,
    assignedTo: userId,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  }))

  if (tasks.length > 0) {
    await db.collection('tasks').insertMany(tasks)
  }
}