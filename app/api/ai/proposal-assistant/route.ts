import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// Configuration OpenAI/OpenRouter
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
    "X-Title": process.env.SITE_NAME || "NRBTalents"
  }
})

// System Prompts spécifiques aux proposals
const getSystemPrompt = (budgetMin: number, budgetMax: number, currency: string) => `
Tu es NRBTalents Proposal Assistant, un expert en rédaction de proposals freelance.

TON RÔLE :
- Aider les freelances à rédiger des proposals professionnelles
- Personnaliser les lettres de motivation selon le projet
- Suggérer des budgets adaptés au marché
- Proposer des durées réalistes

FORMAT DE RÉPONSE :
Réponds TOUJOURS en JSON avec cette structure exacte :

{
  "coverLetter": "string - lettre de motivation complète",
  "budgetSuggestion": number - montant suggéré,
  "budgetJustification": "string - justification du budget",
  "estimatedDuration": "string - durée estimée",
  "keyPoints": ["string", "string", "string"] - 3 points clés,
  "deliverables": ["string", "string", "string"] - livrables principaux,
  "questionsForClient": ["string", "string"] - 2 questions,
  "confidenceScore": number - score de confiance 0-100
}

RÈGLES IMPORTANTES :
1. Le budget doit être entre ${budgetMin} et ${budgetMax} ${currency}
2. Sois concret et orienté résultats
3. Adapte-toi aux compétences du freelance
4. Garde un ton professionnel mais chaleureux
5. Ne fais pas de promesses non garanties
`

const SYSTEM_PROMPTS = {
  cover_letter_improvement: `
Tu es expert en amélioration de lettres de motivation freelance.

TON RÔLE :
- Rendre les lettres plus professionnelles
- Mettre en avant les compétences pertinentes
- Améliorer la structure et la clarté
- Ajouter des exemples concrets

FORMAT DE RÉPONSE :
Réponds uniquement avec la lettre améliorée, sans commentaires.
  `,

  budget_suggestion: `
Tu es expert en pricing freelance.

TON RÔLE :
- Analyser la complexité du projet
- Suggérer un budget adapté
- Justifier le prix proposé
- Prendre en compte le marché

FORMAT DE RÉPONSE :
Réponds en JSON :
{
  "suggestedBudget": number,
  "justification": "string",
  "hourlyEstimate": number,
  "complexity": "low|medium|high"
}
  `
}

interface ProposalRequest {
  action: 'generate' | 'improve' | 'suggest-budget' | 'analyze'
  projectData: {
    title: string
    description: string
    budget: {
      min: number
      max: number
      currency: string
    }
    skills: string[]
    deadline?: string
    clientName?: string
  }
  freelancerData: {
    name: string
    skills: string[]
    experience?: string[]
    hourlyRate?: number
    bio?: string
  }
  currentContent?: string
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

    const body: ProposalRequest = await request.json()
    
    if (!body.action || !body.projectData || !body.freelancerData) {
      return NextResponse.json(
        { error: 'Données incomplètes' },
        { status: 400 }
      )
    }

    console.log(`🤖 Proposal Assistant - Action: ${body.action}`)

    let aiResponse
    
    switch (body.action) {
      case 'generate':
        aiResponse = await generateProposal(body)
        break
      case 'improve':
        aiResponse = await improveCoverLetter(body)
        break
      case 'suggest-budget':
        aiResponse = await suggestBudget(body)
        break
      case 'analyze':
        aiResponse = await analyzeProject(body)
        break
      default:
        return NextResponse.json(
          { error: 'Action non reconnue' },
          { status: 400 }
        )
    }

    // Sauvegarder l'utilisation dans la base de données
    await saveProposalUsage(session, body.action)

    return NextResponse.json({
      success: true,
      data: aiResponse,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Erreur Proposal Assistant:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur du service AI',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
      },
      { status: 500 }
    )
  }
}

async function generateProposal(request: ProposalRequest) {
  const { projectData, freelancerData } = request
  
  // Création dynamique du prompt système
  const systemPrompt = getSystemPrompt(
    projectData.budget.min,
    projectData.budget.max,
    projectData.budget.currency
  )

  const userPrompt = `
GÉNÈRE UNE PROPOSAL POUR CE PROJET:

PROJET:
- Titre: ${projectData.title}
- Description: ${projectData.description}
- Compétences recherchées: ${projectData.skills.join(', ')}
- Budget client: ${projectData.budget.min} - ${projectData.budget.max} ${projectData.budget.currency}
- Client: ${projectData.clientName || 'Client'}

FREELANCE:
- Nom: ${freelancerData.name}
- Compétences: ${freelancerData.skills.join(', ')}
- Expérience: ${freelancerData.experience?.length || 0} projets
- Bio: ${freelancerData.bio || 'Non spécifiée'}

GÉNÈRE UNE PROPOSAL PERSONNALISÉE.
  `

  console.log('📤 Envoi requête AI pour génération proposal...')

  const completion = await openai.chat.completions.create({
    model: "openai/gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    max_tokens: 1500,
    temperature: 0.7,
  })

  const response = completion.choices[0]?.message?.content
  
  console.log('✅ Réponse AI reçue:', response?.substring(0, 200) + '...')

  try {
    if (!response) {
      throw new Error('Réponse vide de l\'AI')
    }

    // Extraire le JSON de la réponse
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Format JSON non trouvé dans la réponse')
    }

    const parsed = JSON.parse(jsonMatch[0])
    
    // Validation et nettoyage des données
    const budgetSuggestion = Math.max(
      projectData.budget.min,
      Math.min(projectData.budget.max, parsed.budgetSuggestion || projectData.budget.min)
    )

    return {
      coverLetter: parsed.coverLetter?.trim() || generateFallbackCoverLetter(projectData, freelancerData),
      budgetSuggestion,
      budgetJustification: parsed.budgetJustification?.trim() || "Basé sur la complexité du projet",
      estimatedDuration: parsed.estimatedDuration?.trim() || "2-3 semaines",
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 3) : [
        "Expertise dans les technologies requises",
        "Approche méthodique et organisée",
        "Communication transparente"
      ],
      deliverables: Array.isArray(parsed.deliverables) ? parsed.deliverables.slice(0, 3) : [
        "Livrables selon spécifications",
        "Documentation complète",
        "Support après livraison"
      ],
      questionsForClient: Array.isArray(parsed.questionsForClient) ? parsed.questionsForClient.slice(0, 2) : [
        "Quels sont les délais exacts attendus ?",
        "Avez-vous des préférences techniques particulières ?"
      ],
      confidenceScore: Math.min(100, Math.max(0, parsed.confidenceScore || 75))
    }
  } catch (error) {
    console.error('❌ Erreur parsing JSON:', error)
    console.log('🔄 Utilisation du fallback...')
    
    // Fallback si parsing échoue
    return generateFallbackProposal(projectData, freelancerData)
  }
}

async function improveCoverLetter(request: ProposalRequest) {
  const { currentContent, projectData, freelancerData } = request
  
  if (!currentContent || !currentContent.trim()) {
    throw new Error('Contenu manquant ou vide')
  }

  console.log('📤 Envoi requête AI pour amélioration lettre...')

  const completion = await openai.chat.completions.create({
    model: "openai/gpt-3.5-turbo",
    messages: [
      { 
        role: "system", 
        content: SYSTEM_PROMPTS.cover_letter_improvement 
      },
      { 
        role: "user", 
        content: `Améliore cette lettre de motivation:\n\n${currentContent}\n\nContexte projet: ${projectData.title} - ${projectData.description}\nCompétences freelance: ${freelancerData.skills.join(', ')}` 
      }
    ],
    max_tokens: 1000,
    temperature: 0.7,
  })

  const improvedContent = completion.choices[0]?.message?.content?.trim()
  
  return improvedContent || currentContent
}

async function suggestBudget(request: ProposalRequest) {
  const { projectData, freelancerData } = request

  console.log('📤 Envoi requête AI pour suggestion budget...')

  const completion = await openai.chat.completions.create({
    model: "openai/gpt-3.5-turbo",
    messages: [
      { 
        role: "system", 
        content: SYSTEM_PROMPTS.budget_suggestion 
      },
      { 
        role: "user", 
        content: `Suggère un budget pour ce projet:\n\nProjet: ${projectData.title}\nDescription: ${projectData.description}\nFourchette client: ${projectData.budget.min} - ${projectData.budget.max} ${projectData.budget.currency}\nCompétences requises: ${projectData.skills.join(', ')}\n\nFreelance tarif: ${freelancerData.hourlyRate || 50}€/h\nCompétences: ${freelancerData.skills.join(', ')}` 
      }
    ],
    max_tokens: 500,
    temperature: 0.5,
  })

  const response = completion.choices[0]?.message?.content
  
  try {
    if (response) {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        
        // Validation du budget suggéré
        const suggestedBudget = Math.max(
          projectData.budget.min,
          Math.min(projectData.budget.max, parsed.suggestedBudget || projectData.budget.min)
        )
        
        return {
          suggestedBudget,
          justification: parsed.justification?.trim() || "Basé sur la complexité du projet",
          hourlyEstimate: parsed.hourlyEstimate || 40,
          complexity: ["low", "medium", "high"].includes(parsed.complexity?.toLowerCase()) 
            ? parsed.complexity.toLowerCase() 
            : "medium"
        }
      }
    }
  } catch (error) {
    console.error('❌ Erreur parsing budget:', error)
  }

  // Fallback
  const averageBudget = (projectData.budget.min + projectData.budget.max) / 2
  return {
    suggestedBudget: Math.round(averageBudget / 50) * 50,
    justification: "Budget moyen adapté à la complexité du projet",
    hourlyEstimate: 40,
    complexity: "medium"
  }
}

async function analyzeProject(request: ProposalRequest) {
  const { projectData, freelancerData } = request

  try {
    // Analyse basée sur les compétences
    const matchingSkills = freelancerData.skills.filter(skill => 
      projectData.skills.some(projectSkill => 
        projectSkill.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(projectSkill.toLowerCase())
      )
    )

    const matchPercentage = projectData.skills.length > 0 
      ? Math.round((matchingSkills.length / projectData.skills.length) * 100)
      : 50

    const missingSkills = projectData.skills.filter(skill => 
      !freelancerData.skills.some(freelancerSkill =>
        freelancerSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(freelancerSkill.toLowerCase())
      )
    )

    return {
      skillsMatch: matchPercentage,
      matchingSkills,
      missingSkills,
      estimatedHours: projectData.skills.length * 10,
      complexity: projectData.skills.length > 5 ? "high" : projectData.skills.length > 2 ? "medium" : "low",
      recommendation: matchPercentage > 70 ? "strong" : matchPercentage > 40 ? "moderate" : "weak",
      success: true
    }
  } catch (error) {
    console.error('❌ Erreur analyse projet:', error)
    
    // Fallback minimal
    return {
      skillsMatch: 50,
      matchingSkills: [],
      missingSkills: projectData.skills || [],
      estimatedHours: 40,
      complexity: "medium",
      recommendation: "moderate",
      success: false,
      error: "Analyse échouée, valeurs par défaut utilisées"
    }
  }
}

async function saveProposalUsage(session: any, action: string) {
  try {
    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    
    await db.collection('ai_usage').insertOne({
      userId,
      action,
      type: 'proposal_assistant',
      timestamp: new Date(),
      creditsUsed: 1,
      createdAt: new Date()
    })
    
    console.log(`📊 Usage AI sauvegardé: ${action}`)
  } catch (error) {
    console.error('⚠️ Erreur sauvegarde usage (non bloquant):', error)
  }
}

function generateFallbackCoverLetter(projectData: any, freelancerData: any): string {
  return `Bonjour${projectData.clientName ? ` ${projectData.clientName}` : ''},

Je vous contacte concernant votre projet "${projectData.title}".

Avec mon expertise en ${freelancerData.skills.slice(0, 2).join(' et ')}, je suis convaincu de pouvoir répondre efficacement à vos besoins.

Je propose une approche structurée garantissant des livrables de qualité dans les délais convenus.

Je reste à votre disposition pour discuter plus en détail de ce projet.

Cordialement,
${freelancerData.name}`
}

function generateFallbackProposal(projectData: any, freelancerData: any) {
  const averageBudget = (projectData.budget.min + projectData.budget.max) / 2
  
  return {
    coverLetter: generateFallbackCoverLetter(projectData, freelancerData),
    budgetSuggestion: Math.round(averageBudget / 50) * 50,
    budgetJustification: "Budget adapté à la complexité du projet",
    estimatedDuration: "3-4 semaines",
    keyPoints: [
      "Expérience pertinente dans le domaine",
      "Approche méthodique et organisée",
      "Communication transparente tout au long du projet"
    ],
    deliverables: [
      "Livrables selon spécifications",
      "Documentation technique",
      "Support après livraison"
    ],
    questionsForClient: [
      "Quels sont vos délais exacts ?",
      "Avez-vous des contraintes techniques particulières ?"
    ],
    confidenceScore: 70
  }
}