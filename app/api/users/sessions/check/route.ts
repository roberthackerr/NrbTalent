// app/api/users/sessions/check/route.ts - VERSION CORRIGÉE
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { headers } from "next/headers"
import crypto from "crypto"

/**
 * Génère un ID de session STABLE (IDENTIQUE à celui dans route.ts)
 */
function generateSessionId(userId: string, userAgent: string): string {
  const cleanUserAgent = userAgent
    .replace(/\d+\.\d+\.\d+\.\d+/g, 'X.X.X.X')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200)
  
  const hash = crypto
    .createHash('sha256')
    .update(`${userId}:${cleanUserAgent}`)
    .digest('hex')
    .substring(0, 16)
  
  return `sess_${hash}`
}

function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase()
  let browser = "Inconnu", os = "Inconnu", device = "Ordinateur"

  if (ua.includes("edg/")) browser = "Edge"
  else if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome"
  else if (ua.includes("firefox")) browser = "Firefox"
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari"

  if (ua.includes("windows")) os = "Windows"
  else if (ua.includes("mac")) os = "macOS"
  else if (ua.includes("linux")) os = "Linux"
  else if (ua.includes("android")) os = "Android"
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS"

  if (ua.includes("mobile") || ua.includes("iphone")) device = "Mobile"
  else if (ua.includes("tablet") || ua.includes("ipad")) device = "Tablette"

  return { browser, os, device }
}

function getClientIp(request: Request): string {
  const headersList = headers()
  return (
    headersList.get("x-forwarded-for")?.split(",")[0] ||
    headersList.get("x-real-ip") ||
    "Unknown"
  )
}

/**
 * POST - Vérifier si la session courante est toujours active
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log("❌ CHECK: Pas de session NextAuth")
      return NextResponse.json(
        { 
          active: false,
          reason: "no_session"
        }, 
        { status: 401 }
      )
    }

    const client = await clientPromise
    const db = client.db()
    const userId = session.user.id // STRING
    
    const headersList = headers()
    const userAgent = headersList.get("user-agent") || "Unknown"
    const sessionId = generateSessionId(userId, userAgent)
    
    console.log("🔍 CHECK session:", sessionId)
    
    // Vérifier si la session existe et est active
    const userSession = await db.collection("user_sessions").findOne({
      id: sessionId,
      userId: userId // STRING
    })

    // Session n'existe pas - LA CRÉER AUTOMATIQUEMENT
    if (!userSession) {
      console.log("⚠️ CHECK: Session inexistante, création auto")
      
      const deviceInfo = parseUserAgent(userAgent)
      const ip = getClientIp(request)
      
      const newSession = {
        id: sessionId,
        userId: userId, // STRING
        device: {
          userAgent,
          ip,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          device: deviceInfo.device
        },
        location: {
          country: "Unknown",
          city: "Unknown"
        },
        createdAt: new Date(),
        lastActive: new Date(),
        active: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }

      await db.collection("user_sessions").insertOne(newSession)
      
      console.log("✅ CHECK: Session auto-créée")
      
      return NextResponse.json({ 
        active: true,
        sessionId,
        autoCreated: true
      })
    }

    // Session existe mais est INACTIVE
    if (userSession.active === false) {
      console.log("❌ CHECK: Session inactive:", sessionId)
      return NextResponse.json(
        { 
          active: false,
          reason: "session_terminated",
          terminatedAt: userSession.terminatedAt
        }, 
        { status: 401 }
      )
    }

    // Session ACTIVE - Mettre à jour lastActive
    await db.collection("user_sessions").updateOne(
      { id: sessionId, userId },
      { $set: { lastActive: new Date() } }
    )

    console.log("✅ CHECK: Session active:", sessionId)
    
    return NextResponse.json({ 
      active: true,
      sessionId,
      lastActive: new Date()
    })

  } catch (error) {
    console.error("❌ Erreur CHECK:", error)
    return NextResponse.json(
      { 
        active: false,
        reason: "server_error"
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Alternative
 */
export async function GET(request: Request) {
  return POST(request)
}