import { User } from '@/lib/models/user.ts.bp'
import { any } from 'zod'

export interface ProposalAssistantOptions {
  projectTitle: string
  projectDescription: string
  projectBudget: {
    min: number
    max: number
    currency: string
  }
  projectSkills: string[]
  clientName?: string
  freelancerData?: {
    name: string
    title?: string
    skills: string[]
    experience?: string[]
    hourlyRate?: number
    bio?: string
  }
  templateType?: 'professional' | 'friendly' | 'competitive' | 'detailed'
}

export interface ProposalSuggestion {
  coverLetter: string
  budgetSuggestion: number
  budgetJustification: string
  estimatedDuration: string
  keyPoints: string[]
  deliverables: string[]
  questionsForClient: string[]
  confidenceScore: number
}

export class ProposalAssistantService {
  private async callProposalAssistantAPI(
    action: 'generate' | 'improve' | 'suggest-budget' | 'analyze',
    data: any
  ): Promise<any> {
    try {
      console.log(`📤 Appel Proposal Assistant - Action: ${action}`, data)

      const response = await fetch('/api/ai/proposal-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ...data
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error(`❌ Erreur API Proposal Assistant (${action}):`, error)
        throw new Error(error.error || `Erreur ${action}`)
      }

      const result = await response.json()
      console.log(`✅ Réponse Proposal Assistant reçue (${action})`)
      
      return result.data

    } catch (error: any) {
      console.error(`❌ Erreur Proposal Assistant (${action}):`, error.message)
      throw error
    }
  }

  async analyzeProject(projectData: any, freelancerData: any): Promise<any> {
    try {
      return await this.callProposalAssistantAPI('analyze', {
        projectData: {
          title: projectData.title,
          description: projectData.description,
          budget: projectData.budget,
          skills: projectData.skills || [],
          clientName: projectData.client?.name
        },
        freelancerData: {
          name: freelancerData.name,
          title: freelancerData.title,
          skills: freelancerData.skills || [],
          hourlyRate: freelancerData.hourlyRate,
          bio: freelancerData.bio
        }
      })
    } catch (error) {
      console.error('Erreur analyse projet:', error)
      
      // Fallback manuel
      const matchingSkills = (freelancerData.skills || []).filter((skill:any) => 
        (projectData.skills || []).some((projectSkill:any) => 
          projectSkill.toLowerCase().includes(skill.toLowerCase()) || 
          skill.toLowerCase().includes(projectSkill.toLowerCase())
        )
      )

      const matchPercentage = (projectData.skills || []).length > 0 
        ? Math.round((matchingSkills.length / (projectData.skills || []).length) * 100)
        : 50

      return {
        difficulty: (projectData.skills || []).length > 5 ? 'advanced' : 
                   (projectData.skills || []).length > 2 ? 'intermediate' : 'beginner',
        estimatedHours: (projectData.skills || []).length * 10,
        skillsMatch: matchPercentage,
        suggestedBudget: projectData.budget?.min || 1000,
        suggestedDuration: '3-4 semaines',
        keyQuestions: [
          'Quels sont les délais exacts attendus ?',
          'Y a-t-il des contraintes techniques spécifiques ?'
        ],
        competitiveAdvantages: matchingSkills.length > 0 ? 
          [`Expertise en ${matchingSkills.slice(0, 2).join(', ')}`] : 
          ['Disponibilité immédiate']
      }
    }
  }

  async generateProposalSuggestion(options: ProposalAssistantOptions): Promise<ProposalSuggestion> {
    try {
      return await this.callProposalAssistantAPI('generate', {
        projectData: {
          title: options.projectTitle,
          description: options.projectDescription,
          budget: options.projectBudget,
          skills: options.projectSkills,
          clientName: options.clientName
        },
        freelancerData: options.freelancerData || {
          name: 'Freelance',
          skills: [],
          bio: ''
        }
      })
    } catch (error) {
      console.error('Erreur génération proposal:', error)
      return this.generateFallbackProposal(options)
    }
  }

  async improveCoverLetter(coverLetter: string, projectData: any, freelancerData: any): Promise<string> {
    try {
      return await this.callProposalAssistantAPI('improve', {
        currentContent: coverLetter,
        projectData: {
          title: projectData.title,
          description: projectData.description,
          budget: projectData.budget,
          skills: projectData.skills || []
        },
        freelancerData: {
          name: freelancerData.name,
          skills: freelancerData.skills || [],
          bio: freelancerData.bio
        }
      })
    } catch (error) {
      console.error('Erreur amélioration:', error)
      return coverLetter // Retourne l'original si échec
    }
  }

  async suggestBudget(projectData: any, freelancerData: any): Promise<{
    suggestedBudget: number
    justification: string
    hourlyEstimate: number
    complexity: string
  }> {
    try {
      return await this.callProposalAssistantAPI('suggest-budget', {
        projectData: {
          title: projectData.title,
          description: projectData.description,
          budget: projectData.budget,
          skills: projectData.skills || []
        },
        freelancerData: {
          name: freelancerData.name,
          skills: freelancerData.skills || [],
          hourlyRate: freelancerData.hourlyRate
        }
      })
    } catch (error) {
      console.error('Erreur suggestion budget:', error)
      
      // Fallback manuel
      const fallbackBudget = projectData.budget?.min || 1000
      const averageBudget = projectData.budget ? 
        (projectData.budget.min + projectData.budget.max) / 2 : fallbackBudget
        
      return {
        suggestedBudget: Math.round(averageBudget / 50) * 50,
        justification: 'Basé sur la moyenne du marché pour ce type de projet',
        hourlyEstimate: 40,
        complexity: (projectData.skills || []).length > 5 ? 'high' : 
                   (projectData.skills || []).length > 2 ? 'medium' : 'low'
      }
    }
  }

  private generateFallbackProposal(options: ProposalAssistantOptions): ProposalSuggestion {
    const averageBudget = (options.projectBudget.min + options.projectBudget.max) / 2
    
    return {
      coverLetter: this.generateFallbackCoverLetter(options),
      budgetSuggestion: Math.round(averageBudget / 50) * 50,
      budgetJustification: `Budget moyen pour un projet de cette complexité, tenant compte des compétences requises : ${options.projectSkills.join(', ')}`,
      estimatedDuration: '3-4 semaines',
      keyPoints: [
        `Spécialisation en ${options.projectSkills[0] || 'ce domaine'}`,
        'Approche structurée et méthodique',
        'Communication transparente tout au long du projet',
        'Livraison dans les délais convenus'
      ],
      deliverables: [
        'Analyse complète des besoins',
        'Solution développée selon les spécifications',
        'Tests de qualité et débogage',
        'Documentation et formation si nécessaire'
      ],
      questionsForClient: [
        'Pourriez-vous préciser les délais attendus ?',
        'Avez-vous des exemples similaires qui vous inspirent ?',
        'Y a-t-il des contraintes techniques particulières ?'
      ],
      confidenceScore: 75
    }
  }

  private generateFallbackCoverLetter(options: ProposalAssistantOptions): string {
    return `Bonjour${options.clientName ? ` ${options.clientName}` : ''},

Je me permets de vous contacter suite à votre annonce pour "${options.projectTitle}".

Avec mon expertise en ${options.projectSkills.slice(0, 3).join(', ')}, je suis convaincu de pouvoir mener à bien ce projet de manière efficace et professionnelle.

Je propose une approche structurée qui garantit une communication transparente et des livrables de qualité, dans les délais convenus.

Je serais ravi d'échanger plus en détail sur vos besoins spécifiques et de vous présenter comment je peux vous aider à concrétiser ce projet.

Dans l'attente de votre retour,

Cordialement,
[Votre Nom]`
  }
}

export const proposalAssistant = new ProposalAssistantService()