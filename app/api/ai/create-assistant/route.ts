// app/api/ai/create-assistant/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const db  = await getDatabase()
    
    const aiUser = {
      _id: new ObjectId('66aabbccddeeff0011223344'), // ID fixe pour faciliter
      name: "Assistant AI",
      email: "assistant@votreplateforme.com",
      avatar: "🤖",
      role: "ai_assistant",
      isAI: true,
      isOnline: true,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Vérifier si l'user AI existe déjà
    const existingAI = await db.collection('users').findOne({ role: "ai_assistant" })
    
    if (!existingAI) {
      await db.collection('users').insertOne(aiUser)
      console.log('✅ User AI créé:', aiUser._id)
    }

    return NextResponse.json({ 
      success: true, 
      aiUser: existingAI || aiUser 
    })

  } catch (error) {
    console.error('❌ Erreur création user AI:', error)
    return NextResponse.json(
      { error: 'Erreur création user AI' },
      { status: 500 }
    )
  }
}