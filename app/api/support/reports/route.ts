// app/api/support/reports/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// POST - Créer un signalement de problème
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const {
      type,
      title,
      description,
      severity,
      steps,
      expectedBehavior,
      actualBehavior,
      browser,
      os,
      screenshots
    } = body
    
    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    
    // Récupérer les infos utilisateur
    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { name: 1, email: 1, role: 1 } }
    )
    
    const report = {
      userId,
      user: {
        name: user?.name,
        email: user?.email,
        role: user?.role
      },
      type,
      title,
      description,
      severity: severity || 'medium',
      steps,
      expectedBehavior,
      actualBehavior,
      browser,
      os,
      screenshots: screenshots || [],
      status: 'pending',
      assignedTo: null,
      resolvedAt: null,
      resolution: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection("problem_reports").insertOne(report)
    
    // Envoyer une notification aux admins
    await db.collection("notifications").insertOne({
      userId: null, // Notification système pour les admins
      category: "SUPPORT",
      priority: severity === 'critical' ? "HIGH" : "MEDIUM",
      title: `Nouveau signalement: ${title}`,
      message: `${user?.name} a signalé un problème de type ${type} (${severity})`,
      actionUrl: `/admin/support/reports/${result.insertedId}`,
      data: {
        entityType: "problem_report",
        action: "new_report",
        reportId: result.insertedId,
        severity,
        type
      },
      status: "UNREAD",
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    return NextResponse.json({
      success: true,
      reportId: result.insertedId,
      message: "Report submitted successfully"
    })
    
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    )
  }
}

// GET - Récupérer les signalements de l'utilisateur
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    
    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    
    let query: any = { userId }
    if (status) query.status = status
    
    const skip = (page - 1) * limit
    
    const [reports, total] = await Promise.all([
      db.collection("problem_reports")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("problem_reports").countDocuments(query)
    ])
    
    return NextResponse.json({
      reports,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    )
  }
}