// app/api/users/language/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { updateUserLanguage } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { language } = await request.json()
    
    if (!language || !['fr', 'en', 'mg'].includes(language)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 })
    }

    // Mettre à jour la langue dans la DB
    await updateUserLanguage(session.user.id, language)

    // Mettre à jour le cookie
    const response = NextResponse.json({ success: true, language })
    response.cookies.set('preferred-language', language, {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'lax'
    })

    return response
  } catch (error) {
    console.error("Error updating language:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}