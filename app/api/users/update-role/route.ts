// app/api/users/update-role/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Configuration des groupes par défaut
const DEFAULT_GROUP_SLUGS = [
  "nrbtalents",  // Votre groupe existant
  // Ajoutez d'autres slugs ici
]

// Slugs des groupes basés sur le rôle
const ROLE_GROUP_SLUGS = {
  freelance: "freelance-community",
  client: "client-space"
}

// Messages d'erreur multilingues
const errorMessages = {
  fr: {
    unauthorized: "Non autorisé",
    invalidRole: "Rôle invalide",
    userNotFound: "Utilisateur non trouvé",
    serverError: "Erreur interne du serveur",
    success: "Profil mis à jour avec succès",
    groupAddSuccess: "Vous avez été ajouté aux groupes par défaut"
  },
  en: {
    unauthorized: "Unauthorized",
    invalidRole: "Invalid role",
    userNotFound: "User not found",
    serverError: "Internal server error",
    success: "Profile updated successfully",
    groupAddSuccess: "You have been added to default groups"
  },
  mg: {
    unauthorized: "Tsy nahazo alalana",
    invalidRole: "Tsy misy io anjara asa io",
    userNotFound: "Tsy hita ny mpampiasa",
    serverError: "Hadisoana anatiny",
    success: "Vita soa aman-tsara ny fanovana ny momba anao",
    groupAddSuccess: "Nampidirina anatin'ireo vondrona fototra ianao"
  }
}

// Détecter la langue depuis la requête
function getLanguageFromRequest(request: Request): 'fr' | 'en' | 'mg' {
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage?.startsWith('fr')) return 'fr'
  if (acceptLanguage?.startsWith('mg')) return 'mg'
  
  const url = new URL(request.url)
  const langParam = url.searchParams.get('lang')
  if (langParam === 'fr' || langParam === 'en' || langParam === 'mg') return langParam
  
  return 'en'
}

// Fonction pour ajouter l'utilisateur aux groupes par défaut
async function addUserToDefaultGroups(
  db: any,
  userId: ObjectId,
  userRole: string,
  userLang: string
): Promise<string[]> {
  const groupsCollection = db.collection("groups")
  const groupMembersCollection = db.collection("group_members")
  const addedGroups: string[] = []

  try {
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
        
        // Mettre à jour les statistiques du groupe
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
        
        addedGroups.push(group.name)
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
          
          addedGroups.push(roleGroup.name)
          console.log(`✅ Utilisateur ${userId} ajouté au groupe basé sur le rôle: ${roleGroup.name}`)
        }
      } else {
        console.warn(`⚠️ Groupe de rôle avec slug "${roleSlug}" non trouvé`)
      }
    }
    
    // 3. Envoyer une notification de bienvenue
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
  
  return addedGroups
}

export async function POST(request: Request) {
  try {
    const lang = getLanguageFromRequest(request)
    const messages = errorMessages[lang]

    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: messages.unauthorized, code: "UNAUTHORIZED" }, 
        { status: 401 }
      )
    }

    const { role, onboardingRoleCompleted = true } = await request.json()

    if (!role || (role !== "freelance" && role !== "client")) {
      return NextResponse.json(
        { 
          error: messages.invalidRole,
          code: "INVALID_ROLE",
          validRoles: ["freelance", "client"]
        }, 
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Trouver l'utilisateur
    let userId
    try {
      userId = new ObjectId((session.user as any).id)
    } catch {
      const userByEmail = await db.collection("users").findOne({
        email: session.user.email
      })
      if (!userByEmail) {
        return NextResponse.json(
          { error: messages.userNotFound, code: "USER_NOT_FOUND" }, 
          { status: 404 }
        )
      }
      userId = userByEmail._id
    }

    // Mettre à jour le rôle de l'utilisateur
    const result = await db.collection("users").updateOne(
      { _id: userId },
      { 
        $set: { 
          role: role,
          onboardingRoleCompleted: onboardingRoleCompleted,
          updatedAt: new Date()
        } 
      }
    )

    if (result.modifiedCount === 0 && result.matchedCount === 0) {
      return NextResponse.json(
        { error: messages.userNotFound, code: "USER_NOT_FOUND" }, 
        { status: 404 }
      )
    }

    // ============================================
    // 📌 AJOUTER L'UTILISATEUR AUX GROUPES PAR DÉFAUT
    // ============================================
    let addedGroups: string[] = []
    
    try {
      addedGroups = await addUserToDefaultGroups(db, userId, role, lang)
      console.log(`✅ Utilisateur ${userId} ajouté aux groupes: ${addedGroups.join(", ")}`)
    } catch (groupError) {
      console.error("⚠️ Erreur lors de l'ajout aux groupes:", groupError)
    }

    // Retourner la réponse avec les groupes ajoutés
    return NextResponse.json({ 
      success: true,
      message: messages.success,
      role: role,
      onboardingRoleCompleted: onboardingRoleCompleted,
      groupsAdded: addedGroups,
      lang: lang
    })

  } catch (error) {
    console.error("Error updating user:", error)
    
    const lang = getLanguageFromRequest(request)
    const messages = errorMessages[lang]
    
    return NextResponse.json({ 
      error: messages.serverError,
      code: "INTERNAL_SERVER_ERROR",
      details: error instanceof Error ? error.message : undefined
    }, { status: 500 })
  }
}