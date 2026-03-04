"use client"

import type React from "react"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"

const categories = [
  "Web Development",
  "Mobile Development",
  "AI & Machine Learning",
  "Cybersecurity",
  "Telecommunications",
  "UI/UX Design",
  "Data Science",
  "DevOps",
  "Blockchain",
  "Other",
]

export default function PostProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [budgetType, setBudgetType] = useState<"fixed" | "hourly">("fixed")

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      budgetMin: Number.parseInt(formData.get("budgetMin") as string),
      budgetMax: Number.parseInt(formData.get("budgetMax") as string),
      budgetType,
      skills,
      deadline: formData.get("deadline") || undefined,
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success("Project posted successfully!")
        router.push("/dashboard/client/projects")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to post project")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen">
      <DashboardSidebar role="client" />

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Post a New Project</h1>
            <p className="mt-2 text-muted-foreground">
              Describe your project and find the perfect freelancer to bring it to life.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Project Details */}
              <Card className="p-6">
                <h2 className="mb-4 text-xl font-semibold">Project Details</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Project Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g. Build a responsive e-commerce website"
                      required
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Project Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe your project in detail, including requirements, deliverables, and any specific technologies..."
                      required
                      className="mt-1.5 min-h-[200px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" required>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select a category" />
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
                </div>
              </Card>

              {/* Skills Required */}
              <Card className="p-6">
                <h2 className="mb-4 text-xl font-semibold">Required Skills</h2>
                <div className="mb-4 flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1 px-3 py-1.5">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a required skill..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" onClick={addSkill} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </Card>

              {/* Budget & Timeline */}
              <Card className="p-6">
                <h2 className="mb-4 text-xl font-semibold">Budget & Timeline</h2>
                <div className="space-y-4">
                  <div>
                    <Label>Budget Type</Label>
                    <div className="mt-3 flex gap-4">
                      <button
                        type="button"
                        onClick={() => setBudgetType("fixed")}
                        className={`flex-1 rounded-lg border-2 p-4 text-left transition-colors ${
                          budgetType === "fixed" ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="font-semibold">Fixed Price</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          One-time payment for the entire project
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBudgetType("hourly")}
                        className={`flex-1 rounded-lg border-2 p-4 text-left transition-colors ${
                          budgetType === "hourly" ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="font-semibold">Hourly Rate</div>
                        <div className="mt-1 text-sm text-muted-foreground">Pay based on hours worked</div>
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="budgetMin">Minimum Budget ($)</Label>
                      <Input id="budgetMin" name="budgetMin" type="number" required className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="budgetMax">Maximum Budget ($)</Label>
                      <Input id="budgetMax" name="budgetMax" type="number" required className="mt-1.5" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="deadline">Project Deadline (Optional)</Label>
                    <Input id="deadline" name="deadline" type="date" className="mt-1.5" />
                  </div>
                </div>
              </Card>

              {/* Submit */}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || skills.length === 0}>
                  {loading ? "Posting..." : "Post Project"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
