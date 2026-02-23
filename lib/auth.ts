import type { NextAuthOptions, Session } from "next-auth"
import type { JWT } from "next-auth/jwt"
import { getServerSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { getDatabase } from "./mongodb"
import bcrypt from "bcryptjs"
import { User, CreateUserDTO, toUserResponseDTO, createNewUser } from "./models/user"
import { ObjectId } from "mongodb"

// ==================== TYPE EXTENSIONS ====================
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: "freelance" | "client" | "admin"
      onboardingCompleted: boolean
      onboardingRoleCompleted:boolean
      avatar?: string | null
    }
  }
  
  interface User {
    id: string
    role: "freelance" | "client" | "admin"
    onboardingCompleted: boolean
    onboardingRoleCompleted:boolean
    avatar?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "freelance" | "client" | "admin"
    onboardingCompleted: boolean
    onboardingRoleCompleted:boolean
    email: string
    name?: string | null
    avatar?: string | null
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
      async profile(profile) {
        try {
          const db = await getDatabase()
          const usersCollection = db.collection<User>("users")
          
          // Vérifier si l'utilisateur existe déjà
          let existingUser = await usersCollection.findOne({ 
            email: profile.email 
          })

          if (!existingUser) {
            // Créer un nouvel utilisateur avec createNewUser helper
            const newUserData: CreateUserDTO = {
              name: profile.name,
              email: profile.email,
              role: "freelance", // Rôle par défaut
              avatar: profile.picture
            }

            const newUser = {
              ...createNewUser(newUserData),
              _id: new ObjectId(),
              avatar: profile.picture || "",
              verified: true, // Google = vérifié
              emailVerified: new Date(),
              lastLogin: new Date()
            }

            await usersCollection.insertOne(newUser)
            existingUser = newUser
          } else {
            // Mettre à jour les informations existantes
            await usersCollection.updateOne(
              { _id: existingUser._id },
              { 
                $set: { 
                  name: profile.name,
                  avatar: profile.picture || existingUser.avatar,
                  lastLogin: new Date(),
                  updatedAt: new Date()
                }
              }
            )
          }

          // Retourner l'utilisateur formaté pour NextAuth
          return {
            id: existingUser._id.toString(),
            name: existingUser.name,
            email: existingUser.email,
            image: existingUser.avatar,
            role: existingUser.role,
            onboardingRoleCompleted:existingUser.onboardingRoleCompleted || false,
            onboardingCompleted: existingUser.onboardingCompleted || false,
            avatar: existingUser.avatar
          }
        } catch (error) {
          console.error("Google profile error:", error)
          throw error
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
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email et mot de passe requis")
          }

          const db = await getDatabase()
          const usersCollection = db.collection<User>("users")
          
          // Vérifier si l'utilisateur existe
          const existingUser = await usersCollection.findOne({
            email: credentials.email,
          })

          // ===== INSCRIPTION =====
          if (credentials.name) {
            if (existingUser) {
              throw new Error("Un compte existe déjà avec cet email")
            }

            // Utiliser le helper createNewUser
            const newUserData: CreateUserDTO = {
              name: credentials.name,
              email: credentials.email,
              password: credentials.password,
              role: (credentials.role as "freelance" | "client") || "freelance"
            }

            const hashedPassword = await bcrypt.hash(credentials.password, 12)
            
            const newUser = {
              ...createNewUser(newUserData),
              _id: new ObjectId(),
              password: hashedPassword,
              createdAt: new Date(),
              updatedAt: new Date()
            }

            await usersCollection.insertOne(newUser)

            return {
              id: newUser._id.toString(),
              email: newUser.email,
              name: newUser.name,
              role: newUser.role,
              onboardingCompleted: false,
              avatar: newUser.avatar
            }
          }

          // ===== CONNEXION =====
          if (!existingUser) {
            throw new Error("Aucun utilisateur trouvé avec cet email")
          }

          // Vérifier si le compte utilise Google
          if (!existingUser.password) {
            throw new Error("Ce compte utilise Google. Connectez-vous avec Google.")
          }

          const isValid = await bcrypt.compare(credentials.password, existingUser.password)

          if (!isValid) {
            throw new Error("Mot de passe incorrect")
          }

          // Mettre à jour la date de dernière connexion
          await usersCollection.updateOne(
            { _id: existingUser._id },
            { $set: { lastLogin: new Date(), updatedAt: new Date() } }
          )

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
          throw error
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      try {
        if (user) {
          // Stocker toutes les informations utilisateur dans le token
          token.id = user.id
          token.role = user.role as "freelance" | "client" | "admin"
          token.onboardingRoleCompleted = user.onboardingRoleCompleted ?? false
          token.onboardingCompleted = user.onboardingCompleted ?? false
          token.email = user.email!
          token.name = user.name
          token.avatar = user.avatar
        }

        // Mise à jour du token si nécessaire
        if (trigger === "update" && session) {
          const db = await getDatabase()
          const dbUser = await db.collection<User>("users").findOne({
            email: token.email,
          })
          
          if (dbUser) {
            token.id = dbUser._id.toString()
            token.role = dbUser.role
            token.onboardingCompleted = dbUser.onboardingCompleted ?? false
            token.name = dbUser.name
            token.avatar = dbUser.avatar
            
            // Mise à jour depuis la session
            if (session.role) token.role = session.role as typeof token.role
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
          // Peupler la session avec les données du token
          session.user.id = token.id
          session.user.role = token.role || "freelance"
          session.user.onboardingCompleted = token.onboardingCompleted || false
          session.user.email = token.email
          session.user.name = token.name
          session.user.image = token.avatar || null
          session.user.avatar = token.avatar || null
        }
      } catch (error) {
        console.error("Session callback error:", error)
      }
      
      return session
    },
  },

  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
    newUser: "/onboarding", // Redirige les nouveaux utilisateurs vers onboarding
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

// ==================== UTILITAIRES ====================

/**
 * Récupère l'utilisateur courant avec toutes ses informations
 */
export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return null
    }
    
    // Récupérer les données complètes depuis la DB
    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({ 
      email: session.user.email 
    })
    
    if (!user) return null
    
    // Retourner le DTO sécurisé
    return toUserResponseDTO(user)
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

/**
 * Récupère l'ObjectId de l'utilisateur courant
 */
export async function getCurrentUserObjectId(): Promise<ObjectId | null> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return null
    }
    
    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne(
      { email: session.user.email },
      { projection: { _id: 1 } } // Ne récupérer que l'ID
    )
    
    return user?._id || null
  } catch (error) {
    console.error("Error getting current user ObjectId:", error)
    return null
  }
}

/**
 * Récupère l'ID de l'utilisateur courant (string)
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const objectId = await getCurrentUserObjectId()
    return objectId?.toString() || null
  } catch (error) {
    console.error("Error getting current user ID:", error)
    return null
  }
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  return !!session?.user
}

/**
 * Vérifie si l'utilisateur a complété l'onboarding
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  return session?.user?.onboardingCompleted || false
}

/**
 * Récupère le rôle de l'utilisateur courant
 */
export async function getCurrentUserRole(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.role || null
}

/**
 * Mise à jour de la session côté client
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