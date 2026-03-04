// app/projects/[id]/team-matchmaking/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/context/language-context';
import { 
  getMatchGradeColor, 
  getMatchGradeText, 
  getAvailabilityColor, 
  getAvailabilityText,
  getComplexityColor,
  getComplexityText
} from '@/lib/dictionaries/teams';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Users,
  Star,
  Target,
  Zap,
  Brain,
  Sparkles,
  Filter,
  Search,
  Clock,
  DollarSign,
  MapPin,
  Globe,
  TrendingUp,
  Award,
  CheckCircle,
  Heart,
  Share2,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Rocket,
  Cpu,
  RefreshCw,
  Eye,
  MoreHorizontal,
  BarChart3,
  GitBranch,
  BrainCircuit,
  ShieldCheck,
  Users2,
  BriefcaseBusiness,
  Calculator,
  CalendarDays,
  FileText,
  GitCompare,
  PieChart,
  Target as TargetIcon,
  Brain as BrainIcon,
  Wifi,
  Palette,
  Code,
  LineChart,
  TrendingUp as TrendingUpIcon,
  StarHalf,
  Globe2,
  Clock4,
  Zap as ZapIcon,
  BarChart,
  Settings,
  Download,
  Copy,
  Plus,
  X,
  AlertCircle,
  ArrowUpRight,
  History,
  Lock,
  Unlock,
  Shield,
  Building,
  Calendar,
  Briefcase
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
interface Project {
  id: string;
  title: string;
  description: string;
  budget: {
    min: number;
    max: number;
    currency: string;
    type: string;
  };
  skills: string[];
  category: string;
  complexity: 'simple' | 'moderate' | 'complex' | 'very-complex';
  timeline: number;
  location: string;
  client: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    completedProjects: number;
  };
  createdAt: Date;
  status: 'open' | 'in-progress' | 'completed';
  applications: number;
  clientId: string;
}

interface Team {
  id: string;
  name: string;
  tagline: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  skills: Array<{ name: string; category: string }>;
  rating: number;
  completedProjects: number;
  totalEarnings: number;
  availability: 'available' | 'busy' | 'full';
  isVerified: boolean;
  isFeatured?: boolean;
  matchScore?: number;
  matchGrade?: 'excellent' | 'good' | 'potential' | 'low';
  matchDetails?: {
    skillMatch: number;
    experienceMatch: number;
    culturalFit: number;
    learningPotential: number;
    clientSatisfactionPrediction: number;
    confidence: number;
    estimatedTimeline: number;
    riskFactors: string[];
    recommendations: string[];
    timelineMatch: number;
    budgetFit: number;
    chemistryScore: number;
  };
}

interface MatchInsight {
  type: 'strength' | 'warning' | 'opportunity';
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function ProjectTeamMatchmakingPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const { toast } = useToast();
  const { language, dictionary, formatCurrency, formatDate, getTimeAgo } = useLanguage();
  
  const [loading, setLoading] = useState({
    project: true,
    matching: false,
    teams: true
  });
  const [activeTab, setActiveTab] = useState('ai-matches');
  const [matchStrategy, setMatchStrategy] = useState<'balanced' | 'skills-focused' | 'culture-focused' | 'speed-focused'>('balanced');
  
  // Data states
  const [project, setProject] = useState<Project | null>(null);
  const [matchedTeams, setMatchedTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [matchInsights, setMatchInsights] = useState<MatchInsight[]>([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    matchGrade: [] as string[],
    availability: [] as string[],
    minRating: 0,
    minMembers: 1,
    maxMembers: 20,
    requiredSkills: [] as string[],
    sortBy: 'matchScore' as 'matchScore' | 'rating' | 'members' | 'earnings' | 'timeline'
  });
  
  // Stats
  const [stats, setStats] = useState({
    totalTeamsAnalyzed: 0,
    matchedTeams: 0,
    avgMatchScore: 0,
    successPrediction: 0,
    avgTimeline: 0,
    confidence: 0
  });

  // Fetch project and run matching on mount
  useEffect(() => {
    if (status === 'authenticated' && projectId) {
      fetchProject();
      runAIMatching();
    }
  }, [projectId, status]);

  const fetchProject = async () => {
    try {
      setLoading(prev => ({ ...prev, project: true }));
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();
      
      if (data) {
        setProject(data);
      } else {
        toast({
          title: dictionary.errors.failedToLoad,
          description: 'Project not found',
          variant: 'destructive',
        });
        router.push('/projects');
      }
    } catch (error) {
      toast({
        title: dictionary.errors.failedToLoad,
        description: error instanceof Error ? error.message : '',
        variant: 'destructive',
      });
    } finally {
      setLoading(prev => ({ ...prev, project: false }));
    }
  };

  const runAIMatching = async () => {
    if (!projectId) return;
    
    try {
      setLoading(prev => ({ ...prev, matching: true, teams: true }));
      
      // Call the AI matching API
      const response = await fetch(`/api/ai/matching?projectId=${projectId}&testMode=false&limit=20`);
      const data = await response.json();
      
      if (data.success) {
        // Transform the matches for our UI
        const teams = data.matches.map((match: any) => ({
          id: match.freelancer?._id || match.freelancerId,
          name: match.freelancer?.name || dictionary.emptyStates.noTeams,
          tagline: match.freelancer?.tagline || 'Professional team',
          description: match.freelancer?.description || '',
          memberCount: match.freelancer?.memberCount || 1,
          maxMembers: match.freelancer?.maxMembers || 5,
          skills: match.freelancer?.skills?.map((s: string) => ({ name: s, category: 'General' })) || [],
          rating: match.freelancer?.rating || 0,
          completedProjects: match.freelancer?.statistics?.completedProjects || 0,
          totalEarnings: match.freelancer?.statistics?.totalEarnings || 0,
          availability: 'available' as const,
          isVerified: match.freelancer?.isVerified || false,
          matchScore: match.matchScore,
          matchGrade: match.matchGrade || (match.matchScore >= 75 ? 'excellent' : match.matchScore >= 60 ? 'good' : match.matchScore >= 40 ? 'potential' : 'low'),
          matchDetails: {
            skillMatch: match.skillGapAnalysis?.score || 70,
            experienceMatch: 85,
            culturalFit: match.culturalFit || 80,
            learningPotential: match.learningPotential || 65,
            clientSatisfactionPrediction: match.clientSatisfactionPrediction || 85,
            confidence: match.confidence || 75,
            estimatedTimeline: match.estimatedTimeline || 30,
            riskFactors: match.riskFactors || ['New team formation'],
            recommendations: match.recommendedActions || ['Schedule initial meeting'],
            timelineMatch: 90,
            budgetFit: 85,
            chemistryScore: match.culturalFit || 80
          }
        }));

        setMatchedTeams(teams);
        setFilteredTeams(teams);
        
        // Calculate stats
        const totalTeams = data.statistics?.totalFreelancers || teams.length;
        const matchedTeamsCount = data.statistics?.matchedFreelancers || teams.length;
        const avgMatchScore = data.statistics?.averageMatchScore || 
          (teams.reduce((acc: number, team: Team) => acc + (team.matchScore || 0), 0) / teams.length || 0);
        
        setStats({
          totalTeamsAnalyzed: totalTeams,
          matchedTeams: matchedTeamsCount,
          avgMatchScore,
          successPrediction: 85,
          avgTimeline: 45,
          confidence: 82
        });

        // Generate match insights
        generateMatchInsights(teams);
        
        toast({
          title: dictionary.success.matchesGenerated,
          description: `Found ${matchedTeamsCount} ${matchedTeamsCount === 1 ? 'match' : 'matches'} for your project`,
        });
      }
    } catch (error) {
      toast({
        title: dictionary.errors.matchingFailed,
        description: error instanceof Error ? error.message : '',
        variant: 'destructive',
      });
    } finally {
      setLoading(prev => ({ ...prev, matching: false, teams: false }));
    }
  };

  const generateMatchInsights = (teams: Team[]) => {
    const insights: MatchInsight[] = [];
    
    // Check for excellent matches
    const excellentMatches = teams.filter(t => t.matchGrade === 'excellent').length;
    if (excellentMatches > 0) {
      insights.push({
        type: 'strength',
        title: dictionary.perfectTeamFound,
        description: `${excellentMatches} ${dictionary.excellent.toLowerCase()} ${dictionary.matchesReady.toLowerCase()}`,
        icon: <Sparkles className="h-5 w-5" />
      });
    }

    // Check average match score
    const avgScore = teams.reduce((acc, team) => acc + (team.matchScore || 0), 0) / teams.length;
    if (avgScore > 75) {
      insights.push({
        type: 'strength',
        title: 'High Quality Matches',
        description: `Average match score of ${avgScore.toFixed(0)}% indicates strong alignment`,
        icon: <TrendingUpIcon className="h-5 w-5" />
      });
    }

    // Check for skill gaps
    const teamsWithLearningPotential = teams.filter(t => 
      t.matchDetails?.learningPotential && t.matchDetails.learningPotential > 70
    ).length;
    
    if (teamsWithLearningPotential > 0) {
      insights.push({
        type: 'opportunity',
        title: dictionary.learningOpportunities,
        description: `${teamsWithLearningPotential} teams show high learning potential`,
        icon: <BrainCircuit className="h-5 w-5" />
      });
    }

    // Check timeline alignment
    const timelineMatches = teams.filter(t => 
      t.matchDetails?.timelineMatch && t.matchDetails.timelineMatch > 85
    ).length;
    
    if (timelineMatches < teams.length * 0.3) {
      insights.push({
        type: 'warning',
        title: 'Timeline Considerations',
        description: 'Some teams may require adjusted timelines',
        icon: <Clock4 className="h-5 w-5" />
      });
    }

    setMatchInsights(insights);
  };

  const applyFilters = useCallback(() => {
    let results = [...matchedTeams];

    // Apply match grade filter
    if (filters.matchGrade.length > 0) {
      results = results.filter(team => 
        team.matchGrade && filters.matchGrade.includes(team.matchGrade)
      );
    }

    // Apply availability filter
    if (filters.availability.length > 0) {
      results = results.filter(team => 
        filters.availability.includes(team.availability)
      );
    }

    // Apply rating filter
    results = results.filter(team => team.rating >= filters.minRating);

    // Apply member count filter
    results = results.filter(team => 
      team.memberCount >= filters.minMembers && 
      team.memberCount <= filters.maxMembers
    );

    // Apply skills filter
    if (filters.requiredSkills.length > 0) {
      results = results.filter(team =>
        team.skills.some(skill => 
          filters.requiredSkills.some(reqSkill => 
            skill.name.toLowerCase().includes(reqSkill.toLowerCase())
          )
        )
      );
    }

    // Apply sorting
    results.sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'members':
          return b.memberCount - a.memberCount;
        case 'earnings':
          return b.totalEarnings - a.totalEarnings;
        case 'timeline':
          return (a.matchDetails?.estimatedTimeline || 0) - (b.matchDetails?.estimatedTimeline || 0);
        case 'matchScore':
        default:
          return (b.matchScore || 0) - (a.matchScore || 0);
      }
    });

    setFilteredTeams(results);
  }, [matchedTeams, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleClearFilters = () => {
    setFilters({
      matchGrade: [],
      availability: [],
      minRating: 0,
      minMembers: 1,
      maxMembers: 20,
      requiredSkills: [],
      sortBy: 'matchScore'
    });
  };

  const handleInviteTeam = (teamId: string) => {
    toast({
      title: dictionary.success.teamInvited,
      description: 'Invitation sent to team',
    });
  };

  const handleSaveTeam = (teamId: string) => {
    toast({
      title: dictionary.success.projectSaved,
      description: 'Team saved to favorites',
    });
  };

  const handleStartChat = (teamId: string) => {
    router.push(`/messages?team=${teamId}`);
  };

  const handleViewTeam = (teamId: string) => {
    router.push(`/teams/${teamId}`);
  };

  const handleRefreshMatches = () => {
    runAIMatching();
  };

  const handleExportResults = () => {
    toast({
      title: dictionary.exportResults,
      description: 'Match results exported successfully',
    });
  };

  const handleShareResults = () => {
    if (navigator.share) {
      navigator.share({
        title: `AI Team Matches for ${project?.title}`,
        text: `Check out the AI-generated team matches for "${project?.title}" on NrbTalents`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link Copied',
        description: 'Match results link copied to clipboard',
      });
    }
  };

  // Loading skeleton
  const ProjectSkeleton = () => (
    <div className="space-y-6">
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );

  // Match grade badge component
  const MatchGradeBadge = ({ grade, score }: { grade?: 'excellent' | 'good' | 'potential' | 'low', score?: number }) => {
    if (!grade) return null;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`${getMatchGradeColor(grade)} text-sm font-semibold px-3 py-1.5`}>
              {getMatchGradeText(grade, language)} {score !== undefined && `• ${score}%`}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{dictionary.tooltips.matchScore}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Availability badge component
  const AvailabilityBadge = ({ availability }: { availability: 'available' | 'busy' | 'full' }) => {
    return (
      <Badge className={`${getAvailabilityColor(availability)} capitalize`}>
        {getAvailabilityText(availability, language)}
      </Badge>
    );
  };

  // Complexity badge component
  const ComplexityBadge = ({ complexity }: { complexity: 'simple' | 'moderate' | 'complex' | 'very-complex' }) => {
    return (
      <Badge className={`${getComplexityColor(complexity)} capitalize`}>
        {getComplexityText(complexity, language)}
      </Badge>
    );
  };

  // Stats card component
  const StatsCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    trend 
  }: { 
    title: string; 
    value: string | number; 
    subtitle: string; 
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <Card className="border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow duration-300">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {value}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          </div>
          <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full">
            <div className="text-purple-600 dark:text-purple-400">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading.project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ProjectSkeleton />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Project Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The project you're looking for doesn't exist or you don't have access
        </p>
        <Button onClick={() => router.push('/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Sparkles className="h-8 w-8" />
                  {dictionary.pageTitle}
                </h1>
                <p className="text-purple-100 mt-2">
                  {dictionary.pageDescription}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/20"
                onClick={handleRefreshMatches}
                disabled={loading.matching}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading.matching ? 'animate-spin' : ''}`} />
                {loading.matching ? dictionary.processing : dictionary.refreshMatches}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/20">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportResults}>
                    <Download className="h-4 w-4 mr-2" />
                    {dictionary.exportResults}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareResults}>
                    <Share2 className="h-4 w-4 mr-2" />
                    {dictionary.shareResults}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Project Info */}
          <Card className="border-white/20 bg-white/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-2xl font-bold">{project.title}</h2>
                    <ComplexityBadge complexity={project.complexity} />
                    <Badge variant="outline" className="border-white/30 text-white">
                      {project.category}
                    </Badge>
                  </div>
                  <p className="text-purple-100 mb-4">{project.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatCurrency(project.budget.min, project.budget.currency, language)} - {formatCurrency(project.budget.max, project.budget.currency, language)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{project.timeline} {dictionary.timeline}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{project.location || 'Remote'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="md:w-64">
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">{dictionary.client}</h3>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{project.client.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{project.client.name}</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-sm">{project.client.rating}</span>
                          <span className="text-xs text-white/60">({project.client.completedProjects} projects)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title={dictionary.totalTeams}
            value={stats.totalTeamsAnalyzed}
            subtitle="Analyzed by AI"
            icon={<Brain className="h-6 w-6" />}
          />
          
          <StatsCard
            title={dictionary.matchedTeams}
            value={stats.matchedTeams}
            subtitle={`${((stats.matchedTeams / stats.totalTeamsAnalyzed) * 100).toFixed(1)}% ${dictionary.matchRate}`}
            icon={<Target className="h-6 w-6" />}
            trend="up"
          />
          
          <StatsCard
            title={dictionary.avgRating}
            value={stats.avgMatchScore.toFixed(1)}
            subtitle="Average match score"
            icon={<BarChart3 className="h-6 w-6" />}
          />
          
          <StatsCard
            title={dictionary.successRate}
            value={`${stats.successPrediction}%`}
            subtitle="Predicted success rate"
            icon={<TrendingUp className="h-6 w-6" />}
            trend="up"
          />
        </div>

        {/* AI Match Strategy */}
        <Card className="mb-8 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  🧠 {dictionary.smartMatching} Strategy
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {dictionary.deepAnalysis}: Analyzing skills, experience, cultural fit, and project requirements
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <Cpu className="h-3 w-3 mr-1" />
                  {dictionary.aiOptimized}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefreshMatches}
                  disabled={loading.matching}
                >
                  {loading.matching ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                      {dictionary.aiProcessing}
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="h-3 w-3 mr-2" />
                      {dictionary.refreshMatches}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Filters & Insights */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Insights */}
            {matchInsights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BrainIcon className="h-5 w-5" />
                    AI Insights
                  </CardTitle>
                  <CardDescription>
                    {dictionary.deepAnalysis} results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {matchInsights.map((insight, index) => (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg border ${
                          insight.type === 'strength' 
                            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                            : insight.type === 'warning'
                            ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                            : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${
                            insight.type === 'strength' 
                              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                              : insight.type === 'warning'
                              ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400'
                              : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                          }`}>
                            {insight.icon}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {insight.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {insight.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    {dictionary.filters}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearFilters}
                  >
                    {dictionary.clearFilters}
                  </Button>
                </CardTitle>
                <CardDescription>
                  Refine your match results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Match Quality */}
                  <div>
                    <Label className="mb-3 block">{dictionary.matchQuality}</Label>
                    <div className="flex flex-wrap gap-2">
                      {(['excellent', 'good', 'potential', 'low'] as const).map((grade) => (
                        <Button
                          key={grade}
                          variant={filters.matchGrade.includes(grade) ? "default" : "outline"}
                          size="sm"
                          className={`${
                            filters.matchGrade.includes(grade) 
                              ? getMatchGradeColor(grade)
                              : ''
                          }`}
                          onClick={() => {
                            setFilters(prev => ({
                              ...prev,
                              matchGrade: prev.matchGrade.includes(grade)
                                ? prev.matchGrade.filter(g => g !== grade)
                                : [...prev.matchGrade, grade]
                            }));
                          }}
                        >
                          {getMatchGradeText(grade, language)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Availability */}
                  <div>
                    <Label className="mb-3 block">{dictionary.availability}</Label>
                    <div className="flex flex-wrap gap-2">
                      {(['available', 'busy', 'full'] as const).map((status) => (
                        <Button
                          key={status}
                          variant={filters.availability.includes(status) ? "default" : "outline"}
                          size="sm"
                          className={`${
                            filters.availability.includes(status) 
                              ? getAvailabilityColor(status)
                              : ''
                          }`}
                          onClick={() => {
                            setFilters(prev => ({
                              ...prev,
                              availability: prev.availability.includes(status)
                                ? prev.availability.filter(s => s !== status)
                                : [...prev.availability, status]
                            }));
                          }}
                        >
                          {getAvailabilityText(status, language)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>{dictionary.minRating}</Label>
                      <span className="text-sm font-medium">{filters.minRating}+</span>
                    </div>
                    <Slider
                      value={[filters.minRating]}
                      min={0}
                      max={5}
                      step={0.5}
                      onValueChange={([value]) => setFilters(prev => ({ ...prev, minRating: value }))}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>5</span>
                    </div>
                  </div>

                  {/* Member Count */}
                  <div>
                    <Label className="mb-3 block">Team Size</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Min Members</Label>
                        <Input
                          type="number"
                          value={filters.minMembers}
                          onChange={(e) => setFilters(prev => ({ 
                            ...prev, 
                            minMembers: parseInt(e.target.value) || 1 
                          }))}
                          min={1}
                          max={filters.maxMembers}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max Members</Label>
                        <Input
                          type="number"
                          value={filters.maxMembers}
                          onChange={(e) => setFilters(prev => ({ 
                            ...prev, 
                            maxMembers: parseInt(e.target.value) || 20 
                          }))}
                          min={filters.minMembers}
                          max={50}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sort By */}
                  <div>
                    <Label className="mb-3 block">Sort By</Label>
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="matchScore">Match Score</SelectItem>
                        <SelectItem value="rating">Team Rating</SelectItem>
                        <SelectItem value="members">Member Count</SelectItem>
                        <SelectItem value="earnings">Total Earnings</SelectItem>
                        <SelectItem value="timeline">Estimated Timeline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Matches */}
          <div className="lg:col-span-2">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dictionary.bestMatches}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {filteredTeams.length} {filteredTeams.length === 1 ? 'match' : 'matches'} found
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-purple-200 text-purple-700 dark:border-purple-700 dark:text-purple-300">
                  <ZapIcon className="h-3 w-3 mr-1" />
                  {dictionary.aiPowered}
                </Badge>
              </div>
            </div>

            {/* Matches Grid */}
            {loading.teams ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="border-gray-200 dark:border-gray-800">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTeams.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300 dark:border-gray-700">
                <CardContent className="pt-16 pb-16 text-center">
                  <TargetIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {dictionary.emptyStates.noMatches}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    {dictionary.adjustFilters}
                  </p>
                  <Button onClick={handleClearFilters} variant="outline">
                    {dictionary.clearFilters}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTeams.map((team) => (
                  <Card 
                    key={team.id} 
                    className="group hover:shadow-xl transition-all duration-300 border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 overflow-hidden"
                  >
                    {/* Featured ribbon */}
                    {team.isFeatured && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {dictionary.badges.featured}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {team.name}
                            </CardTitle>
                            {team.isVerified && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <ShieldCheck className="h-4 w-4 text-blue-500 fill-current" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{dictionary.badges.verified}</p>
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
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewTeam(team.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              {dictionary.viewTeam}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSaveTeam(team.id)}>
                              <Heart className="h-4 w-4 mr-2" />
                              {dictionary.saveProject}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStartChat(team.id)}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              {dictionary.startChat}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <MatchGradeBadge grade={team.matchGrade} score={team.matchScore} />
                        <AvailabilityBadge availability={team.availability} />
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {/* Match Score Progress */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {dictionary.matchScore}
                          </span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {team.matchScore}%
                          </span>
                        </div>
                        <Progress value={team.matchScore} className="h-2" />
                      </div>

                      {/* Team Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {team.memberCount}/{team.maxMembers}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{dictionary.teamMembers}</div>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {team.completedProjects}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{dictionary.completedProjects}</div>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatCurrency(team.totalEarnings, 'USD', language)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{dictionary.totalEarnings}</div>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Skills</span>
                          <span className="text-xs text-gray-500">{team.skills.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {team.skills.slice(0, 4).map((skill, index) => (
                            <Badge 
                              key={index} 
                              variant="outline"
                              className="text-xs px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                            >
                              {skill.name}
                            </Badge>
                          ))}
                          {team.skills.length > 4 && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                              +{team.skills.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Match Details */}
                      {team.matchDetails && (
                        <div className="space-y-4">
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-center">
                                    <div className="text-sm text-gray-500">{dictionary.skillMatch}</div>
                                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                                      {team.matchDetails.skillMatch}%
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{dictionary.tooltips.skillMatch}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-center">
                                    <div className="text-sm text-gray-500">{dictionary.culturalFit}</div>
                                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                                      {team.matchDetails.culturalFit}%
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{dictionary.tooltips.culturalFit}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{dictionary.estimatedTimeline}:</span>
                            <span className="font-semibold">{team.matchDetails.estimatedTimeline} days</span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{dictionary.confidence}:</span>
                            <span className="font-semibold">{team.matchDetails.confidence}%</span>
                          </div>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="pt-0">
                      <div className="flex gap-3 w-full">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleViewTeam(team.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {dictionary.viewTeam}
                        </Button>
                        <Button 
                          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          onClick={() => handleInviteTeam(team.id)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {dictionary.inviteTeam}
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {/* Load More Button */}
            {filteredTeams.length > 0 && (
              <div className="text-center mt-8">
                <Button 
                  variant="outline" 
                  className="px-8"
                  onClick={() => router.push(`/teams/discover?project=${projectId}`)}
                >
                  {dictionary.viewAll} Teams
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}