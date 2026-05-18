// app/api/auth/activate/[token]/route.ts
import { NextResponse } from "next/server"
import { activateAccount } from "@/lib/auth"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    
    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 400 }
      )
    }

    const result = await activateAccount(token)

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: result.message 
      })
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error in activation route:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}