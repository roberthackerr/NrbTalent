// app/api/ai/chat-assistant/route.ts - ENHANCED WITH MONGODB SAVING
import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { getDatabase } from '@/lib/mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// 🔥 CONFIGURATION OPENROUTER
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
    "X-Title": process.env.SITE_NAME || "NRBTalents"
  }
})

// 🔥 CONTEXTES SPÉCIFIQUES POUR DIFFÉRENTS TYPES DE CONVERSATIONS
const SYSTEM_PROMPTS = {
  general: `
Tu es NRBTalents Assistant, un expert en mise en relation clients/freelancers.

TON RÔLE :
- Aider à formuler les besoins projets
- Donner des conseils pour améliorer les briefs
- Expliquer le fonctionnement de la plateforme
- Aider à la communication entre parties

TON TON :
- Professionnel mais accessible
- Concis et pratique
- Encourageant et positif

RÈGLES :
- Ne fais pas de promesses non garanties
- Ne donne pas de conseils financiers spécifiques
- Redirige vers le support humain pour les problèmes complexes

Réponds en français de façon naturelle.
  `,

  project_help: `
Tu es expert en rédaction de briefs projets pour freelances.

AIDE À :
- Clarifier les objectifs du projet
- Définir les livrables attendus
- Estimer les compétences nécessaires
- Structurer la description du projet

POSE DES QUESTIONS POUR :
- Le budget approximatif
- Les délais souhaités
- Les technologies préférées
- Les contraintes spécifiques

TON STYLE :
- Pratique et orienté résultats
- Pose des questions pertinentes
- Donne des exemples concrets
  `,

  freelancer_advice: `
Tu es coach pour freelancers sur la plateforme.

CONSEILS SUR :
- Comment se présenter efficacement
- Comment mettre en valeur son portfolio
- Comment répondre aux offres de projet
- Comment fixer ses tarifs
- Comment gérer la relation client

TON APPROCHE :
- Bienveillant et constructif
- Basé sur les meilleures pratiques
- Encourage la transparence
  `
}

// 🔥 GET AI USER FROM DATABASE
async function getAIUser() {
  const db = await getDatabase()
  const aiUser = await db.collection('users').findOne({ 
    role: "ai_assistant",
    isAI: true 
  })

  if (!aiUser) {
    // Create a default AI user if not exists
    const defaultAIUser = {
      name: "NRBTalents Assistant",
      email: "assistant@nrbtalents.com",
      role: "ai_assistant",
      isAI: true,
      avatar: "/ai-assistant.png",
      createdAt: new Date(),
      updatedAt: new Date(),
      isOnline: true
    }
    
    const result = await db.collection('users').insertOne(defaultAIUser)
    return { ...defaultAIUser, _id: result.insertedId }
  }

  return aiUser
}

// 🔥 SAVE MESSAGE TO CONVERSATION
async function saveMessageToConversation(
  conversationId: string, 
  content: string, 
  senderId: ObjectId, 
  messageType: string = 'text'
) {
  const db = await getDatabase()
  
  const message = {
    conversationId: new ObjectId(conversationId),
    senderId: senderId,
    content: content,
    type: messageType,
    createdAt: new Date(),
    updatedAt: new Date(),
    readBy: [],
    status: 'delivered'
  }

  const result = await db.collection('messages').insertOne(message)
  
  // Update conversation's last message and timestamp
  await db.collection('conversations').updateOne(
    { _id: new ObjectId(conversationId) },
    { 
      $set: { 
        updatedAt: new Date(),
        lastMessage: {
          content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          senderId: senderId,
          createdAt: new Date()
        }
      } 
    }
  )

  return result.insertedId
}

// 🔥 CREATE AI CONVERSATION IF NOT EXISTS
async function getOrCreateAIConversation(userId: ObjectId, aiUserId: ObjectId) {
  const db = await getDatabase()
  
  // Look for existing AI conversation
  const existingConversation = await db.collection('conversations').findOne({
    participants: { 
      $all: [userId, aiUserId],
      $size: 2
    },
    isAIConversation: true
  })

  if (existingConversation) {
    return existingConversation
  }

  // Create new AI conversation
  const newConversation = {
    participants: [userId, aiUserId],
    isAIConversation: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastMessage: null,
    unreadCount: 0,
    type: 'ai_assistant',
    title: 'Conversation avec Assistant NRBTalents'
  }

  const result = await db.collection('conversations').insertOne(newConversation)
  return { ...newConversation, _id: result.insertedId }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { message, conversationId, conversationType = 'general' } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message vide' },
        { status: 400 }
      )
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: 'ID de conversation requis' },
        { status: 400 }
      )
    }

    console.log('🤖 Requête AI reçue:', {
      messageLength: message.length,
      conversationType,
      conversationId,
      userId: (session.user as any).id
    })

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // 🔥 VERIFY CONVERSATION ACCESS
    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(conversationId),
      participants: userId
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation non trouvée ou accès refusé' },
        { status: 404 }
      )
    }

    // 🔥 GET AI USER
    const aiUser = await getAIUser()
    if (!aiUser) {
      return NextResponse.json(
        { error: 'Assistant AI non configuré' },
        { status: 500 }
      )
    }

    // 🔥 SAVE USER MESSAGE TO DATABASE
    const userMessageId = await saveMessageToConversation(
      conversationId,
      message,
      userId
    )

    console.log('💾 Message utilisateur sauvegardé:', userMessageId)

    // 🔥 SELECT APPROPRIATE SYSTEM PROMPT
    const systemPrompt = SYSTEM_PROMPTS[conversationType as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.general

    // 🔥 CALL OPENROUTER
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: message
        }
      ],
      max_tokens: 800,
      temperature: 0.7,
    })

    const aiResponse = completion.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('Pas de réponse de l\'AI')
    }

    console.log('✅ Réponse AI générée:', aiResponse.substring(0, 100) + '...')

    // 🔥 SAVE AI RESPONSE TO DATABASE
    const aiMessageId = await saveMessageToConversation(
      conversationId,
      aiResponse,
      aiUser._id,
      determineResponseType(message, aiResponse)
    )

    console.log('💾 Réponse AI sauvegardée:', aiMessageId)

    return NextResponse.json({
      success: true,
      response: {
        content: aiResponse,
        type: determineResponseType(message, aiResponse),
        conversationType: conversationType,
        messageId: aiMessageId.toString(),
        aiUser: {
          _id: aiUser._id,
          name: aiUser.name,
          avatar: aiUser.avatar
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur AI Assistant API:', {
      message: error.message,
      code: error.code,
      status: error.status
    })
    
    // 🔥 SPECIFIC ERROR HANDLING FOR OPENROUTER
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'Quota API épuisé' },
        { status: 503 }
      )
    }
    
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Clé API OpenRouter invalide' },
        { status: 401 }
      )
    }
    
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Trop de requêtes vers le service AI' },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Erreur du service AI',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
      },
      { status: 500 }
    )
  }
}

// 🔥 FUNCTION TO DETERMINE RESPONSE TYPE
function determineResponseType(userMessage: string, aiResponse: string): string {
  const lowerMessage = userMessage.toLowerCase()
  const lowerResponse = aiResponse.toLowerCase()

  if (lowerMessage.includes('comment') || lowerMessage.includes('?')) {
    return 'explanation'
  }
  if (lowerResponse.includes('conseil') || lowerResponse.includes('je suggère') || lowerResponse.includes('je te recommande')) {
    return 'suggestion' 
  }
  if (lowerResponse.includes('question') || lowerResponse.includes('peux-tu préciser')) {
    return 'clarification'
  }
  return 'advice'
}

// 🔥 ENDPOINT TO GET AI USER
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const aiUser = await getAIUser()

    if (!aiUser) {
      return NextResponse.json(
        { error: 'Assistant AI non configuré' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      aiUser: {
        _id: aiUser._id,
        name: aiUser.name,
        avatar: aiUser.avatar,
        role: aiUser.role,
        isOnline: true
      }
    })

  } catch (error) {
    console.error('❌ Erreur récupération user AI:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// 🔥 NEW ENDPOINT TO INITIATE AI CONVERSATION
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const userId = new ObjectId((session.user as any).id)
    const aiUser = await getAIUser()

    if (!aiUser) {
      return NextResponse.json(
        { error: 'Assistant AI non configuré' },
        { status: 500 }
      )
    }

    // Get or create AI conversation
    const conversation = await getOrCreateAIConversation(userId, aiUser._id)

    // Add conversation details with participants
    const db = await getDatabase()
    const conversationWithDetails = await db.collection('conversations')
      .aggregate([
        { $match: { _id: conversation._id } },
        { 
          $lookup: { 
            from: "users", 
            localField: "participants", 
            foreignField: "_id", 
            as: "participants" 
          }
        },
        { 
          $project: { 
            "participants.password": 0,
            "participants.createdAt": 0,
            "participants.updatedAt": 0
          }
        }
      ])
      .next()

    return NextResponse.json({
      success: true,
      conversation: conversationWithDetails,
      aiUser: {
        _id: aiUser._id,
        name: aiUser.name,
        avatar: aiUser.avatar,
        role: aiUser.role
      }
    })

  } catch (error) {
    console.error('❌ Erreur initiation conversation AI:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}