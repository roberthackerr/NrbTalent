// app/api/users/update-role/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Messages d'erreur en français et anglais
const errorMessages = {
  fr: {
    unauthorized: "Non autorisé",
    invalidRole: "Rôle invalide",
    userNotFound: "Utilisateur non trouvé",
    serverError: "Erreur interne du serveur",
    success: "Profil mis à jour avec succès"
  },
  en: {
    unauthorized: "Unauthorized",
    invalidRole: "Invalid role",
    userNotFound: "User not found",
    serverError: "Internal server error",
    success: "Profile updated successfully"
  }
}

// Détecter la langue depuis la requête
function getLanguageFromRequest(request: Request): 'fr' | 'en' {
  // 1. Vérifier le header Accept-Language
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage?.startsWith('fr')) {
    return 'fr'
  }
  
  // 2. Vérifier un paramètre ?lang=fr dans l'URL
  const url = new URL(request.url)
  const langParam = url.searchParams.get('lang')
  if (langParam === 'fr' || langParam === 'en') {
    return langParam
  }
  
  // 3. Par défaut, anglais
  return 'en'
}

export async function POST(request: Request) {
  try {
    // Détecter la langue
    const lang = getLanguageFromRequest(request)
    const messages = errorMessages[lang]

    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { 
          error: messages.unauthorized,
          code: "UNAUTHORIZED"
        }, 
        { status: 401 }
      )
    }

    const { role, onboardingRoleCompleted = true } = await request.json()

    if (!role || (role !== "freelance" && role !== "client")) {
      return NextResponse.json(
        { 
          error: messages.invalidRole,
          code: "INVALID_ROLE",
          validRoles: ["freelance", "client"]
        }, 
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Trouver l'utilisateur par email si l'ID n'est pas valide
    let userId
    try {
      userId = new ObjectId((session.user as any).id)
    } catch {
      // Si l'ID n'est pas valide, chercher par email
      const userByEmail = await db.collection("users").findOne({
        email: session.user.email
      })
      if (!userByEmail) {
        return NextResponse.json(
          { 
            error: messages.userNotFound,
            code: "USER_NOT_FOUND"
          }, 
          { status: 404 }
        )
      }
      userId = userByEmail._id
    }

    const result = await db.collection("users").updateOne(
      { _id: userId },
      { 
        $set: { 
          role: role,
          onboardingRoleCompleted: onboardingRoleCompleted,
          updatedAt: new Date()
        } 
      }
    )

    if (result.modifiedCount === 0 && result.matchedCount === 0) {
      return NextResponse.json(
        { 
          error: messages.userNotFound,
          code: "USER_NOT_FOUND"
        }, 
        { status: 404 }
      )
    }

    // Succès - retourner le message dans la bonne langue
    return NextResponse.json({ 
      success: true,
      message: messages.success,
      role: role,
      onboardingRoleCompleted: onboardingRoleCompleted,
      lang: lang // Retourner la langue utilisée pour debug
    })

  } catch (error) {
    console.error("Error updating user:", error)
    
    // Détecter la langue même en cas d'erreur
    const lang = getLanguageFromRequest(request)
    const messages = errorMessages[lang]
    
    return NextResponse.json({ 
      error: messages.serverError,
      code: "INTERNAL_SERVER_ERROR",
      details: error instanceof Error ? error.message : undefined
    }, { status: 500 })
  }
}