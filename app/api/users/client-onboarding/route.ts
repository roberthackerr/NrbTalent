// app/api/users/client-onboarding/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    const { clientProfile } = body

    if (!clientProfile) {
      return NextResponse.json(
        { error: "Client profile data is required" }, 
        { status: 400 }
      )
    }

    // Validate required fields
    const requiredFields = ['company', 'location', 'contact']
    for (const field of requiredFields) {
      if (!clientProfile[field]) {
        return NextResponse.json(
          { error: `Missing required section: ${field}` }, 
          { status: 400 }
        )
      }
    }

    // Validate company required fields
    const companyRequired = ['name', 'size', 'industry']
    for (const field of companyRequired) {
      if (!clientProfile.company[field]) {
        return NextResponse.json(
          { error: `Missing company field: ${field}` }, 
          { status: 400 }
        )
      }
    }

    // Validate location required fields
    if (!clientProfile.location.country || !clientProfile.location.city) {
      return NextResponse.json(
        { error: "Country and city are required" }, 
        { status: 400 }
      )
    }

    // Validate contact required fields
    if (!clientProfile.contact.name || !clientProfile.contact.email || !clientProfile.contact.phone) {
      return NextResponse.json(
        { error: "Contact name, email, and phone are required" }, 
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    // Check if user exists and is not deactivated
    const existingUser = await db.collection("users").findOne({
      _id: userId,
      $or: [
        { isDeactivated: { $ne: true } },
        { isDeactivated: { $exists: false } }
      ]
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found or account deactivated" }, 
        { status: 404 }
      )
    }

    // Update user with client profile
    const updateResult = await db.collection("users").updateOne(
      { _id: userId },
      {
        $set: {
          role: 'client',
          onboardingCompleted: true,
          onboardingRoleCompleted: true,
          clientProfile: {
            company: {
              name: clientProfile.company.name,
              website: clientProfile.company.website || null,
              size: clientProfile.company.size,
              industry: clientProfile.company.industry,
              description: clientProfile.company.description || null,
              yearFounded: clientProfile.company.yearFounded || null,
              logo: clientProfile.company.logo  || null
            },
            location: {
              country: clientProfile.location.country,
              city: clientProfile.location.city,
              address: clientProfile.location.address || null
            },
            contact: {
              name: clientProfile.contact.name,
              position: clientProfile.contact.position || null,
              phone: clientProfile.contact.phone,
              email: clientProfile.contact.email
            },
            preferences: {
              language: clientProfile.preferences?.language || 'en',
              newsletter: clientProfile.preferences?.newsletter || false
            },
            createdAt: new Date(),
            updatedAt: new Date()
          },
          updatedAt: new Date()
        }
      }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update user profile" }, 
        { status: 500 }
      )
    }

    // Create a welcome notification
    const notificationMessages = {
      fr: {
        title: "🎉 Bienvenue sur la plateforme !",
        message: `Votre profil client a été créé avec succès. Vous pouvez maintenant publier des projets et trouver des freelances.`
      },
      en: {
        title: "🎉 Welcome to the platform!",
        message: `Your client profile has been successfully created. You can now post projects and find freelancers.`
      },
      mg: {
        title: "🎉 Tonga soa amin'ny sehatra!",
        message: `Nahomby ny famoronana ny mombamomba anao maha-mpanjifa. Afaka mametraka tetikasa sy mitady freelancers ianao izao.`
      }
    }

    const userLang = existingUser?.language || clientProfile.preferences?.language || 'en'
    const notif = notificationMessages[userLang as keyof typeof notificationMessages] || notificationMessages.en

    await db.collection("notifications").insertOne({
      userId: userId,
      category: "SYSTEM",
      priority: "HIGH",
      title: notif.title,
      message: notif.message,
      actionUrl: `/dashboard`,
      data: {
        entityType: "onboarding",
        action: "client_onboarding_completed",
        companyName: clientProfile.company.name
      },
      status: "UNREAD",
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Add user to client groups
    try {
      await addUserToClientGroups(db, userId, userLang)
    } catch (groupError) {
      console.error("Error adding user to client groups:", groupError)
      // Don't fail the onboarding if group joining fails
    }

    // Fetch updated user
    const updatedUser = await db.collection("users").findOne(
      { _id: userId },
      { projection: { password: 0 } }
    )

    return NextResponse.json({
      success: true,
      message: "Client profile setup complete!",
      user: updatedUser
    })

  } catch (error) {
    console.error("Error in client onboarding:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}

// Helper function to add client to relevant groups
async function addUserToClientGroups(db: any, userId: ObjectId, userLang: string = 'en') {
  const groupsCollection = db.collection("groups")
  const groupMembersCollection = db.collection("group_members")

  // Client-specific groups
  const clientGroups = [
    "client-space",
    "business-owners",
    "hiring-tips"
  ]

  for (const slug of clientGroups) {
    const group = await groupsCollection.findOne({ slug })
    
    if (group) {
      const existingMember = await groupMembersCollection.findOne({
        groupId: group._id,
        userId: userId
      })
      
      if (!existingMember) {
        await groupMembersCollection.insertOne({
          groupId: group._id,
          userId: userId,
          role: "member",
          status: "active",
          joinedAt: new Date(),
          activity: {
            postCount: 0,
            commentCount: 0,
            eventAttendance: 0,
            lastActivity: new Date()
          },
          badges: ["new-client"],
          createdAt: new Date(),
          updatedAt: new Date()
        })
        
        await groupsCollection.updateOne(
          { _id: group._id },
          { 
            $inc: { 
              "stats.totalMembers": 1,
              "stats.activeMembers": 1
            },
            $set: {
              "stats.lastActivityAt": new Date(),
              updatedAt: new Date()
            }
          }
        )
        
        console.log(`✅ Client ${userId} added to group: ${group.name}`)
      }
    }
  }
}

// Optional: GET endpoint to retrieve client profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { clientProfile: 1, role: 1, onboardingCompleted: 1 } }
    )

    if (!user) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      clientProfile: user.clientProfile || null,
      role: user.role,
      onboardingCompleted: user.onboardingCompleted || false
    })

  } catch (error) {
    console.error("Error fetching client profile:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}