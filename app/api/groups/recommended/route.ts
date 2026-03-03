// /app/api/groups/recommended/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    
    // Récupérer les intérêts de l'utilisateur
    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { skills: 1, location: 1, interests: 1 } }
    )
    
    // Groupes déjà joints
    const userGroups = await db.collection("group_members")
      .distinct("groupId", { userId })
    
    const recommendations = []
    
    // 1. Par compétences
    if (user?.skills && user.skills.length > 0) {
      const skillGroups = await db.collection("groups").find({
        type: 'skill',
        skills: { $in: user.skills.map(s => new RegExp(s, 'i')) },
        _id: { $nin: userGroups },
        $or: [
          { status: { $ne: 'archived' } },
          { status: { $exists: false } }
        ]
      })
      .sort({ "stats.totalMembers": -1 })
      .limit(5)
      .toArray()
      
      recommendations.push(...skillGroups.map(g => ({
        ...g,
        reason: `Correspond à vos compétences: ${user.skills.find(s => 
          g.skills?.some((gs:any) => gs.toLowerCase().includes(s.toLowerCase()))
        )}`
      })))
    }
    
    // 2. Par localisation
    if (user?.location) {
      const locationGroups = await db.collection("groups").find({
        type: 'location',
        location: { $regex: user.location, $options: 'i' },
        _id: { $nin: userGroups },
        $or: [
          { status: { $ne: 'archived' } },
          { status: { $exists: false } }
        ]
      })
      .sort({ "stats.totalMembers": -1 })
      .limit(3)
      .toArray()
      
      recommendations.push(...locationGroups.map(g => ({
        ...g,
        reason: `Basé à ${user.location}`
      })))
    }
    
    // 3. Groupes populaires que vous pourriez aimer
    const popularGroups = await db.collection("groups").find({
      _id: { $nin: userGroups },
      isFeatured: true,
      $or: [
        { status: { $ne: 'archived' } },
        { status: { $exists: false } }
      ]
    })
    .sort({ "stats.totalMembers": -1 })
    .limit(5)
    .toArray()
    
    recommendations.push(...popularGroups.map(g => ({
      ...g,
      reason: 'Groupe populaire'
    })))
    
    // 4. Groupes similaires à ceux que vous suivez
    if (userGroups.length > 0) {
      const similarGroups = await db.collection("groups").aggregate([
        {
          $match: {
            _id: { $nin: userGroups },
            $or: [
              { status: { $ne: 'archived' } },
              { status: { $exists: false } }
            ]
          }
        },
        {
          $lookup: {
            from: "groups",
            localField: "skills",
            foreignField: "skills",
            as: "similarGroups"
          }
        },
        {
          $addFields: {
            similarityScore: {
              $size: {
                $setIntersection: [
                  "$skills",
                  { $arrayElemAt: ["$similarGroups.skills", 0] }
                ]
              }
            }
          }
        },
        { $sort: { similarityScore: -1 } },
        { $limit: 5 }
      ]).toArray()
      
      recommendations.push(...similarGroups.map(g => ({
        ...g,
        reason: 'Similaire à vos groupes'
      })))
    }
    
    // Éliminer les doublons et mélanger
    const uniqueRecommendations = Array.from(
      new Map(recommendations.map(g => [g._id.toString(), g])).values()
    )
    
    // Mélanger et limiter
    const shuffled = uniqueRecommendations
      .sort(() => Math.random() - 0.5)
      .slice(0, 10)
    
    return NextResponse.json({ recommendations: shuffled })
  } catch (error) {
    console.error("Error fetching recommendations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}