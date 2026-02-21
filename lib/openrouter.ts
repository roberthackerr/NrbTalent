import OpenAI from 'openai'

export interface AIModel {
  id: string
  name: string
  provider: string
  costPerMillion: {
    input: number
    output: number
  }
  maxTokens: number
  capabilities: string[]
  bestFor: string[]
}

export const AI_MODELS: AIModel[] = [
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
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    costPerMillion: { input: 3, output: 15 },
    maxTokens: 200000,
    capabilities: ["complex-analysis", "reasoning", "documentation"],
    bestFor: ["Complex projects", "Detailed analysis", "Business planning"]
  },
  {
    id: "google/gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    costPerMillion: { input: 0.35, output: 1.05 },
    maxTokens: 1000000,
    capabilities: ["fast", "multimodal", "creative"],
    bestFor: ["Quick iterations", "Creative solutions", "Prototyping"]
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    costPerMillion: { input: 0.15, output: 0.60 },
    maxTokens: 16384,
    capabilities: ["balanced", "efficient", "reliable"],
    bestFor: ["General purpose", "Cost-effective", "Reliable results"]
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "Meta",
    costPerMillion: { input: 0.39, output: 0.39 },
    maxTokens: 131072,
    capabilities: ["open-source", "long-context", "coding"],
    bestFor: ["Open-source projects", "Long documents", "Code generation"]
  }
]

export interface BlueprintGenerationOptions {
  modelId?: string
  temperature?: number
  maxTokens?: number
  forceRegenerate?: boolean
}

export interface GenerationStats {
  inputTokens: number
  outputTokens: number
  cost: number
  processingTime: number
  modelUsed: string
}

class OpenRouterClient {
  private client: OpenAI
  private defaultModel = "deepseek/deepseek-chat"

  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not set in environment variables')
    }

    this.client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "FreelanceSync AI Architect",
        "Content-Type": "application/json"
      },
      timeout: 30000,
      maxRetries: 3
    })
  }

  async generateBlueprint(
    brief: string, 
    projectType?: string, 
    options: BlueprintGenerationOptions = {}
  ): Promise<{ blueprint: any; stats: GenerationStats }> {
    const modelId = options.modelId || this.defaultModel
    const temperature = options.temperature ?? 0.3
    const maxTokens = options.maxTokens ?? 4000
    
    const prompt = this.buildBlueprintPrompt(brief, projectType)
    const systemPrompt = this.getSystemPrompt()
    
    const startTime = Date.now()
    
    try {
      console.log(`Generating blueprint with model: ${modelId}`)
      console.log(`Brief length: ${brief.length} chars`)
      
      const response = await this.client.chat.completions.create({
        model: modelId,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature,
        max_tokens: maxTokens,
        stream: false
      })

      const endTime = Date.now()
      const processingTime = endTime - startTime
      
      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response content from AI')
      }

      const inputTokens = response.usage?.prompt_tokens || Math.ceil(prompt.length / 4)
      const outputTokens = response.usage?.completion_tokens || Math.ceil(content.length / 4)
      
      let blueprint
      try {
        blueprint = JSON.parse(content)
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError)
        console.error('Raw content:', content.substring(0, 500))
        blueprint = this.generateDynamicFallbackBlueprint(brief, projectType)
      }

      // Validation et enrichissement
      blueprint = this.validateAndEnrichBlueprint(blueprint, brief, projectType)

      const cost = this.calculateCost(inputTokens, outputTokens, modelId)

      return {
        blueprint,
        stats: {
          inputTokens,
          outputTokens,
          cost,
          processingTime,
          modelUsed: modelId
        }
      }

    } catch (error: any) {
      console.error('OpenRouter API Error:', error.message)
      
      // Fallback dynamique basé sur le brief
      const fallbackBlueprint = this.generateDynamicFallbackBlueprint(brief, projectType)
      const fallbackStats = {
        inputTokens: Math.ceil(prompt.length / 4),
        outputTokens: Math.ceil(JSON.stringify(fallbackBlueprint).length / 4),
        cost: 0,
        processingTime: Date.now() - startTime,
        modelUsed: 'fallback'
      }
      
      return {
        blueprint: fallbackBlueprint,
        stats: fallbackStats
      }
    }
  }

  private buildBlueprintPrompt(brief: string, projectType?: string): string {
    return `
TU ES UN ARCHITECTE DE PROJETS TECHNIQUES SENIOR.

MISSION: Analyser ce brief client et créer un blueprint COMPLÈTEMENT PERSONNALISÉ.

⚠️ IMPORTANT: NE DONNE PAS UN BLUEPRINT GÉNÉRIQUE !
Chaque projet est unique. Analyse les détails et adapte-toi.

BRIEF CLIENT:
${brief}
${projectType ? `\nCATÉGORIE: ${projectType}` : ''}

CONSIDÈRE:
1. Le contexte spécifique du projet
2. Les mots-clés dans le brief
3. Le niveau de détail fourni
4. Les contraintes mentionnées (budget, délai, etc.)

EXIGENCES:
- Sois PRÉCIS et SPÉCIFIQUE
- Évite les templates génériques
- Adapte la complexité au brief
- Propose des solutions réalistes
- Justifie chaque choix technique

INSTRUCTIONS DE FORMAT:
Retourne UNIQUEMENT un JSON valide avec cette structure exacte:

{
  "analysis": {
    "domain": "string (choisir parmi: e-commerce, saas, mobile-app, web-portal, crm, erp, marketplace, social-network, blog-cms, game, iot, blockchain, other)",
    "complexity": "low|medium|high",
    "targetUsers": ["string array (spécifique au projet)"],
    "keyFeatures": ["string array (basé sur le brief)"],
    "technicalRequirements": ["string array (concret)"],
    "uniqueAspects": ["string array (ce qui rend ce projet unique)"]
  },
  "techStack": {
    "frontend": { 
      "primary": "string", 
      "alternatives": ["string"], 
      "reasoning": "string (justification détaillée)" 
    },
    "backend": { 
      "primary": "string", 
      "alternatives": ["string"], 
      "reasoning": "string (justification détaillée)" 
    },
    "database": { 
      "primary": "string", 
      "alternatives": ["string"], 
      "reasoning": "string (justification détaillée)" 
    },
    "apis": ["string (spécifique)"],
    "devops": ["string"],
    "mobile": { 
      "primary": "string (ou 'none')", 
      "alternatives": ["string"], 
      "reasoning": "string" 
    },
    "hosting": { 
      "primary": "string", 
      "alternatives": ["string"], 
      "reasoning": "string" 
    }
  },
  "architecture": {
    "diagram": "mermaid code (personnalisé)",
    "components": [
      { 
        "name": "string", 
        "description": "string", 
        "responsibility": "string",
        "tech": "string"
      }
    ],
    "patterns": ["string array"],
    "scalabilityConsiderations": ["string array"]
  },
  "timeline": {
    "phases": [
      { 
        "name": "string", 
        "duration": number, 
        "tasks": ["string"], 
        "deliverables": ["string"],
        "priority": "high|medium|low"
      }
    ],
    "totalWeeks": number,
    "criticalPath": ["string"],
    "milestones": [
      { "week": number, "description": "string", "importance": "high|medium|low" }
    ]
  },
  "team": {
    "recommendedRoles": [
      { 
        "role": "string", 
        "experience": "junior|mid|senior", 
        "hours": number, 
        "responsibilities": ["string"],
        "skillsRequired": ["string"]
      }
    ],
    "totalHours": number,
    "teamSize": number,
    "collaborationTools": ["string"]
  },
  "budget": {
    "min": number,
    "recommended": number,
    "max": number,
    "breakdown": [
      { 
        "role": "string", 
        "hours": number, 
        "rate": number, 
        "total": number,
        "justification": "string"
      }
    ],
    "currency": "USD|EUR|GBP|CAD",
    "hostingCosts": { "monthly": number, "annual": number },
    "thirdPartyCosts": { "monthly": number, "annual": number }
  },
  "risks": [
    { 
      "risk": "string", 
      "probability": "low|medium|high", 
      "impact": "low|medium|high", 
      "mitigation": "string",
      "owner": "string"
    }
  ],
  "successMetrics": ["string"],
  "recommendations": ["string"]
}

NE RETOURNE RIEN D'AUTRE QUE CE JSON.
`.trim()
  }

  private getSystemPrompt(): string {
    return `
Tu es un architecte de projets techniques senior avec 20+ ans d'expérience.
Tu travailles pour une plateforme freelance et aides les clients à planifier leurs projets.

TES PRINCIPES:
1. PERSONNALISATION: Chaque projet est unique. Adapte chaque détail au brief.
2. RÉALISME: Propose des solutions réalisables dans les contraintes.
3. PRÉCISION: Sois spécifique et évite les généralités.
4. JUSTIFICATION: Explique pourquoi tu fais chaque choix.
5. CRÉATIVITÉ: Trouve des solutions innovantes mais pratiques.

MÉTHODOLOGIE:
1. Analyse lexicale du brief pour comprendre le contexte
2. Identification des besoins explicites et implicites
3. Adaptation de la complexité au niveau de détail
4. Suggestion de technologies adaptées au contexte
5. Estimation réaliste des coûts et délais
RÈGLES DE BUDGET IMPORTANTES:
1. Le TOTAL du budget (budget.recommended) DOIT correspondre à la somme de budget.breakdown
2. Calcul: budget.recommended = Σ(breakdown[i].hours × breakdown[i].rate)
3. budget.min = budget.recommended × 0.85 (15% de marge inférieure)
4. budget.max = budget.recommended × 1.15 (15% de marge supérieure)
5. VÉRIFIER les calculs avant de répondre

EXEMPLE CORRECT:
"budget": {
  "min": 8500,
  "recommended": 10000,  // = (200×40) + (150×45) + (100×50)
  "max": 11500,
  "breakdown": [
    {"role": "Frontend", "hours": 200, "rate": 40, "total": 8000},
    {"role": "Backend", "hours": 150, "rate": 45, "total": 6750},
    {"role": "Designer", "hours": 100, "rate": 50, "total": 5000}
  ]
}

NE JAMAIS:
- Donner un recommended différent de la somme des breakdown
- Oublier de multiplier heures × taux
- Mettre des chiffres aléatoires


CRITÈRES TECHNIQUES:
- Performance vs coût
- Courbe d'apprentissage
- Disponibilité des compétences
- Maintenance long terme
- Sécurité et conformité
- Évolutivité

NE JAMAIS:
- Réutiliser un blueprint d'un autre projet
- Utiliser des templates génériques
- Ignorer les spécificités du brief
- Sous-estimer la complexité
- Oublier de justifier les choix

Retourne TOUJOURS un JSON valide et complet.
`.trim()
  }

  private generateDynamicFallbackBlueprint(brief: string, projectType?: string): any {
    // Analyse dynamique du brief
    const lowerBrief = brief.toLowerCase()
    
    // Déterminer le domaine
    let domain = "web"
    if (lowerBrief.includes('mobile') || lowerBrief.includes('app')) domain = "mobile-app"
    if (lowerBrief.includes('e-commerce') || lowerBrief.includes('shop') || lowerBrief.includes('boutique')) domain = "e-commerce"
    if (lowerBrief.includes('saas') || lowerBrief.includes('subscription') || lowerBrief.includes('abonnement')) domain = "saas"
    if (lowerBrief.includes('marketplace') || lowerBrief.includes('plateforme')) domain = "marketplace"
    if (lowerBrief.includes('crm') || lowerBrief.includes('customer')) domain = "crm"
    if (lowerBrief.includes('blog') || lowerBrief.includes('cms')) domain = "blog-cms"
    
    // Déterminer la complexité
    let complexity: "low" | "medium" | "high" = "medium"
    if (brief.length < 100) complexity = "low"
    if (brief.length > 500 || lowerBrief.includes('complex') || lowerBrief.includes('avancé')) complexity = "high"
    
    // Technologies basées sur le brief
    const usesReact = lowerBrief.includes('react') || lowerBrief.includes('frontend')
    const usesNode = lowerBrief.includes('node') || lowerBrief.includes('javascript') || lowerBrief.includes('js')
    const usesPython = lowerBrief.includes('python') || lowerBrief.includes('django') || lowerBrief.includes('flask')
    const usesPhp = lowerBrief.includes('php') || lowerBrief.includes('laravel') || lowerBrief.includes('wordpress')
    const needsMobile = lowerBrief.includes('mobile') || lowerBrief.includes('app') || lowerBrief.includes('ios') || lowerBrief.includes('android')
    
    // Stack technique basée sur les besoins
    const frontend = usesReact ? "React" : "Vue.js"
    const backend = usesNode ? "Node.js" : usesPython ? "Python Django" : usesPhp ? "PHP Laravel" : "Node.js"
    const database = lowerBrief.includes('real-time') ? "Firebase" : "MongoDB"
    
    // Timeline basée sur la complexité
    const totalWeeks = complexity === "low" ? 4 : complexity === "medium" ? 8 : 12
    
    // Budget basé sur la complexité et les mots-clés
    let baseBudget = complexity === "low" ? 3000 : complexity === "medium" ? 8000 : 15000
    if (lowerBrief.includes('budget') || lowerBrief.includes('économ')) baseBudget *= 0.7
    if (lowerBrief.includes('premium') || lowerBrief.includes('entreprise')) baseBudget *= 1.5
    
    return {
      analysis: {
        domain,
        complexity,
        targetUsers: ["Utilisateurs finaux", "Administrateurs"],
        keyFeatures: this.extractFeaturesFromBrief(brief),
        technicalRequirements: this.extractTechnicalRequirements(brief),
        uniqueAspects: this.extractUniqueAspects(brief)
      },
      techStack: {
        frontend: { 
          primary: frontend, 
          alternatives: frontend === "React" ? ["Vue.js", "Angular"] : ["React", "Svelte"],
          reasoning: `Choix basé sur ${usesReact ? 'la mention spécifique' : 'les besoins standards du marché'} et la disponibilité des développeurs`
        },
        backend: { 
          primary: backend, 
          alternatives: backend === "Node.js" ? ["Python Django", "Ruby on Rails"] : ["Node.js", "Java Spring"],
          reasoning: `${backend} offre un bon équilibre performance/coût pour ce type de projet`
        },
        database: { 
          primary: database, 
          alternatives: database === "MongoDB" ? ["PostgreSQL", "MySQL"] : ["MongoDB", "Supabase"],
          reasoning: `${database} est adapté aux besoins ${lowerBrief.includes('real-time') ? 'temps réel' : 'standard'} identifiés`
        },
        apis: ["REST API", "Authentication API"],
        devops: ["Docker", "GitHub Actions", "AWS/GCP"],
        mobile: { 
          primary: needsMobile ? "React Native" : "none", 
          alternatives: needsMobile ? ["Flutter", "Native iOS/Android"] : [],
          reasoning: needsMobile ? "Solution cross-platform pour réduire les coûts" : "Pas de besoin mobile identifié"
        },
        hosting: { 
          primary: "Vercel/AWS", 
          alternatives: ["Google Cloud", "Azure"],
          reasoning: "Solution scalable avec bon rapport qualité-prix"
        }
      },
      architecture: {
        diagram: `graph TD
    A[Client] --> B[${frontend} Frontend]
    B --> C[${backend} Backend API]
    C --> D[(${database} Database)]
    C --> E[Third-party APIs]
    B --> F[CDN]`,
        components: [
          { name: "Frontend Application", description: "Interface utilisateur", responsibility: "Gestion UI/UX et interactions", tech: frontend },
          { name: "Backend API", description: "Logique métier", responsibility: "Traitement des données et authentification", tech: backend },
          { name: "Database", description: "Stockage persistant", responsibility: "Persistance des données", tech: database }
        ],
        patterns: ["MVC", "REST API"],
        scalabilityConsiderations: ["Load balancing", "Caching strategy", "Database indexing"]
      },
      timeline: {
        phases: [
          { name: "Planification & Design", duration: 1, tasks: ["Analyse besoins", "Wireframes", "Architecture"], deliverables: ["Spécifications", "Maquettes"], priority: "high" },
          { name: "Développement MVP", duration: totalWeeks - 2, tasks: ["Frontend", "Backend", "Integration"], deliverables: ["MVP fonctionnel"], priority: "high" },
          { name: "Tests & Déploiement", duration: 1, tasks: ["QA", "User testing", "Deployment"], deliverables: ["Application en production"], priority: "medium" }
        ],
        totalWeeks,
        criticalPath: ["Développement Frontend", "Intégration API"],
        milestones: [
          { week: 1, description: "Spécifications finalisées", importance: "high" },
          { week: Math.floor(totalWeeks/2), description: "MVP interne", importance: "medium" },
          { week: totalWeeks, description: "Livraison production", importance: "high" }
        ]
      },
      team: {
        recommendedRoles: [
          { role: "Frontend Developer", experience: "mid", hours: complexity === "low" ? 60 : complexity === "medium" ? 100 : 160, responsibilities: ["Développement UI", "Intégration"], skillsRequired: [frontend, "HTML/CSS", "JavaScript"] },
          { role: "Backend Developer", experience: "mid", hours: complexity === "low" ? 40 : complexity === "medium" ? 80 : 120, responsibilities: ["API Development", "Database"], skillsRequired: [backend, "API Design", database] }
        ],
        totalHours: complexity === "low" ? 100 : complexity === "medium" ? 180 : 280,
        teamSize: 2,
        collaborationTools: ["GitHub", "Slack", "Trello", "Figma"]
      },
      budget: {
        min: Math.round(baseBudget * 0.7),
        recommended: Math.round(baseBudget),
        max: Math.round(baseBudget * 1.3),
        breakdown: [
          { role: "Frontend Developer", hours: complexity === "low" ? 60 : complexity === "medium" ? 100 : 160, rate: 45, total: complexity === "low" ? 2700 : complexity === "medium" ? 4500 : 7200, justification: "Taux moyen marché freelance" },
          { role: "Backend Developer", hours: complexity === "low" ? 40 : complexity === "medium" ? 80 : 120, rate: 50, total: complexity === "low" ? 2000 : complexity === "medium" ? 4000 : 6000, justification: "Expertise backend légèrement plus élevée" }
        ],
        currency: "USD",
        hostingCosts: { monthly: 50, annual: 500 },
        thirdPartyCosts: { monthly: 20, annual: 240 }
      },
      risks: [
        { risk: "Changement de scope", probability: "medium", impact: "high", mitigation: "Sprints courts et revues régulières", owner: "Project Manager" },
        { risk: "Retards techniques", probability: "low", impact: "medium", mitigation: "Buffer de 20% dans la timeline", owner: "Tech Lead" },
        { risk: "Problèmes de qualité", probability: "low", impact: "high", mitigation: "Tests automatisés et code reviews", owner: "QA Engineer" }
      ],
      successMetrics: ["Fonctionnalités livrées", "Performance technique", "Satisfaction utilisateur", "Respect du budget"],
      recommendations: [
        "Commencer par un MVP minimal",
        "Prioriser les fonctionnalités essentielles",
        "Prévoir des sessions de feedback utilisateur"
      ]
    }
  }

  private extractFeaturesFromBrief(brief: string): string[] {
    const lowerBrief = brief.toLowerCase()
    const features = []
    
    if (lowerBrief.includes('auth') || lowerBrief.includes('login') || lowerBrief.includes('register')) {
      features.push("Système d'authentification sécurisé")
    }
    if (lowerBrief.includes('payment') || lowerBrief.includes('paiement') || lowerBrief.includes('checkout')) {
      features.push("Intégration de paiement")
    }
    if (lowerBrief.includes('admin') || lowerBrief.includes('dashboard')) {
      features.push("Panel d'administration")
    }
    if (lowerBrief.includes('search') || lowerBrief.includes('recherche')) {
      features.push("Moteur de recherche")
    }
    if (lowerBrief.includes('notification') || lowerBrief.includes('alert')) {
      features.push("Système de notifications")
    }
    if (lowerBrief.includes('upload') || lowerBrief.includes('file')) {
      features.push("Gestion de fichiers")
    }
    if (lowerBrief.includes('chat') || lowerBrief.includes('message')) {
      features.push("Messagerie en temps réel")
    }
    
    return features.length > 0 ? features : ["Interface utilisateur responsive", "Gestion de contenu"]
  }

  private extractTechnicalRequirements(brief: string): string[] {
    const lowerBrief = brief.toLowerCase()
    const requirements = []
    
    if (lowerBrief.includes('mobile') || lowerBrief.includes('app')) {
      requirements.push("Design responsive/mobile-first")
    }
    if (lowerBrief.includes('fast') || lowerBrief.includes('performance')) {
      requirements.push("Optimisation des performances")
    }
    if (lowerBrief.includes('secure') || lowerBrief.includes('sécurité')) {
      requirements.push("Mesures de sécurité avancées")
    }
    if (lowerBrief.includes('scale') || lowerBrief.includes('growth')) {
      requirements.push("Architecture scalable")
    }
    if (lowerBrief.includes('api') || lowerBrief.includes('integration')) {
      requirements.push("API REST bien documentée")
    }
    
    return requirements.length > 0 ? requirements : ["Responsive design", "API REST", "Base de données"]
  }

  private extractUniqueAspects(brief: string): string[] {
    const unique = []
    
    // Recherche d'éléments uniques
    if (brief.length > 200) {
      unique.push("Brief détaillé permettant une analyse précise")
    }
    if (brief.includes('unique') || brief.includes('innovant') || brief.includes('nouveau')) {
      unique.push("Approche innovante demandée")
    }
    
    return unique.length > 0 ? unique : ["Solution sur mesure adaptée aux besoins spécifiques"]
  }

  private validateAndEnrichBlueprint(blueprint: any, brief: string, projectType?: string): any {
    // Validation des champs obligatoires
    const requiredFields = ['analysis', 'techStack', 'architecture', 'timeline', 'team', 'budget']
    requiredFields.forEach(field => {
      if (!blueprint[field]) {
        console.warn(`Missing required field: ${field}, using fallback`)
        return this.generateDynamicFallbackBlueprint(brief, projectType)
      }
    })

    // Enrichissement avec des métadonnées
    blueprint.metadata = {
      generatedAt: new Date().toISOString(),
      briefLength: brief.length,
      projectType: projectType || 'general',
      hasMobile: brief.toLowerCase().includes('mobile') || brief.toLowerCase().includes('app'),
      hasEcommerce: brief.toLowerCase().includes('e-commerce') || brief.toLowerCase().includes('shop'),
      complexityScore: blueprint.analysis.complexity === 'low' ? 3 : 
                     blueprint.analysis.complexity === 'medium' ? 6 : 9
    }

    return blueprint
  }

  calculateCost(inputTokens: number, outputTokens: number, modelId: string): number {
    const model = AI_MODELS.find(m => m.id === modelId) || AI_MODELS[0]
    const inputCost = (inputTokens * model.costPerMillion.input) / 1000000
    const outputCost = (outputTokens * model.costPerMillion.output) / 1000000
    return parseFloat((inputCost + outputCost).toFixed(4))
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5
      })
      return true
    } catch (error) {
      console.error('OpenRouter connection test failed:', error)
      return false
    }
  }
    async getAvailableModels(): Promise<AIModel[]> {
    try {
      // Option 1: Utiliser l'API OpenRouter pour récupérer les modèles disponibles
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Transformer la réponse de l'API
        const models = data.data?.map((model: any) => ({
          id: model.id,
          name: model.name || model.id.split('/')[1],
          provider: model.id.split('/')[0],
          costPerMillion: {
            input: model.pricing?.prompt || 0,
            output: model.pricing?.completion || 0
          },
          maxTokens: model.context_length || 32768,
          capabilities: this.getCapabilitiesForModel(model.id),
          bestFor: this.getBestForModel(model.id)
        })) || []
        
        // Filtrer pour garder seulement les modèles principaux
        const mainModels = models.filter((model: AIModel) => 
          AI_MODELS.some(m => m.id === model.id)
        )
        
        return mainModels.length > 0 ? mainModels : AI_MODELS
      }
      
      // Si l'API échoue, retourner les modèles statiques
      return AI_MODELS
    } catch (error) {
      console.error('Error fetching models from OpenRouter:', error)
      // Retourner les modèles statiques en fallback
      return AI_MODELS
    }
  }

  private getCapabilitiesForModel(modelId: string): string[] {
    const capabilitiesMap: Record<string, string[]> = {
      'deepseek/deepseek-chat': ['code', 'analysis', 'planning', 'french'],
      'openai/gpt-4o-mini': ['balanced', 'efficient', 'creative'],
      'anthropic/claude-3.5-sonnet': ['reasoning', 'analysis', 'documentation'],
      'google/gemini-2.0-flash-exp': ['fast', 'multimodal', 'creative'],
      'meta-llama/llama-3.3-70b-instruct': ['open-source', 'long-context', 'coding']
    }
    
    return capabilitiesMap[modelId] || ['general-purpose']
  }

  private getBestForModel(modelId: string): string[] {
    const bestForMap: Record<string, string[]> = {
      'deepseek/deepseek-chat': ['MVP', 'Budget projects', 'Technical planning', 'Code'],
      'openai/gpt-4o-mini': ['General purpose', 'Cost-effective', 'Quick iterations'],
      'anthropic/claude-3.5-sonnet': ['Complex analysis', 'Business planning', 'Detailed documents'],
      'google/gemini-2.0-flash-exp': ['Prototyping', 'Creative solutions', 'Fast responses'],
      'meta-llama/llama-3.3-70b-instruct': ['Open-source projects', 'Long documents', 'Privacy-focused']
    }
    
    return bestForMap[modelId] || ['General projects']
  }
}

export const openRouter = new OpenRouterClient()