import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()

    const pendingRequests = await db.collection("verification_requests")
      .find({ status: "pending" })
      .sort({ submittedAt: 1 })
      .toArray()

    // Get user details for each request
    const requestsWithUsers = await Promise.all(
      pendingRequests.map(async (request) => {
        const user = await db.collection("users").findOne(
          { _id: request.userId },
          { projection: { name: 1, email: 1, avatar: 1 } }
        )
        return {
          ...request,
          user
        }
      })
    )

    return NextResponse.json({ requests: requestsWithUsers })

  } catch (error) {
    console.error("Error fetching verification requests:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { requestId, status, rejectionReason } = await request.json()
    const adminId = new ObjectId((session.user as any).id)

    if (!requestId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const db = await getDatabase()
    const requestObjId = new ObjectId(requestId)

    // Get the verification request
    const verificationRequest = await db.collection("verification_requests")
      .findOne({ _id: requestObjId })

    if (!verificationRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Update the verification request
    await db.collection("verification_requests").updateOne(
      { _id: requestObjId },
      {
        $set: {
          status,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: status === "rejected" ? rejectionReason : null,
          updatedAt: new Date()
        }
      }
    )

    // Update user profile
    const userUpdate: any = {
      verificationStatus: status,
      updatedAt: new Date()
    }

    if (status === "approved") {
      userUpdate.verifiedAt = new Date()
      userUpdate.verifiedBy = adminId
    }

    await db.collection("users").updateOne(
      { _id: verificationRequest.userId },
      { $set: userUpdate }
    )

    // Send notification to user
    await db.collection("notifications").insertOne({
      userId: verificationRequest.userId,
      type: "verification_update",
      title: status === "approved" ? "Vérification approuvée" : "Vérification rejetée",
      message: status === "approved" 
        ? "Félicitations ! Votre identité a été vérifiée avec succès."
        : `Votre demande de vérification a été rejetée. Raison: ${rejectionReason || "Documents illisibles ou incomplets"}`,
      data: { status, rejectionReason },
      read: false,
      createdAt: new Date()
    })

    return NextResponse.json({ 
      success: true,
      message: `Verification request ${status}`
    })

  } catch (error) {
    console.error("Error updating verification request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}