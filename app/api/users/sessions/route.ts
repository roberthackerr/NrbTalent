// app/api/users/sessions/route.ts - VERSION CORRIGÉE
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { headers } from "next/headers"
import crypto from "crypto"

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Génère un ID de session STABLE basé sur userId et userAgent
 * IMPORTANT: Doit toujours générer le même ID pour le même user/device
 */
function generateSessionId(userId: string, userAgent: string): string {
  // Nettoyer le userAgent pour enlever les parties variables (versions mineures)
  const cleanUserAgent = userAgent
    .replace(/\d+\.\d+\.\d+\.\d+/g, 'X.X.X.X') // versions
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200) // limiter la taille
  
  // Créer un hash stable
  const hash = crypto
    .createHash('sha256')
    .update(`${userId}:${cleanUserAgent}`)
    .digest('hex')
    .substring(0, 16)
  
  return `sess_${hash}`
}

/**
 * Parse le user-agent pour extraire les informations
 */
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase()
  
  let browser = "Inconnu"
  let os = "Inconnu"
  let device = "Ordinateur"

  // Détecter le navigateur
  if (ua.includes("edg/")) browser = "Edge"
  else if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome"
  else if (ua.includes("firefox")) browser = "Firefox"
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari"
  else if (ua.includes("opera") || ua.includes("opr/")) browser = "Opera"

  // Détecter l'OS
  if (ua.includes("windows nt 10.0")) os = "Windows 10/11"
  else if (ua.includes("windows")) os = "Windows"
  else if (ua.includes("mac os x")) os = "macOS"
  else if (ua.includes("linux")) os = "Linux"
  else if (ua.includes("android")) os = "Android"
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS"

  // Détecter le device
  if (ua.includes("mobile") || ua.includes("iphone")) device = "Mobile"
  else if (ua.includes("tablet") || ua.includes("ipad")) device = "Tablette"

  return { browser, os, device }
}

/**
 * Obtient l'IP du client
 */
function getClientIp(request: Request): string {
  const headersList = headers()
  return (
    headersList.get("x-forwarded-for")?.split(",")[0] ||
    headersList.get("x-real-ip") ||
    headersList.get("cf-connecting-ip") ||
    "Unknown"
  )
}

// ============================================================================
// GET - Récupérer toutes les sessions de l'utilisateur
// ============================================================================

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const userId = session.user.id

    console.log("🔍 GET /sessions - userId:", userId)

    // Rechercher les sessions avec userId comme STRING (standardisé)
    const allSessions = await db.collection("user_sessions")
      .find({ userId: userId }) // Toujours en string
      .sort({ lastActive: -1 })
      .toArray()

    console.log(`✅ Trouvé ${allSessions.length} sessions`)

    // Générer l'ID de la session courante
    const headersList = headers()
    const userAgent = headersList.get("user-agent") || "Unknown"
    const currentSessionId = generateSessionId(userId, userAgent)

    console.log("📌 Session courante:", currentSessionId)

    // Formater les sessions
    const formattedSessions = allSessions.map(sess => {
      const deviceInfo = parseUserAgent(sess.device?.userAgent || "Unknown")
      const isCurrent = sess.id === currentSessionId
      
      return {
        id: sess.id,
        device: {
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          device: deviceInfo.device,
          ip: sess.device?.ip || "Unknown",
          userAgent: sess.device?.userAgent
        },
        location: sess.location || {
          country: "Unknown",
          city: "Unknown"
        },
        createdAt: sess.createdAt,
        lastActive: sess.lastActive,
        current: isCurrent,
        active: sess.active !== false,
        expiresAt: sess.expiresAt
      }
    })

    // Statistiques
    const stats = {
      total: formattedSessions.length,
      active: formattedSessions.filter(s => s.active).length,
      inactive: formattedSessions.filter(s => !s.active).length,
      current: formattedSessions.filter(s => s.current).length
    }

    return NextResponse.json({
      success: true,
      sessions: formattedSessions,
      stats,
      userId
    })

  } catch (error) {
    console.error("❌ Erreur GET /sessions:", error)
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Créer ou mettre à jour une session (appelé lors du login)
// ============================================================================

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const userId = session.user.id // Toujours en string

    // Récupérer les informations
    const headersList = headers()
    const userAgent = headersList.get("user-agent") || "Unknown"
    const ip = getClientIp(request)
    const sessionId = generateSessionId(userId, userAgent)

    console.log("🔄 POST /sessions - Création/MAJ:", sessionId)

    const deviceInfo = parseUserAgent(userAgent)

    // Vérifier si la session existe
    const existingSession = await db.collection("user_sessions").findOne({
      id: sessionId,
      userId: userId
    })

    const sessionData = {
      lastActive: new Date(),
      active: true,
      device: {
        userAgent,
        ip,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device: deviceInfo.device
      }
    }

    if (existingSession) {
      // Mettre à jour
      await db.collection("user_sessions").updateOne(
        { id: sessionId, userId },
        { $set: sessionData }
      )
      
      console.log("✅ Session mise à jour:", sessionId)
      
      return NextResponse.json({
        success: true,
        message: "Session mise à jour",
        sessionId,
        action: "updated"
      })
    }

    // Créer nouvelle session
    const newSession = {
      id: sessionId,
      userId, // STRING
      ...sessionData,
      location: {
        country: "Unknown",
        city: "Unknown"
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
    }

    await db.collection("user_sessions").insertOne(newSession)
    
    console.log("✅ Nouvelle session créée:", sessionId)
    
    return NextResponse.json({
      success: true,
      message: "Session créée",
      sessionId,
      action: "created"
    })

  } catch (error) {
    console.error("❌ Erreur POST /sessions:", error)
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Terminer une ou plusieurs sessions
// ============================================================================

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, terminateAll } = body
    
    const client = await clientPromise
    const db = client.db()
    const userId = session.user.id

    console.log("🔥 DELETE /sessions:", { sessionId, terminateAll })

    // ========================================================================
    // OPTION 1: Terminer TOUTES les autres sessions
    // ========================================================================
    if (terminateAll) {
      const headersList = headers()
      const userAgent = headersList.get("user-agent") || "Unknown"
      const currentSessionId = generateSessionId(userId, userAgent)
      
      console.log("🔥 Terminant TOUTES les sessions sauf:", currentSessionId)
      
      const result = await db.collection("user_sessions").updateMany(
        { 
          userId,
          id: { $ne: currentSessionId },
          active: { $ne: false }
        },
        { 
          $set: { 
            active: false,
            terminatedAt: new Date(),
            terminatedBy: "user"
          } 
        }
      )

      console.log(`✅ Terminé ${result.modifiedCount} sessions`)

      return NextResponse.json({
        success: true,
        message: `${result.modifiedCount} session(s) terminée(s)`,
        terminatedCount: result.modifiedCount
      })
    }

    // ========================================================================
    // OPTION 2: Terminer UNE session spécifique
    // ========================================================================
    if (!sessionId) {
      return NextResponse.json({ 
        error: "ID de session requis"
      }, { status: 400 })
    }

    // Vérifier que ce n'est pas la session courante
    const headersList = headers()
    const userAgent = headersList.get("user-agent") || "Unknown"
    const currentSessionId = generateSessionId(userId, userAgent)

    if (sessionId === currentSessionId) {
      return NextResponse.json({
        error: "Impossible de terminer votre session courante"
      }, { status: 400 })
    }

    console.log("🔥 Terminant session spécifique:", sessionId)

    const result = await db.collection("user_sessions").updateOne(
      { 
        userId,
        id: sessionId,
        active: { $ne: false }
      },
      { 
        $set: { 
          active: false,
          terminatedAt: new Date(),
          terminatedBy: "user"
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        error: "Session non trouvée ou déjà inactive"
      }, { status: 404 })
    }

    console.log("✅ Session terminée:", sessionId)

    return NextResponse.json({
      success: true,
      message: "Session terminée avec succès"
    })

  } catch (error) {
    console.error("❌ Erreur DELETE /sessions:", error)
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    )
  }
}