import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { User, PortfolioItem } from "@/lib/models/user"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    
    const user = await db.collection<User>("users").findOne(
      { _id: new ObjectId(params.id) },
      { projection: { portfolio: 1, name: 1 } }
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ portfolio: user.portfolio || [] })
  } catch (error) {
    console.error("Error fetching portfolio:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).id !== params.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const portfolioItem: PortfolioItem = await request.json()
    const db = await getDatabase()

    const result = await db.collection<User>("users").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $push: {
          portfolio: {
            ...portfolioItem,
            id: new ObjectId().toString(),
            createdAt: new Date()
          }
        },
        $set: { updatedAt: new Date() }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Portfolio item added successfully" })
  } catch (error) {
    console.error("Error adding portfolio item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}