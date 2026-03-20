import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, MapPin, DollarSign, Briefcase, Award, Globe, Calendar, CheckCircle2 } from "lucide-react"
import { notFound } from "next/navigation"

async function getFreelancer(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/users/${id}`, {
      cache: "no-store",
    })

    if (!res.ok) {
      return null
    }

    return res.json()
  } catch (error) {
    console.error("Error fetching freelancer:", error)
    return null
  }
}

export default async function FreelancerProfilePage({ params }: { params: { id: string } }) {
  const freelancer = await getFreelancer(params.id)

  if (!freelancer || freelancer.role !== "freelance") {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <Card className="p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex gap-6">
                <Avatar className="h-24 w-24 border-2 border-border">
                  <AvatarImage src={freelancer.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl">{freelancer.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">{freelancer.name}</h1>
                    {freelancer.verified && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-lg text-muted-foreground">{freelancer.title || "Freelancer"}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                    {freelancer.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{freelancer.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({freelancer.reviewCount || 0} reviews)</span>
                      </div>
                    )}

                    {freelancer.location && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{freelancer.location}</span>
                      </div>
                    )}

                    {freelancer.completedProjects !== undefined && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span>{freelancer.completedProjects} projects completed</span>
                      </div>
                    )}
                  </div>

                  {freelancer.badges && freelancer.badges.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {freelancer.badges.map((badge: any, index: number) => (
                        <Badge key={index} variant="outline" className="gap-1">
                          <Award className="h-3 w-3" />
                          {badge.type.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 md:items-end">
                {freelancer.hourlyRate && (
                  <div className="flex items-center gap-1 text-2xl font-bold">
                    <DollarSign className="h-6 w-6" />
                    <span>{freelancer.hourlyRate}</span>
                    <span className="text-base font-normal text-muted-foreground">/hr</span>
                  </div>
                )}

                <Button size="lg" className="w-full gap-2 md:w-auto">
                  <Briefcase className="h-4 w-4" />
                  Hire Me
                </Button>

                <Button variant="outline" size="lg" className="w-full md:w-auto bg-transparent">
                  Send Message
                </Button>
              </div>
            </div>
          </Card>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="space-y-8 lg:col-span-2">
              {/* About */}
              {freelancer.bio && (
                <Card className="p-6">
                  <h2 className="mb-4 text-xl font-semibold">About</h2>
                  <p className="text-muted-foreground leading-relaxed">{freelancer.bio}</p>
                </Card>
              )}

              {/* Skills */}
              {freelancer.skills && freelancer.skills.length > 0 && (
                <Card className="p-6">
                  <h2 className="mb-4 text-xl font-semibold">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {freelancer.skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="px-3 py-1.5">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Portfolio */}
              {freelancer.portfolio && freelancer.portfolio.length > 0 && (
                <Card className="p-6">
                  <h2 className="mb-4 text-xl font-semibold">Portfolio</h2>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {freelancer.portfolio.map((project: any, index: number) => (
                      <Card key={index} className="overflow-hidden border-border/50">
                        {project.image && (
                          <div className="aspect-video bg-muted">
                            <img
                              src={project.image || "/placeholder.svg"}
                              alt={project.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold">{project.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                          {project.url && (
                            <Button variant="link" className="mt-2 h-auto p-0" asChild>
                              <a href={project.url} target="_blank" rel="noopener noreferrer">
                                View Project →
                              </a>
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
              )}

              {/* Certifications */}
              {freelancer.certifications && freelancer.certifications.length > 0 && (
                <Card className="p-6">
                  <h2 className="mb-4 text-xl font-semibold">Certifications</h2>
                  <div className="space-y-4">
                    {freelancer.certifications.map((cert: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 border-b border-border/40 pb-4 last:border-0 last:pb-0"
                      >
                        <Award className="mt-1 h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <h3 className="font-semibold">{cert.name}</h3>
                          <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Earned {new Date(cert.earnedAt).toLocaleDateString()}
                          </p>
                          {cert.certificateUrl && (
                            <Button variant="link" className="mt-1 h-auto p-0 text-xs" asChild>
                              <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer">
                                View Certificate →
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Availability */}
              {freelancer.availability && (
                <Card className="p-6">
                  <h3 className="mb-4 font-semibold">Availability</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge
                        variant={
                          freelancer.availability.status === "available"
                            ? "default"
                            : freelancer.availability.status === "busy"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {freelancer.availability.status}
                      </Badge>
                    </div>
                    {freelancer.availability.hoursPerWeek && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Hours/week</span>
                        <span className="font-medium">{freelancer.availability.hoursPerWeek}h</span>
                      </div>
                    )}
                    {freelancer.availability.nextAvailable && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Available from {new Date(freelancer.availability.nextAvailable).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Languages */}
              {freelancer.languages && freelancer.languages.length > 0 && (
                <Card className="p-6">
                  <h3 className="mb-4 font-semibold">Languages</h3>
                  <div className="space-y-2">
                    {freelancer.languages.map((language: string) => (
                      <div key={language} className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span>{language}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Quick Stats */}
              <Card className="p-6">
                <h3 className="mb-4 font-semibold">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Member since</span>
                    <span className="font-medium">
                      {new Date(freelancer.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {freelancer.completedProjects !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="font-medium">{freelancer.completedProjects} projects</span>
                    </div>
                  )}
                  {freelancer.cancelledProjects !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Cancelled</span>
                      <span className="font-medium">{freelancer.cancelledProjects} projects</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
