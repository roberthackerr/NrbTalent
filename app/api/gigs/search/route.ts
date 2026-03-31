import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 12
const MAX_LIMIT = 50
const MIN_PRICE = 0
const MAX_PRICE = 10000

// ─── Validation Schema ────────────────────────────────────────────────────────
const SearchGigsSchema = z.object({
  q: z.string().optional().transform(val => val?.trim()),
  page: z.string().optional().default(DEFAULT_PAGE.toString()).transform(val => {
    const num = parseInt(val, 10)
    return isNaN(num) || num < 1 ? DEFAULT_PAGE : num
  }),
  limit: z.string().optional().default(DEFAULT_LIMIT.toString()).transform(val => {
    const num = parseInt(val, 10)
    return isNaN(num) || num < 1 || num > MAX_LIMIT ? DEFAULT_LIMIT : num
  }),
  category: z.string().optional().transform(val => val === "all" ? undefined : val),
  subcategory: z.string().optional(),
  skills: z.string().optional().transform(val => {
    if (!val) return undefined
    const skills = val.split(",").map(s => s.trim()).filter(s => s.length > 0)
    return skills.length > 0 ? skills : undefined
  }),
  minPrice: z.string().optional().default(MIN_PRICE.toString()).transform(val => {
    const num = parseInt(val, 10)
    return isNaN(num) || num < MIN_PRICE ? MIN_PRICE : num
  }),
  maxPrice: z.string().optional().default(MAX_PRICE.toString()).transform(val => {
    const num = parseInt(val, 10)
    return isNaN(num) || num > MAX_PRICE ? MAX_PRICE : num
  }),
  deliveryTime: z.string().optional().transform(val => {
    if (!val) return undefined
    const times = val.split(",").map(t => parseInt(t, 10)).filter(t => !isNaN(t))
    return times.length > 0 ? times : undefined
  }),
  rating: z.string().optional().transform(val => {
    const num = parseFloat(val || "0")
    return isNaN(num) ? 0 : num
  }),
  sortBy: z.enum(["relevance", "createdAt", "price", "rating", "sales", "reviews", ""]).optional().default("relevance"),
  sortOrder: z.enum(["asc", "desc", ""]).optional().default("desc").transform(val => val === "" ? "desc" : val),
  status: z.enum(["active", "draft", "paused", "archived", ""]).optional().default("active"),
  sellerId: z.string().optional().refine(val => !val || ObjectId.isValid(val), { message: "Invalid sellerId format" }),
  minRating: z.string().optional().transform(val => {
    const num = parseFloat(val || "0")
    return isNaN(num) ? 0 : num
  }),
  featured: z.enum(["true", "false", ""]).optional().transform(val => val === "true"),
})

type SearchGigsQuery = z.infer<typeof SearchGigsSchema>

// ─── Helper: Build search filter ─────────────────────────────────────────────
function buildSearchFilter(query: SearchGigsQuery) {
  const filter: any = {
    status: "active",
    deleted: { $ne: true }
  }

  // Recherche textuelle (titre, description, compétences)
  if (query.q) {
    const searchRegex = { $regex: query.q, $options: "i" }
    filter.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { shortDescription: searchRegex },
      { skills: searchRegex },
      { category: searchRegex },
      { tags: searchRegex }
    ]
  }

  // Catégorie
  if (query.category) {
    filter.category = query.category
  }

  // Sous-catégorie
  if (query.subcategory) {
    filter.subcategory = query.subcategory
  }

  // Compétences
  if (query.skills && query.skills.length > 0) {
    filter.skills = { $in: query.skills }
  }

  // Prix
  if (query.minPrice > MIN_PRICE || query.maxPrice < MAX_PRICE) {
    filter.price = {
      $gte: query.minPrice,
      $lte: query.maxPrice
    }
  }

  // Délai de livraison (en jours)
  if (query.deliveryTime && query.deliveryTime.length > 0) {
    filter.deliveryTime = { $in: query.deliveryTime }
  }

  // Note minimum
  if (query.minRating > 0 || query.rating > 0) {
    const ratingFilter = Math.max(query.minRating, query.rating)
    filter["seller.rating"] = { $gte: ratingFilter }
  }

  // Gigs en vedette
  if (query.featured) {
    filter.featured = true
  }

  // Gigs d'un vendeur spécifique
  if (query.sellerId) {
    filter.sellerId = new ObjectId(query.sellerId)
  }

  return filter
}

// ─── Helper: Build sort options ───────────────────────────────────────────────
function buildSortOptions(query: SearchGigsQuery) {
  const dir = query.sortOrder === "asc" ? 1 : -1

  const sortMap: Record<string, any> = {
    createdAt: { createdAt: dir },
    price: { price: dir },
    rating: { "seller.rating": dir },
    sales: { totalSales: dir },
    reviews: { reviewCount: dir }
  }

  if (query.sortBy === "relevance") {
    // Pour la pertinence, on combine popularité et récence
    return { featured: -1, totalSales: -1, createdAt: -1 }
  }

  return sortMap[query.sortBy] || { createdAt: -1 }
}

// ─── Helper: Enrichir les gigs avec les infos vendeur ────────────────────────
async function enrichGigsWithSellers(gigs: any[], db: any) {
  if (!gigs.length) return gigs

  const uniqueSellerIds = [
    ...new Set(gigs.map(g => g.sellerId?.toString()).filter(Boolean))
  ].map(id => new ObjectId(id))

  if (!uniqueSellerIds.length) return gigs

  const sellers = await db.collection("users")
    .find({ _id: { $in: uniqueSellerIds } })
    .project({
      _id: 1,
      name: 1,
      avatar: 1,
      title: 1,
      "statistics.rating": 1,
      "statistics.completedProjects": 1,
      "statistics.responseRate": 1,
      verified: 1,
      createdAt: 1
    })
    .toArray()

  const sellerMap = new Map(sellers.map(s => [s._id.toString(), s]))

  return gigs.map(gig => ({
    ...gig,
    seller: sellerMap.get(gig.sellerId?.toString()) || null,
    // Calculer le temps estimé de livraison en texte
    estimatedDelivery: gig.deliveryTime 
      ? `${gig.deliveryTime} ${gig.deliveryTime > 1 ? 'jours' : 'jour'}`
      : null
  }))
}

// ─── Helper: Vérifier si l'utilisateur a déjà commandé ce gig ────────────────
async function checkUserOrders(userId: string, gigIds: string[], db: any) {
  if (!userId || !gigIds.length) return new Set()
  
  try {
    const orders = await db.collection("orders")
      .find({
        userId: new ObjectId(userId),
        gigId: { $in: gigIds.map(id => new ObjectId(id)) },
        status: { $in: ["completed", "in-progress"] }
      })
      .project({ gigId: 1 })
      .toArray()
    
    return new Set(orders.map(o => o.gigId.toString()))
  } catch {
    return new Set()
  }
}

// ─── Main GET handler ─────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    // Validation des paramètres
    const validation = SearchGigsSchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid search parameters",
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const query = validation.data
    const db = await getDatabase()

    // Vérifier si l'utilisateur a déjà commandé certains gigs
    let userOrderedGigs = new Set<string>()
    if (session?.user?.id) {
      const gigsForOrderCheck: string[] = [] // On récupérera après la recherche
      // On ne peut pas vérifier avant d'avoir les IDs des gigs
    }

    // Construction du filtre
    const filter = buildSearchFilter(query)
    const skip = (query.page - 1) * query.limit
    const sortOptions = buildSortOptions(query)

    // Exécution de la recherche avec agrégation pour meilleures performances
    const aggregationPipeline = [
      { $match: filter },
      { $sort: sortOptions },
      { $skip: skip },
      { $limit: query.limit },
      // Ajouter des champs calculés
      {
        $addFields: {
          averageRating: { $ifNull: ["$seller.rating", 0] },
          priceRange: {
            $concat: [
              { $toString: "$price" },
              " €"
            ]
          }
        }
      }
    ]

    const [gigs, totalCount] = await Promise.all([
      db.collection("gigs")
        .aggregate(aggregationPipeline)
        .toArray(),
      db.collection("gigs").countDocuments(filter),
    ])

    // Enrichir avec les infos vendeurs
    const enrichedGigs = await enrichGigsWithSellers(gigs, db)

    // Vérifier les commandes de l'utilisateur
    let userOrderedGigIds = new Set<string>()
    if (session?.user?.id && enrichedGigs.length) {
      const gigIds = enrichedGigs.map(g => g._id.toString())
      userOrderedGigIds = await checkUserOrders((session.user as any).id, gigIds, db)
    }

    // Ajouter l'information de commande aux gigs
    const gigsWithOrderStatus = enrichedGigs.map(gig => ({
      ...gig,
      hasOrdered: userOrderedGigIds.has(gig._id.toString())
    }))

    const totalPages = Math.ceil(totalCount / query.limit)

    // Facettes pour les filtres (catégories populaires, compétences, etc.)
    const [popularCategories, popularSkills, priceRanges] = await Promise.all([
      db.collection("gigs").aggregate([
        { $match: { status: "active", deleted: { $ne: true } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]).toArray(),
      db.collection("gigs").aggregate([
        { $match: { status: "active", deleted: { $ne: true } } },
        { $unwind: "$skills" },
        { $group: { _id: "$skills", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]).toArray(),
      db.collection("gigs").aggregate([
        { $match: { status: "active", deleted: { $ne: true } } },
        {
          $facet: {
            minMax: [
              { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } }
            ],
            ranges: [
              {
                $bucket: {
                  groupBy: "$price",
                  boundaries: [0, 50, 100, 200, 500, 1000, 5000],
                  default: "Other",
                  output: { count: { $sum: 1 } }
                }
              }
            ]
          }
        }
      ]).toArray(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        gigs: gigsWithOrderStatus,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: totalCount,
          totalPages,
          hasNext: query.page < totalPages,
          hasPrev: query.page > 1,
        },
        filters: {
          query: query.q || null,
          category: query.category || null,
          subcategory: query.subcategory || null,
          skills: query.skills || null,
          minPrice: query.minPrice,
          maxPrice: query.maxPrice,
          deliveryTime: query.deliveryTime || null,
          minRating: query.minRating || query.rating,
        },
        facets: {
          categories: popularCategories.map(c => ({ name: c._id, count: c.count })),
          skills: popularSkills.map(s => ({ name: s._id, count: s.count })),
          priceRange: {
            min: priceRanges[0]?.minMax[0]?.min || 0,
            max: priceRanges[0]?.minMax[0]?.max || 1000,
            buckets: priceRanges[0]?.ranges || []
          }
        }
      },
    })
  } catch (error) {
    console.error("❌ Error searching gigs:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}