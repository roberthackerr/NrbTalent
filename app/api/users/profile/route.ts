import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/user"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne(
      { _id: new ObjectId((session.user as any).id) },
      { projection: { password: 0 } }
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { section, data } = await request.json()
    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    let updateData: any = {}
    let updateOperation: any = { $set: { updatedAt: new Date() } }

    switch (section) {
      case 'experience':
        // Si c'est une suppression
        if (data._delete) {
          updateOperation = {
            ...updateOperation,
            $pull: { experience: { id: data.id } }
          }
        } 
        // Si c'est une mise à jour d'une expérience existante
        else if (data.id) {
          updateOperation = {
            ...updateOperation,
            $set: { 
              "experience.$[elem]": data,
              updatedAt: new Date()
            }
          }
          // Filtrer pour mettre à jour seulement l'expérience avec le bon ID
          const arrayFilters = [{ "elem.id": data.id }]
          await db.collection<User>("users").updateOne(
            { _id: userId },
            updateOperation,
            { arrayFilters }
          )
          return NextResponse.json({ message: "Experience updated successfully" })
        }
        // Si c'est une nouvelle expérience
        else {
          updateOperation = {
            ...updateOperation,
            $push: { 
              experience: {
                ...data,
                id: data.id || new ObjectId().toString(),
                createdAt: new Date()
              }
            }
          }
        }
        break

      case 'basic':
        updateOperation.$set = { ...updateOperation.$set, ...data }
        break

      case 'professional':
        updateOperation.$set = {
          ...updateOperation.$set,
          skills: data.skills,
          hourlyRate: data.hourlyRate,
          availability: data.availability,
          languages: data.languages
        }
        break

      case 'social':
        updateOperation.$set = { ...updateOperation.$set, socialLinks: data }
        break

      case 'preferences':
        updateOperation.$set = { ...updateOperation.$set, preferences: data }
        break

      default:
        return NextResponse.json({ error: "Invalid section" }, { status: 400 })
    }

    // Exécuter l'opération de mise à jour
    const result = await db.collection<User>("users").updateOne(
      { _id: userId },
      updateOperation
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}





