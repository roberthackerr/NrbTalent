// app/api/users/profile/route.ts (version corrigée)
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { User, Skill, Portfolio, Experience } from "@/lib/models/user"
import { toUserResponseDTO } from "@/lib/models/user"

// ============================================
// GET - Fetch user profile
// ============================================
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)
    
    const user = await db.collection<User>("users").findOne(
      { _id: userId },
      { projection: { password: 0 } }
    )

    if (!user) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      )
    }

    return NextResponse.json(toUserResponseDTO(user))
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}

// ============================================
// PATCH - Update user profile
// ============================================
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const { section, data } = await request.json()
    const db = await getDatabase()
    const userId = new ObjectId((session.user as any).id)

    if (!section) {
      return NextResponse.json(
        { error: "Section is required" }, 
        { status: 400 }
      )
    }

    // Base update operation with timestamp
    const updateOperation: any = { 
      $set: { 
        updatedAt: new Date() 
      } 
    }
    
    let arrayFilters: any[] = []
    let useArrayFilters = false

    // Helper pour initialiser un champ si nécessaire
    const ensureFieldExists = async (field: string, defaultValue: any[] = []) => {
      const user = await db.collection<User>("users").findOne(
        { _id: userId, [field]: { $exists: false } },
        { projection: { _id: 1 } }
      )
      if (user) {
        await db.collection<User>("users").updateOne(
          { _id: userId },
          { $set: { [field]: defaultValue } }
        )
      }
    }

    switch (section) {
      case 'preferences':
        // Mettre à jour les préférences
        if (data.language) {
          // Sauvegarder aussi dans le champ language principal pour faciliter l'accès
          updateOperation.$set = {
            ...updateOperation.$set,
            preferences: data,
            language: data.language  // 👈 SAUVEGARDER DANS LE CHAMP PRINCIPAL
          }
        } else {
          updateOperation.$set = {
            ...updateOperation.$set,
            preferences: data
          }
        }
        break
      // ------------------------------
      // ONBOARDING COMPLETED
      // ------------------------------
      case 'onboardingCompleted':
        updateOperation.$set = {
          ...updateOperation.$set,
          onboardingCompleted: data.onboardingCompleted
        }
        console.log("✅ Onboarding completed status updated")
        break

      // ------------------------------
      // EXPERIENCE
      // ------------------------------
      case 'experience':
        await ensureFieldExists('experience', [])
        
        if (data._delete) {
          updateOperation.$pull = { 
            experience: { id: data.id } 
          }
        } else if (data.id) {
          updateOperation.$set = {
            ...updateOperation.$set,
            "experience.$[elem]": {
              ...data,
              _id: undefined,
              updatedAt: new Date()
            }
          }
          arrayFilters = [{ "elem.id": data.id }]
          useArrayFilters = true
        } else {
          updateOperation.$push = {
            experience: {
              ...data,
              id: data.id || new ObjectId().toString(),
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        }
        break

      // ------------------------------
      // EDUCATION (CORRIGÉ)
      // ------------------------------
      case 'education':
        // Initialiser le tableau education s'il n'existe pas
        await ensureFieldExists('education', [])
        
        if (data._delete) {
          // Supprimer une formation
          updateOperation.$pull = { 
            education: { id: data.id } 
          }
        } else if (data.id) {
          // Mettre à jour une formation existante
          // Vérifier d'abord si l'élément existe
          const user = await db.collection<User>("users").findOne(
            { _id: userId, "education.id": data.id },
            { projection: { _id: 1 } }
          )
          
          if (user) {
            updateOperation.$set = {
              ...updateOperation.$set,
              "education.$[elem]": {
                ...data,
                _id: undefined,
                updatedAt: new Date()
              }
            }
            arrayFilters = [{ "elem.id": data.id }]
            useArrayFilters = true
          } else {
            // Si l'élément n'existe pas, l'ajouter
            updateOperation.$push = {
              education: {
                ...data,
                id: data.id,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            }
          }
        } else {
          // Ajouter une nouvelle formation
          updateOperation.$push = {
            education: {
              ...data,
              id: data.id || new ObjectId().toString(),
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        }
        break

      // ------------------------------
      // PORTFOLIO
      // ------------------------------
      case 'portfolio':
        await ensureFieldExists('portfolio', [])
        
        if (data._delete) {
          updateOperation.$pull = { 
            portfolio: { id: data.id } 
          }
        } else if (data.id) {
          const existingUser = await db.collection<User>("users").findOne(
            { _id: userId, "portfolio.id": data.id }
          )

          if (existingUser) {
            updateOperation.$set = {
              ...updateOperation.$set,
              "portfolio.$[elem]": {
                ...data,
                _id: undefined,
                updatedAt: new Date()
              }
            }
            arrayFilters = [{ "elem.id": data.id }]
            useArrayFilters = true
          } else {
            updateOperation.$push = {
              portfolio: {
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
                featured: data.featured || false
              }
            }
          }
        } else {
          updateOperation.$push = {
            portfolio: {
              ...data,
              id: new ObjectId().toString(),
              createdAt: new Date(),
              updatedAt: new Date(),
              featured: data.featured || false
            }
          }
        }
        break

      // ------------------------------
      // BASIC INFO
      // ------------------------------
      case 'basic':
        updateOperation.$set = {
          ...updateOperation.$set,
          ...data
        }
        break

      // ------------------------------
      // PROFESSIONAL INFO
      // ------------------------------
      case 'professional':
        updateOperation.$set = {
          ...updateOperation.$set,
          skills: data.skills || [],
          hourlyRate: data.hourlyRate,
          availability: data.availability,
          languages: data.languages || []
        }
        break

      // ------------------------------
      // SOCIAL LINKS
      // ------------------------------
      case 'social':
        updateOperation.$set = {
          ...updateOperation.$set,
          socialLinks: data
        }
        break

      // ------------------------------
      // PREFERENCES
      // ------------------------------
      case 'preferences':
        updateOperation.$set = {
          ...updateOperation.$set,
          preferences: data
        }
        break

      // ------------------------------
      // SKILLS (Alias for professional)
      // ------------------------------
      case 'skills':
        updateOperation.$set = {
          ...updateOperation.$set,
          skills: data
        }
        break

      default:
        return NextResponse.json(
          { error: `Invalid section: ${section}` }, 
          { status: 400 }
        )
    }

    // ========================================
    // Execute update operation
    // ========================================
    let result
    if (useArrayFilters) {
      result = await db.collection<User>("users").updateOne(
        { _id: userId },
        updateOperation,
        { arrayFilters }
      )
    } else {
      result = await db.collection<User>("users").updateOne(
        { _id: userId },
        updateOperation
      )
    }

    // Check if user was found
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      )
    }

    // ========================================
    // Fetch updated user
    // ========================================
    const updatedUser = await db.collection<User>("users").findOne(
      { _id: userId },
      { projection: { password: 0 } }
    )

    console.log('✅ User updated:', {
      section,
      educationCount: updatedUser?.education?.length || 0,
      portfolioCount: updatedUser?.portfolio?.length || 0,
      experienceCount: updatedUser?.experience?.length || 0,
      skillsCount: updatedUser?.skills?.length || 0
    })

    return NextResponse.json({ 
      message: section === 'portfolio' 
        ? "Portfolio updated successfully" 
        : "Profile updated successfully",
      user: updatedUser ? toUserResponseDTO(updatedUser) : null,
      success: true
    })

  } catch (error: any) {
    console.error("❌ Error updating profile:", error)
    
    if (error.code === 2) {
      return NextResponse.json({ 
        error: "Array filter error. The item might not exist.",
        details: error.message 
      }, { status: 400 })
    }
    
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: "Duplicate key error",
        details: error.message 
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 })
  }
}