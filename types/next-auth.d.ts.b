import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      projectId:UserProject
      name?: string | null
      email?: string | null
      image?: string | null
      role: "client" | "admin" | "freelance"
      // Vos champs personnalisés
      skills?: {
        id: string
        name: string
        category: string
        level: string
        yearsOfExperience: number
        featured: boolean
      }[]
      experience?: {
        company: string
        position: string
        location: string
        startDate: string
        endDate: string
        current: boolean
        description: string
        technologies: string[]
        id: string
        createdAt?: string
        achievement?: string
      }[]
      title?: string
      bio?: string
      avatar?: string
      location?: string
      hourlyRate?: number
      availability?: string
      socialLinks?: {
        website?: string
        linkedin?: string
        github?: string
        twitter?: string
      }
      statistics?: {
        completedProjects?: number
        successRate?: number
        rating?: number
      }
      currentWorkload?: number
      createdAt?: string
      updatedAt?: string
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: "freelance" | "client" | "admin"
    skills?: any[]
    experience?: any[]
    title?: string
    bio?: string
    // ... autres champs
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "freelance" | "client" | "admin"
    skills?: any[]
    experience?: any[]
    // ... autres champs
  }
}

