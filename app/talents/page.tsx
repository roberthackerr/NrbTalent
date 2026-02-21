import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, MapPin, DollarSign } from "lucide-react"
import Link from "next/link"

export default function TalentsPage() {
  const talents = [
    {
      id: 1,
      name: "John Doe",
      title: "Full-Stack Developer",
      avatar: "/placeholder.svg?height=100&width=100",
      rating: 4.9,
      reviews: 47,
      hourlyRate: 85,
      location: "New York, USA",
      skills: ["React", "Node.js", "TypeScript", "MongoDB", "AWS"],
      bio: "Experienced full-stack developer with 8+ years building scalable web applications.",
    },
    {
      id: 2,
      name: "Sarah Smith",
      title: "AI/ML Engineer",
      avatar: "/placeholder.svg?height=100&width=100",
      rating: 5.0,
      reviews: 32,
      hourlyRate: 120,
      location: "San Francisco, USA",
      skills: ["Python", "TensorFlow", "PyTorch", "NLP", "Computer Vision"],
      bio: "AI specialist focused on building intelligent systems and machine learning models.",
    },
    {
      id: 3,
      name: "Mike Johnson",
      title: "Cybersecurity Expert",
      avatar: "/placeholder.svg?height=100&width=100",
      rating: 4.8,
      reviews: 28,
      hourlyRate: 95,
      location: "London, UK",
      skills: ["Penetration Testing", "Security Audit", "OWASP", "Network Security"],
      bio: "Certified security professional specializing in web application security.",
    },
  ]

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">Find Top Tech Talent</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Browse verified professionals ready to bring your project to life.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {talents.map((talent) => (
              <Card key={talent.id} className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={talent.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{talent.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{talent.name}</h3>
                      <p className="text-sm text-muted-foreground">{talent.title}</p>
                      <div className="mt-2 flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{talent.rating}</span>
                        <span className="text-muted-foreground">({talent.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-muted-foreground line-clamp-2">{talent.bio}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {talent.skills.slice(0, 4).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {talent.skills.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{talent.skills.length - 4}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{talent.location}</span>
                      </div>
                      <div className="flex items-center gap-1 font-medium">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>${talent.hourlyRate}/hr</span>
                      </div>
                    </div>
                    <Button asChild size="sm">
                      <Link href={`/talents/${talent.id}`}>View Profile</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
