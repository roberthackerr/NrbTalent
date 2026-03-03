import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { z } from "zod"

// Schéma de validation des paramètres
// ✅ Propre et typé
// ✅ Solution la plus propre - accepte null et applique la valeur par défaut
const FeedQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  category: z.string().nullable().optional().default(""),
  search: z.string().nullable().optional().default(""),
  types: z.string().nullable().optional().default("group_post,project,gig,ai_match"),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)

    // Validation des paramètres
    const query = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      category: searchParams.get('category'),
      search: searchParams.get('search'),
      types: searchParams.get('types'),
    }
    const parseResult = FeedQuerySchema.safeParse(query)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Paramètres invalides", details: parseResult.error.issues },
        { status: 400 }
      )
    }
    const { page, limit, category, search, types } = parseResult.data

    const db = await getDatabase()
    const userId = session?.user ? new ObjectId((session.user as any).id) : null
    const userRole = session?.user ? (session.user as any).role : null

    // Types à inclure
    const includeTypes = types ? types.split(',') : ['group_post', 'project', 'gig', 'ai_match']

    // Construction des promesses en parallèle
    const promises: Promise<any>[] = []

    // 1. Publications de groupes (si connecté)
    if (includeTypes.includes('group_post') && userId) {
      promises.push(
        fetchGroupPosts(db, userId, page, limit, category, search)
          .then(data => ({ type: 'group_posts', data }))
          .catch(err => {
            console.error("Error fetching group posts:", err)
            return { type: 'group_posts', data: { items: [], total: 0 } }
          })
      )
    } else {
      promises.push(Promise.resolve({ type: 'group_posts', data: { items: [], total: 0 } }))
    }

    // 2. Projets publics
    if (includeTypes.includes('project')) {
      promises.push(
        fetchProjects(db, page, limit, category, search)
          .then(data => ({ type: 'projects', data }))
          .catch(err => {
            console.error("Error fetching projects:", err)
            return { type: 'projects', data: { items: [], total: 0 } }
          })
      )
    } else {
      promises.push(Promise.resolve({ type: 'projects', data: { items: [], total: 0 } }))
    }

    // 3. Gigs/Services publics
    if (includeTypes.includes('gig')) {
      promises.push(
        fetchGigs(db, page, limit, category, search)
          .then(data => ({ type: 'gigs', data }))
          .catch(err => {
            console.error("Error fetching gigs:", err)
            return { type: 'gigs', data: { items: [], total: 0 } }
          })
      )
    } else {
      promises.push(Promise.resolve({ type: 'gigs', data: { items: [], total: 0 } }))
    }

    // 4. Matchs IA (si freelance connecté)
    if (includeTypes.includes('ai_match') && userId && userRole === 'freelance') {
      promises.push(
        fetchAIMatches(db, userId, limit)
          .then(data => ({ type: 'ai_matches', data }))
          .catch(err => {
            console.error("Error fetching AI matches:", err)
            return { type: 'ai_matches', data: { items: [] } }
          })
      )
    } else {
      promises.push(Promise.resolve({ type: 'ai_matches', data: { items: [] } }))
    }

    // Attendre toutes les promesses
    const results = await Promise.all(promises)

    // Organiser les résultats
    const groupPosts = results.find(r => r.type === 'group_posts')?.data || { items: [], total: 0 }
    const projects = results.find(r => r.type === 'projects')?.data || { items: [], total: 0 }
    const gigs = results.find(r => r.type === 'gigs')?.data || { items: [], total: 0 }
    const aiMatches = results.find(r => r.type === 'ai_matches')?.data || { items: [] }

    // Calculer s'il y a plus de contenu
    const hasMore = 
      (groupPosts.items.length + projects.items.length + gigs.items.length + aiMatches.items.length) >= limit

    return NextResponse.json({
      groupPosts: groupPosts.items,
      projects: projects.items,
      gigs: gigs.items,
      aiMatches: aiMatches.items,
      hasMore,
      meta: {
        page,
        limit,
        total: {
          groupPosts: groupPosts.total,
          projects: projects.total,
          gigs: gigs.total,
          aiMatches: aiMatches.items.length,
        },
        user: userId ? {
          id: userId.toString(),
          role: userRole,
        } : null,
      }
    })
  } catch (error) {
    console.error("❌ Erreur API feed unifié:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// ─── Fonctions de récupération ────────────────────────────────

async function fetchGroupPosts(db: any, userId: ObjectId, page: number, limit: number, category?: string, search?: string) {
  // Récupérer les groupes de l'utilisateur
  const memberships = await db.collection("group_members")
    .find({ userId })
    .toArray()
  const groupIds = memberships.map(m => m.groupId)

  if (groupIds.length === 0) {
    return { items: [], total: 0 }
  }

  // Construire le filtre
  const filter: any = { groupId: { $in: groupIds } }
  
  if (category && category !== "all") {
    filter.category = category
  }
  
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } }
    ]
  }

  const skip = (page - 1) * limit

  // Récupérer les posts avec les infos auteur et groupe
   const posts = await db.collection("group_posts")
    .aggregate([
      { $match: filter },
      { $sort: { createdAt: -1, isPinned: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "author"
        }
      },
      { 
        $unwind: { 
          path: "$author", 
          preserveNullAndEmptyArrays: true // ✅ Important pour garder les posts même sans auteur
        } 
      },
      {
        $lookup: {
          from: "groups",
          localField: "groupId",
          foreignField: "_id",
          as: "group"
        }
      },
      { $unwind: "$group" },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          type: 1,
          images: 1,
          tags: 1,
          createdAt: 1,
          updatedAt: 1,
          isPinned: 1,
          isFeatured: 1,
          // ✅ Toujours inclure author même si null
          author: {
            _id: { $ifNull: ["$author._id", null] },
            name: { $ifNull: ["$author.name", "Ancien membre"] },
            avatar: "$author.avatar",
            title: "$author.title",
          },
          group: {
            _id: "$group._id",
            name: "$group.name",
            slug: "$group.slug",
            avatar: "$group.avatar",
          },
          reactionCounts: 1,
          commentCount: 1,
          shareCount: 1,
          viewCount: 1,
        }
      }
    ])
    .toArray()
  const total = await db.collection("group_posts").countDocuments(filter)

  return { items: posts, total }
}

async function fetchProjects(db: any, page: number, limit: number, category?: string, search?: string) {
  const filter: any = { 
    status: "open",
    visibility: "public"
  }

  if (category && category !== "all") {
    filter.category = category
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { skills: { $in: [new RegExp(search, "i")] } }
    ]
  }

  const skip = (page - 1) * limit

  const projects = await db.collection("projects")
    .aggregate([
      { $match: filter },
      { $sort: { featured: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "clientId",
          foreignField: "_id",
          as: "client"
        }
      },
      { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          category: 1,
          budget: 1,
          skills: 1,
          deadline: 1,
          createdAt: 1,
          updatedAt: 1,
          featured: 1,
          urgency: 1,
          location: 1,
          views: 1,
          applicationCount: 1,
          "client._id": 1,
          "client.name": 1,
          "client.avatar": 1,
          "client.rating": 1,
          "client.company": 1,
        }
      }
    ])
    .toArray()

  const total = await db.collection("projects").countDocuments(filter)

  return { items: projects, total }
}

// Dans la fonction fetchGigs, modifiez le mapping des images
async function fetchGigs(db: any, page: number, limit: number, category?: string, search?: string) {
  const filter: any = { status: "active" }

  if (category && category !== "all") {
    filter.category = category
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } }
    ]
  }

  const skip = (page - 1) * limit

  const gigs = await db.collection("gigs")
    .aggregate([
      { $match: filter },
      { $sort: { featured: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "seller"
        }
      },
      { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          category: 1,
          price: 1,
          deliveryTime: 1,
          revisions: 1,
          tags: 1,
          // ✅ CORRECTION ICI : extraire les URLs des images
          images: {
            $map: {
              input: "$images",
              as: "img",
              in: "$$img.url"
            }
          },
          createdAt: 1,
          updatedAt: 1,
          featured: 1,
          views: 1,
          likes: 1,
          ordersCount: 1,
          rating: 1,
          "seller._id": 1,
          "seller.name": 1,
          "seller.avatar": 1,
          "seller.title": 1,
        }
      }
    ])
    .toArray()

  const total = await db.collection("gigs").countDocuments(filter)

  return { items: gigs, total }
}

async function fetchAIMatches(db: any, userId: ObjectId, limit: number) {
  // Récupérer les compétences du freelance
  const user = await db.collection("users").findOne(
    { _id: userId },
    { projection: { skills: 1, hourlyRate: 1, preferences: 1 } }
  )

  if (!user || !user.skills || user.skills.length === 0) {
    return { items: [] }
  }

  // Trouver des projets correspondant aux compétences
  const matches = await db.collection("projects")
    .aggregate([
      {
        $match: {
          status: "open",
          skills: { $in: user.skills }
        }
      },
      {
        $addFields: {
          matchScore: {
            $multiply: [
              { $size: { $setIntersection: ["$skills", user.skills] } },
              20 // 20 points par compétence matchée (max 100)
            ]
          },
          matchedSkills: { $setIntersection: ["$skills", user.skills] }
        }
      },
      { $match: { matchScore: { $gte: 50 } } }, // Au moins 50% de match
      { $sort: { matchScore: -1, createdAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "clientId",
          foreignField: "_id",
          as: "client"
        }
      },
      { $unwind: "$client" },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          budget: 1,
          skills: 1,
          deadline: 1,
          createdAt: 1,
          matchScore: 1,
          matchedSkills: 1,
          reason: {
            $concat: [
              "Correspond à vos compétences en ",
              { $arrayElemAt: ["$matchedSkills", 0] },
              { $cond: { if: { $gt: [{ $size: "$matchedSkills" }, 1] }, then: ", etc.", else: "" } }
            ]
          },
          "client.name": 1,
          "client.avatar": 1,
          "client.rating": 1,
        }
      }
    ])
    .toArray()

  return { items: matches }
}