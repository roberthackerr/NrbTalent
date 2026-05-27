// app/api/support/faq/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// GET - Récupérer toutes les FAQs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    
    const db = await getDatabase()
    let query: any = { active: true }
    
    if (category && category !== 'all') {
      query.category = category
    }
    
    if (search) {
      query.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } }
      ]
    }
    
    const skip = (page - 1) * limit
    
    const [faqs, total] = await Promise.all([
      db.collection("faqs")
        .find(query)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("faqs").countDocuments(query)
    ])
    
    return NextResponse.json({
      faqs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    return NextResponse.json(
      { error: "Failed to fetch FAQs" },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle FAQ (admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { question, answer, category, order } = body
    
    if (!question || !answer || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    
    const faq = {
      question,
      answer,
      category,
      order: order || 0,
      helpful: 0,
      notHelpful: 0,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection("faqs").insertOne(faq)
    
    return NextResponse.json({
      success: true,
      faq: { ...faq, _id: result.insertedId }
    })
    
  } catch (error) {
    console.error('Error creating FAQ:', error)
    return NextResponse.json(
      { error: "Failed to create FAQ" },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour une FAQ (admin only)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { id, question, answer, category, order, active } = body
    
    if (!id) {
      return NextResponse.json(
        { error: "FAQ ID is required" },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    const updateData: any = {
      updatedAt: new Date()
    }
    
    if (question !== undefined) updateData.question = question
    if (answer !== undefined) updateData.answer = answer
    if (category !== undefined) updateData.category = category
    if (order !== undefined) updateData.order = order
    if (active !== undefined) updateData.active = active
    
    const result = await db.collection("faqs").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "FAQ not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error updating FAQ:', error)
    return NextResponse.json(
      { error: "Failed to update FAQ" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une FAQ (admin only)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: "FAQ ID is required" },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    
    const result = await db.collection("faqs").deleteOne({
      _id: new ObjectId(id)
    })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "FAQ not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error deleting FAQ:', error)
    return NextResponse.json(
      { error: "Failed to delete FAQ" },
      { status: 500 }
    )
  }
}