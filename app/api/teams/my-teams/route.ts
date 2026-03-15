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

    // Find all teams where the user is a member
    const teams = await db.collection("teams").find({
      "members.userId": userId,
      isActive: { $ne: false }
    }).toArray()

    // Format the response
    const formattedTeams = teams.map(team => {
      const isLead = team.members.some(
        (member: any) => 
          member.userId.toString() === userId.toString() && 
          member.isLead === true
      )
      
      return {
        id: team._id.toString(),
        name: team.name,
        description: team.description || '',
        memberCount: team.members?.length || 0,
        skills: team.skills || [],
        isLead,
        availability: team.availability || 'available',
        isPublic: team.isPublic !== false
      }
    })

    return NextResponse.json({
      success: true,
      teams: formattedTeams,
      count: formattedTeams.length
    })

  } catch (error) {
    console.error("Error fetching user teams:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}