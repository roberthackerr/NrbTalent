// /app/(dashboard)/groups/my-groups/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Users, Calendar, MessageSquare, TrendingUp, Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GroupCard } from '@/components/groups/GroupCard'
import { Group } from '@/lib/models/group'

export default function MyGroupsPage() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [stats, setStats] = useState({
    total: 0,
    asOwner: 0,
    asAdmin: 0,
    active: 0
  })

  useEffect(() => {
    fetchUserGroups()
  }, [activeTab])

  const fetchUserGroups = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab !== 'all') params.set('role', activeTab)
      
      const response = await fetch(`/api/user/groups?${params}`)
      const data = await response.json()
      
      setGroups(data.groups)
      calculateStats(data.groups)
    } catch (error) {
      console.error('Error fetching user groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (groups: any[]) => {
    const stats = {
      total:  groups?.length ? groups.length : 0,
      asOwner:  groups?.filter(g => g.membership.role === 'owner').length,
      asAdmin: groups?.filter(g => g.membership.role === 'admin').length,
      active: groups?.filter(g => 
        new Date(g.lastActivityAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
    }
    setStats(stats)
  }

  const filteredGroups = groups?.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Mes groupes</h1>
            <p className="text-slate-600 mt-2">
              Gérez vos communautés et découvrez de nouveaux groupes
            </p>
          </div>
          <Button asChild>
            <a href="/groups/create">
              <Plus className="h-4 w-4 mr-2" />
              Créer un groupe
            </a>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Groupes total</span>
            </div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="font-semibold">En tant que propriétaire</span>
            </div>
            <div className="text-3xl font-bold">{stats.asOwner}</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <span className="font-semibold">En tant qu'admin</span>
            </div>
            <div className="text-3xl font-bold">{stats.asAdmin}</div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-amber-600" />
              <span className="font-semibold">Actifs récemment</span>
            </div>
            <div className="text-3xl font-bold">{stats.active}</div>
          </div>
        </div>

        {/* Search and Tabs */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher dans mes groupes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="owner">Propriétaire</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
              <TabsTrigger value="member">Membre</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-slate-200 h-64 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : filteredGroups && filteredGroups.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <GroupCard
                key={group._id}
                group={group}
                showJoinButton={false}
              />
            ))}
          </div>
          
          {groups.length > 6 && (
            <div className="text-center mt-8">
              <Button variant="outline" size="lg">
                Voir plus de groupes
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {activeTab === 'all' ? 'Vous n\'êtes membre d\'aucun groupe' : 'Aucun groupe trouvé'}
          </h3>
          <p className="text-slate-600 mb-6">
            {activeTab === 'all' 
              ? 'Rejoignez des groupes ou créez le vôtre pour commencer'
              : 'Vous n\'avez pas de groupes avec ce rôle'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <a href="/groups">Explorer les groupes</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/groups/create">Créer un groupe</a>
            </Button>
          </div>
        </div>
      )}

      {/* Recommended Groups Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Groupes recommandés</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Ici vous pouvez ajouter des groupes recommandés */}
        </div>
      </div>
    </div>
  )
}