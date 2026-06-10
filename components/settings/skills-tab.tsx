// components/settings/skills-tab.tsx
'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap, Plus, X, Star, TrendingUp, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface SkillsTabProps {
  user: any
  dict: any
  lang: string
  onUpdate?: () => void
}

interface Skill {
  id: string
  name: string
  category: string
  level: "beginner" | "intermediate" | "advanced" | "expert"
  yearsOfExperience: number
  featured: boolean
}

export function SkillsTab({ user, dict, lang, onUpdate }: SkillsTabProps) {
  const [loading, setLoading] = useState(false)
  const [skills, setSkills] = useState<Skill[]>([])
  const [popularSkills, setPopularSkills] = useState<string[]>([])
  const [skillCategories, setSkillCategories] = useState<string[]>([])
  
  const [newSkill, setNewSkill] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [skillLevel, setSkillLevel] = useState<Skill["level"]>("intermediate")
  const [yearsOfExperience, setYearsOfExperience] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)

  useEffect(() => {
    fetchSkills()
    fetchPopularSkills()
    fetchSkillCategories()
  }, [])

  const fetchSkills = async () => {
    try {
      const response = await fetch('/api/users/profile')
      if (response.ok) {
        const userData = await response.json()
        setSkills(userData.skills || [])
      }
    } catch (error) {
      console.error('Error fetching skills:', error)
      toast.error(dict.errors?.fetch || "Error loading skills")
    }
  }

  const fetchPopularSkills = async () => {
    try {
      const response = await fetch('/api/skills/popular')
      if (response.ok) {
        const data = await response.json()
        setPopularSkills(data.skills || [])
      } else {
        setPopularSkills([
          "React", "TypeScript", "Node.js", "Python", "Next.js",
          "Vue.js", "Angular", "PHP", "Laravel", "Java",
          "Docker", "AWS", "MongoDB", "PostgreSQL", "Figma"
        ])
      }
    } catch (error) {
      setPopularSkills([
        "React", "TypeScript", "Node.js", "Python", "Next.js",
        "Vue.js", "Angular", "PHP", "Laravel", "Java"
      ])
    }
  }

  const fetchSkillCategories = async () => {
    try {
      const response = await fetch('/api/skills/categories')
      if (response.ok) {
        const data = await response.json()
        setSkillCategories(data.categories || [])
      } else {
        setSkillCategories([
          "Web Development", "Mobile Development", "UI/UX Design",
          "DevOps", "Data Science", "Marketing", "Other"
        ])
      }
    } catch (error) {
      setSkillCategories([
        "Web Development", "Mobile Development", "UI/UX Design",
        "DevOps", "Data Science", "Marketing", "Other"
      ])
    }
  }

  const filteredSkills = Array.isArray(popularSkills) 
    ? popularSkills.filter((skill: string) =>
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : []

  const addSkill = async () => {
    const skillToAdd = showCustomInput ? newSkill : (newSkill || searchTerm)
    
    if (!skillToAdd.trim() || !selectedCategory) {
      toast.error(dict.errors?.missingFields || "Please enter a skill and select a category")
      return
    }

    const skillExists = skills.some(skill => 
      skill.name.toLowerCase() === skillToAdd.toLowerCase()
    )

    if (skillExists) {
      toast.error(dict.errors?.alreadyExists || "This skill already exists")
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          section: 'professional',
          data: {
            skills: [
              ...skills,
              {
                id: Date.now().toString(),
                name: skillToAdd.trim(),
                category: selectedCategory,
                level: skillLevel,
                yearsOfExperience,
                featured: false
              }
            ]
          }
        })
      })

      if (response.ok) {
        await fetchSkills()
        setNewSkill("")
        setSearchTerm("")
        setSelectedCategory("")
        setSkillLevel("intermediate")
        setYearsOfExperience(1)
        setShowCustomInput(false)
        toast.success(dict.success?.added || "Skill added successfully!")
        if (onUpdate) onUpdate()
      } else {
        throw new Error('Failed to add skill')
      }
    } catch (error) {
      toast.error(dict.errors?.add || "Error adding skill")
    } finally {
      setLoading(false)
    }
  }

  const removeSkill = async (skillId: string) => {
    setLoading(true)
    try {
      const updatedSkills = skills.filter(skill => skill.id !== skillId)
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          section: 'professional',
          data: { skills: updatedSkills }
        })
      })

      if (response.ok) {
        setSkills(updatedSkills)
        toast.success(dict.success?.removed || "Skill removed!")
        if (onUpdate) onUpdate()
      } else {
        throw new Error('Failed to remove skill')
      }
    } catch (error) {
      toast.error(dict.errors?.remove || "Error removing skill")
    } finally {
      setLoading(false)
    }
  }

  const toggleFeatured = async (skillId: string) => {
    setLoading(true)
    try {
      const updatedSkills = skills.map(skill => 
        skill.id === skillId ? { ...skill, featured: !skill.featured } : skill
      )
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          section: 'professional',
          data: { skills: updatedSkills }
        })
      })

      if (response.ok) {
        setSkills(updatedSkills)
        toast.success(dict.success?.updated || "Skill updated!")
        if (onUpdate) onUpdate()
      } else {
        throw new Error('Failed to update skill')
      }
    } catch (error) {
      toast.error(dict.errors?.update || "Error updating skill")
    } finally {
      setLoading(false)
    }
  }

  const getLevelColor = (level: Skill["level"]) => {
    switch (level) {
      case "beginner": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
      case "intermediate": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
      case "advanced": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
      case "expert": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
    }
  }

  const getLevelText = (level: Skill["level"]) => dict.levels?.[level] || level

  const featuredSkills = skills.filter(skill => skill.featured)
  const otherSkills = skills.filter(skill => !skill.featured)

  return (
    <div className="space-y-4">
      {/* Add Skills - Compact */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-4 w-4 text-yellow-500" />
            {dict.addTitle || "Add Skills"}
          </CardTitle>
          <CardDescription className="text-xs">
            {dict.addDescription || "Add your professional skills"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Skill Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{dict.title || "Skill"}</Label>
              {showCustomInput ? (
                <div className="space-y-1.5">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Enter skill name"
                    className="h-9 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCustomInput(false)}
                    className="text-xs h-7 px-2"
                  >
                    ← {dict.back || "Back to list"}
                  </Button>
                </div>
              ) : (
                <Select value={newSkill} onValueChange={setNewSkill}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder={dict.searchSkills || "Search or select skill"} />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-8 text-sm mb-2"
                      />
                    </div>
                    <div className="max-h-48 overflow-auto">
                      {filteredSkills.slice(0, 8).map((skill) => (
                        <SelectItem key={skill} value={skill} className="text-sm">
                          {skill}
                        </SelectItem>
                      ))}
                    </div>
                    <div className="border-t p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCustomInput(true)}
                        className="w-full justify-start text-xs h-8"
                      >
                        <Plus className="h-3 w-3 mr-1" /> {dict.addCustom || "Add custom skill"}
                      </Button>
                    </div>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{dict.category || "Category"}</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {skillCategories.map((category) => (
                    <SelectItem key={category} value={category} className="text-sm">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 grid-cols-2">
            {/* Proficiency Level */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{dict.proficiency || "Level"}</Label>
              <Select value={skillLevel} onValueChange={(value: Skill["level"]) => setSkillLevel(value)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner" className="text-sm">Beginner</SelectItem>
                  <SelectItem value="intermediate" className="text-sm">Intermediate</SelectItem>
                  <SelectItem value="advanced" className="text-sm">Advanced</SelectItem>
                  <SelectItem value="expert" className="text-sm">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Years of Experience */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{dict.yearsOfExperience || "Years"}</Label>
              <Input
                type="number"
                min="0"
                max="50"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(parseInt(e.target.value) || 0)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <Button 
            onClick={addSkill}
            disabled={loading || (!newSkill.trim() && !searchTerm.trim()) || !selectedCategory}
            size="sm"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 h-9"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {loading ? (dict.saving || "Adding...") : (dict.addSkill || "Add Skill")}
          </Button>
        </CardContent>
      </Card>

      {/* Featured Skills - Compact */}
      {featuredSkills.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-4 w-4 text-yellow-500" />
              {dict.featuredTitle || "Featured Skills"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {featuredSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border border-yellow-200 dark:border-yellow-800 rounded-full px-3 py-1 group"
                >
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    {skill.name}
                  </span>
                  <Badge className={cn("text-[10px] px-1.5 py-0 h-4", getLevelColor(skill.level))}>
                    {getLevelText(skill.level).substring(0, 3)}
                  </Badge>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleFeatured(skill.id)}
                      className="p-0.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded"
                    >
                      <Star className="h-3 w-3 fill-current" />
                    </button>
                    <button
                      onClick={() => removeSkill(skill.id)}
                      className="p-0.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Skills - Compact List */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{dict.allSkillsTitle || "All Skills"}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {skills.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {skills.length > 0 ? (
            <div className="space-y-2">
              {otherSkills.slice(0, 5).map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {skill.name}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 h-4">
                        {skill.category}
                      </Badge>
                      <Badge className={cn("text-[10px] px-1.5 h-4", getLevelColor(skill.level))}>
                        {getLevelText(skill.level)}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {skill.yearsOfExperience}y
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleFeatured(skill.id)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                      title="Feature"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeSkill(skill.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                      title="Remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {otherSkills.length > 5 && (
                <button className="w-full text-center text-xs text-blue-600 hover:text-blue-700 py-2">
                  + {otherSkills.length - 5} more skills
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Zap className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {dict.emptyState || "No skills added yet"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {dict.addDescription || "Add your first skill above"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats - Compact */}
      {skills.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {skills.length}
            </div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              {dict.skillsLabel || "Skills"}
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
              {featuredSkills.length}
            </div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              {dict.featuredLabel || "Featured"}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {Math.round(skills.reduce((acc, skill) => acc + skill.yearsOfExperience, 0) / skills.length * 10) / 10}
            </div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              {dict.avgExperienceLabel || "Avg Years"}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}