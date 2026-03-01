// app/api/auth/register/route.ts - Version corrigée
import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { ObjectId } from "mongodb"
import { User, CreateUserDTO, createNewUser } from "@/lib/models/user"
import { sendVerificationEmail } from "@/lib/email-service"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, lang } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection<User>("users")

    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const tokenExpiry = new Date(Date.now() + 24 * 3600000)

    const newUserData: CreateUserDTO = {
      name,
      email,
      password,
      role: role || "freelance",
    }

    const newUser = {
      ...createNewUser(newUserData),
      _id: new ObjectId(),
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: null,
      // ✅ On ne stocke PLUS le token dans l'utilisateur
    }

    await usersCollection.insertOne(newUser)

    // ✅ On stocke le token dans la collection dédiée
    await db.collection("verificationTokens").insertOne({
      userId: newUser._id,
      email: newUser.email,
      token: verificationToken,
      type: 'email_verification',
      expiresAt: tokenExpiry,
      createdAt: new Date(),
      lang: lang || "fr"
    })

    await sendVerificationEmail(newUser.email, verificationToken, lang || "fr")

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 })
  }
}