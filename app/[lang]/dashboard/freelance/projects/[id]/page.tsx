"use client"

import type React from "react"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DollarSign, Calendar, ArrowLeft, Star } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import type { Project } from "@/lib/models/user"

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [showApplicationForm, setShowApplicationForm] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [params.id])

  async function fetchProject() {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      }
    } catch (error) {
      console.error("Error fetching project:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleApply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setApplying(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      coverLetter: formData.get("coverLetter"),
      proposedBudget: Number.parseInt(formData.get("proposedBudget") as string),
      estimatedDuration: formData.get("estimatedDuration"),
    }

    try {
      const response = await fetch(`/api/projects/${params.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success("Application submitted successfully!")
        setShowApplicationForm(false)
        router.push("/dashboard/freelance/applications")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to submit application")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <DashboardSidebar role="freelance" />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading project...</p>
        </main>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-screen">
        <DashboardSidebar role="freelance" />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Project not found</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <DashboardSidebar role="freelance" />

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-8">
          <Button variant="ghost" asChild className="mb-6 gap-2">
            <Link href="/dashboard/freelance/projects">
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Link>
          </Button>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold">{project.title}</h1>
                      <Badge variant="secondary" className="mt-2">
                        {project.category}
                      </Badge>
                    </div>
                    <Badge variant={project.status === "open" ? "default" : "secondary"}>{project.status}</Badge>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="mb-3 text-lg font-semibold">Project Description</h2>
                    <p className="whitespace-pre-wrap text-muted-foreground">{project.description}</p>
                  </div>

                  <div>
                    <h2 className="mb-3 text-lg font-semibold">Required Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {project.skills.map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/40 p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm">Budget</span>
                      </div>
                      <p className="mt-2 text-lg font-semibold">
                        ${project.budget.min.toLocaleString()} - ${project.budget.max.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">{project.budget.type}</p>
                    </div>

                    {project.deadline && (
                      <div className="rounded-lg border border-border/40 p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">Deadline</span>
                        </div>
                        <p className="mt-2 text-lg font-semibold">{new Date(project.deadline).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {showApplicationForm && (
                <Card className="mt-6 p-6">
                  <h2 className="mb-4 text-xl font-semibold">Submit Your Application</h2>
                  <form onSubmit={handleApply} className="space-y-4">
                    <div>
                      <Label htmlFor="coverLetter">Cover Letter</Label>
                      <Textarea
                        id="coverLetter"
                        name="coverLetter"
                        placeholder="Explain why you're the best fit for this project..."
                        required
                        className="mt-1.5 min-h-[150px]"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="proposedBudget">Your Proposed Budget ($)</Label>
                        <Input
                          id="proposedBudget"
                          name="proposedBudget"
                          type="number"
                          required
                          className="mt-1.5"
                          placeholder={`${project.budget.min} - ${project.budget.max}`}
                        />
                      </div>
                      <div>
                        <Label htmlFor="estimatedDuration">Estimated Duration</Label>
                        <Input
                          id="estimatedDuration"
                          name="estimatedDuration"
                          placeholder="e.g. 2 weeks"
                          required
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setShowApplicationForm(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={applying}>
                        {applying ? "Submitting..." : "Submit Application"}
                      </Button>
                    </div>
                  </form>
                </Card>
              )}
            </div>

            <div>
              <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Project Details</h2>
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Posted</span>
                    <span className="font-medium">{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Applications</span>
                    <span className="font-medium">{project.applications?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="secondary" className="capitalize">
                      {project.status}
                    </Badge>
                  </div>
                </div>

                {project.status === "open" && !showApplicationForm && (
                  <Button className="mt-6 w-full" onClick={() => setShowApplicationForm(true)}>
                    Apply Now
                  </Button>
                )}
              </Card>

              <Card className="mt-6 p-6">
                <h2 className="mb-4 text-lg font-semibold">About the Client</h2>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>C</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Client Name</p>
                    <p className="text-sm text-muted-foreground">Member since 2024</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Projects Posted</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hire Rate</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">4.8</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
