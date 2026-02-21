"use client"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Briefcase, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function ClientProjectsPage() {
  const projects = {
    open: [
      {
        id: 1,
        title: "E-commerce Platform Development",
        budget: "$5,000 - $8,000",
        proposals: 23,
        posted: "3 days ago",
        category: "Web Development",
      },
      {
        id: 2,
        title: "Mobile App UI/UX Design",
        budget: "$2,000 - $3,500",
        proposals: 15,
        posted: "1 week ago",
        category: "UI/UX Design",
      },
    ],
    inProgress: [
      {
        id: 3,
        title: "API Integration & Testing",
        budget: "$2,000",
        freelancer: "Mike Johnson",
        progress: 90,
        deadline: "3 days left",
      },
    ],
    completed: [
      {
        id: 4,
        title: "Logo Design for Tech Startup",
        budget: "$800",
        freelancer: "Sarah Smith",
        completedDate: "2 weeks ago",
        rating: 5,
      },
    ],
  }

  return (
    <div className="flex h-screen">
      <DashboardSidebar role="client" />

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Projects</h1>
              <p className="mt-2 text-muted-foreground">Manage all your projects in one place.</p>
            </div>
            <Button asChild className="gap-2">
              <Link href="/dashboard/client/post-project">
                <Plus className="h-4 w-4" />
                Post New Project
              </Link>
            </Button>
          </div>

          <Tabs defaultValue="open" className="space-y-6">
            <TabsList>
              <TabsTrigger value="open" className="gap-2">
                <Briefcase className="h-4 w-4" />
                Open ({projects.open.length})
              </TabsTrigger>
              <TabsTrigger value="in-progress" className="gap-2">
                <Clock className="h-4 w-4" />
                In Progress ({projects.inProgress.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Completed ({projects.completed.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="open" className="space-y-4">
              {projects.open.map((project) => (
                <Card key={project.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{project.title}</h3>
                        <Badge variant="secondary">{project.category}</Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Budget: {project.budget}</span>
                        <span>•</span>
                        <span className="font-medium text-primary">{project.proposals} proposals received</span>
                        <span>•</span>
                        <span>Posted {project.posted}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" asChild>
                        <Link href={`/dashboard/client/projects/${project.id}/edit`}>Edit</Link>
                      </Button>
                      <Button asChild>
                        <Link href={`/dashboard/client/projects/${project.id}/proposals`}>View Proposals</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="in-progress" className="space-y-4">
              {projects.inProgress.map((project) => (
                <Card key={project.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{project.title}</h3>
                      <div className="mt-3 grid gap-4 sm:grid-cols-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Freelancer</p>
                          <p className="font-medium">{project.freelancer}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Budget</p>
                          <p className="font-medium">{project.budget}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Deadline</p>
                          <p className="font-medium">{project.deadline}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full bg-primary transition-all" style={{ width: `${project.progress}%` }} />
                        </div>
                      </div>
                    </div>
                    <Button asChild className="ml-4">
                      <Link href={`/dashboard/client/projects/${project.id}`}>View Details</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {projects.completed.map((project) => (
                <Card key={project.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{project.title}</h3>
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Freelancer: {project.freelancer}</span>
                        <span>•</span>
                        <span>Budget: {project.budget}</span>
                        <span>•</span>
                        <span>Completed {project.completedDate}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">Rating: {project.rating}/5 ⭐</span>
                      </div>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href={`/dashboard/client/projects/${project.id}`}>View Details</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
