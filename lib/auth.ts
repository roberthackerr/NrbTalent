import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { getDatabase } from "./mongodb"
import bcrypt from "bcryptjs"
import type { User } from "./models/user"
import { ObjectId } from "mongodb"

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
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required")
        }

        const db = await getDatabase()
        const user = await db.collection<User>("users").findOne({
          email: credentials.email,
        })

        if (!user) {
          throw new Error("No user found with this email")
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error("Invalid password")
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const db = await getDatabase()
        const existingUser = await db.collection<User>("users").findOne({
          email: user.email!,
        })

        if (!existingUser) {
          // Create new user for OAuth sign-in
          await db.collection<User>("users").insertOne({
            _id: new ObjectId(),
            name: user.name!,
            email: user.email!,
            password: "", // No password for OAuth users
            role: "freelance", // Default role, can be changed later
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
            verified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        const db = await getDatabase()
        const dbUser = await db.collection<User>("users").findOne({
          email: user.email!,
        })

        if (dbUser) {
          token.role = dbUser.role
          token.id = dbUser._id.toString()
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = token.role
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
  session: {
    strategy: "jwt",
  },
}
