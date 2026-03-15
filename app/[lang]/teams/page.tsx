// app/teams/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Users, 
  Plus, 
  Filter, 
  TrendingUp, 
  Clock, 
  Star, 
  ChevronRight,
  Zap,
  Shield,
  DollarSign,
  Sparkles,
  Building,
  Target,
  Heart,
  Calendar,
  Award,
  CheckCircle,
  Globe,
  Rocket,
  TrendingDown,
  Eye,
  MoreHorizontal,
  UserPlus,
  Mail,
  Copy,
  BarChart3,
  Briefcase,
  Languages,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CreateTeamModal } from '@/components/teams/create-team-modal';
import { TeamFilters } from '@/components/teams/team-filters';
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

interface Team {
  id: string;
  name: string;
  tagline: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  skills: Array<{ name: string; category: string; level?: string }>;
  availability: 'available' | 'busy' | 'full';
  completedProjects: number;
  rating?: number;
  totalEarnings?: number;
  location?: string;
  languages?: string[];
  responseTime?: number;
  completionRate?: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  joinCode?: string;
  createdAt: Date;
  industry?: string;
  tools?: string[];
}

interface FilterState {
  availability: string[];
  skills: string[];
  minRating: number;
  minMembers: number;
  maxMembers: number;
  industries: string[];
  sortBy: 'newest' | 'rating' | 'members' | 'projects' | 'earnings';
}

export default function TeamsDashboard() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('discover');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    availability: ['available'],
    skills: [],
    minRating: 0,
    minMembers: 1,
    maxMembers: 20,
    industries: [],
    sortBy: 'newest'
  });
  const [stats, setStats] = useState({
    totalTeams: 0,
    availableTeams: 0,
    avgRating: 0,
    totalProjects: 0,
    totalEarnings: 0,
    avgResponseTime: 0
  });

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch teams on component mount
  useEffect(() => {
    fetchTeams();
    fetchMyTeams();
  }, []);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [teams, debouncedSearch, filters]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teams/discover?limit=20');
      const data = await response.json();
      
      if (data.success) {
        setTeams(data.teams);
        calculateStats(data.teams);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load teams',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTeams = async () => {
    try {
      const response = await fetch('/api/teams/my-teams');
      const data = await response.json();
      
      if (data.success) {
        setMyTeams(data.teams);
      }
    } catch (error) {
      // Silent fail for my teams
    }
  };

  const calculateStats = (teamsList: Team[]) => {
    const availableTeams = teamsList.filter(t => t.availability === 'available').length;
    const totalRating = teamsList.reduce((acc, team) => acc + (team.rating || 0), 0);
    const totalProjects = teamsList.reduce((acc, team) => acc + team.completedProjects, 0);
    const totalEarnings = teamsList.reduce((acc, team) => acc + (team.totalEarnings || 0), 0);
    const avgResponseTime = teamsList.reduce((acc, team) => acc + (team.responseTime || 48), 0) / teamsList.length;

    setStats({
      totalTeams: teamsList.length,
      availableTeams,
      avgRating: teamsList.length > 0 ? totalRating / teamsList.length : 0,
      totalProjects,
      totalEarnings,
      avgResponseTime
    });
  };

  const applyFilters = useCallback(() => {
    let result = [...teams];

    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(team =>
        team.name.toLowerCase().includes(query) ||
        team.tagline.toLowerCase().includes(query) ||
        team.description.toLowerCase().includes(query) ||
        team.skills.some(skill => skill.name.toLowerCase().includes(query)) ||
        team.industry?.toLowerCase().includes(query) ||
        team.tools?.some(tool => tool.toLowerCase().includes(query))
      );
    }

    // Apply availability filter
    if (filters.availability.length > 0) {
      result = result.filter(team => filters.availability.includes(team.availability));
    }

    // Apply skills filter
    if (filters.skills.length > 0) {
      result = result.filter(team =>
        team.skills.some(skill => filters.skills.includes(skill.name))
      );
    }

    // Apply rating filter
    result = result.filter(team => (team.rating || 0) >= filters.minRating);

    // Apply member count filter
    result = result.filter(team => 
      team.memberCount >= filters.minMembers && 
      team.memberCount <= filters.maxMembers
    );

    // Apply industries filter
    if (filters.industries.length > 0) {
      result = result.filter(team => 
        team.industry && filters.industries.includes(team.industry)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'members':
          return b.memberCount - a.memberCount;
        case 'projects':
          return b.completedProjects - a.completedProjects;
        case 'earnings':
          return (b.totalEarnings || 0) - (a.totalEarnings || 0);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredTeams(result);
  }, [teams, debouncedSearch, filters]);

  const handleTeamCreated = (newTeam: any) => {
    fetchTeams();
    fetchMyTeams();
    
    toast({
      title: '🎉 Team Created Successfully!',
      description: `"${newTeam.name}" is now ready for members`,
      duration: 5000,
      action: (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/teams/join/${newTeam.joinCode}`);
              toast({
                title: 'Copied!',
                description: 'Join link copied to clipboard',
              });
            }}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy Join Link
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => window.location.href = `/teams/${newTeam.id}`}
          >
            Open Team
          </Button>
        </div>
      ),
    });
  };

  const handleJoinTeam = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/join`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Request Sent!',
          description: 'Your join request has been submitted to the team lead',
          duration: 5000,
        });
        fetchTeams();
        fetchMyTeams();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send join request',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleCopyJoinCode = (team: Team) => {
    if (team.joinCode) {
      navigator.clipboard.writeText(team.joinCode);
      toast({
        title: 'Copied!',
        description: 'Join code copied to clipboard',
      });
    }
  };

  const handleSaveTeam = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/save`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Saved!',
          description: 'Team added to your saved list',
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save team',
        variant: 'destructive',
      });
    }
  };

  const clearFilters = () => {
    setFilters({
      availability: ['available'],
      skills: [],
      minRating: 0,
      minMembers: 1,
      maxMembers: 20,
      industries: [],
      sortBy: 'newest'
    });
    setSearchQuery('');
  };

  const AvailabilityBadge = ({ availability }: { availability: string }) => {
    const config = {
      available: { label: 'Available', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      busy: { label: 'Busy', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
      full: { label: 'Full', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    };

    const { label, color } = config[availability as keyof typeof config] || config.available;

    return (
      <Badge className={`${color} capitalize`}>
        {label}
      </Badge>
    );
  };

  const renderTeamCard = (team: Team, isMyTeam?: boolean) => (
    <Card 
      key={team.id} 
      className="group hover:shadow-xl transition-all duration-300 border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer overflow-hidden"
    >
      {/* Featured ribbon */}
      {team.isFeatured && (
        <div className="absolute top-4 right-4 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 blur-sm opacity-75"></div>
            <Badge className="relative bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          </div>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {team.name}
              </CardTitle>
              {team.isVerified && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <CheckCircle className="h-4 w-4 text-blue-500 fill-current" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Verified Team</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <CardDescription className="truncate">
              {team.tagline}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSaveTeam(team.id)}>
                <Heart className="h-4 w-4 mr-2" />
                Save Team
              </DropdownMenuItem>
              {!isMyTeam && (
                <DropdownMenuItem onClick={() => handleJoinTeam(team.id)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Request to Join
                </DropdownMenuItem>
              )}
              {team.joinCode && (
                <DropdownMenuItem onClick={() => handleCopyJoinCode(team)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Join Code
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-between mt-2">
          <AvailabilityBadge availability={team.availability} />
          {team.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">{team.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-500">({team.completedProjects})</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 min-h-[40px]">
          {team.description}
        </p>
        
        {/* Team info row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border-2 border-white dark:border-gray-800 shadow-sm">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {team.memberCount}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {team.memberCount}/{team.maxMembers}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 block">members</span>
            </div>
          </div>
          
          {team.totalEarnings && team.totalEarnings > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <DollarSign className="h-3 w-3 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">
                      ${(team.totalEarnings / 1000).toFixed(0)}K+
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total earnings from {team.completedProjects} projects</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {/* Skills */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Skills</span>
            <span className="text-xs text-gray-500">{team.skills.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {team.skills.slice(0, 4).map((skill, index) => (
              <Badge 
                key={`${skill.name}-${index}`} 
                variant="outline"
                className="text-xs px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
              >
                {skill.name}
                {skill.level && (
                  <span className="ml-1 text-xs opacity-75">
                    {skill.level.charAt(0).toUpperCase()}
                  </span>
                )}
              </Badge>
            ))}
            {team.skills.length > 4 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{team.skills.length - 4}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Additional info */}
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-400 mb-4">
          {team.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{team.location}</span>
            </div>
          )}
          {team.responseTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{team.responseTime}h response</span>
            </div>
          )}
          {team.industry && (
            <div className="col-span-2 flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              <span className="truncate">{team.industry}</span>
            </div>
          )}
        </div>
        
        {/* Action button */}
        <Button 
          size="sm" 
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          onClick={() => window.location.href = `/teams/${team.id}`}
        >
          <Eye className="h-4 w-4 mr-2" />
          View Team Details
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Header with Hero Section */}
      <div className="relative overflow-hidden border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="container relative mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex-1 max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <Badge variant="outline" className="text-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                  <Rocket className="h-3 w-3 mr-1" />
                  🚀 Team Collaboration Platform
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                Build Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Dream Team
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl leading-relaxed">
                Join thousands of professionals collaborating, sharing skills, and winning bigger projects together. 
                Our platform connects talented individuals with complementary skills to form powerhouse teams.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  <Sparkles className="h-5 w-5 mr-3" />
                  Create Your Team
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 px-8 py-6 text-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
                  onClick={() => document.getElementById('teams-grid')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Target className="h-5 w-5 mr-3" />
                  Explore Teams
                </Button>
              </div>

              {/* Stats with animations */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {loading ? '...' : stats.totalTeams.toLocaleString()}
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Teams</div>
                </div>
                <div className="p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${loading ? '...' : (stats.totalEarnings / 1000000).toFixed(1)}M+
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</div>
                </div>
                <div className="p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : stats.avgRating.toFixed(1)}⭐
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Rating</div>
                </div>
                <div className="p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : stats.avgResponseTime.toFixed(0)}h
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Response</div>
                </div>
              </div>
            </div>
            
            {/* Team illustration */}
            <div className="hidden lg:block relative">
              <div className="relative">
                <div className="w-80 h-80 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl rotate-3 shadow-2xl animate-gradient-xy">
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                </div>
                
                {/* Floating team avatars */}
                {['👨‍💻', '👩‍🎨', '👨‍🔬', '👩‍💼', '👨‍🏫', '👩‍🚀'].map((emoji, i) => (
                  <div
                    key={i}
                    className={`absolute w-14 h-14 bg-white dark:bg-gray-800 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center text-2xl shadow-lg animate-float`}
                    style={{
                      top: `${20 + (i % 3) * 25}%`,
                      left: `${(i % 2) * 60 + 20}%`,
                      animationDelay: `${i * 0.2}s`,
                    }}
                  >
                    {emoji}
                  </div>
                ))}
                
                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 animate-bounce">
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg">
                    <Award className="h-3 w-3 mr-1" />
                    Top Rated
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Available Teams</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {loading ? '...' : stats.availableTeams}
                  </h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Ready to collaborate
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-full">
                  <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Total Projects</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {loading ? '...' : stats.totalProjects.toLocaleString()}
                  </h3>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    Successfully delivered
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-800/30 rounded-full">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300">Avg. Success Rate</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {loading ? '...' : '95%'}
                  </h3>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Project completion
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-full">
                  <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 border-orange-200 dark:border-orange-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700 dark:text-orange-300">Global Reach</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    50+
                  </h3>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    Countries represented
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-800/30 rounded-full">
                  <Globe className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Action Bar */}
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search teams by name, skills, industry, or tools..."
                  className="pl-10 h-12 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 w-full lg:w-auto">
              <Button 
                variant="outline" 
                className="border-gray-300 dark:border-gray-700 flex-1 lg:flex-none"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {Object.values(filters).some(v => 
                  Array.isArray(v) ? v.length > 0 : v > 0
                ) && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                    !
                  </Badge>
                )}
              </Button>
              
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex-1 lg:flex-none"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="border-gray-300 dark:border-gray-700">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.location.href = '/teams/saved'}>
                    <Heart className="h-4 w-4 mr-2" />
                    Saved Teams
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/teams/invitations'}>
                    <Mail className="h-4 w-4 mr-2" />
                    Invitations
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/teams/analytics'}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <TeamFilters
                filters={filters}
                onChange={setFilters}
                onClear={clearFilters}
              />
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {activeTab === 'discover' ? 'Discover Teams' : 
               activeTab === 'my-teams' ? 'My Teams' : 'Team Projects'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {loading ? 'Loading teams...' : 
               activeTab === 'discover' ? 
                 `Showing ${filteredTeams.length} of ${teams.length} teams` :
               activeTab === 'my-teams' ?
                 `${myTeams.length} teams you're part of` :
                 'Projects specifically for teams'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {activeTab === 'discover' && filteredTeams.length > 0 && (
              <Select
                value={filters.sortBy}
                onValueChange={(value: any) => setFilters({...filters, sortBy: value})}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="members">Most Members</SelectItem>
                  <SelectItem value="projects">Most Projects</SelectItem>
                  <SelectItem value="earnings">Highest Earnings</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="border border-gray-300 dark:border-gray-700"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 w-full md:w-auto">
            <TabsTrigger 
              value="discover"
              className="data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 px-6"
            >
              <Users className="h-4 w-4 mr-2" />
              Discover Teams
            </TabsTrigger>
            <TabsTrigger 
              value="my-teams"
              className="data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 px-6"
            >
              <Shield className="h-4 w-4 mr-2" />
              My Teams
              {myTeams.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {myTeams.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="projects"
              className="data-[state=active]:bg-white data-[state=active]:dark:bg-gray-900 px-6"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Team Projects
            </TabsTrigger>
          </TabsList>

          {/* Discover Teams Tab */}
          <TabsContent value="discover" className="space-y-6">
            <div id="teams-grid">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="border-gray-200 dark:border-gray-700 overflow-hidden">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                          <Skeleton className="h-8 w-16 rounded-full" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-10 w-32" />
                          <Skeleton className="h-8 w-24" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredTeams.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-300 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-900">
                  <CardContent className="pt-16 pb-16 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                      <Users className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      No teams found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                      {searchQuery || Object.values(filters).some(v => 
                        Array.isArray(v) ? v.length > 0 : v > 0
                      ) ? 'Try adjusting your search or filters to find more teams' : 'Be the first to create an amazing team!'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button onClick={clearFilters} variant="outline">
                        Clear Filters
                      </Button>
                      <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Create First Team
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTeams.map((team) => renderTeamCard(team))}
                </div>
              )}
            </div>

            {/* Load More Button */}
            {!loading && filteredTeams.length > 0 && filteredTeams.length < teams.length && (
              <div className="text-center pt-8">
                <Button 
                  variant="outline" 
                  className="px-8"
                  onClick={fetchTeams}
                >
                  Load More Teams
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* My Teams Tab */}
          <TabsContent value="my-teams">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-lg" />
                ))}
              </div>
            ) : myTeams.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300 dark:border-gray-700">
                <CardContent className="pt-16 pb-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                    <Shield className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    No Teams Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                    You haven't created or joined any teams yet. Start by creating your own team or requesting to join existing ones.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      variant="outline"
                      onClick={() => document.getElementById('teams-grid')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      Browse Teams
                    </Button>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Your First Team
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myTeams.map((team) => renderTeamCard(team, true))}
                </div>
                
                {/* Team Management CTA */}
                <Card className="mt-8 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-900">
                  <CardContent className="pt-8 pb-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          Need to manage your teams?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Access team settings, manage members, and view analytics from your team dashboard.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => window.location.href = '/teams/manage'}>
                          Manage All Teams
                        </Button>
                        <Button onClick={() => window.location.href = '/teams/analytics'}>
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Analytics
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Team Projects Tab */}
          <TabsContent value="projects">
            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="pt-16 pb-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center">
                  <DollarSign className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Team Projects Marketplace
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  Browse projects specifically designed for teams. Collaborate on larger, higher-paying opportunities.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline" onClick={() => window.location.href = '/projects'}>
                    Browse All Projects
                  </Button>
                  <Button onClick={() => window.location.href = '/projects/team-mode'}>
                    <Target className="h-4 w-4 mr-2" />
                    Explore Team Projects
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTeamCreated={handleTeamCreated}
      />

      {/* Add custom animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes gradient-xy {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-gradient-xy {
          background-size: 200% 200%;
          animation: gradient-xy 15s ease infinite;
        }
      `}</style>
    </div>
  );
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// X icon component
const X = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);