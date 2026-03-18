// app/api/users/verification/identity/[requestId]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import cloudinary from "@/lib/cloudinary/config"

export async function DELETE(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { requestId } = params
    const userId = new ObjectId((session.user as any).id)
    const db = await getDatabase()

    // Trouver la demande
    const verificationRequest = await db.collection("verification_requests").findOne({
      requestId,
      userId
    })

    if (!verificationRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Supprimer les documents de Cloudinary
    for (const doc of verificationRequest.documents) {
      if (doc.publicId) {
        try {
          const resourceType = doc.type === 'application/pdf' ? 'raw' : 'image'
          await cloudinary.uploader.destroy(doc.publicId, { resource_type: resourceType })
          console.log(`✅ Deleted from Cloudinary: ${doc.publicId}`)
        } catch (error) {
          console.error(`❌ Failed to delete from Cloudinary: ${doc.publicId}`, error)
        }
      }
    }

    // Supprimer la demande
    await db.collection("verification_requests").deleteOne({ requestId })

    // Mettre à jour l'utilisateur
    await db.collection("users").updateOne(
      { _id: userId },
      { 
        $unset: { 
          verificationStatus: "",
          verificationSubmittedAt: "",
          verificationRequestId: ""
        },
        $set: { updatedAt: new Date() }
      }
    )

    return NextResponse.json({ 
      success: true,
      message: "Documents deleted successfully" 
    })

  } catch (error) {
    console.error("Error deleting verification request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}