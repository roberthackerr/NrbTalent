// app/dashboard/teams/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  Star,
  DollarSign,
  Calendar,
  Award,
  Clock,
  MapPin,
  Briefcase,
  Globe,
  Mail,
  ExternalLink,
  Settings,
  FileText,
  Package,
  TrendingUp,
  Target,
  CheckCircle,
  Heart,
  Share2,
  MessageSquare,
  BarChart,
  Users as UsersIcon,
  FolderOpen,
  ClipboardCheck,
  Search,
  Plus,
  Filter,
  ChevronRight,
  Zap,
  Shield,
  Sparkles,
  Building,
  MoreHorizontal,
  UserPlus,
  Copy,
  Eye,
  FileBarChart,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Timer,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types
interface Team {
  id: string;
  name: string;
  tagline: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  skills: Array<{ name: string; category: string }>;
  availability: 'available' | 'busy' | 'full';
  completedProjects: number;
  rating?: number;
  totalEarnings?: number;
  isLead: boolean;
  isPublic: boolean;
  createdAt: Date;
}

interface TeamProject {
  id: string;
  contractId: string;
  title: string;
  description: string;
  client: {
    id: string;
    name: string;
    avatar?: string;
    email: string;
  };
  value: number;
  currency: string;
  status: 'draft' | 'pending' | 'active' | 'completed' | 'cancelled';
  progress: number;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  type: string;
  milestones: Array<{
    title: string;
    amount: number;
    dueDate?: string;
    status: 'pending' | 'paid';
  }>;
}

interface TeamContract {
  id: string;
  title: string;
  team: {
    id: string;
    name: string;
    avatar?: string;
    members: number;
  };
  client: {
    id: string;
    name: string;
    avatar?: string;
    email: string;
  };
  value: number;
  currency: string;
  status: 'draft' | 'pending' | 'active' | 'completed' | 'cancelled';
  progress: number;
  startDate: string;
  endDate: string;
  type: string;
  signatures: {
    total: number;
    completed: number;
  };
  createdAt: Date;
}

interface TeamApplication {
  id: string;
  projectId: string;
  projectTitle: string;
  projectBudget: number;
  projectCategory: string;
  projectStatus: string;
  coverLetter: string;
  proposedBudget: number;
  estimatedTimeline: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export default function TeamsDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState({
    teams: true,
    projects: true,
    contracts: true,
    applications: true,
    stats: true
  });
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [teamProjects, setTeamProjects] = useState<TeamProject[]>([]);
  const [teamContracts, setTeamContracts] = useState<TeamContract[]>([]);
  const [teamApplications, setTeamApplications] = useState<TeamApplication[]>([]);
  
  // Stats state
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalProjects: 0,
    totalContracts: 0,
    totalRevenue: 0,
    activeProjects: 0,
    pendingApplications: 0,
    completionRate: 0,
    avgTeamRating: 0
  });

  // Fetch all data on mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAllData();
    }
  }, [status]);

  const fetchAllData = async () => {
    try {
      // Fetch user's teams
      const teamsResponse = await fetch('/api/teams/my-teams');
      const teamsData = await teamsResponse.json();
      
      if (teamsData.success) {
        setMyTeams(teamsData.teams);
        setLoading(prev => ({ ...prev, teams: false }));
      }

      // Calculate stats from teams
      if (teamsData.success && teamsData.teams.length > 0) {
        const totalRevenue = teamsData.teams.reduce((sum: number, team: any) => 
          sum + (team.totalEarnings || 0), 0);
        const avgRating = teamsData.teams.length > 0 
          ? teamsData.teams.reduce((sum: number, team: any) => sum + (team.rating || 0), 0) / teamsData.teams.length
          : 0;
        
        // Fetch contracts for all teams
        const allContracts = [];
        for (const team of teamsData.teams) {
          try {
            const contractsResponse = await fetch(`/api/teams/${team.id}/projects`);
            const contractsData = await contractsResponse.json();
            if (contractsData.success && contractsData.projects) {
              allContracts.push(...contractsData.projects);
            }
          } catch (error) {
            console.error(`Error fetching projects for team ${team.id}:`, error);
          }
        }
        
        const activeProjects = allContracts.filter((p: any) => p.status === 'active').length;
        const completedProjects = allContracts.filter((p: any) => p.status === 'completed').length;
        
        setTeamProjects(allContracts);
        setLoading(prev => ({ ...prev, projects: false }));
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalTeams: teamsData.teams.length,
          totalProjects: allContracts.length,
          activeProjects,
          totalRevenue,
          completionRate: allContracts.length > 0 
            ? (completedProjects / allContracts.length) * 100 
            : 0,
          avgTeamRating: avgRating
        }));
      }

      // Fetch user's contracts
      const contractsResponse = await fetch('/api/team/contracts?role=member');
      const contractsData = await contractsResponse.json();
      
      if (contractsData.success) {
        setTeamContracts(contractsData.contracts);
        setLoading(prev => ({ ...prev, contracts: false }));
        setStats(prev => ({
          ...prev,
          totalContracts: contractsData.contracts.length
        }));
      }

      // Fetch team applications (if user is team lead)
      if (teamsData.success) {
        const leadTeams = teamsData.teams.filter((team: any) => team.isLead);
        if (leadTeams.length > 0) {
          const applicationsResponse = await fetch(`/api/teams/${leadTeams[0].id}/applications`);
          const applicationsData = await applicationsResponse.json();
          
          if (applicationsData.success) {
            setTeamApplications(applicationsData.applications);
            setLoading(prev => ({ ...prev, applications: false }));
            setStats(prev => ({
              ...prev,
              pendingApplications: applicationsData.applications.filter((app: any) => app.status === 'pending').length
            }));
          }
        }
      }

      setLoading(prev => ({ ...prev, stats: false }));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    }
  };

  const handleCreateTeam = () => {
    router.push('/teams/create');
  };

  const handleViewTeam = (teamId: string) => {
    router.push(`/teams/${teamId}`);
  };

  const handleViewProject = (projectId: string) => {
    router.push(`/contracts/${projectId}`);
  };

  const handleCopyJoinCode = (joinCode: string) => {
    navigator.clipboard.writeText(joinCode);
    toast({
      title: 'Copied!',
      description: 'Join code copied to clipboard',
    });
  };

  const handleInviteMember = (teamId: string) => {
    toast({
      title: 'Invite Link Generated',
      description: 'Share this link with team members',
    });
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, { label: string; color: string; icon?: React.ReactNode }> = {
      active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: <Clock className="h-3 w-3 mr-1" /> },
      completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: <Award className="h-3 w-3 mr-1" /> },
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300', icon: <FileText className="h-3 w-3 mr-1" /> },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
      available: { label: 'Available', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      busy: { label: 'Busy', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
      full: { label: 'Full', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <Badge className={`${config.color} capitalize text-xs`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  // Loading skeleton for teams
  const TeamsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-3">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your teams, projects, and collaborations in one place
            </p>
          </div>
          <Button onClick={handleCreateTeam} className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="h-4 w-4 mr-2" />
            Create New Team
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {loading.stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Teams</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.totalTeams}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Active teams</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Active Projects</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.activeProjects}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Total: {stats.totalProjects}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <FolderOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatCurrency(stats.totalRevenue)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Team earnings</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400">Pending Applications</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.pendingApplications}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <ClipboardCheck className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-4 md:inline-flex">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900">
            <BarChart className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="teams" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900">
            <Users className="h-4 w-4 mr-2" />
            My Teams
            {myTeams.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0">
                {myTeams.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900">
            <FolderOpen className="h-4 w-4 mr-2" />
            Projects
            {teamProjects.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0">
                {teamProjects.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="applications" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Applications
            {teamApplications.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0">
                {teamApplications.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for managing your teams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto py-6 flex flex-col items-center justify-center"
                  onClick={() => router.push('/teams/create')}
                >
                  <Plus className="h-8 w-8 mb-2 text-blue-600" />
                  <span className="font-medium">Create Team</span>
                  <span className="text-sm text-gray-500 mt-1">Start a new team</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-6 flex flex-col items-center justify-center"
                  onClick={() => router.push('/contracts/create')}
                >
                  <FileText className="h-8 w-8 mb-2 text-green-600" />
                  <span className="font-medium">Create Contract</span>
                  <span className="text-sm text-gray-500 mt-1">Draft a new contract</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-6 flex flex-col items-center justify-center"
                  onClick={() => router.push('/projects')}
                >
                  <Target className="h-8 w-8 mb-2 text-purple-600" />
                  <span className="font-medium">Find Projects</span>
                  <span className="text-sm text-gray-500 mt-1">Browse opportunities</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Teams */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Teams</span>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('teams')}>
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading.teams ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : myTeams.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No teams yet</p>
                    <Button variant="outline" className="mt-4" onClick={handleCreateTeam}>
                      Create Your First Team
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myTeams.slice(0, 3).map((team) => (
                      <div key={team.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {team.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{team.name}</p>
                            <p className="text-sm text-gray-500">{team.memberCount} members</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {team.isLead && (
                            <Badge variant="outline" className="text-xs">
                              Lead
                            </Badge>
                          )}
                          <StatusBadge status={team.availability} />
                          <Button variant="ghost" size="sm" onClick={() => handleViewTeam(team.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Active Projects</span>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('projects')}>
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading.projects ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-2 w-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    ))}
                  </div>
                ) : teamProjects.filter(p => p.status === 'active').length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No active projects</p>
                    <Button variant="outline" className="mt-4" onClick={() => router.push('/projects')}>
                      Find Projects
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamProjects
                      .filter(p => p.status === 'active')
                      .slice(0, 3)
                      .map((project) => (
                        <div key={project.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {project.title}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {formatCurrency(project.value, project.currency)}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Progress</span>
                              <span className="font-medium">{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} className="h-2" />
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{project.daysRemaining} days remaining</span>
                            <Button variant="ghost" size="sm" onClick={() => handleViewProject(project.contractId)}>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* My Teams Tab */}
        <TabsContent value="teams" className="space-y-6">
          {loading.teams ? (
            <TeamsSkeleton />
          ) : myTeams.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Teams Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Create your first team to start collaborating with other professionals
                </p>
                <Button onClick={handleCreateTeam} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Team
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTeams.map((team) => (
                  <Card key={team.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="flex items-center gap-2 mb-2">
                            <span className="truncate">{team.name}</span>
                            {team.isLead && (
                              <Badge variant="secondary" className="text-xs">
                                Lead
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="truncate">{team.tagline}</CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewTeam(team.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/teams/${team.id}/settings`)}>
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleInviteMember(team.id)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Invite Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                        {team.description}
                      </p>
                      
                      <div className="space-y-4">
                        {/* Team Stats */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {team.memberCount}/{team.maxMembers}
                            </div>
                            <div className="text-xs text-gray-500">Members</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {team.completedProjects}
                            </div>
                            <div className="text-xs text-gray-500">Projects</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {team.rating ? team.rating.toFixed(1) : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">Rating</div>
                          </div>
                        </div>

                        {/* Skills */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Skills</span>
                            <span className="text-xs text-gray-500">{team.skills.length}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {team.skills.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill.name}
                              </Badge>
                            ))}
                            {team.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{team.skills.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between pt-2">
                          <StatusBadge status={team.availability} />
                          {team.totalEarnings && team.totalEarnings > 0 && (
                            <div className="text-sm font-medium text-green-600 dark:text-green-400">
                              ${(team.totalEarnings / 1000).toFixed(0)}K earned
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => handleViewTeam(team.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Team
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          {loading.projects ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : teamProjects.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FolderOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Team Projects
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Your teams haven't started any projects yet. Browse opportunities or create a new contract.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => router.push('/projects')}>
                    Browse Projects
                  </Button>
                  <Button onClick={() => router.push('/contracts/create')}>
                    Create Contract
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {teamProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {project.title}
                          </h3>
                          <StatusBadge status={project.status} />
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                          {project.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              Client: {project.client.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(project.value, project.currency)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {project.daysRemaining > 0 ? `${project.daysRemaining}d left` : 'Completed'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {project.progress}%
                          </div>
                          <Progress value={project.progress} className="w-32 mt-2" />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProject(project.contractId)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Milestones */}
                    {project.milestones && project.milestones.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                          Milestones
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {project.milestones.slice(0, 3).map((milestone, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {milestone.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatCurrency(milestone.amount, project.currency)}
                                </p>
                              </div>
                              <Badge variant={
                                milestone.status === 'paid' ? 'default' : 'outline'
                              }>
                                {milestone.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-6">
          {loading.applications ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : teamApplications.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <ClipboardCheck className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Applications
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Your teams haven't submitted any project applications yet.
                </p>
                <Button variant="outline" onClick={() => router.push('/projects')}>
                  Browse Projects
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {teamApplications.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {application.projectTitle}
                          </h3>
                          <StatusBadge status={application.status} />
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                          <Badge variant="outline" className="text-xs">
                            {application.projectCategory}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">
                              Budget: {formatCurrency(application.projectBudget)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {application.estimatedTimeline}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                          {application.coverLetter}
                        </p>
                        
                        <div className="text-xs text-gray-500">
                          Applied on {new Date(application.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3">
                        {application.proposedBudget && (
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Proposed Budget</div>
                            <div className="text-xl font-bold text-gray-900 dark:text-white">
                              {formatCurrency(application.proposedBudget)}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          {application.status === 'pending' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}