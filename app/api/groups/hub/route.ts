// /app/api/groups/hub/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Récupérer toutes les statistiques
    const [
      totalGroups,
      userGroups,
      activeGroups,
      upcomingEvents,
      availableJobs,
      userStats
    ] = await Promise.all([
      db.collection("groups").countDocuments({
        $or: [{ status: { $ne: 'archived' } }, { status: { $exists: false } }]
      }),
      db.collection("group_members").countDocuments({ userId }),
      db.collection("groups").countDocuments({
        "lastActivityAt": { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      db.collection("group_events").countDocuments({
        "startDate": { $gte: new Date() },
        "status": "scheduled"
      }),
      db.collection("group_posts").countDocuments({
        "type": "job",
        "status": "published"
      }),
      db.collection("users").findOne(
        { _id: userId },
        { projection: { "statistics.groupEngagement": 1 } }
      )
    ])

    // Groupes recommandés
    const recommendedGroups = await db.collection("groups").find({
      isFeatured: true,
      $or: [{ status: { $ne: 'archived' } }, { status: { $exists: false } }]
    })
    .sort({ "stats.totalMembers": -1 })
    .limit(6)
    .toArray()

    // Groupes récemment actifs
    const recentlyActive = await db.collection("groups").find({
      "lastActivityAt": { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
    .sort({ "lastActivityAt": -1 })
    .limit(5)
    .toArray()

    return NextResponse.json({
      hub: {
        stats: {
          totalGroups,
          userGroups,
          activeGroups,
          upcomingEvents,
          availableJobs,
          userEngagement: userStats?.statistics?.groupEngagement || 0
        },
        featured: recommendedGroups.map(g => ({
          id: g._id,
          name: g.name,
          slug: g.slug,
          description: g.description,
          members: g.stats.totalMembers,
          type: g.type
        })),
        recentlyActive: recentlyActive.map(g => ({
          id: g._id,
          name: g.name,
          slug: g.slug,
          lastActivity: g.lastActivityAt,
          newPosts: g.stats.totalPosts
        })),
        quickLinks: [
          { label: "Créer un groupe", href: "/groups/create", icon: "plus" },
          { label: "Mes groupes", href: "/groups/my-groups", icon: "users" },
          { label: "Événements", href: "/groups/events", icon: "calendar" },
          { label: "Offres d'emploi", href: "/groups/jobs", icon: "briefcase" },
          { label: "Paramètres", href: "/groups/settings", icon: "settings" },
          { label: "Analytiques", href: "/groups/analytics", icon: "bar-chart" }
        ]
      }
    })

  } catch (error) {
    console.error("Error fetching hub data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}