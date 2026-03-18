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

    const userId = new ObjectId((session.user as any).id)
    const db = await getDatabase()

    // Find the most recent verification request
    const verificationRequest = await db.collection("verification_requests")
      .findOne(
        { userId },
        { sort: { submittedAt: -1 } }
      )

    if (!verificationRequest) {
      return NextResponse.json({ status: "none" })
    }

    return NextResponse.json({ 
      status: verificationRequest.status,
      submittedAt: verificationRequest.submittedAt,
      reviewedAt: verificationRequest.reviewedAt,
      rejectionReason: verificationRequest.rejectionReason
    })

  } catch (error) {
    console.error("Error fetching verification status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}