"use client"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Briefcase, Clock, DollarSign } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import type { Project } from "@/lib/models/user"

const categories = [
  "All Categories",
  "Web Development",
  "Mobile Development",
  "AI & Machine Learning",
  "Cybersecurity",
  "Telecommunications",
  "UI/UX Design",
  "Data Science",
  "DevOps",
  "Blockchain",
]

export default function BrowseProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")

  useEffect(() => {
    fetchProjects()
  }, [selectedCategory])

  async function fetchProjects() {
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== "All Categories") {
        params.append("category", selectedCategory)
      }

      const response = await fetch(`/api/projects?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="flex h-screen">
      <DashboardSidebar role="freelance" />

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Browse Projects</h1>
            <p className="mt-2 text-muted-foreground">
              Find your next opportunity from thousands of available projects.
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6 p-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Projects List */}
          {loading ? (
            <div className="text-center text-muted-foreground">Loading projects...</div>
          ) : filteredProjects.length === 0 ? (
            <Card className="p-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No projects found</h3>
              <p className="mt-2 text-muted-foreground">Try adjusting your filters or check back later.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <Card key={project._id?.toString()} className="p-6 transition-all hover:border-primary/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{project.title}</h3>
                          <Badge variant="secondary" className="mt-2">
                            {project.category}
                          </Badge>
                        </div>
                      </div>

                      <p className="mt-3 text-muted-foreground line-clamp-2">{project.description}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {project.skills.slice(0, 5).map((skill) => (
                          <Badge key={skill} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                        {project.skills.length > 5 && (
                          <Badge variant="outline">+{project.skills.length - 5} more</Badge>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>
                            ${project.budget.min.toLocaleString()} - ${project.budget.max.toLocaleString()}
                          </span>
                          <span className="text-xs">({project.budget.type})</span>
                        </div>
                        {project.deadline && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                            </div>
                          </>
                        )}
                        <span>•</span>
                        <span>Posted {new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <Button asChild className="ml-4">
                      <Link href={`/dashboard/freelance/projects/${project._id}`}>View Details</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
