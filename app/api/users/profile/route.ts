// app/api/users/profile/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { User, Skill, Portfolio, Experience } from "@/lib/models/user"
import { toUserResponseDTO } from "@/lib/models/user"

// Configuration des groupes par défaut
const DEFAULT_GROUP_SLUGS = [
  "nrbtalents",
]

// Slugs des groupes basés sur le rôle
const ROLE_GROUP_SLUGS = {
  freelance: "freelance-community",
  client: "client-space"
}

// Fonction pour ajouter l'utilisateur aux groupes par défaut
async function addUserToDefaultGroups(
  db: any,
  userId: ObjectId,
  userRole: string,
  userLang: string = 'fr'
): Promise<void> {
  const groupsCollection = db.collection("groups")
  const groupMembersCollection = db.collection("group_members")

  try {
    // Vérifier si l'utilisateur est déjà membre d'au moins un groupe
    const existingMembership = await groupMembersCollection.findOne({ userId })
    
    if (existingMembership) {
      console.log(`ℹ️ Utilisateur ${userId} déjà membre d'un groupe, skip`)
      return
    }

    // 1. Ajouter aux groupes par défaut
    for (const slug of DEFAULT_GROUP_SLUGS) {
      const group = await groupsCollection.findOne({ slug })
      
      if (!group) {
        console.warn(`⚠️ Groupe avec slug "${slug}" non trouvé`)
        continue
      }
      
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
          badges: ["new-member"],
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
        
        console.log(`✅ Utilisateur ${userId} ajouté au groupe: ${group.name}`)
      }
    }
    
    // 2. Ajouter au groupe basé sur le rôle
    const roleSlug = ROLE_GROUP_SLUGS[userRole === "freelance" ? "freelance" : "client"]
    if (roleSlug) {
      const roleGroup = await groupsCollection.findOne({ slug: roleSlug })
      
      if (roleGroup) {
        const existingMember = await groupMembersCollection.findOne({
          groupId: roleGroup._id,
          userId: userId
        })
        
        if (!existingMember) {
          await groupMembersCollection.insertOne({
            groupId: roleGroup._id,
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
            badges: ["new-member"],
            createdAt: new Date(),
            updatedAt: new Date()
          })
          
          await groupsCollection.updateOne(
            { _id: roleGroup._id },
            { 
              $inc: { 
                "stats.totalMembers": 1,
                "stats.activeMembers": 1
              },
              $set: { updatedAt: new Date() }
            }
          )
          
          console.log(`✅ Utilisateur ${userId} ajouté au groupe basé sur le rôle: ${roleGroup.name}`)
        }
      } else {
        console.warn(`⚠️ Groupe de rôle avec slug "${roleSlug}" non trouvé`)
      }
    }
    
    // 3. Envoyer une notification de bienvenue
    const addedGroups = []
    for (const slug of DEFAULT_GROUP_SLUGS) {
      const group = await groupsCollection.findOne({ slug })
      if (group) addedGroups.push(group.name)
    }
    if (roleSlug) {
      const roleGroup = await groupsCollection.findOne({ slug: roleSlug })
      if (roleGroup) addedGroups.push(roleGroup.name)
    }
    
    if (addedGroups.length > 0) {
      const notificationMessages = {
        fr: {
          title: "🎉 Bienvenue dans la communauté !",
          message: `Vous avez été ajouté aux groupes suivants : ${addedGroups.join(", ")}. Rejoignez la communauté et commencez à échanger !`
        },
        en: {
          title: "🎉 Welcome to the community!",
          message: `You've been added to the following groups: ${addedGroups.join(", ")}. Join the community and start connecting!`
        },
        mg: {
          title: "🎉 Tonga soa ao amin'ny vondrom-piarahamonina!",
          message: `Nampidirina anatin'ireo vondrona ireo ianao: ${addedGroups.join(", ")}. Midira ary manomboka mifanakalo hevitra!`
        }
      }
      
      const notif = notificationMessages[userLang as keyof typeof notificationMessages] || notificationMessages.fr
      
      await db.collection("notifications").insertOne({
        userId: userId,
        category: "COMMUNITY",
        priority: "MEDIUM",
        title: notif.title,
        message: notif.message,
        actionUrl: `/groups`,
        data: {
          entityType: "system",
          action: "welcome",
          groups: addedGroups
        },
        status: "UNREAD",
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
    
  } catch (error) {
    console.error("⚠️ Erreur lors de l'ajout aux groupes:", error)
  }
}

// Fonction pour récupérer la langue de l'utilisateur
async function getUserLanguage(db: any, userId: ObjectId): Promise<string> {
  try {
    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { language: 1, preferences: 1 } }
    )
    return user?.language || user?.preferences?.language || 'fr'
  } catch {
    return 'fr'
  }
}

// ============================================
// GET - Fetch user profile
// ============================================
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
    
    // ✅ Vérifier que l'utilisateur n'est pas désactivé
    const user = await db.collection<User>("users").findOne(
      { 
        _id: userId,
        $or: [
          { isDeactivated: { $ne: true } },
          { isDeactivated: { $exists: false } }
        ],
        $or: [
          { isActive: { $ne: false } },
          { isActive: { $exists: false } }
        ]
      },
      { projection: { password: 0 } }
    )

    if (!user) {
      return NextResponse.json(
        { error: "User not found or account deactivated" }, 
        { status: 404 }
      )
    }

    return NextResponse.json(toUserResponseDTO(user))
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}

// ============================================
// PATCH - Update user profile
// ============================================
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const { section, data } = await request.json()
    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    if (!section) {
      return NextResponse.json(
        { error: "Section is required" }, 
        { status: 400 }
      )
    }

    // ✅ Vérifier que l'utilisateur n'est pas désactivé avant la mise à jour
    const existingUser = await db.collection<User>("users").findOne({
      _id: userId,
      $or: [
        { isDeactivated: { $ne: true } },
        { isDeactivated: { $exists: false } }
      ],
      $or: [
        { isActive: { $ne: false } },
        { isActive: { $exists: false } }
      ]
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Account deactivated. Cannot update profile." }, 
        { status: 403 }
      )
    }

    // Base update operation with timestamp
    const updateOperation: any = { 
      $set: { 
        updatedAt: new Date() 
      } 
    }
    
    let arrayFilters: any[] = []
    let useArrayFilters = false

    // Helper pour initialiser un champ si nécessaire
    const ensureFieldExists = async (field: string, defaultValue: any[] = []) => {
      const user = await db.collection<User>("users").findOne(
        { _id: userId, [field]: { $exists: false } },
        { projection: { _id: 1 } }
      )
      if (user) {
        await db.collection<User>("users").updateOne(
          { _id: userId },
          { $set: { [field]: defaultValue } }
        )
      }
    }

    switch (section) {
      case 'preferences':
        if (data.language) {
          updateOperation.$set = {
            ...updateOperation.$set,
            preferences: data,
            language: data.language
          }
        } else {
          updateOperation.$set = {
            ...updateOperation.$set,
            preferences: data
          }
        }
        break

      case 'onboardingCompleted':
        updateOperation.$set = {
          ...updateOperation.$set,
          onboardingCompleted: data.onboardingCompleted
        }
        console.log("✅ Onboarding completed status updated")
        break

      case 'experience':
        await ensureFieldExists('experience', [])
        
        if (data._delete) {
          updateOperation.$pull = { 
            experience: { id: data.id } 
          }
        } else if (data.id) {
          updateOperation.$set = {
            ...updateOperation.$set,
            "experience.$[elem]": {
              ...data,
              _id: undefined,
              updatedAt: new Date()
            }
          }
          arrayFilters = [{ "elem.id": data.id }]
          useArrayFilters = true
        } else {
          updateOperation.$push = {
            experience: {
              ...data,
              id: data.id || new ObjectId().toString(),
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        }
        break

      case 'education':
        await ensureFieldExists('education', [])
        
        if (data._delete) {
          updateOperation.$pull = { 
            education: { id: data.id } 
          }
        } else if (data.id) {
          const user = await db.collection<User>("users").findOne(
            { _id: userId, "education.id": data.id },
            { projection: { _id: 1 } }
          )
          
          if (user) {
            updateOperation.$set = {
              ...updateOperation.$set,
              "education.$[elem]": {
                ...data,
                _id: undefined,
                updatedAt: new Date()
              }
            }
            arrayFilters = [{ "elem.id": data.id }]
            useArrayFilters = true
          } else {
            updateOperation.$push = {
              education: {
                ...data,
                id: data.id,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            }
          }
        } else {
          updateOperation.$push = {
            education: {
              ...data,
              id: data.id || new ObjectId().toString(),
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        }
        break

      case 'portfolio':
        await ensureFieldExists('portfolio', [])
        
        if (data._delete) {
          updateOperation.$pull = { 
            portfolio: { id: data.id } 
          }
        } else if (data.id) {
          const existingUserPortfolio = await db.collection<User>("users").findOne(
            { _id: userId, "portfolio.id": data.id }
          )

          if (existingUserPortfolio) {
            updateOperation.$set = {
              ...updateOperation.$set,
              "portfolio.$[elem]": {
                ...data,
                _id: undefined,
                updatedAt: new Date()
              }
            }
            arrayFilters = [{ "elem.id": data.id }]
            useArrayFilters = true
          } else {
            updateOperation.$push = {
              portfolio: {
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
                featured: data.featured || false
              }
            }
          }
        } else {
          updateOperation.$push = {
            portfolio: {
              ...data,
              id: new ObjectId().toString(),
              createdAt: new Date(),
              updatedAt: new Date(),
              featured: data.featured || false
            }
          }
        }
        break

      case 'basic':
        updateOperation.$set = {
          ...updateOperation.$set,
          ...data
        }
        break

      case 'professional':
        updateOperation.$set = {
          ...updateOperation.$set,
          skills: data.skills || [],
          hourlyRate: data.hourlyRate,
          availability: data.availability,
          languages: data.languages || []
        }
        break

      case 'social':
        updateOperation.$set = {
          ...updateOperation.$set,
          socialLinks: data
        }
        break

      case 'skills':
        updateOperation.$set = {
          ...updateOperation.$set,
          skills: data
        }
        break

      case 'role':
        if (data.role && (data.role === "freelance" || data.role === "client")) {
          updateOperation.$set = {
            ...updateOperation.$set,
            role: data.role,
            onboardingRoleCompleted: data.onboardingRoleCompleted !== undefined ? data.onboardingRoleCompleted : true
          }
        } else {
          return NextResponse.json(
            { error: "Invalid role" }, 
            { status: 400 }
          )
        }
        break

      default:
        return NextResponse.json(
          { error: `Invalid section: ${section}` }, 
          { status: 400 }
        )
    }

    // ========================================
    // Execute update operation
    // ========================================
    let result
    if (useArrayFilters) {
      result = await db.collection<User>("users").updateOne(
        { _id: userId },
        updateOperation,
        { arrayFilters }
      )
    } else {
      result = await db.collection<User>("users").updateOne(
        { _id: userId },
        updateOperation
      )
    }

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      )
    }

    // ============================================
    // 📌 AJOUTER L'UTILISATEUR AUX GROUPES (si pas encore membre)
    // ============================================
    try {
      const groupMembersCollection = db.collection("group_members")
      const existingMembership = await groupMembersCollection.findOne({ userId })
      
      if (!existingMembership) {
        const userLang = await getUserLanguage(db, userId)
        const userRole = (await db.collection("users").findOne({ _id: userId }))?.role || "freelance"
        
        await addUserToDefaultGroups(db, userId, userRole, userLang)
      }
    } catch (groupError) {
      console.error("⚠️ Erreur lors de l'ajout aux groupes:", groupError)
    }

    // ========================================
    // Fetch updated user
    // ========================================
    const updatedUser = await db.collection<User>("users").findOne(
      { _id: userId },
      { projection: { password: 0 } }
    )

    console.log('✅ User updated:', {
      section,
      educationCount: updatedUser?.education?.length || 0,
      portfolioCount: updatedUser?.portfolio?.length || 0,
      experienceCount: updatedUser?.experience?.length || 0,
      skillsCount: updatedUser?.skills?.length || 0
    })

    return NextResponse.json({ 
      message: section === 'portfolio' 
        ? "Portfolio updated successfully" 
        : "Profile updated successfully",
      user: updatedUser ? toUserResponseDTO(updatedUser) : null,
      success: true
    })

  } catch (error: any) {
    console.error("❌ Error updating profile:", error)
    
    if (error.code === 2) {
      return NextResponse.json({ 
        error: "Array filter error. The item might not exist.",
        details: error.message 
      }, { status: 400 })
    }
    
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: "Duplicate key error",
        details: error.message 
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 })
  }
}