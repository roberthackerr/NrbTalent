// app/sitemap.ts
import type { MetadataRoute } from "next"

// Types de recherche possibles
type SearchType = 'all' | 'users' | 'projects'
type BudgetType = 'all' | 'fixed' | 'hourly'
type SortType = 'relevance' | 'rating' | 'date'

// Options pour générer les URLs de recherche
const searchOptions = {
  types: ['all', 'users', 'projects'] as SearchType[],
  budgetTypes: ['all', 'fixed', 'hourly'] as BudgetType[],
  sortOptions: ['relevance', 'rating', 'date'] as SortType[],
  ratings: [0, 3.5, 4, 4.5],
  pageLimits: [1, 2, 3], // Pages populaires à indexer
}

// Requêtes de recherche populaires (basées sur l'usage réel)
const popularQueries = [
  // Développement
  "développeur web", "web developer", "mpamoratra tranonkala",
  "react", "next.js", "node.js", "javascript", "typescript",
  "python", "django", "flask", "java", "spring boot",
  "php", "laravel", "symfony", "ruby on rails",
  "mobile developer", "flutter", "react native", "swift", "kotlin",
  "fullstack", "frontend", "backend", "devops", "cloud",
  
  // Design
  "designer graphique", "graphic designer", "mpamorona sary",
  "ui/ux designer", "web designer", "logo designer",
  "figma", "adobe xd", "photoshop", "illustrator",
  "motion designer", "video editor", "3d designer",
  
  // Marketing
  "marketing digital", "digital marketer", "mpivarotra an-tserasera",
  "seo", "sem", "google ads", "facebook ads",
  "social media manager", "content creator", "copywriter",
  "email marketing", "community manager",
  
  // Data
  "data scientist", "data analyst", "mpandinika angona",
  "machine learning", "ai engineer", "big data",
  "sql", "power bi", "tableau",
  
  // Autres
  "rédacteur", "writer", "mpanoratra",
  "consultant", "virtual assistant", "project manager",
  "customer support", "sales", "administrative assistant",
]

// Catégories populaires pour les projets
const popularCategories = [
  "web development", "mobile development", "software development",
  "design", "graphic design", "ui/ux design",
  "marketing", "digital marketing", "seo",
  "writing", "content creation", "translation",
  "data science", "machine learning", "ai",
  "consulting", "virtual assistance", "administration",
]

// Localisations populaires
const popularLocations = [
  "antananarivo", "tamatave", "mahajanga", "fianarantsoa",
  "paris", "lyon", "marseille", "bordeaux",
  "montreal", "paris", "dakar", "abidjan",
  "remote", "télétravail", "any", "lavian-davitra",
]

// Compétences populaires
const popularSkills = [
  "react", "javascript", "python", "node.js", "typescript",
  "figma", "photoshop", "illustrator", "ui/ux", "graphic design",
  "seo", "google ads", "facebook ads", "social media",
  "sql", "mongodb", "postgresql", "firebase",
  "wordpress", "shopify", "woocommerce", "webflow",
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "https://nrb-talent.vercel.app"
  const languages = ["en", "fr", "mg"]
  const lastModified = new Date()

  const sitemapEntries: MetadataRoute.Sitemap = []

  // ==================== 1. PAGES STATIQUES ====================
  const staticRoutes = [
    { path: "", priority: 1.0, changefreq: "daily" },
    { path: "about", priority: 0.8, changefreq: "monthly" },
    { path: "blog", priority: 0.7, changefreq: "weekly" },
    { path: "calendar", priority: 0.6, changefreq: "weekly" },
    { path: "contact", priority: 0.7, changefreq: "monthly" },
    { path: "cookies", priority: 0.3, changefreq: "yearly" },
    { path: "docs", priority: 0.6, changefreq: "weekly" },
    { path: "faq", priority: 0.7, changefreq: "monthly" },
    { path: "freelancers", priority: 0.9, changefreq: "daily" },
    { path: "how-it-works", priority: 0.8, changefreq: "monthly" },
    { path: "ide", priority: 0.5, changefreq: "weekly" },
    { path: "meet", priority: 0.7, changefreq: "daily" },
    { path: "news", priority: 0.7, changefreq: "daily" },
    { path: "notifications", priority: 0.5, changefreq: "daily" },
    { path: "pricing", priority: 0.8, changefreq: "weekly" },
    { path: "privacy", priority: 0.4, changefreq: "yearly" },
    { path: "talents", priority: 0.9, changefreq: "daily" },
    { path: "terms", priority: 0.4, changefreq: "yearly" },
    { path: "gigs", priority: 0.8, changefreq: "daily" },
    { path: "gigs/create", priority: 0.7, changefreq: "weekly" },
    { path: "projects", priority: 0.9, changefreq: "daily" },
    { path: "projects/create", priority: 0.7, changefreq: "weekly" },
    { path: "teams", priority: 0.7, changefreq: "daily" },
    { path: "messages", priority: 0.6, changefreq: "daily" },
    { path: "profile", priority: 0.6, changefreq: "weekly" },
    { path: "contracts", priority: 0.7, changefreq: "daily" },
    { path: "orders", priority: 0.7, changefreq: "daily" },
    { path: "auth/signin", priority: 0.5, changefreq: "yearly" },
    { path: "auth/signup", priority: 0.5, changefreq: "yearly" },
    { path: "dashboard", priority: 0.8, changefreq: "daily" },
    { path: "dashboard/academy", priority: 0.7, changefreq: "weekly" },
    { path: "dashboard/messages", priority: 0.6, changefreq: "daily" },
    { path: "dashboard/settings", priority: 0.6, changefreq: "weekly" },
    { path: "dashboard/referrals", priority: 0.6, changefreq: "weekly" },
    { path: "dashboard/client", priority: 0.7, changefreq: "daily" },
    { path: "dashboard/client/ai-matching", priority: 0.8, changefreq: "daily" },
    { path: "dashboard/client/post-project", priority: 0.7, changefreq: "weekly" },
    { path: "dashboard/freelance", priority: 0.7, changefreq: "daily" },
    { path: "dashboard/freelance/applications", priority: 0.7, changefreq: "daily" },
    { path: "dashboard/freelance/gigs", priority: 0.7, changefreq: "daily" },
    { path: "dashboard/freelance/profile", priority: 0.8, changefreq: "weekly" },
    { path: "dashboard/freelancer", priority: 0.7, changefreq: "daily" },
    { path: "dashboard/freelancer/bank", priority: 0.6, changefreq: "weekly" },
    { path: "dashboard/freelancer/payments", priority: 0.7, changefreq: "daily" },
    { path: "ai-matching", priority: 0.8, changefreq: "daily" },
    { path: "onboarding", priority: 0.6, changefreq: "monthly" },
    { path: "onboarding/role", priority: 0.6, changefreq: "monthly" },
    { path: "admin/verification", priority: 0.5, changefreq: "daily" },
    { path: "search", priority: 0.95, changefreq: "daily" }, // Page search principale
  ]

  // Générer les URLs statiques pour chaque langue
  for (const route of staticRoutes) {
    for (const lang of languages) {
      const url = route.path === "" 
        ? `${baseUrl}/${lang}`
        : `${baseUrl}/${lang}/${route.path}`
      
      sitemapEntries.push({
        url,
        lastModified,
        changeFrequency: route.changefreq as MetadataRoute.Sitemap[number]["changeFrequency"],
        priority: route.priority,
      })
    }
  }

  // ==================== 2. ROUTES DE RECHERCHE PRINCIPALES ====================
  
  // Page search sans paramètres (par langue)
  for (const lang of languages) {
    sitemapEntries.push({
      url: `${baseUrl}/${lang}/search`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.95,
    })
  }

  // ==================== 3. RECHERCHES PAR TYPE ====================
  for (const lang of languages) {
    for (const type of searchOptions.types) {
      sitemapEntries.push({
        url: `${baseUrl}/${lang}/search?type=${type}`,
        lastModified,
        changeFrequency: "daily",
        priority: 0.85,
      })
    }
  }

  // ==================== 4. RECHERCHES PAR TRI ====================
  for (const lang of languages) {
    for (const sort of searchOptions.sortOptions) {
      sitemapEntries.push({
        url: `${baseUrl}/${lang}/search?sort=${sort}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }
  }

  // ==================== 5. RECHERCHES PAR CATÉGORIE ====================
  for (const lang of languages) {
    for (const category of popularCategories) {
      sitemapEntries.push({
        url: `${baseUrl}/${lang}/search?category=${encodeURIComponent(category)}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.75,
      })
    }
  }

  // ==================== 6. RECHERCHES PAR LOCALISATION ====================
  for (const lang of languages) {
    for (const location of popularLocations) {
      sitemapEntries.push({
        url: `${baseUrl}/${lang}/search?location=${encodeURIComponent(location)}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }
  }

  // ==================== 7. RECHERCHES PAR COMPÉTENCES ====================
  for (const lang of languages) {
    for (const skill of popularSkills) {
      sitemapEntries.push({
        url: `${baseUrl}/${lang}/search?skills=${encodeURIComponent(skill)}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.75,
      })
    }
    
    // Combinaisons de compétences populaires
    const skillCombinations = [
      "react,node.js",
      "javascript,typescript",
      "python,django",
      "figma,ui/ux",
      "photoshop,illustrator",
      "seo,google ads",
      "react,native",
      "laravel,vue.js",
    ]
    
    for (const skills of skillCombinations) {
      sitemapEntries.push({
        url: `${baseUrl}/${lang}/search?skills=${encodeURIComponent(skills)}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.65,
      })
    }
  }

  // ==================== 8. RECHERCHES PAR BUDGET ====================
  for (const lang of languages) {
    for (const budgetType of searchOptions.budgetTypes) {
      // Budget min-max populaires
      const budgetRanges = [
        { min: 0, max: 100 },
        { min: 100, max: 500 },
        { min: 500, max: 1000 },
        { min: 1000, max: 5000 },
        { min: 5000, max: 10000 },
      ]
      
      for (const range of budgetRanges) {
        sitemapEntries.push({
          url: `${baseUrl}/${lang}/search?budgetMin=${range.min}&budgetMax=${range.max}&budgetType=${budgetType}`,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.65,
        })
      }
    }
  }

  // ==================== 9. RECHERCHES PAR NOTE ====================
  for (const lang of languages) {
    for (const rating of searchOptions.ratings) {
      if (rating > 0) {
        sitemapEntries.push({
          url: `${baseUrl}/${lang}/search?minRating=${rating}`,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.7,
        })
      }
    }
  }

  // ==================== 10. RECHERCHES POPULAIRES (QUERIES) ====================
  for (const lang of languages) {
    for (const query of popularQueries) {
      sitemapEntries.push({
        url: `${baseUrl}/${lang}/search?q=${encodeURIComponent(query)}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.8,
      })
      
      // Combinaisons query + type
      for (const type of searchOptions.types) {
        if (type !== 'all') {
          sitemapEntries.push({
            url: `${baseUrl}/${lang}/search?q=${encodeURIComponent(query)}&type=${type}`,
            lastModified,
            changeFrequency: "weekly",
            priority: 0.7,
          })
        }
      }
    }
  }

  // ==================== 11. RECHERCHES AVEC PAGINATION ====================
  for (const lang of languages) {
    for (const page of searchOptions.pageLimits) {
      if (page > 1) {
        sitemapEntries.push({
          url: `${baseUrl}/${lang}/search?page=${page}`,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.5,
        })
        
        // Pagination + type
        for (const type of searchOptions.types) {
          if (type !== 'all') {
            sitemapEntries.push({
              url: `${baseUrl}/${lang}/search?type=${type}&page=${page}`,
              lastModified,
              changeFrequency: "weekly",
              priority: 0.45,
            })
          }
        }
      }
    }
  }

  // ==================== 12. COMBINAISONS AVANCÉES (populaires) ====================
  const advancedCombinations = [
    { type: "users", sort: "rating", minRating: 4 },
    { type: "users", sort: "date", location: "remote" },
    { type: "projects", sort: "date", budgetType: "fixed" },
    { type: "projects", sort: "relevance", category: "web development" },
    { type: "all", sort: "relevance", skills: "react" },
    { type: "users", sort: "rating", skills: "javascript,react" },
    { type: "projects", sort: "date", budgetMin: 500, budgetMax: 5000 },
  ]
  
  for (const lang of languages) {
    for (const combo of advancedCombinations) {
      const params = new URLSearchParams()
      if (combo.type) params.set("type", combo.type)
      if (combo.sort) params.set("sort", combo.sort)
      if (combo.minRating) params.set("minRating", combo.minRating.toString())
      if (combo.location) params.set("location", combo.location)
      if (combo.budgetType) params.set("budgetType", combo.budgetType)
      if (combo.category) params.set("category", combo.category)
      if (combo.skills) params.set("skills", combo.skills)
      if (combo.budgetMin) params.set("budgetMin", combo.budgetMin.toString())
      if (combo.budgetMax) params.set("budgetMax", combo.budgetMax.toString())
      
      sitemapEntries.push({
        url: `${baseUrl}/${lang}/search?${params.toString()}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.6,
      })
    }
  }

  return sitemapEntries
}