import type { NextAuthOptions, Session } from "next-auth"
import type { JWT } from "next-auth/jwt"
import { getServerSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { getDatabase } from "./mongodb"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { User, CreateUserDTO, toUserResponseDTO, createNewUser } from "./models/user"
import { ObjectId } from "mongodb"
import { sendVerificationEmail } from "./email-service"

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
      onboardingRoleCompleted: boolean
      avatar?: string | null
      emailVerified?: boolean | null
    }
  }

  interface User {
    id: string
    role: "freelance" | "client" | "admin"
    onboardingCompleted: boolean
    onboardingRoleCompleted: boolean
    avatar?: string | null
    emailVerified?: boolean | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "freelance" | "client" | "admin"
    onboardingCompleted: boolean
    onboardingRoleCompleted: boolean
    email: string
    name?: string | null
    avatar?: string | null
    emailVerified?: boolean | null
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

          let existingUser = await usersCollection.findOne({
            email: profile.email,
          })

          if (!existingUser) {
            const newUserData: CreateUserDTO = {
              name: profile.name,
              email: profile.email,
              role: "freelance",
              avatar: profile.picture,
            }

            const newUser = {
              ...createNewUser(newUserData),
              _id: new ObjectId(),
              avatar: profile.picture || "",
              verified: true,
              emailVerified: new Date(), // Google = vérifié d'office
              lastLogin: new Date(),
              onboardingRoleCompleted: false,
              onboardingCompleted: false,
            }

            await usersCollection.insertOne(newUser)
            existingUser = newUser
          } else {
            await usersCollection.updateOne(
              { _id: existingUser._id },
              {
                $set: {
                  name: profile.name,
                  avatar: existingUser.avatar,
                  lastLogin: new Date(),
                  updatedAt: new Date(),
                },
              }
            )
          }

          return {
            id: existingUser._id.toString(),
            name: existingUser.name,
            email: existingUser.email,
            image: existingUser.avatar,
            role: existingUser.role,
            onboardingRoleCompleted: existingUser.onboardingRoleCompleted || false,
            onboardingCompleted: existingUser.onboardingCompleted || false,
            avatar: existingUser.avatar,
            emailVerified: !!existingUser.emailVerified,
          }
        } catch (error) {
          console.error("Google profile error:", error)
          throw error
        }
      },
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        lang: { label: "Language", type: "text" },
        isVerifiedFlow: { label: "Verified Flow", type: "text" }, // 👈 NOUVEAU CHAMP
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email et mot de passe requis")
          }

          const db = await getDatabase()
          const usersCollection = db.collection<User>("users")

          const existingUser = await usersCollection.findOne({
            email: credentials.email,
          })

          // ===== CONNEXION UNIQUEMENT =====
          if (!existingUser) {
            throw new Error("Aucun utilisateur trouvé avec cet email")
          }

          // ✅ CAS SPÉCIAL: Vérification d'email (après clic sur lien)
          if (credentials.isVerifiedFlow === 'true' && credentials.password === 'VERIFIED_BY_EMAIL') {
            // Vérifier que l'email est bien vérifié
            if (!existingUser.emailVerified) {
              throw new Error("EMAIL_NOT_VERIFIED")
            }

            // Connecter l'utilisateur
            return {
              id: existingUser._id.toString(),
              email: existingUser.email,
              name: existingUser.name,
              role: existingUser.role,
              onboardingRoleCompleted: existingUser.onboardingRoleCompleted || false,
              onboardingCompleted: existingUser.onboardingCompleted || false,
              avatar: existingUser.avatar,
              emailVerified: true,
            }
          }

          // ✅ CAS NORMAL: Connexion standard
          // Vérification de l'email
          if (!existingUser.emailVerified) {
            // Vérifier si le token existe et n'est pas expiré
            if (
              !existingUser.verificationToken ||
              !existingUser.verificationTokenExpiry ||
              existingUser.verificationTokenExpiry < new Date()
            ) {
              // Générer un nouveau token
              const newToken = crypto.randomBytes(32).toString("hex")
              const newExpiry = new Date(Date.now() + 24 * 3600000)

              await usersCollection.updateOne(
                { _id: existingUser._id },
                {
                  $set: {
                    verificationToken: newToken,
                    verificationTokenExpiry: newExpiry,
                  },
                }
              )

              try {
                await sendVerificationEmail(
                  existingUser.email,
                  newToken,
                  credentials.lang || "fr"
                )
              } catch (emailError) {
                console.error("Erreur renvoi email vérification:", emailError)
              }
            }

            throw new Error("EMAIL_NOT_VERIFIED")
          }

          // Vérifier si le compte utilise Google
          if (!existingUser.password) {
            throw new Error(
              "Ce compte utilise Google. Connectez-vous avec Google."
            )
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            existingUser.password
          )

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
            onboardingRoleCompleted: existingUser.onboardingRoleCompleted || false,
            onboardingCompleted: existingUser.onboardingCompleted || false,
            avatar: existingUser.avatar,
            emailVerified: true,
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
          token.id = user.id
          token.role = user.role as "freelance" | "client" | "admin"
          token.onboardingRoleCompleted = user.onboardingRoleCompleted ?? false
          token.onboardingCompleted = user.onboardingCompleted ?? false
          token.email = user.email!
          token.name = user.name
          token.avatar = user.avatar
          token.emailVerified = user.emailVerified ?? false
        }

        if (trigger === "update" && session) {
          const db = await getDatabase()
          const dbUser = await db.collection<User>("users").findOne({
            email: token.email,
          })

          if (dbUser) {
            token.id = dbUser._id.toString()
            token.role = dbUser.role
            token.onboardingCompleted = dbUser.onboardingCompleted ?? false
            token.onboardingRoleCompleted = dbUser.onboardingRoleCompleted ?? false
            token.name = dbUser.name
            token.avatar = dbUser.avatar
            token.emailVerified = !!dbUser.emailVerified

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
          session.user.id = token.id
          session.user.role = token.role || "freelance"
          session.user.onboardingCompleted = token.onboardingCompleted || false
          session.user.onboardingRoleCompleted = token.onboardingRoleCompleted || false
          session.user.email = token.email
          session.user.name = token.name
          session.user.image = token.avatar || null
          session.user.avatar = token.avatar || null
          session.user.emailVerified = token.emailVerified || false
        }
      } catch (error) {
        console.error("Session callback error:", error)
      }

      return session
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    newUser: "/onboarding",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

// ==================== UTILITAIRES ====================

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return null
    }

    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({
      email: session.user.email,
    })

    if (!user) return null

    return toUserResponseDTO(user)
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function getCurrentUserObjectId(): Promise<ObjectId | null> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return null
    }

    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne(
      { email: session.user.email },
      { projection: { _id: 1 } }
    )

    return user?._id || null
  } catch (error) {
    console.error("Error getting current user ObjectId:", error)
    return null
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const objectId = await getCurrentUserObjectId()
    return objectId?.toString() || null
  } catch (error) {
    console.error("Error getting current user ID:", error)
    return null
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  return !!session?.user
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  return session?.user?.onboardingCompleted || false
}

export async function isEmailVerified(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  return session?.user?.emailVerified || false
}

export async function getCurrentUserRole(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.role || null
}

export async function updateSession(data: Partial<Session["user"]>) {
  try {
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error("Failed to update session")
    }

    return await response.json()
  } catch (error) {
    console.error("Error updating session:", error)
    return null
  }
}

export async function markEmailAsVerified(email: string) {
  try {
    const db = await getDatabase()
    await db.collection<User>("users").updateOne(
      { email },
      {
        $set: {
          emailVerified: new Date(),
          updatedAt: new Date(),
        },
        $unset: {
          verificationToken: "",
          verificationTokenExpiry: "",
        },
      }
    )
    return true
  } catch (error) {
    console.error("Error marking email as verified:", error)
    return false
  }
}