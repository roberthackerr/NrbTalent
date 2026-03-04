// app/projects/[id]/applications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { 
  ArrowLeft, 
  Users, 
  DollarSign, 
  Calendar, 
  Clock, 
  Star,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  TrendingUp,
  Briefcase,
  Filter,
  Search,
  Download,
  FileText,
  Award,
  Sparkles,
  ChevronRight,
  Loader2,
  Shield,
  Zap,
  BarChart3,
  Crown,
  Building2,
  Target,
  Brain,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Globe,
  Check,
  X,
  Code,
  Palette,
  Database,
  Cpu,
  Server,
  Cloud,
  Lock,
  Smartphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';

// Language dictionary
const dictionary = {
  en: {
    // Page titles and headers
    pageTitle: 'Team Applications',
    pageSubtitle: 'Review team proposals for',
    backButton: 'Back',
    myProjects: 'My Projects',
    loading: 'Loading...',
    
    // Stats cards
    totalApplications: 'Total Applications',
    pendingReview: 'Pending Review',
    avgProposal: 'Avg. Proposal',
    projectBudget: 'Project Budget',
    projectStatus: 'Project Status',
    
    // Application status
    accepted: 'Accepted',
    pending: 'Pending',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
    new: 'New',
    
    // Application details
    applicationDetails: 'Application Details',
    coverLetter: 'Cover Letter',
    teamDetails: 'Team Details',
    teamMembers: 'Team Members',
    proposedBudget: 'Proposed Budget',
    estimatedTimeline: 'Estimated Timeline',
    skillsRoles: 'Skills & Roles',
    primaryRoles: 'Primary Roles',
    keySkills: 'Key Skills',
    viewTeam: 'View Team',
    messageTeam: 'Message Team',
    
    // Actions
    acceptTeam: 'Accept Team',
    reject: 'Reject',
    selectApplication: 'Select an Application',
    clickToView: 'Click on any application to view details',
    onlyOneTeam: 'You can accept only one team for this project',
    acceptConfirmation: 'Are you sure you want to accept',
    rejectConfirmation: 'Optional: Add a message explaining why you\'re rejecting this application:',
    acceptedMessage: 'You\'ve accepted this team',
    rejectedMessage: 'You\'ve rejected this application',
    
    // Filters and tabs
    all: 'All',
    allApplications: 'All Applications',
    pendingApplications: 'Pending Applications',
    acceptedApplications: 'Accepted',
    rejectedApplications: 'Rejected',
    filterBy: 'Filter by',
    searchTeams: 'Search teams...',
    sortBy: 'Sort by',
    
    // Team info
    teamSelected: 'Team Selected!',
    teamSelectedMessage: 'You\'ve accepted',
    projectInProgress: 'The project is now in progress.',
    viewProject: 'View Project',
    
    // Errors and empty states
    projectNotFound: 'Project Not Found',
    projectNotFoundMessage: 'This project doesn\'t exist or you don\'t have access.',
    noApplications: 'No applications found',
    noPendingApplications: 'No pending applications at the moment.',
    noFilteredApplications: 'No applications match your filter.',
    
    // Additional info
    appliedOn: 'Applied',
    budgetRange: 'Budget Range',
    experienceLevel: 'Experience Level',
    successRate: 'Success Rate',
    rating: 'Rating',
    completedProjects: 'Completed Projects',
    teamSize: 'Team Size',
    
    // Dialog messages
    acceptDialogTitle: 'Accept Team Proposal',
    acceptDialogDescription: 'This will assign the project to this team and notify all members.',
    rejectDialogTitle: 'Reject Team Proposal',
    rejectDialogDescription: 'Provide feedback to help the team improve their proposals.',
    feedbackPlaceholder: 'Optional feedback for the team...',
    confirmAccept: 'Confirm Acceptance',
    confirmReject: 'Confirm Rejection',
    cancel: 'Cancel',
    
    // Status badges
    highlyRecommended: 'Highly Recommended',
    goodFit: 'Good Fit',
    newTeam: 'New Team',
    premium: 'Premium',
    
    // Time filters
    last24Hours: 'Last 24 hours',
    lastWeek: 'Last week',
    lastMonth: 'Last month',
    allTime: 'All time',
    
    // Skill categories
    frontend: 'Frontend',
    backend: 'Backend',
    fullstack: 'Full Stack',
    mobile: 'Mobile',
    devops: 'DevOps',
    design: 'Design',
    database: 'Database',
    testing: 'Testing',
    aiMl: 'AI/ML',
    cybersecurity: 'Cybersecurity',
  }
};

// Interface for skill object
interface SkillObject {
  name: string;
  category?: string;
  level?: number;
  years?: number;
  certification?: boolean;
}

interface TeamApplication {
  id: string;
  teamId: string;
  teamName: string;
  coverLetter: string;
  proposedBudget: number;
  estimatedTimeline: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  clientViewed: boolean;
  createdAt: string;
  teamSummary: {
    memberCount: number;
    roles: string[];
    skills: SkillObject[] | string[]; // Can be array of strings or objects
    rating?: number;
    completedProjects?: number;
    successRate?: number;
    experienceLevel?: string;
    location?: string;
    hourlyRate?: number;
    totalYears?: number;
    isFeatured?: boolean;
    averageLevel?: number;
    averageExperience?: number;
  };
  teamDetails?: {
    avatar?: string;
    tagline?: string;
    totalEarnings?: number;
    preferredProjectTypes?: string[];
    communicationTools?: string[];
  };
}

interface Project {
  id: string;
  title: string;
  budget: {
    min: number;
    max: number;
    currency?: string;
  };
  status: string;
  description?: string;
  category?: string;
  deadline?: string;
  location?: string;
  requiredSkills?: string[];
}

// Helper function to get skill icon based on category
const getSkillIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'frontend':
    case 'web':
      return <Code className="h-3 w-3 mr-1" />;
    case 'backend':
    case 'api':
      return <Server className="h-3 w-3 mr-1" />;
    case 'design':
    case 'ui/ux':
      return <Palette className="h-3 w-3 mr-1" />;
    case 'database':
      return <Database className="h-3 w-3 mr-1" />;
    case 'mobile':
      return <Smartphone className="h-3 w-3 mr-1" />;
    case 'devops':
    case 'cloud':
      return <Cloud className="h-3 w-3 mr-1" />;
    case 'ai':
    case 'ml':
      return <Cpu className="h-3 w-3 mr-1" />;
    case 'security':
      return <Lock className="h-3 w-3 mr-1" />;
    default:
      return <Code className="h-3 w-3 mr-1" />;
  }
};

// Helper function to get skill color based on category
const getSkillColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'frontend':
    case 'web':
      return 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    case 'backend':
    case 'api':
      return 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
    case 'design':
    case 'ui/ux':
      return 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    case 'database':
      return 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    case 'mobile':
      return 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800';
    case 'devops':
    case 'cloud':
      return 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800';
    case 'ai':
    case 'ml':
      return 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800';
    case 'security':
      return 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    default:
      return 'bg-slate-50 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800';
  }
};

// Helper function to process skills (handle both string and object formats)
const processSkills = (skills: SkillObject[] | string[]): SkillObject[] => {
  if (!skills || skills.length === 0) return [];
  
  // If skills are strings, convert to objects
  if (typeof skills[0] === 'string') {
    return (skills as string[]).map(skill => ({
      name: skill as string,
      category: 'other'
    }));
  }
  
  return skills as SkillObject[];
};

export default function ProjectApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [applications, setApplications] = useState<TeamApplication[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [timeFilter, setTimeFilter] = useState('all');
  const [showOnlyUnviewed, setShowOnlyUnviewed] = useState(false);
  const [language, setLanguage] = useState('en');
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [processing, setProcessing] = useState(false);
  const [skillCategories, setSkillCategories] = useState<Set<string>>(new Set());

  const dict = dictionary[language as keyof typeof dictionary];
  const projectId = params.id as string;

  useEffect(() => {
    fetchApplications();
  }, [projectId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/team-applications`);
      const data = await response.json();
      
      if (data.success) {
        setProject(data.project);
        
        // Process applications to ensure skills are in correct format
        const processedApplications = data.applications.map((app: TeamApplication) => ({
          ...app,
          teamSummary: {
            ...app.teamSummary,
            skills: processSkills(app.teamSummary.skills || [])
          }
        }));
        
        setApplications(processedApplications);
        
        // Extract unique skill categories
        const categories = new Set<string>();
        processedApplications.forEach((app: TeamApplication) => {
          const skills = processSkills(app.teamSummary.skills);
          skills.forEach(skill => {
            if (skill.category) {
              categories.add(skill.category.toLowerCase());
            }
          });
        });
        setSkillCategories(categories);
        
        if (processedApplications.length > 0 && !selectedApplication) {
          setSelectedApplication(processedApplications[0].id);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive',
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, status: 'accepted' | 'rejected', message?: string) => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/team-applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, message: message || feedback }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: status === 'accepted' ? dict.acceptTeam + '!' : dict.rejected,
          description: data.message,
          className: status === 'accepted' 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0' 
            : 'bg-gradient-to-r from-red-500 to-rose-600 text-white border-0',
        });
        
        setAcceptDialogOpen(false);
        setRejectDialogOpen(false);
        setFeedback('');
        fetchApplications();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  // Filter and sort applications
  const filteredApplications = applications
    .filter(app => {
      if (activeTab !== 'all' && app.status !== activeTab) return false;
      if (showOnlyUnviewed && app.clientViewed) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = app.teamName.toLowerCase().includes(query);
        const matchesSkills = processSkills(app.teamSummary.skills).some(skill => 
          skill.name.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesSkills) return false;
      }
      
      // Time filter
      const appDate = new Date(app.createdAt);
      const now = new Date();
      const diffHours = (now.getTime() - appDate.getTime()) / (1000 * 60 * 60);
      
      if (timeFilter === 'last24Hours' && diffHours > 24) return false;
      if (timeFilter === 'lastWeek' && diffHours > 168) return false;
      if (timeFilter === 'lastMonth' && diffHours > 720) return false;
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'budget-high':
          return b.proposedBudget - a.proposedBudget;
        case 'budget-low':
          return a.proposedBudget - b.proposedBudget;
        case 'rating':
          return (b.teamSummary.rating || 0) - (a.teamSummary.rating || 0);
        case 'experience':
          return (b.teamSummary.averageLevel || 0) - (a.teamSummary.averageLevel || 0);
        default:
          return 0;
      }
    });

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const acceptedApplication = applications.find(app => app.status === 'accepted');

  const getApplicationScore = (app: TeamApplication) => {
    let score = 0;
    if (app.teamSummary.rating && app.teamSummary.rating >= 4.5) score += 30;
    if (app.teamSummary.completedProjects && app.teamSummary.completedProjects > 10) score += 20;
    if (app.teamSummary.successRate && app.teamSummary.successRate > 90) score += 25;
    if (app.teamSummary.experienceLevel === 'expert') score += 25;
    return score;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-gradient-to-r from-green-500 to-emerald-600';
      case 'rejected': return 'bg-gradient-to-r from-red-500 to-rose-600';
      case 'withdrawn': return 'bg-gradient-to-r from-gray-500 to-slate-600';
      default: return 'bg-gradient-to-r from-amber-500 to-orange-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-r from-green-500 to-emerald-600';
    if (score >= 60) return 'bg-gradient-to-r from-blue-500 to-cyan-600';
    if (score >= 40) return 'bg-gradient-to-r from-amber-500 to-orange-600';
    return 'bg-gradient-to-r from-gray-500 to-slate-600';
  };

  // Render skill badge
  const renderSkillBadge = (skill: SkillObject | string, index: number) => {
    const skillObj = typeof skill === 'string' ? { name: skill, category: 'other' } : skill;
    
    return (
      <TooltipProvider key={index}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className={`${getSkillColor(skillObj.category || 'other')} hover:opacity-90 transition-opacity`}
            >
              <div className="flex items-center">
                {getSkillIcon(skillObj.category || 'other')}
                <span>{skillObj.name}</span>
                {skillObj.level && (
                  <span className="ml-1 text-xs opacity-70">• {skillObj.level}/5</span>
                )}
              </div>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-semibold">{skillObj.name}</p>
              {skillObj.category && (
                <p className="text-xs">Category: {skillObj.category}</p>
              )}
              {skillObj.level && (
                <p className="text-xs">Proficiency: {skillObj.level}/5</p>
              )}
              {skillObj.years && (
                <p className="text-xs">Experience: {skillObj.years} years</p>
              )}
              {skillObj.certification && (
                <p className="text-xs text-green-600">Certified</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-[600px] rounded-2xl lg:col-span-2 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800" />
            <Skeleton className="h-[600px] rounded-2xl bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20 flex items-center justify-center p-4">
        <Card className="max-w-md border-0 shadow-2xl bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-20 animate-pulse rounded-full"></div>
              <Briefcase className="h-12 w-12 text-slate-400 dark:text-slate-600 relative z-10" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {dict.projectNotFound}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {dict.projectNotFoundMessage}
            </p>
            <Button 
              onClick={() => router.push('/dashboard/client/projects')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {dict.myProjects}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedApp = applications.find(app => app.id === selectedApplication);
  const selectedAppSkills = selectedApp ? processSkills(selectedApp.teamSummary.skills) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950/20">
      {/* Header with gradient */}
      <div className="relative overflow-hidden border-b border-slate-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="container mx-auto px-4 py-8 relative">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-6 group transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                {dict.backButton}
              </Button>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {dict.pageTitle}
                  </h1>
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                    {applications.length} {dict.totalApplications.toLowerCase()}
                  </Badge>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  {dict.pageSubtitle} <span className="font-semibold text-slate-900 dark:text-white">"{project.title}"</span>
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <Badge 
                  variant={project.status === 'open' ? 'default' : 'secondary'}
                  className="capitalize border-0 shadow-sm"
                >
                  {dict.projectStatus}: {project.status}
                </Badge>
                <div className="text-right bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900 p-3 rounded-xl shadow-sm">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{dict.projectBudget}</p>
                  <p className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ${project.budget.min} - ${project.budget.max}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 dark:from-blue-500/5 dark:via-gray-800 dark:to-blue-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{dict.totalApplications}</p>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                    {applications.length}
                  </h3>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-slate-500 dark:text-slate-400">
                <TrendingUp className="h-4 w-4 mr-1 text-emerald-500" />
                <span>From last week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 dark:from-amber-500/5 dark:via-gray-800 dark:to-amber-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{dict.pendingReview}</p>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                    {pendingApplications.length}
                  </h3>
                </div>
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Response rate</span>
                  <span className="font-medium">90%</span>
                </div>
                <Progress value={90} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 dark:from-emerald-500/5 dark:via-gray-800 dark:to-emerald-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{dict.avgProposal}</p>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                    ${applications.length > 0 
                      ? Math.round(applications.reduce((acc, app) => acc + app.proposedBudget, 0) / applications.length).toLocaleString()
                      : '0'
                    }
                  </h3>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 text-sm">
                <div className="flex items-center text-slate-500 dark:text-slate-400">
                  <Target className="h-4 w-4 mr-2 text-emerald-500" />
                  <span>Within budget range</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 dark:from-purple-500/5 dark:via-gray-800 dark:to-purple-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Quality Score</p>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                    {applications.length > 0 
                      ? Math.round(applications.reduce((acc, app) => acc + getApplicationScore(app), 0) / applications.length)
                      : '0'
                    }%
                  </h3>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  High quality proposals
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>


{acceptedApplication && (
  <Card className="mb-8 border-0 shadow-xl bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-green-500/10 dark:from-green-500/5 dark:via-emerald-500/5 dark:to-green-500/5">
    <CardContent className="p-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
              {dict.teamSelected}
            </h3>
            <p className="text-green-700 dark:text-green-400">
              {dict.teamSelectedMessage} <span className="font-semibold">"{acceptedApplication.teamName}"</span> {dict.projectInProgress}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="border-green-300 text-green-700 dark:border-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
            onClick={() => router.push(`/projects/${projectId}`)}
          >
            {dict.viewProject}
          </Button>
          <Button 
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
            onClick={() => router.push(`/messages?team=${acceptedApplication.teamId}&project=${projectId}`)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {dict.messageTeam}
          </Button>
          {/* ADD THIS BUTTON */}
          <Button 
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            onClick={() => router.push(`/team/contracts/create?projectId=${projectId}&applicationId=${acceptedApplication.id}`)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Create Contract
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
)}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Applications List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters and Controls */}
            <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder={dict.searchTeams}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[180px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder={dict.sortBy} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="budget-high">Budget (High to Low)</SelectItem>
                        <SelectItem value="budget-low">Budget (Low to High)</SelectItem>
                        <SelectItem value="rating">Highest Rating</SelectItem>
                        <SelectItem value="experience">Most Experienced</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                      <SelectTrigger className="w-[140px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="Time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{dict.allTime}</SelectItem>
                        <SelectItem value="last24Hours">{dict.last24Hours}</SelectItem>
                        <SelectItem value="lastWeek">{dict.lastWeek}</SelectItem>
                        <SelectItem value="lastMonth">{dict.lastMonth}</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={showOnlyUnviewed}
                        onCheckedChange={setShowOnlyUnviewed}
                        id="unviewed-only"
                      />
                      <Label htmlFor="unviewed-only" className="text-sm">
                        New Only
                      </Label>
                    </div>
                  </div>
                </div>
                
                {/* Skill Category Filters */}
                {skillCategories.size > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Filter by skill category:</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(skillCategories).map((category, index) => (
                        <Badge 
                          key={index}
                          variant="outline"
                          className={`cursor-pointer ${getSkillColor(category)} hover:opacity-80`}
                        >
                          {getSkillIcon(category)}
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                  {dict.all} ({applications.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
                  {dict.pending} ({pendingApplications.length})
                </TabsTrigger>
                <TabsTrigger value="accepted" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">
                  {dict.accepted}
                </TabsTrigger>
                <TabsTrigger value="rejected" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-500 data-[state=active]:text-white">
                  {dict.rejected}
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {filteredApplications.length === 0 ? (
                  <Card className="border-dashed border-2 border-slate-300 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-gray-900">
                    <CardContent className="pt-16 pb-16 text-center">
                      <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-20 animate-pulse rounded-full"></div>
                        <Users className="h-16 w-16 text-slate-400 dark:text-slate-600 relative z-10" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        {dict.noApplications}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                        {activeTab === 'pending' 
                          ? dict.noPendingApplications 
                          : dict.noFilteredApplications}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredApplications.map((application) => {
                      const score = getApplicationScore(application);
                      const appSkills = processSkills(application.teamSummary.skills);
                      
                      return (
                        <Card 
                          key={application.id}
                          className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 ${
                            selectedApplication === application.id 
                              ? 'ring-2 ring-blue-500 dark:ring-blue-400' 
                              : ''
                          } ${getStatusColor(application.status)}/10`}
                          onClick={() => setSelectedApplication(application.id)}
                        >
                          <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                              <div className="flex-1">
                                <div className="flex items-start gap-4">
                                  <div className="relative">
                                    <Avatar className="h-14 w-14 border-2 border-white dark:border-gray-800 shadow-lg">
                                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                                        {application.teamName.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    {score >= 80 && (
                                      <div className="absolute -top-2 -right-2">
                                        <Badge className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-xs px-2 py-0">
                                          <Crown className="h-3 w-3 mr-1" />
                                          {dict.highlyRecommended}
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                        {application.teamName}
                                      </h3>
                                      <Badge className={`${getStatusColor(application.status)} text-white border-0`}>
                                        {application.status}
                                      </Badge>
                                      {!application.clientViewed && (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200">
                                          {dict.new}
                                        </Badge>
                                      )}
                                      {application.teamSummary.experienceLevel === 'expert' && (
                                        <Badge variant="outline" className="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200">
                                          <Award className="h-3 w-3 mr-1" />
                                          {dict.premium}
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                      {dict.appliedOn} {new Date(application.createdAt).toLocaleDateString()}
                                    </p>
                                    
                                    <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
                                      <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-slate-400" />
                                        <span>{application.teamSummary.memberCount} {dict.teamSize.toLowerCase()}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Star className="h-4 w-4 text-amber-400" />
                                        <span>{application.teamSummary.rating?.toFixed(1) || 'N/A'} {dict.rating}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                                        <span>{application.teamSummary.completedProjects || 0} {dict.completedProjects.toLowerCase()}</span>
                                      </div>
                                    </div>
                                    
                                    {/* Skills preview */}
                                    {appSkills.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mb-3">
                                        {appSkills.slice(0, 4).map((skill, index) => renderSkillBadge(skill, index))}
                                        {appSkills.length > 4 && (
                                          <Badge variant="outline" className="text-xs">
                                            +{appSkills.length - 4} more
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <Separator className="my-4" />
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-slate-600 dark:text-slate-400">{dict.proposedBudget}</span>
                                      <span className="font-bold text-slate-900 dark:text-white">
                                        ${application.proposedBudget.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-slate-600 dark:text-slate-400">{dict.estimatedTimeline}</span>
                                      <span className="font-medium text-slate-900 dark:text-white">
                                        {application.estimatedTimeline}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="text-sm text-slate-600 dark:text-slate-400">{dict.experienceLevel}</div>
                                    <div>
                                      <Badge variant="secondary" className="capitalize">
                                        {application.teamSummary.experienceLevel || 'Intermediate'}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-slate-600 dark:text-slate-400">{dict.successRate}</span>
                                      <span className="font-bold">{score}%</span>
                                    </div>
                                    <Progress value={score} className={`h-2 ${getScoreColor(score)}`} />
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Column: Application Details */}
          <div className="lg:col-span-1">
            {selectedApp ? (
              <Card className="border-0 shadow-xl bg-white dark:bg-gray-800 sticky top-8">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {dict.applicationDetails}
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push(`/teams/${selectedApp.teamId}`)}
                      className="hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {dict.viewTeam}
                    </Button>
                  </div>
                  <CardDescription>
                    {selectedApp.teamName}'s proposal
                  </CardDescription>
                </CardHeader>
                
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <CardContent className="space-y-6">
                    {/* Score Card */}
                    <div className="bg-gradient-to-br from-slate-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border border-slate-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-slate-900 dark:text-white">Match Score</span>
                        <Badge className={`${getScoreColor(getApplicationScore(selectedApp))} text-white`}>
                          {getApplicationScore(selectedApp)}%
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Experience</span>
                          <span className="font-medium">{selectedApp.teamSummary.experienceLevel || 'Intermediate'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Rating</span>
                          <span className="font-medium">{selectedApp.teamSummary.rating?.toFixed(1) || 'N/A'}/5.0</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Projects Completed</span>
                          <span className="font-medium">{selectedApp.teamSummary.completedProjects || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cover Letter */}
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        {dict.coverLetter}
                      </h4>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 max-h-48 overflow-y-auto">
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line text-sm">
                          {selectedApp.coverLetter}
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Team Details */}
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-purple-500" />
                        {dict.teamDetails}
                      </h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">{dict.teamMembers}</p>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-slate-400" />
                              <span className="font-medium">{selectedApp.teamSummary.memberCount}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">{dict.proposedBudget}</p>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-emerald-400" />
                              <span className="font-bold text-lg text-slate-900 dark:text-white">
                                ${selectedApp.proposedBudget.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">{dict.estimatedTimeline}</p>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-400" />
                              <span className="font-medium">{selectedApp.estimatedTimeline}</span>
                            </div>
                          </div>
                          {selectedApp.teamSummary.location && (
                            <div className="space-y-1">
                              <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-rose-400" />
                                <span className="font-medium">{selectedApp.teamSummary.location}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Skills & Roles */}
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Target className="h-5 w-5 text-orange-500" />
                        {dict.skillsRoles}
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{dict.primaryRoles}</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedApp.teamSummary.roles.map((role, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200"
                              >
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{dict.keySkills}</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedAppSkills.map((skill, index) => renderSkillBadge(skill, index))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    {selectedApp.status === 'pending' && !acceptedApplication && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                            <p className="text-sm text-amber-800 dark:text-amber-400 text-center">
                              <AlertCircle className="h-4 w-4 inline mr-2" />
                              {dict.onlyOneTeam}
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
                              <DialogTrigger asChild>
                                <Button 
                                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90"
                                  disabled={processing}
                                >
                                  {processing ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                  )}
                                  {dict.acceptTeam}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                  <DialogTitle className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                                    {dict.acceptDialogTitle}
                                  </DialogTitle>
                                  <DialogDescription>
                                    {dict.acceptDialogDescription}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    You're about to accept <span className="font-semibold">{selectedApp.teamName}</span> for this project.
                                  </p>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setAcceptDialogOpen(false)}
                                    disabled={processing}
                                  >
                                    {dict.cancel}
                                  </Button>
                                  <Button
                                    onClick={() => handleStatusUpdate(selectedApp.id, 'accepted')}
                                    disabled={processing}
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                  >
                                    {processing ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4 mr-2" />
                                    )}
                                    {dict.confirmAccept}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  className="flex-1 border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                                  disabled={processing}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  {dict.reject}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                  <DialogTitle className="bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent">
                                    {dict.rejectDialogTitle}
                                  </DialogTitle>
                                  <DialogDescription>
                                    {dict.rejectDialogDescription}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <Textarea
                                    placeholder={dict.feedbackPlaceholder}
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    className="min-h-[100px]"
                                  />
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setRejectDialogOpen(false)}
                                    disabled={processing}
                                  >
                                    {dict.cancel}
                                  </Button>
                                  <Button
                                    onClick={() => handleStatusUpdate(selectedApp.id, 'rejected')}
                                    disabled={processing}
                                    className="bg-gradient-to-r from-red-500 to-rose-600 text-white"
                                  >
                                    {processing ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <X className="h-4 w-4 mr-2" />
                                    )}
                                    {dict.confirmReject}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Status Actions */}
                    {selectedApp.status === 'accepted' && (
                      <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <p className="text-green-700 dark:text-green-400">
                            {dict.acceptedMessage}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedApp.status === 'rejected' && (
                      <div className="p-4 bg-gradient-to-r from-red-500/10 to-rose-500/10 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-3">
                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          <p className="text-red-700 dark:text-red-400">
                            {dict.rejectedMessage}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* View Conversation */}
                    <Button 
                      variant="outline" 
                      className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30"
                      onClick={() => router.push(`/messages?team=${selectedApp.teamId}&project=${projectId}`)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {dict.messageTeam}
                    </Button>
                  </CardContent>
                </ScrollArea>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-slate-300 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-gray-900">
                <CardContent className="pt-16 pb-16 text-center">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-20 animate-pulse rounded-full"></div>
                    <Filter className="h-16 w-16 text-slate-400 dark:text-slate-600 relative z-10" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {dict.selectApplication}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {dict.clickToView}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>

    
  );
}