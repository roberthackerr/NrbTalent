// app/api/support/reports/admin/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const db = await getDatabase()
    
    const reports = await db.collection("problem_reports")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()
    
    return NextResponse.json({ reports })
    
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}