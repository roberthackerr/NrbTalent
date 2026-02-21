import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import type { User } from "@/lib/models/user"

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if user exists
    const existingUser = await db.collection<User>("users").findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const newUser: Omit<User, "_id"> = {
      name,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: undefined,
      availability: undefined,
      skills: [],
      languages: [],
      socialLinks: undefined,
      portfolio: [],
      education: [],
      experience: [],
      certifications: [],
      reviews: [],
      badges: [],
      statistics: undefined,
      enrolledCourses: [],
      savedProjects: [],
      following: [],
      followers: [],
      verified: false,
      emailVerified: false,
      phoneVerified: false,
      identityVerified: false,
      completionScore: 0,
      isActive: false
    }

    const result = await db.collection<User>("users").insertOne(newUser as User)

    return NextResponse.json({ message: "User created successfully", userId: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
