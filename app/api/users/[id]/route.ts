// app/api/users/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/user"

export async function GET(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const isOwnProfile = session?.user && (session.user as any).id === id
    
    // Vérifier que l'ID est valide
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const db = await getDatabase()
    
    // ✅ FILTRER LES COMPTES DÉSACTIVÉS
    // Pour les autres utilisateurs, ne pas montrer les comptes désactivés
    // Pour son propre profil, on peut le voir même désactivé (pour lui permettre de réactiver)
    let filter: any = { _id: new ObjectId(id) }
    
    if (!isOwnProfile) {
      // Ne pas afficher les comptes désactivés aux autres utilisateurs
      filter = {
        ...filter,
        $and: [
          {
            $or: [
              { isDeactivated: { $ne: true } },
              { isDeactivated: { $exists: false } }
            ]
          },
          {
            $or: [
              { isActive: { $ne: false } },
              { isActive: { $exists: false } }
            ]
          }
        ]
      }
    }
    
    const projection = isOwnProfile 
      ? { password: 0 }
      : { 
          password: 0,
          email: 0,
          phone: 0,
          preferences: 0,
          statistics: 0,
          enrolledCourses: 0,
          savedProjects: 0
        }

    const user = await db.collection<User>("users").findOne(filter, { projection })

    if (!user) {
      // Message différent si le compte est désactivé pour son propre profil
      if (isOwnProfile) {
        const deactivatedUser = await db.collection<User>("users").findOne(
          { _id: new ObjectId(id) },
          { projection: { isDeactivated: 1, isActive: 1, name: 1, email: 1 } }
        )
        
        if (deactivatedUser?.isDeactivated === true || deactivatedUser?.isActive === false) {
          return NextResponse.json({ 
            error: "Account deactivated",
            isDeactivated: true,
            message: "Votre compte est désactivé. Veuillez le réactiver pour accéder à vos informations."
          }, { status: 403 })
        }
      }
      
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Ajouter des informations sur le statut du compte pour le propriétaire
    const responseUser = {
      ...user,
      isDeactivated: user.isDeactivated === true,
      isActive: user.isActive !== false,
      canReactivate: isOwnProfile && (user.isDeactivated === true || user.isActive === false)
    }

    return NextResponse.json(responseUser)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    // Vérifier que l'ID est valide
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }
    
    if (!session?.user || (session.user as any).id !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await request.json()
    const db = await getDatabase()

    // ✅ Vérifier que le compte n'est pas désactivé avant la mise à jour
    const existingUser = await db.collection<User>("users").findOne({
      _id: new ObjectId(id),
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
      const deactivatedUser = await db.collection<User>("users").findOne(
        { _id: new ObjectId(id) },
        { projection: { isDeactivated: 1, isActive: 1 } }
      )
      
      if (deactivatedUser?.isDeactivated === true || deactivatedUser?.isActive === false) {
        return NextResponse.json({ 
          error: "Account deactivated. Please reactivate your account before updating.",
          isDeactivated: true
        }, { status: 403 })
      }
      
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const restrictedFields = ['password', 'email', '_id', 'role', 'verified', 'createdAt', 'isDeactivated', 'deactivatedAt']
    restrictedFields.forEach(field => delete updates[field])

    // Ne pas permettre de réactiver via cette API (utiliser l'API dédiée)
    if (updates.isActive === true && existingUser.isDeactivated === true) {
      return NextResponse.json({ 
        error: "Cannot reactivate account via this endpoint. Use /api/auth/reactivate instead."
      }, { status: 400 })
    }

    const result = await db.collection<User>("users").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await db.collection<User>("users").findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    )

    return NextResponse.json({ 
      message: "User updated successfully",
      user: updatedUser
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}