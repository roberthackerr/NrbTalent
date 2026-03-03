import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { VerificationRequest, UserVerificationStatus } from "@/lib/models/verification"
import { uploadToCloudStorage } from "@/lib/storage" // You'll need to implement this
import { sendVerificationEmail } from "@/lib/email" // You'll need to implement this

// GET: Get user's verification status
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Users can only view their own verification status
    if ((session.user as any).id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const db = await getDatabase()
    const userId = params.id

    // Get all verification requests for this user
    const verifications = await db.collection<VerificationRequest>("verification_requests")
      .find({ userId })
      .sort({ submittedAt: -1 })
      .toArray()

    // Get current verification status
    const status = await db.collection<UserVerificationStatus>("verification_status")
      .findOne({ userId })

    // Calculate overall status if not exists
    if (!status) {
      const user = await db.collection("users").findOne(
        { _id: new ObjectId(userId) },
        { projection: { email: 1, phone: 1, verified: 1 } }
      )

      const defaultStatus: UserVerificationStatus = {
        userId,
        email: user?.email ? true : false, // Assuming email is verified on registration
        phone: false,
        identity: false,
        payment: false,
        overallStatus: 'unverified',
        lastUpdated: new Date(),
        level: 0
      }

      return NextResponse.json({
        status: defaultStatus,
        verifications,
        required: ['email', 'identity'] // Required verifications for your platform
      })
    }

    return NextResponse.json({
      status,
      verifications,
      required: ['email', 'identity']
    })
  } catch (error) {
    console.error("Error fetching verification status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Submit a new verification request
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Users can only submit verification for themselves
    if ((session.user as any).id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const type = formData.get("type") as string
    const userId = params.id
    const db = await getDatabase()

    // Check if there's already a pending request
    const existingPending = await db.collection<VerificationRequest>("verification_requests")
      .findOne({
        userId,
        type,
        status: "pending"
      })

    if (existingPending) {
      return NextResponse.json(
        { error: "You already have a pending verification request for this type" },
        { status: 400 }
      )
    }

    // Handle different verification types
    switch (type) {
      case "identity":
        return await handleIdentityVerification(formData, userId, db)
      case "phone":
        return await handlePhoneVerification(formData, userId, db)
      case "payment":
        return await handlePaymentVerification(formData, userId, db)
      default:
        return NextResponse.json({ error: "Invalid verification type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error submitting verification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}