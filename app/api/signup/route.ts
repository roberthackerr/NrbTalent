// src/app/api/signup/route.ts (modifié)
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Chaque champ est une invitation à l'éveil" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Votre ancrage nécessite au moins 8 caractères" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Cet email ne résonne pas juste" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Cette âme est déjà en chemin" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "seeker",
      createdAt: new Date(),
      onboardingCompleted: false,
      auraProfile: {
        energyBaseline: null,
        coherenceScore: 0,
        lastBreathwork: null,
        meditationMinutes: 0,
      },
    });

    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };

    return NextResponse.json(
      {
        message: "Bienvenue. Votre renaissance commence maintenant.",
        user: userResponse,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Une perturbation cosmique s'est produite" },
      { status: 500 }
    );
  }
}