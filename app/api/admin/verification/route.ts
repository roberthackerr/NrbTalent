// app/api/admin/verification/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    
    const skip = (page - 1) * limit

    const db = await getDatabase()

    // Construire le filtre
    const filter: any = {}
    if (status && status !== 'all') {
      filter.status = status
    }

    // Recherche par nom ou email
    if (search) {
      const users = await db.collection("users").find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).project({ _id: 1 }).toArray()
      
      const userIds = users.map(u => u._id)
      filter.userId = { $in: userIds }
    }

    // Compter le total pour la pagination
    const total = await db.collection("verification_requests").countDocuments(filter)
    
    // Récupérer les demandes avec pagination
    const requests = await db.collection("verification_requests")
      .find(filter)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Récupérer les informations des utilisateurs
    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const user = await db.collection("users").findOne(
          { _id: request.userId },
          { 
            projection: { 
              name: 1, 
              email: 1, 
              avatar: 1, 
              title: 1,
              verificationStatus: 1,
              createdAt: 1 
            } 
          }
        )
        
        // IMPORTANT: Convertir les ObjectId en strings
        return {
          _id: request._id.toString(),
          userId: request.userId.toString(),
          documents: request.documents || [],
          status: request.status,
          submittedAt: request.submittedAt.toISOString(),
          updatedAt: request.updatedAt?.toISOString(),
          reviewedBy: request.reviewedBy?.toString(),
          reviewedAt: request.reviewedAt?.toISOString(),
          rejectionReason: request.rejectionReason,
          user: user ? {
            _id: user._id.toString(),
            name: user.name || '',
            email: user.email || '',
            avatar: user.avatar,
            title: user.title,
            verificationStatus: user.verificationStatus,
            createdAt: user.createdAt?.toISOString()
          } : null
        }
      })
    )

    // Statistiques
    const stats = {
      pending: await db.collection("verification_requests").countDocuments({ status: 'pending' }),
      approved: await db.collection("verification_requests").countDocuments({ status: 'approved' }),
      rejected: await db.collection("verification_requests").countDocuments({ status: 'rejected' }),
      total: await db.collection("verification_requests").countDocuments()
    }

    return NextResponse.json({ 
      requests: requestsWithUsers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      stats
    })

  } catch (error) {
    console.error("Error fetching verification requests:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      requests: [],
      totalPages: 1,
      currentPage: 1,
      stats: { pending: 0, approved: 0, rejected: 0, total: 0 }
    }, { status: 500 })
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

    // Récupérer la demande
    const verificationRequest = await db.collection("verification_requests")
      .findOne({ _id: requestObjId })

    if (!verificationRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Mettre à jour la demande
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

    // Mettre à jour l'utilisateur
    await db.collection("users").updateOne(
      { _id: verificationRequest.userId },
      { 
        $set: { 
          verificationStatus: status,
          updatedAt: new Date(),
          ...(status === "approved" ? { verifiedAt: new Date() } : {})
        } 
      }
    )

    // Notification à l'utilisateur
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