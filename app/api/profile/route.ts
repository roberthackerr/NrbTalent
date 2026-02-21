import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET() {
  const session = await getServerSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Simuler des données de profil (à remplacer par votre base de données)
  const profile = {
    _id: "1",
    name: session.user.name,
    email: session.user.email,
    role: "freelance", // ou "client"
    avatar: session.user.image,
    bio: "Développeur full-stack passionné avec 5 ans d'expérience dans la création d'applications web modernes. Spécialisé en React, Node.js et TypeScript.",
    location: "Paris, France",
    phone: "+33 1 23 45 67 89",
    website: "https://monportfolio.com",
    linkedin: "https://linkedin.com/in/username",
    github: "https://github.com/username",
    twitter: "https://twitter.com/username",
    isVerified: true,
    joinDate: "2023-01-15",
    completionScore: 85,
    hourlyRate: 65,
    totalEarnings: 12500,
    languages: ["Français", "Anglais", "Espagnol"],
    skills: ["React", "TypeScript", "Node.js", "Next.js", "PostgreSQL", "AWS"],
    education: [
      {
        id: "1",
        school: "École d'Ingénieurs Informatique",
        degree: "Master",
        field: "Informatique",
        startDate: "2016-09-01",
        endDate: "2019-06-30",
        current: false
      }
    ],
    experience: [
      {
        id: "1",
        company: "Tech Startup",
        position: "Développeur Full-Stack",
        startDate: "2020-03-01",
        endDate: "2023-12-31",
        current: false,
        description: "Développement d'applications web pour clients internationaux."
      }
    ],
    portfolio: [
      {
        id: "1",
        title: "Plateforme E-commerce",
        description: "Application e-commerce complète avec panier et paiement",
        image: "/portfolio/project1.jpg",
        url: "https://example.com",
        technologies: ["React", "Node.js", "MongoDB"]
      }
    ],
    reviews: [
      {
        id: "1",
        clientName: "Marie Dubois",
        clientAvatar: "/avatars/client1.jpg",
        rating: 5,
        comment: "Excellent travail ! Livraison dans les temps et très professionnel.",
        date: "2024-01-15",
        project: "Site vitrine entreprise"
      }
    ],
    availability: "available"
  }

  return NextResponse.json(profile)
}