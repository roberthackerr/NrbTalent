// api/projects/types/route.ts
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

// Configuration des types de projets
const PROJECT_TYPES = {
  categories: [
    {
      id: "web-dev",
      name: "Web Development",
      icon: "💻",
      subcategories: [
        "Frontend Development",
        "Backend Development",
        "Full Stack Development",
        "E-commerce Development",
        "CMS Development"
      ]
    },
    {
      id: "mobile-dev",
      name: "Mobile Development",
      icon: "📱",
      subcategories: [
        "iOS Development",
        "Android Development",
        "React Native",
        "Flutter",
        "Hybrid Apps"
      ]
    },
    {
      id: "design",
      name: "Design",
      icon: "🎨",
      subcategories: [
        "UI/UX Design",
        "Graphic Design",
        "Logo Design",
        "Brand Identity",
        "Illustration"
      ]
    },
    {
      id: "marketing",
      name: "Marketing",
      icon: "📢",
      subcategories: [
        "Digital Marketing",
        "SEO",
        "Content Marketing",
        "Social Media Marketing",
        "Email Marketing"
      ]
    },
    {
      id: "writing",
      name: "Writing",
      icon: "✍️",
      subcategories: [
        "Content Writing",
        "Copywriting",
        "Technical Writing",
        "Translation",
        "Editing & Proofreading"
      ]
    },
    {
      id: "admin",
      name: "Admin Support",
      icon: "📋",
      subcategories: [
        "Virtual Assistant",
        "Data Entry",
        "Customer Support",
        "Project Management",
        "Research"
      ]
    },
    {
      id: "it-network",
      name: "IT & Networking",
      icon: "🔧",
      subcategories: [
        "System Administration",
        "Network Security",
        "DevOps",
        "Cloud Computing",
        "Database Management"
      ]
    },
    {
      id: "video-audio",
      name: "Video & Audio",
      icon: "🎬",
      subcategories: [
        "Video Editing",
        "Animation",
        "Audio Production",
        "Voice Over",
        "Podcasting"
      ]
    }
  ],
  
  skills: {
    "web-dev": [
      "React", "Vue.js", "Angular", "Next.js", "Node.js",
      "Express", "Django", "Laravel", "TypeScript", "JavaScript",
      "HTML5", "CSS3", "Tailwind CSS", "Bootstrap", "jQuery"
    ],
    "mobile-dev": [
      "React Native", "Flutter", "Swift", "Kotlin", "Java",
      "Ionic", "Xamarin", "Android Studio", "Xcode", "Firebase"
    ],
    "design": [
      "Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator",
      "InDesign", "After Effects", "Procreate", "Canva", "Blender"
    ],
    "marketing": [
      "Google Analytics", "SEO", "SEM", "Facebook Ads", "Google Ads",
      "Content Strategy", "Email Marketing", "Social Media", "HubSpot", "Mailchimp"
    ],
    "writing": [
      "Creative Writing", "Technical Writing", "Copywriting", "SEO Writing",
      "Editing", "Translation", "Research", "Storytelling", "Blogging"
    ],
    "admin": [
      "Microsoft Office", "Google Workspace", "Data Entry", "Excel",
      "Project Management", "CRM", "Customer Service", "Research", "Organization"
    ],
    "it-network": [
      "Linux", "AWS", "Azure", "Docker", "Kubernetes",
      "CI/CD", "Git", "Terraform", "Ansible", "Monitoring"
    ],
    "video-audio": [
      "Premiere Pro", "Final Cut Pro", "DaVinci Resolve", "After Effects",
      "Audacity", "Pro Tools", "Logic Pro", "Animation", "3D Modeling"
    ]
  },

  budgetRanges: [
    { label: "Micro (< 500€)", min: 0, max: 500 },
    { label: "Petit (500€ - 1K€)", min: 500, max: 1000 },
    { label: "Moyen (1K€ - 5K€)", min: 1000, max: 5000 },
    { label: "Grand (5K€ - 10K€)", min: 5000, max: 10000 },
    { label: "Entreprise (> 10K€)", min: 10000, max: 1000000 }
  ],

  projectDurations: [
    { label: "Court terme (< 1 mois)", value: "short", days: 30 },
    { label: "Moyen terme (1-3 mois)", value: "medium", days: 90 },
    { label: "Long terme (3-6 mois)", value: "long", days: 180 },
    { label: "Très long terme (> 6 mois)", value: "extended", days: 365 }
  ],

  experienceLevels: [
    { label: "Débutant", value: "beginner", description: "1-2 ans d'expérience" },
    { label: "Intermédiaire", value: "intermediate", description: "2-5 ans d'expérience" },
    { label: "Expert", value: "expert", description: "5-10 ans d'expérience" },
    { label: "Senior", value: "senior", description: "10+ ans d'expérience" }
  ],

  projectComplexity: [
    { label: "Simple", value: "simple", description: "Tâches basiques et bien définies" },
    { label: "Modéré", value: "medium", description: "Nécessite des compétences intermédiaires" },
    { label: "Complexe", value: "complex", description: "Projets techniques avancés" },
    { label: "Expert", value: "expert", description: "Défis techniques majeurs" }
  ]
}

// GET - Récupérer tous les types
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const categoryId = searchParams.get("category")

    // Si un type spécifique est demandé
    if (type) {
      switch (type) {
        case "categories":
          return NextResponse.json({
            success: true,
            data: PROJECT_TYPES.categories
          })
        
        case "skills":
          if (categoryId && PROJECT_TYPES.skills[categoryId as keyof typeof PROJECT_TYPES.skills]) {
            return NextResponse.json({
              success: true,
              data: PROJECT_TYPES.skills[categoryId as keyof typeof PROJECT_TYPES.skills]
            })
          }
          return NextResponse.json({
            success: true,
            data: PROJECT_TYPES.skills
          })
        
        case "budgets":
          return NextResponse.json({
            success: true,
            data: PROJECT_TYPES.budgetRanges
          })
        
        case "durations":
          return NextResponse.json({
            success: true,
            data: PROJECT_TYPES.projectDurations
          })
        
        case "experience":
          return NextResponse.json({
            success: true,
            data: PROJECT_TYPES.experienceLevels
          })
        
        case "complexity":
          return NextResponse.json({
            success: true,
            data: PROJECT_TYPES.projectComplexity
          })
        
        default:
          return NextResponse.json(
            { success: false, error: "Invalid type parameter" },
            { status: 400 }
          )
      }
    }

    // Retourner tout
    return NextResponse.json({
      success: true,
      data: PROJECT_TYPES
    })

  } catch (error) {
    console.error("Error fetching project types:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// POST - Obtenir des statistiques sur les types de projets
export async function POST(request: Request) {
  try {
    const db = await getDatabase()
    
    // Agrégations pour les statistiques
    const [categoryStats, skillStats, budgetStats] = await Promise.all([
      // Statistiques par catégorie
      db.collection("projects").aggregate([
        { $match: { status: "open" } },
        { $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgBudget: { $avg: "$budget.min" },
          totalApplications: { $sum: "$applicationCount" }
        }},
        { $sort: { count: -1 } }
      ]).toArray(),
      
      // Compétences les plus demandées
      db.collection("projects").aggregate([
        { $match: { status: "open" } },
        { $unwind: "$skills" },
        { $group: {
          _id: "$skills",
          count: { $sum: 1 }
        }},
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]).toArray(),
      
      // Distribution des budgets
      db.collection("projects").aggregate([
        { $match: { status: "open" } },
        { $bucket: {
          groupBy: "$budget.min",
          boundaries: [0, 500, 1000, 5000, 10000, 1000000],
          default: "Other",
          output: {
            count: { $sum: 1 },
            avgBudget: { $avg: "$budget.min" }
          }
        }}
      ]).toArray()
    ])

    return NextResponse.json({
      success: true,
      data: {
        categories: categoryStats,
        skills: skillStats,
        budgets: budgetStats,
        metadata: {
          totalOpenProjects: categoryStats.reduce((sum, cat) => sum + cat.count, 0),
          generatedAt: new Date()
        }
      }
    })

  } catch (error) {
    console.error("Error fetching statistics:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}