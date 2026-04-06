// app/sitemap.ts
import type { MetadataRoute } from "next"

// Helper pour encoder les URLs pour le XML
function encodeSitemapUrl(url: string): string {
  // Remplacer & par &amp; pour le XML
  // Mais attention à ne pas remplacer &amp; déjà présent
  return url.replace(/&(?!amp;)/g, '&amp;')
}

// Types de recherche possibles
type SearchType = 'all' | 'users' | 'projects'
type BudgetType = 'all' | 'fixed' | 'hourly'
type SortType = 'relevance' | 'rating' | 'date'

// Options pour générer les URLs de recherche
const searchOptions = {
  types: ['all', 'users', 'projects'] as SearchType[],
  budgetTypes: ['all', 'fixed', 'hourly'] as BudgetType[],
  sortOptions: ['relevance', 'rating', 'date'] as SortType[],
  ratings: [3.5, 4, 4.5], // Enlever 0 car inutile
  pageLimits: [2, 3], // Pages 2 et 3 seulement
}

// Requêtes de recherche populaires - EN VERSION URL-SAFE UNIQUEMENT
const popularQueries = [
  // Développement
  "developpeur-web", "web-developer", "mpamoratra-tranonkala",
  "react", "nextjs", "nodejs", "javascript", "typescript",
  "python", "django", "flask", "java", "spring-boot",
  "php", "laravel", "symfony", "ruby-on-rails",
  "mobile-developer", "flutter", "react-native", "swift", "kotlin",
  "fullstack", "frontend", "backend", "devops", "cloud",
  
  // Design
  "designer-graphique", "graphic-designer", "mpamorona-sary",
  "ui-ux-designer", "web-designer", "logo-designer",
  "figma", "adobe-xd", "photoshop", "illustrator",
  "motion-designer", "video-editor", "3d-designer",
  
  // Marketing
  "marketing-digital", "digital-marketer", "mpivarotra-antserasera",
  "seo", "sem", "google-ads", "facebook-ads",
  "social-media-manager", "content-creator", "copywriter",
  "email-marketing", "community-manager",
  
  // Data
  "data-scientist", "data-analyst", "mpandinika-angona",
  "machine-learning", "ai-engineer", "big-data",
  "sql", "power-bi", "tableau",
  
  // Autres
  "redacteur", "writer", "mpanoratra",
  "consultant", "virtual-assistant", "project-manager",
  "customer-support", "sales", "administrative-assistant",
]

// Catégories populaires - UNIQUEMENT caractères URL-safe
const popularCategories = [
  "web-development", "mobile-development", "software-development",
  "design", "graphic-design", "ui-ux-design",
  "marketing", "digital-marketing", "seo",
  "writing", "content-creation", "translation",
  "data-science", "machine-learning", "ai",
  "consulting", "virtual-assistance", "administration",
]

// Localisations populaires
const popularLocations = [
  "antananarivo", "tamatave", "mahajanga", "fianarantsoa",
  "paris", "lyon", "marseille", "bordeaux",
  "montreal", "dakar", "abidjan",
  "remote", "teletravail", "any", "lavian-davitra",
]

// Compétences populaires
const popularSkills = [
  "react", "javascript", "python", "nodejs", "typescript",
  "figma", "photoshop", "illustrator", "ui-ux", "graphic-design",
  "seo", "google-ads", "facebook-ads", "social-media",
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
    { path: "search", priority: 0.95, changefreq: "daily" },
  ]

  // Générer les URLs statiques pour chaque langue
  for (const route of staticRoutes) {
    for (const lang of languages) {
      const url = route.path === "" 
        ? `${baseUrl}/${lang}`
        : `${baseUrl}/${lang}/${route.path}`
      
      sitemapEntries.push({
        url: encodeSitemapUrl(url),
        lastModified,
        changeFrequency: route.changefreq as MetadataRoute.Sitemap[number]["changeFrequency"],
        priority: route.priority,
      })
    }
  }

  // ==================== 2. ROUTES DE RECHERCHE PRINCIPALES ====================
  for (const lang of languages) {
    sitemapEntries.push({
      url: encodeSitemapUrl(`${baseUrl}/${lang}/search`),
      lastModified,
      changeFrequency: "daily",
      priority: 0.95,
    })
  }

  // ==================== 3. RECHERCHES PAR TYPE ====================
  for (const lang of languages) {
    for (const type of searchOptions.types) {
      sitemapEntries.push({
        url: encodeSitemapUrl(`${baseUrl}/${lang}/search?type=${type}`),
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
        url: encodeSitemapUrl(`${baseUrl}/${lang}/search?sort=${sort}`),
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
        url: encodeSitemapUrl(`${baseUrl}/${lang}/search?category=${category}`),
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
        url: encodeSitemapUrl(`${baseUrl}/${lang}/search?location=${location}`),
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
        url: encodeSitemapUrl(`${baseUrl}/${lang}/search?skills=${skill}`),
        lastModified,
        changeFrequency: "weekly",
        priority: 0.75,
      })
    }
    
    const skillCombinations = [
      "react,nodejs",
      "javascript,typescript",
      "python,django",
      "figma,ui-ux",
      "photoshop,illustrator",
      "seo,google-ads",
    ]
    
    for (const skills of skillCombinations) {
      sitemapEntries.push({
        url: encodeSitemapUrl(`${baseUrl}/${lang}/search?skills=${skills}`),
        lastModified,
        changeFrequency: "weekly",
        priority: 0.65,
      })
    }
  }

  // ==================== 8. RECHERCHES PAR BUDGET ====================
  for (const lang of languages) {
    for (const budgetType of searchOptions.budgetTypes) {
      const budgetRanges = [
        { min: 0, max: 100 },
        { min: 100, max: 500 },
        { min: 500, max: 1000 },
        { min: 1000, max: 5000 },
        { min: 5000, max: 10000 },
      ]
      
      for (const range of budgetRanges) {
        sitemapEntries.push({
          url: encodeSitemapUrl(`${baseUrl}/${lang}/search?budgetMin=${range.min}&budgetMax=${range.max}&budgetType=${budgetType}`),
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
      sitemapEntries.push({
        url: encodeSitemapUrl(`${baseUrl}/${lang}/search?minRating=${rating}`),
        lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }
  }

  // ==================== 10. RECHERCHES POPULAIRES ====================
  for (const lang of languages) {
    for (const query of popularQueries) {
      sitemapEntries.push({
        url: encodeSitemapUrl(`${baseUrl}/${lang}/search?q=${query}`),
        lastModified,
        changeFrequency: "weekly",
        priority: 0.8,
      })
    }
  }

  // ==================== 11. PAGINATION ====================
  for (const lang of languages) {
    for (const page of searchOptions.pageLimits) {
      sitemapEntries.push({
        url: encodeSitemapUrl(`${baseUrl}/${lang}/search?page=${page}`),
        lastModified,
        changeFrequency: "weekly",
        priority: 0.5,
      })
    }
  }

  // ==================== 12. COMBINAISONS AVANCÉES ====================
  const advancedCombinations = [
    "type=users&sort=rating&minRating=4",
    "type=users&sort=date&location=remote",
    "type=projects&sort=date&budgetType=fixed",
    "type=projects&sort=relevance&category=web-development",
    "type=all&sort=relevance&skills=react",
    "type=users&sort=rating&skills=javascript,react",
    "type=projects&sort=date&budgetMin=500&budgetMax=5000",
  ]
  
  for (const lang of languages) {
    for (const combo of advancedCombinations) {
      sitemapEntries.push({
        url: encodeSitemapUrl(`${baseUrl}/${lang}/search?${combo}`),
        lastModified,
        changeFrequency: "weekly",
        priority: 0.6,
      })
    }
  }

  return sitemapEntries
}