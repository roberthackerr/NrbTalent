"use client"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Plus, X } from "lucide-react"
import { useState } from "react"

export default function FreelanceProfile() {
  const [skills, setSkills] = useState(["React", "Node.js", "TypeScript", "MongoDB"])
  const [newSkill, setNewSkill] = useState("")

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  return (
    <div className="flex h-screen">
      <DashboardSidebar role="freelance" />

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="mt-2 text-muted-foreground">Manage your professional profile and portfolio.</p>
          </div>

          <div className="space-y-6">
            {/* Profile Picture */}
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Profile Picture</h2>
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/placeholder.svg?height=96&width=96" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <Camera className="h-4 w-4" />
                    Change Photo
                  </Button>
                  <p className="mt-2 text-sm text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>
            </Card>

            {/* Basic Information */}
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Basic Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue="John Doe" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="title">Professional Title</Label>
                  <Input id="title" placeholder="e.g. Full-Stack Developer" className="mt-1.5" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell clients about yourself and your experience..."
                    className="mt-1.5 min-h-[120px]"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="e.g. New York, USA" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input id="hourlyRate" type="number" placeholder="50" className="mt-1.5" />
                </div>
              </div>
            </Card>

            {/* Skills */}
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Skills</h2>
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
                  placeholder="Add a skill..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addSkill()}
                />
                <Button onClick={addSkill} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </Card>

            {/* Portfolio */}
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Portfolio</h2>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Plus className="h-4 w-4" />
                  Add Project
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2].map((i) => (
                  <Card key={i} className="overflow-hidden border-border/50">
                    <div className="aspect-video bg-muted" />
                    <div className="p-4">
                      <h3 className="font-semibold">Project Title {i}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Brief description of the project...</p>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <Button variant="outline">Cancel</Button>
              <Button>Save Changes</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
