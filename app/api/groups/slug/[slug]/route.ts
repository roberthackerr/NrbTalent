// /app/api/groups/slug/[slug]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { GroupService } from "@/lib/services/group-service"

// Interface pour les params
interface RouteParams {
  params: Promise<{
    slug: string
  }>
}

export async function GET(
  request: Request, 
  { params }: RouteParams
) {
  try {
    // Désérialiser les params avec await
    const { slug } = await params
    
    const session = await getServerSession(authOptions)
    
    // Pas besoin d'être authentifié pour voir les groupes publics
    // Mais on vérifie pour les groupes privés

    const groupService = GroupService.getInstance()
    const group = await groupService.getGroupBySlug(slug) // Utiliser slug au lieu de params.slug

    if (!group) {
      return NextResponse.json(
        { error: "Groupe non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier si l'utilisateur peut voir le groupe
    const isMember = session ? await groupService.isGroupMember(
      group._id!,
      (session.user as any).id
    ) : false

    // Pour les groupes cachés, seuls les membres peuvent voir
    if (group.visibility === 'hidden' && !isMember) {
      return NextResponse.json(
        { error: "Groupe non trouvé" },
        { status: 404 }
      )
    }

    // Pour les groupes privés, on cache certaines infos si pas membre
    let groupData: any = {
      ...group,
      _id: group._id?.toString(),
      ownerId: group.ownerId?.toString(),
      isMember
    }

    if (group.visibility === 'private' && !isMember) {
      // Masquer certaines infos pour les non-membres
      groupData = {
        ...groupData,
        stats: {
          totalMembers: group.stats.totalMembers,
          totalPosts: group.stats.totalPosts,
          // Masquer les stats détaillées
          activeMembers: 0,
          totalEvents: 0,
          totalJobs: 0
        },
        // Masquer les membres spéciaux
        featuredMembers: []
      }
    }

    return NextResponse.json(groupData)
  } catch (error: any) {
    console.error("Error fetching group by slug:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}