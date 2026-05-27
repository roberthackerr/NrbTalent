// app/api/support/faq/feedback/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    const body = await request.json()
    const { faqId, helpful } = body
    
    if (!faqId) {
      return NextResponse.json(
        { error: "FAQ ID is required" },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    
    // Mettre à jour les statistiques de la FAQ
    const updateField = helpful ? 'helpful' : 'notHelpful'
    
    await db.collection("faqs").updateOne(
      { _id: new ObjectId(faqId) },
      { $inc: { [updateField]: 1 } }
    )
    
    // Enregistrer le feedback utilisateur (si connecté)
    if (session?.user) {
      const userId = new ObjectId((session.user as any).id)
      
      await db.collection("faq_feedback").insertOne({
        faqId: new ObjectId(faqId),
        userId,
        helpful,
        createdAt: new Date()
      })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    )
  }
}