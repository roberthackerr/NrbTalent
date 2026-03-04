"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Award, Clock, Users, Search, Star, Play, CheckCircle2 } from "lucide-react"

interface Course {
  _id: string
  title: string
  description: string
  category: string
  level: string
  instructor: string
  thumbnail: string
  price: number
  duration: number
  lessons: any[]
  skills: string[]
  enrolledStudents: string[]
  rating: number
  certification: {
    enabled: boolean
    certificateName: string
  }
}

export default function AcademyPage() {
  const { data: session } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [selectedCategory])

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== "all") params.append("category", selectedCategory)

      const res = await fetch(`/api/courses?${params}`)
      const data = await res.json()

      setCourses(data.courses)
      setEnrolledCourses(data.courses.filter((c: Course) => c.enrolledStudents.includes(session?.user?.id || "")))
    } catch (error) {
      console.error("Failed to fetch courses:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
      })

      if (res.ok) {
        fetchCourses()
      }
    } catch (error) {
      console.error("Failed to enroll:", error)
    }
  }

  const categories = ["all", "Development", "AI & Machine Learning", "Cybersecurity", "Telecom", "Design"]

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">NRB Academy</h1>
              <p className="text-muted-foreground">Développez vos compétences et obtenez des certifications</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher une formation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                className="rounded-full"
              >
                {cat === "all" ? "Toutes" : cat}
              </Button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">Toutes les formations</TabsTrigger>
            <TabsTrigger value="enrolled">Mes formations</TabsTrigger>
            <TabsTrigger value="certifications">Mes certifications</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">Chargement...</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-16 h-16 text-primary/50" />
                      </div>
                      <Badge className="absolute top-3 right-3">{course.level}</Badge>
                    </div>

                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {course.duration}h
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {course.enrolledStudents.length}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {course.rating.toFixed(1)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {course.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      {course.certification.enabled && (
                        <div className="flex items-center gap-2 text-sm text-primary">
                          <Award className="w-4 h-4" />
                          Certification disponible
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-2xl font-bold">{course.price === 0 ? "Gratuit" : `${course.price}€`}</div>
                        <Button
                          onClick={() => handleEnroll(course._id)}
                          disabled={course.enrolledStudents.includes(session?.user?.id || "")}
                        >
                          {course.enrolledStudents.includes(session?.user?.id || "") ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Inscrit
                            </>
                          ) : (
                            "S'inscrire"
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="enrolled">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  Vous n'êtes inscrit à aucune formation pour le moment
                </div>
              ) : (
                enrolledCourses.map((course) => (
                  <Card key={course._id} className="p-6 space-y-4">
                    <h3 className="font-semibold text-lg">{course.title}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-medium">0%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "0%" }} />
                      </div>
                    </div>
                    <Button className="w-full">Continuer</Button>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="certifications">
            <div className="text-center py-12 text-muted-foreground">Vous n'avez pas encore de certifications</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
