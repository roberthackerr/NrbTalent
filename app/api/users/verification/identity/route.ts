import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = new ObjectId((session.user as any).id)
    const formData = await request.formData()
    
    const files: File[] = []
    for (let i = 0; i < formData.keys.length; i++) {
      const file = formData.get(`document_${i}`) as File
      if (file) files.push(file)
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 })
    }

    // Validate files
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ 
          error: `Invalid file type: ${file.type}. Allowed: JPG, PNG, PDF` 
        }, { status: 400 })
      }
      
      if (file.size > maxSize) {
        return NextResponse.json({ 
          error: `File too large: ${file.name}. Max size: 5MB` 
        }, { status: 400 })
      }
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'verification', userId.toString())
    await mkdir(uploadDir, { recursive: true })

    // Save files and collect paths
    const filePaths: string[] = []
    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const extension = file.type.split('/')[1]
      const filename = `${uuidv4()}.${extension}`
      const filepath = path.join(uploadDir, filename)
      
      await writeFile(filepath, buffer)
      filePaths.push(`/uploads/verification/${userId.toString()}/${filename}`)
    }

    const db = await getDatabase()

    // Create verification request
    const verificationRequest = {
      userId,
      documents: filePaths,
      status: "pending",
      submittedAt: new Date(),
      updatedAt: new Date(),
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null
    }

    await db.collection("verification_requests").insertOne(verificationRequest)

    // Update user profile with verification status
    await db.collection("users").updateOne(
      { _id: userId },
      { 
        $set: { 
          verificationStatus: "pending",
          verificationSubmittedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    )

    // Send notification to admins
    const admins = await db.collection("users").find({ role: "admin" }).toArray()
    const notifications = admins.map(admin => ({
      userId: admin._id,
      type: "verification_request",
      title: "Nouvelle demande de vérification",
      message: `Un utilisateur a soumis des documents pour vérification.`,
      data: { userId: userId.toString() },
      read: false,
      createdAt: new Date()
    }))

    if (notifications.length > 0) {
      await db.collection("notifications").insertMany(notifications)
    }

    return NextResponse.json({ 
      success: true,
      message: "Documents submitted successfully",
      fileCount: files.length
    })

  } catch (error) {
    console.error("Error in verification upload:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}