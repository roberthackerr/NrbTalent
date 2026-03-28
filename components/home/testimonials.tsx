// components/home/testimonials.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import type { Locale } from "@/lib/i18n/config"

interface TestimonialsProps {
  dict?: any
  lang?: Locale
}

export function Testimonials({ dict, lang = "fr" }: TestimonialsProps) {
  // Translations
  const t = {
    title: dict?.testimonials?.title || "Ils nous font confiance",
    subtitle: dict?.testimonials?.subtitle || "Découvrez les retours d'expérience de nos clients et freelances",
    project: dict?.testimonials?.project || "Projet réalisé",
    role: dict?.testimonials?.role || "Rôle"
  }

  const testimonials = [
    {
      id: 1,
      name: dict?.testimonials?.testimonial1?.name || "Sarah Chen",
      role: dict?.testimonials?.testimonial1?.role || "CEO chez TechInnovate",
      company: dict?.testimonials?.testimonial1?.company || "Startup SaaS",
      avatar: "/avatars/sarah-chen.jpg",
      content: dict?.testimonials?.testimonial1?.content || "Grâce à cette plateforme, nous avons trouvé les meilleurs développeurs React pour notre produit. Le matching IA a réduit notre temps de recrutement de 70% !",
      rating: 5,
      project: dict?.testimonials?.testimonial1?.project || "Application de gestion d'équipe"
    },
    {
      id: 2,
      name: dict?.testimonials?.testimonial2?.name || "Marc Dubois",
      role: dict?.testimonials?.testimonial2?.role || "Freelance Full-Stack",
      company: dict?.testimonials?.testimonial2?.company || "Indépendant",
      avatar: "/avatars/marc-dubois.jpg",
      content: dict?.testimonials?.testimonial2?.content || "J'ai multiplié mes revenus par 3 en 6 mois. Les recommandations de projets correspondent parfaitement à mes compétences et mes ambitions.",
      rating: 5,
      project: dict?.testimonials?.testimonial2?.project || "Plus de 15 projets réalisés"
    },
    {
      id: 3,
      name: dict?.testimonials?.testimonial3?.name || "Émilie Laurent",
      role: dict?.testimonials?.testimonial3?.role || "Directrice Marketing",
      company: dict?.testimonials?.testimonial3?.company || "EcomStore",
      avatar: "/avatars/emilie-laurent.jpg",
      content: dict?.testimonials?.testimonial3?.content || "La qualité des freelances est exceptionnelle. Nous avons externalisé tout notre design UI/UX et les résultats ont dépassé nos attentes.",
      rating: 4,
      project: dict?.testimonials?.testimonial3?.project || "Refonte complète de site e-commerce"
    },
    {
      id: 4,
      name: dict?.testimonials?.testimonial4?.name || "Thomas Martin",
      role: dict?.testimonials?.testimonial4?.role || "Développeur DevOps",
      company: dict?.testimonials?.testimonial4?.company || "Freelance",
      avatar: "/avatars/thomas-martin.jpg",
      content: dict?.testimonials?.testimonial4?.content || "Le système de matching intelligent m'a permis de trouver des projets qui correspondent exactement à mon expertise en cloud et infrastructure.",
      rating: 5,
      project: dict?.testimonials?.testimonial4?.project || "Migration vers AWS"
    },
    {
      id: 5,
      name: dict?.testimonials?.testimonial5?.name || "Lisa Rodriguez",
      role: dict?.testimonials?.testimonial5?.role || "Product Manager",
      company: dict?.testimonials?.testimonial5?.company || "FinTech Solutions",
      avatar: "/avatars/lisa-rodriguez.jpg",
      content: dict?.testimonials?.testimonial5?.content || "Nous avons constitué une équipe complète de développeurs en 2 semaines seulement. L'IA a parfaitement compris nos besoins techniques et culturels.",
      rating: 5,
      project: dict?.testimonials?.testimonial5?.project || "Application mobile financière"
    },
    {
      id: 6,
      name: dict?.testimonials?.testimonial6?.name || "Alexandre Petit",
      role: dict?.testimonials?.testimonial6?.role || "Data Scientist",
      company: dict?.testimonials?.testimonial6?.company || "Freelance",
      avatar: "/avatars/alexandre-petit.jpg",
      content: dict?.testimonials?.testimonial6?.content || "Les projets en IA et Machine Learning sont nombreux et bien rémunérés. J'ai trouvé ma spécialisation grâce aux tendances identifiées par la plateforme.",
      rating: 4,
      project: dict?.testimonials?.testimonial6?.project || "Système de recommandation IA"
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
    <section className="py-12 sm:py-16 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3 sm:mb-4">
            {t.title}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-4">
            {t.subtitle}
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center">
                {/* Stars */}
                <div className="flex items-center justify-center gap-1 mb-4 sm:mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 sm:h-5 sm:w-5 ${
                        i < testimonials[currentIndex].rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
                      }`}
                    />
                  ))}
                </div>

                {/* Content */}
                <blockquote className="text-base sm:text-xl text-slate-700 dark:text-slate-300 mb-6 sm:mb-8 leading-relaxed italic px-2">
                  "{testimonials[currentIndex].content}"
                </blockquote>

                {/* Project */}
                <div className="mb-4 sm:mb-6">
                  <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                    {t.project} :
                  </span>
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 ml-2">
                    {testimonials[currentIndex].project}
                  </span>
                </div>

                {/* Profile */}
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    <AvatarImage src={testimonials[currentIndex].avatar} alt={testimonials[currentIndex].name} />
                    <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-sm sm:text-base">
                      {testimonials[currentIndex].name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                      {testimonials[currentIndex].name}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {testimonials[currentIndex].role} • {testimonials[currentIndex].company}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Carousel Controls */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 sm:-left-12 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm h-8 w-8 sm:h-10 sm:w-10"
            onClick={prevTestimonial}
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 sm:-right-12 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm h-8 w-8 sm:h-10 sm:w-10"
            onClick={nextTestimonial}
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-1.5 sm:gap-2 mt-6 sm:mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`h-1.5 sm:h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-blue-600 w-4 sm:w-6"
                  : "bg-slate-300 dark:bg-slate-600 w-1.5 sm:w-2"
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}