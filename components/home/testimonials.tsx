"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "../ui/button"
export function Testimonials() {
const testimonials = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "CEO chez TechInnovate",
    company: "Startup SaaS",
    avatar: "/avatars/sarah-chen.jpg",
    content: "Grâce à cette plateforme, nous avons trouvé les meilleurs développeurs React pour notre produit. Le matching IA a réduit notre temps de recrutement de 70% !",
    rating: 5,
    project: "Application de gestion d'équipe"
  },
  {
    id: 2,
    name: "Marc Dubois",
    role: "Freelance Full-Stack",
    company: "Indépendant",
    avatar: "/avatars/marc-dubois.jpg",
    content: "J'ai multiplié mes revenus par 3 en 6 mois. Les recommandations de projets correspondent parfaitement à mes compétences et mes ambitions.",
    rating: 5,
    project: "Plus de 15 projets réalisés"
  },
  {
    id: 3,
    name: "Émilie Laurent",
    role: "Directrice Marketing",
    company: "EcomStore",
    avatar: "/avatars/emilie-laurent.jpg",
    content: "La qualité des freelances est exceptionnelle. Nous avons externalisé tout notre design UI/UX et les résultats ont dépassé nos attentes.",
    rating: 4,
    project: "Refonte complète de site e-commerce"
  },
  {
    id: 4,
    name: "Thomas Martin",
    role: "Développeur DevOps",
    company: "Freelance",
    avatar: "/avatars/thomas-martin.jpg",
    content: "Le système de matching intelligent m'a permis de trouver des projets qui correspondent exactement à mon expertise en cloud et infrastructure.",
    rating: 5,
    project: "Migration vers AWS"
  },
  {
    id: 5,
    name: "Lisa Rodriguez",
    role: "Product Manager",
    company: "FinTech Solutions",
    avatar: "/avatars/lisa-rodriguez.jpg",
    content: "Nous avons constitué une équipe complète de développeurs en 2 semaines seulement. L'IA a parfaitement compris nos besoins techniques et culturels.",
    rating: 5,
    project: "Application mobile financière"
  },
  {
    id: 6,
    name: "Alexandre Petit",
    role: "Data Scientist",
    company: "Freelance",
    avatar: "/avatars/alexandre-petit.jpg",
    content: "Les projets en IA et Machine Learning sont nombreux et bien rémunérés. J'ai trouvé ma spécialisation grâce aux tendances identifiées par la plateforme.",
    rating: 4,
    project: "Système de recommandation IA"
  }
]

  const [currentIndex, setCurrentIndex] = useState(0)

  const nextTestimonial = () => {
    setCurrentIndex((prev: any) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev: any) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  useEffect(() => {
    const interval = setInterval(nextTestimonial, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Découvrez les retours d'expérience de nos clients et freelances
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center">
                {/* Étoiles */}
                <div className="flex items-center justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < testimonials[currentIndex].rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
                      }`}
                    />
                  ))}
                </div>

                {/* Contenu */}
                <blockquote className="text-xl text-slate-700 dark:text-slate-300 mb-8 leading-relaxed italic">
                  "{testimonials[currentIndex].content}"
                </blockquote>

                {/* Projet */}
                <div className="mb-6">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Projet réalisé :
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                    {testimonials[currentIndex].project}
                  </span>
                </div>

                {/* Profil */}
                <div className="flex items-center justify-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={testimonials[currentIndex].avatar} alt={testimonials[currentIndex].name} />
                    <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {testimonials[currentIndex].name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                      {testimonials[currentIndex].name}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {testimonials[currentIndex].role} • {testimonials[currentIndex].company}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contrôles du carousel */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
            onClick={prevTestimonial}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
            onClick={nextTestimonial}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Indicateurs */}
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-blue-600 w-6"
                  : "bg-slate-300 dark:bg-slate-600"
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
