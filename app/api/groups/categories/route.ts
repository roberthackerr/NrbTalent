// /app/api/groups/categories/route.ts
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDatabase()
    
    const categories = await db.collection("groups").aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalMembers: { $sum: "$stats.totalMembers" },
          avgMembers: { $avg: "$stats.totalMembers" },
          avgActivity: { $avg: "$stats.activeMembers" }
        }
      },
      {
        $project: {
          type: "$_id",
          count: 1,
          totalMembers: 1,
          avgMembers: { $round: ["$avgMembers", 0] },
          avgActivity: { $round: ["$avgActivity", 0] },
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]).toArray()
    
    // Récupérer les groupes les plus populaires par catégorie
    const popularByCategory = await Promise.all(
      categories.map(async (category) => {
        const popularGroups = await db.collection("groups")
          .find({ type: category.type })
          .sort({ "stats.totalMembers": -1 })
          .limit(3)
          .toArray()
        
        return {
          ...category,
          popularGroups: popularGroups.map(g => ({
            id: g._id,
            name: g.name,
            members: g.stats.totalMembers,
            description: g.description
          }))
        }
      })
    )
    
    return NextResponse.json({ categories: popularByCategory })
  } catch (error) {
    console.error("Error fetching group categories:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}