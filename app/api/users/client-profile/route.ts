// app/api/users/client-profile/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

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
      { 
        projection: { 
          clientProfile: 1, 
          onboardingCompleted: 1,
          role: 1,
          email: 1,
          name: 1
        } 
      }
    )

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if onboarding is already completed
    if (user.onboardingCompleted === true) {
      return NextResponse.json({
        success: true,
        onboardingCompleted: true,
        clientProfile: user.clientProfile || null
      })
    }

    return NextResponse.json({
      success: true,
      onboardingCompleted: false,
      clientProfile: user.clientProfile || null
    })

  } catch (error) {
    console.error("Error fetching client profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}