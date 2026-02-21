import type { NextAuthOptions, Session, User } from "next-auth"
import type { JWT } from "next-auth/jwt"
import { getServerSession } from "next-auth" // ✅ Déjà présent
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { getDatabase } from "./mongodb"
import bcrypt from "bcryptjs"
import type { User as MongoUser } from "./models/user"
import { ObjectId } from "mongodb"

// ==================== TYPE EXTENSIONS ====================
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string // Rendre requis pour éviter les undefined
      onboardingCompleted: boolean // Rendre requis
    }
  }
  
  interface User {
    id: string
    role: string
    onboardingCompleted: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    onboardingCompleted: boolean
    email: string
    name?: string | null
  }
}

// ==================== CONFIGURATION ====================
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "freelance", // ✅ Ajout du rôle par défaut
          onboardingCompleted: false,
        }
      }
    }),
    
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        name: { label: "Name", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        try {
          // ✅ Validation améliorée
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email et mot de passe requis")
          }

          const db = await getDatabase()
          
          // Vérifier si l'utilisateur existe
          const existingUser = await db.collection<MongoUser>("users").findOne({
            email: credentials.email,
          })

          // ===== INSCRIPTION =====
          if (credentials.name) {
            if (existingUser) {
              throw new Error("Un compte existe déjà avec cet email")
            }

            const hashedPassword = await bcrypt.hash(credentials.password, 12) // ✅ 12 rounds pour plus de sécurité
            
            const newUser: MongoUser = {
              _id: new ObjectId(),
              name: credentials.name,
              email: credentials.email,
              password: hashedPassword,
              role: credentials.role || "freelance",
              avatar: "",
              bio: "",
              skills: [],
              hourlyRate: 0,
              location: "",
              languages: [],
              portfolio: [],
              certifications: [],
              badges: [],
              rating: 0,
              completedProjects: 0,
              totalEarnings: 0,
              responseTime: 0,
              availability: "available",
              verified: false,
              onboardingCompleted: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            }

            await db.collection<MongoUser>("users").insertOne(newUser)

            return {
              id: newUser._id.toString(),
              email: newUser.email,
              name: newUser.name,
              role: newUser.role,
              onboardingCompleted: false,
            }
          }

          // ===== CONNEXION =====
          if (!existingUser) {
            throw new Error("Aucun utilisateur trouvé avec cet email")
          }

          // ✅ Vérification si le compte utilise Google
          if (!existingUser.password) {
            throw new Error("Ce compte utilise Google. Connectez-vous avec Google.")
          }

          const isValid = await bcrypt.compare(credentials.password, existingUser.password)

          if (!isValid) {
            throw new Error("Mot de passe incorrect")
          }

          return {
            id: existingUser._id.toString(),
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role,
            avatar: existingUser.avatar,
            onboardingCompleted: existingUser.onboardingCompleted || false,
          }
        } catch (error) {
          console.error("Authorize error:", error)
          // ✅ Retourner l'erreur pour l'afficher côté client
          throw error
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider === "google") {
          const db = await getDatabase()
          
          const existingUser = await db.collection<MongoUser>("users").findOne({
            email: user.email!,
          })

          if (!existingUser) {
            // ✅ Création utilisateur Google avec structure complète
            await db.collection<MongoUser>("users").insertOne({
              _id: new ObjectId(),
              name: user.name!,
              email: user.email!,
              password: "",
              role: "freelance",
              avatar: user.image || "",
              bio: "",
              skills: [],
              hourlyRate: 0,
              location: "",
              languages: [],
              portfolio: [],
              certifications: [],
              badges: [],
              rating: 0,
              completedProjects: 0,
              totalEarnings: 0,
              responseTime: 0,
              availability: "available",
              verified: true, // ✅ Google = vérifié
              onboardingCompleted: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          } else {
            // ✅ Mise à jour des infos Google
            await db.collection<MongoUser>("users").updateOne(
              { email: user.email! },
              {
                $set: {
                  name: user.name,
                  avatar: user.image,
                  updatedAt: new Date(),
                }
              }
            )
          }
        }
        return true
      } catch (error) {
        console.error("SignIn callback error:", error)
        return false
      }
    },
    
    async jwt({ token, user, trigger, session }) {
      try {
        // Initialisation du token avec les données utilisateur
        if (user) {
          token.id = user.id
          token.role = user.role
          token.onboardingCompleted = user.onboardingCompleted ?? false
          token.email = user.email!
          token.name = user.name
        }

        // Mise à jour du token si trigger
        if (trigger === "update" && session) {
          const db = await getDatabase()
          const dbUser = await db.collection<MongoUser>("users").findOne({
            email: token.email,
          })
          
          if (dbUser) {
            token.id = dbUser._id.toString()
            token.role = dbUser.role
            token.onboardingCompleted = dbUser.onboardingCompleted ?? false
            token.name = dbUser.name
            
            // Mise à jour depuis la session
            if (session.role) token.role = session.role
            if (session.onboardingCompleted !== undefined) {
              token.onboardingCompleted = session.onboardingCompleted
            }
          }
        }
      } catch (error) {
        console.error("JWT callback error:", error)
      }
      
      return token
    },
    
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.id
          session.user.role = token.role || "freelance"
          session.user.onboardingCompleted = token.onboardingCompleted || false
          session.user.email = token.email
          session.user.name = token.name
        }
      } catch (error) {
        console.error("Session callback error:", error)
      }
      
      return session
    },

    async redirect({ url, baseUrl }) {
      // ✅ Gestion intelligente des redirections
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      
      if (url.startsWith(baseUrl)) {
        return url
      }
      
      // Redirection par défaut après connexion
      if (url.includes("/api/auth/signin")) {
        return `${baseUrl}/dashboard`
      }
      
      return baseUrl
    }
  },

  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
    newUser: "/onboarding", // ✅ Redirige les nouveaux utilisateurs vers onboarding
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
    updateAge: 24 * 60 * 60, // Mise à jour toutes les 24h
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      }
    }
  },

  // ✅ Configuration Vercel
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

// ==================== UTILITAIRES ====================

/**
 * Récupère l'utilisateur courant
 */
export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return null
    }
    
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      onboardingCompleted: session.user.onboardingCompleted,
      image: session.user.image,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

/**
 * Récupère l'ID de l'utilisateur courant
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const user = await getCurrentUser()
    return user?.id || null
  } catch (error) {
    console.error("Error getting current user ID:", error)
    return null
  }
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return !!user
}

/**
 * Vérifie si l'utilisateur a complété l'onboarding
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.onboardingCompleted || false
}

/**
 * Récupère le rôle de l'utilisateur courant
 */
export async function getCurrentUserRole(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.role || null
}

/**
 * Mise à jour de la session côté client
 * À utiliser après onboarding ou mise à jour du profil
 */
export async function updateSession(data: Partial<Session['user']>) {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to update session')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error updating session:', error)
    return null
  }
}