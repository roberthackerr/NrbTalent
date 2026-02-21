// components/tracking/team-members.tsx
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Project, Task } from '@/lib/tracking/types'
import { Users, Mail, Phone, Calendar, Clock } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  phone?: string
  tasksAssigned: number
  tasksCompleted: number
  totalHours: number
}

interface TeamMembersProps {
  project: Project
  tasks: Task[]
}

export function TeamMembers({ project, tasks }: TeamMembersProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTeamMembers()
  }, [project.id, tasks])

  const loadTeamMembers = async () => {
    try {
      // Simuler le chargement des membres d'équipe
      // En réalité, vous feriez un appel API pour récupérer les utilisateurs du projet
      const members: TeamMember[] = [
        {
          id: '1',
          name: 'Jean Dupont',
          email: 'jean.dupont@example.com',
          role: 'Développeur Frontend',
          phone: '+33 1 23 45 67 89',
          tasksAssigned: tasks.filter(t => t.assigneeId === '1').length,
          tasksCompleted: tasks.filter(t => t.assigneeId === '1' && t.status === 'done').length,
          totalHours: tasks
            .filter(t => t.assigneeId === '1')
            .reduce((sum, task) => sum + (task.actualHours || 0), 0)
        },
        {
          id: '2',
          name: 'Marie Martin',
          email: 'marie.martin@example.com',
          role: 'Designer UX/UI',
          phone: '+33 1 34 56 78 90',
          tasksAssigned: tasks.filter(t => t.assigneeId === '2').length,
          tasksCompleted: tasks.filter(t => t.assigneeId === '2' && t.status === 'done').length,
          totalHours: tasks
            .filter(t => t.assigneeId === '2')
            .reduce((sum, task) => sum + (task.actualHours || 0), 0)
        }
      ]
      
      setTeamMembers(members)
    } catch (error) {
      console.error('Error loading team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressPercentage = (assigned: number, completed: number) => {
    return assigned > 0 ? Math.round((completed / assigned) * 100) : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement de l'équipe...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Équipe du projet</h2>
          <p className="text-slate-600">
            {teamMembers.length} membre(s) travaillent sur ce projet
          </p>
        </div>
        <Button className="gap-2">
          <Users className="h-4 w-4" />
          Inviter un membre
        </Button>
      </div>

      {/* Liste des membres */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {teamMembers.map(member => {
          const progress = getProgressPercentage(member.tasksAssigned, member.tasksCompleted)
          
          return (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <p className="text-slate-600 text-sm">{member.role}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {progress}% de complétion
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Coordonnées */}
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="h-4 w-4" />
                    {member.email}
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="h-4 w-4" />
                      {member.phone}
                    </div>
                  )}
                </div>

                {/* Métriques */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{member.tasksAssigned}</p>
                    <p className="text-xs text-slate-600">Tâches assignées</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{member.tasksCompleted}</p>
                    <p className="text-xs text-slate-600">Tâches terminées</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{member.totalHours}h</p>
                    <p className="text-xs text-slate-600">Heures travaillées</p>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">Progression des tâches</span>
                    <span className="text-slate-600">
                      {member.tasksCompleted}/{member.tasksAssigned}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Mail className="h-4 w-4" />
                    Contacter
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Calendar className="h-4 w-4" />
                    Planning
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {teamMembers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Aucun membre dans l'équipe</h3>
            <p className="text-slate-600 mb-4">
              Commencez par inviter des membres à rejoindre votre projet.
            </p>
            <Button className="gap-2">
              <Users className="h-4 w-4" />
              Inviter des membres
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}