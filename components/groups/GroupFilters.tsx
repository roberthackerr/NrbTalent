// /components/groups/GroupFilters.tsx - CORRIGÉ
'use client'

import { useState } from 'react'
import { Filter, X, Tag, MapPin, Briefcase, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface GroupFiltersProps {
  filters: {
    type: string
    skills: string[]
    location: string
    sortBy: string
  }
  onChange: (filters: any) => void
}

const GROUP_TYPES = [
  { value: '', label: 'Tous les types', icon: Users },
  { value: 'skill', label: 'Compétences', icon: Zap },
  { value: 'location', label: 'Localisation', icon: MapPin },
  { value: 'professional', label: 'Professionnel', icon: Briefcase },
  { value: 'company', label: 'Entreprise', icon: Briefcase },
  { value: 'learning', label: 'Apprentissage', icon: Users },
  { value: 'interest', label: 'Intérêt', icon: Tag }
]

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Pertinence' },
  { value: 'members', label: 'Membres (décroissant)' },
  { value: 'activity', label: 'Activité récente' },
  { value: 'newest', label: 'Plus récents' }
]

const POPULAR_SKILLS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'UI/UX Design',
  'Digital Marketing', 'Content Writing', 'Mobile Development',
  'DevOps', 'Data Science', 'Graphic Design', 'Video Editing'
]

export function GroupFilters({ filters, onChange }: GroupFiltersProps) {
  const [skills, setSkills] = useState<string[]>(filters.skills)
  const [customSkill, setCustomSkill] = useState('')

  const handleSkillToggle = (skill: string) => {
    const newSkills = skills.includes(skill)
      ? skills.filter(s => s !== skill)
      : [...skills, skill]
    
    setSkills(newSkills)
    onChange({ ...filters, skills: newSkills })
  }

  const addCustomSkill = () => {
    if (customSkill.trim() && !skills.includes(customSkill.trim())) {
      const newSkills = [...skills, customSkill.trim()]
      setSkills(newSkills)
      setCustomSkill('')
      onChange({ ...filters, skills: newSkills })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomSkill()
    }
  }

  const clearFilters = () => {
    setSkills([])
    onChange({
      type: '',
      skills: [],
      location: '',
      sortBy: 'relevance'
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filtres
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Type de groupe */}
        <div>
          <Label className="mb-2 block">Type de groupe</Label>
          <Select
            value={filters.type || ''} // ← CORRECTION ICI: valeur par défaut ''
            onValueChange={(value) => onChange({ ...filters, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un type" />
            </SelectTrigger>
            <SelectContent>
              {GROUP_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <SelectItem 
                    key={type.value} 
                    value={type.value || 'all'} // ← CORRECTION ICI: valeur non vide
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Compétences */}
        <div>
          <Label className="mb-2 block">Compétences</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.map(skill => (
              <Badge
                key={skill}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => handleSkillToggle(skill)}
              >
                {skill}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
          
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter une compétence..."
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addCustomSkill}
                disabled={!customSkill.trim()}
              >
                Ajouter
              </Button>
            </div>
            
            <div>
              <p className="text-sm text-slate-500 mb-2">Populaires :</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SKILLS.map(skill => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className={`cursor-pointer ${
                      skills.includes(skill) ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => handleSkillToggle(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Localisation */}
        <div>
          <Label className="mb-2 block">Localisation</Label>
          <Input
            placeholder="Ville ou pays"
            value={filters.location}
            onChange={(e) => onChange({ ...filters, location: e.target.value })}
          />
        </div>

        <Separator />

        {/* Tri */}
        <div>
          <Label className="mb-2 block">Trier par</Label>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => onChange({ ...filters, sortBy: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un tri" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={clearFilters}
          >
            Réinitialiser
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              // Appliquer les filtres
            }}
          >
            Appliquer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}