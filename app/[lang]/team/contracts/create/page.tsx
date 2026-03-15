// app/team/contracts/create/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  FileText,
  Users,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  Target,
  CheckCircle,
  PlusCircle,
  X,
  Upload,
  Link,
  Eye,
  Save,
  Send,
  Shield,
  Zap,
  Sparkles,
  Award,
  Brain,
  Code,
  Palette,
  Database,
  Server,
  Smartphone,
  Globe,
  Lock,
  ChevronRight,
  Loader2,
  Star,
  Briefcase,
  Check,
  Search,
  FolderOpen,
  TrendingUp,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { teamContractDictionary, type Language } from '@/lib/dictionaries/team-contract-dictionary';
import { getTypeText } from '@/lib/contract-utils';
import { AccessDeniedCard } from '@/components/access/access-denied-card';

// Types from your applications page
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
    skills: SkillObject[] | string[];
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
  clientId?: string;
  createdAt?: string;
  updatedAt?: string;
  applicationCount?: number;
}

interface ClientProject {
  id: string;
  title: string;
  status: string;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  createdAt: string;
  applicationCount?: number;
  acceptedApplication?: TeamApplication;
}

interface Milestone {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  description: string;
}

interface Deliverable {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
}

interface ContractData {
  title: string;
  description: string;
  teamId: string;
  clientId: string;
  projectId?: string;
  applicationId?: string;
  type: 'fixedPrice' | 'hourlyRate' | 'milestoneBased' | 'retainer';
  value: string;
  currency: string;
  startDate: string;
  endDate: string;
  milestones: Milestone[];
  deliverables: Deliverable[];
  scopeOfWork: string;
  paymentTerms: string;
  specialTerms: string;
  attachments: Array<{ id: string; name: string; url: string }>;
  isRecurring: boolean;
  autoRenew: boolean;
  requiresAllSignatures: boolean;
  notificationSettings: {
    email: boolean;
    inApp: boolean;
    reminders: boolean;
  };
}

// Contract templates
const contractTemplates = [
  {
    id: '1',
    name: 'Standard Development Contract',
    description: 'For web and mobile development projects',
    color: 'bg-gradient-to-r from-blue-500 to-purple-600',
    icon: <Code className="h-5 w-5" />,
    type: 'fixedPrice' as const
  },
  {
    id: '2',
    name: 'Design & Branding Contract',
    description: 'For UI/UX design and branding projects',
    color: 'bg-gradient-to-r from-purple-500 to-pink-600',
    icon: <Palette className="h-5 w-5" />,
    type: 'hourlyRate' as const
  },
  {
    id: '3',
    name: 'DevOps & Infrastructure',
    description: 'For cloud infrastructure and DevOps',
    color: 'bg-gradient-to-r from-emerald-500 to-green-600',
    icon: <Server className="h-5 w-5" />,
    type: 'milestoneBased' as const
  },
  {
    id: '4',
    name: 'AI/ML Development',
    description: 'For artificial intelligence projects',
    color: 'bg-gradient-to-r from-violet-500 to-indigo-600',
    icon: <Brain className="h-5 w-5" />,
    type: 'fixedPrice' as const
  },
  {
    id: '5',
    name: 'Mobile App Development',
    description: 'For iOS and Android applications',
    color: 'bg-gradient-to-r from-cyan-500 to-blue-600',
    icon: <Smartphone className="h-5 w-5" />,
    type: 'milestoneBased' as const
  },
  {
    id: '6',
    name: 'Monthly Retainer',
    description: 'Ongoing support and maintenance',
    color: 'bg-gradient-to-r from-amber-500 to-orange-600',
    icon: <Shield className="h-5 w-5" />,
    type: 'retainer' as const
  },
];

// Helper function to process skills
const processSkills = (skills: SkillObject[] | string[]): SkillObject[] => {
  if (!skills || skills.length === 0) return [];
  
  if (typeof skills[0] === 'string') {
    return (skills as string[]).map(skill => ({
      name: skill as string,
      category: 'other'
    }));
  }
  
  return skills as SkillObject[];
};

export default function CreateTeamContractPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const userRole=session?.user?.role
   if (userRole === 'freelancer' || userRole === 'freelance') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <AccessDeniedCard
          accessType="client-only"
          currentRole={userRole}
          showLoginButton={status === 'unauthenticated'}
          redirectPath="/team/contracts"
        />
      </div>
    );
  }
  const { toast } = useToast();
  
  const [language, setLanguage] = useState<Language>('en');
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  // Data state
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [applications, setApplications] = useState<TeamApplication[]>([]);
  const [acceptedApplication, setAcceptedApplication] = useState<TeamApplication | null>(null);
  const [loadingData, setLoadingData] = useState({
    projects: false,
    applications: false
  });
  
  // Get projectId and applicationId from URL params
  const projectId = searchParams.get('projectId');
  const applicationId = searchParams.get('applicationId');
  
  // Form state
  const [contractData, setContractData] = useState<ContractData>({
    title: '',
    description: '',
    teamId: '',
    clientId: '',
    projectId: projectId || undefined,
    applicationId: applicationId || undefined,
    type: 'fixedPrice',
    value: '',
    currency: 'USD',
    startDate: '',
    endDate: '',
    milestones: [],
    deliverables: [],
    scopeOfWork: '',
    paymentTerms: '',
    specialTerms: '',
    attachments: [],
    isRecurring: false,
    autoRenew: false,
    requiresAllSignatures: true,
    notificationSettings: {
      email: true,
      inApp: true,
      reminders: true
    }
  });

  const dict = teamContractDictionary[language];

  // Initialize based on URL params or fetch projects
  useEffect(() => {
    if (status === 'authenticated') {
      if (projectId && applicationId) {
        // Direct link with params - load specific project and application
        fetchProjectAndApplications(projectId);
        setActiveStep(2); // Skip project selection
      } else {
        // No params - load projects for selection
        fetchClientProjects();
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, projectId, applicationId]);

  const fetchClientProjects = async () => {
    try {
      setLoadingData(prev => ({ ...prev, projects: true }));
      
      // Fetch client's projects with accepted applications
      const response = await fetch('/api/client/projects?status=accepted');
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoadingData(prev => ({ ...prev, projects: false }));
    }
  };

 // In the fetchProjectAndApplications function, update this part:
const fetchProjectAndApplications = async (targetProjectId: string) => {
  try {
    setLoadingData(prev => ({ ...prev, applications: true }));
    
    // Fetch project and team applications
    const response = await fetch(`/api/projects/${targetProjectId}/team-applications`);
    const data = await response.json();
    
    if (data.success) {
      setSelectedProject(data.project);
      
      // Process applications
      const processedApplications = data.applications.map((app: TeamApplication) => ({
        ...app,
        teamSummary: {
          ...app.teamSummary,
          skills: processSkills(app.teamSummary.skills || [])
        }
      }));
      
      setApplications(processedApplications);
      
      // Find accepted application
      let acceptedApp: TeamApplication | null = null;
      
      // First try to use applicationId from URL if provided
      if (applicationId) {
        acceptedApp = processedApplications.find((app: TeamApplication) => app.id === applicationId);
        if (!acceptedApp) {
          toast({
            title: "Application Not Found",
            description: "The specified application was not found.",
            variant: "destructive",
          });
        }
      }
      
      // If no specific applicationId or not found, look for any accepted application
      if (!acceptedApp) {
        acceptedApp = processedApplications.find((app: TeamApplication) => app.status === 'accepted');
      }
      
      if (acceptedApp) {
        setAcceptedApplication(acceptedApp);
        prefillContractData(data.project, acceptedApp);
      } else {
        // Show a more helpful message with options
        toast({
          title: "No Accepted Team",
          description: "This project doesn't have an accepted team yet.",
          variant: "destructive",
        });
        
        // Check if there are pending applications
        const pendingApps = processedApplications.filter((app: TeamApplication) => app.status === 'pending');
        if (pendingApps.length > 0) {
          // There are pending applications - suggest going to review them
          setTimeout(() => {
            if (confirm("This project has pending team applications. Would you like to review and accept one now?")) {
              router.push(`/projects/${targetProjectId}/applications`);
            }
          }, 1000);
        } else {
          // No applications at all
          setTimeout(() => {
            if (confirm("This project doesn't have any team applications yet. Would you like to view the project?")) {
              router.push(`/projects/${targetProjectId}`);
            }
          }, 1000);
        }
      }
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to load project data",
      variant: "destructive",
    });
  } finally {
    setLoadingData(prev => ({ ...prev, applications: false }));
  }
};

  const prefillContractData = (project: Project, acceptedApp: TeamApplication) => {
    const currentUserId = (session?.user as any)?.id;
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(today.getMonth() + 3); // Default 3 months duration
    
    setContractData(prev => ({
      ...prev,
      title: `${project.title} - ${acceptedApp.teamName} Contract`,
      description: acceptedApp.coverLetter.substring(0, 200) + '...',
      teamId: acceptedApp.teamId,
      clientId: currentUserId || '',
      projectId: project.id,
      applicationId: acceptedApp.id,
      value: acceptedApp.proposedBudget.toString(),
      currency: 'USD',
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      scopeOfWork: acceptedApp.coverLetter,
      specialTerms: `Based on accepted application for project: ${project.title}\nProposed Budget: $${acceptedApp.proposedBudget}\nEstimated Timeline: ${acceptedApp.estimatedTimeline}`,
      deliverables: [{
        id: 'deliverable-1',
        title: 'Project Completion',
        description: `Complete ${project.title} according to agreed specifications`,
        dueDate: acceptedApp.estimatedTimeline
      }],
      milestones: acceptedApp.teamSummary.experienceLevel === 'expert' ? [
        {
          id: 'milestone-1',
          title: 'Initial Delivery',
          amount: Math.round(acceptedApp.proposedBudget * 0.3),
          dueDate: '',
          description: 'Initial project setup and planning'
        },
        {
          id: 'milestone-2',
          title: 'Mid-Project Review',
          amount: Math.round(acceptedApp.proposedBudget * 0.4),
          dueDate: '',
          description: 'Progress review and adjustments'
        },
        {
          id: 'milestone-3',
          title: 'Final Delivery',
          amount: Math.round(acceptedApp.proposedBudget * 0.3),
          dueDate: '',
          description: 'Project completion and handover'
        }
      ] : [
        {
          id: 'milestone-1',
          title: 'Project Completion',
          amount: acceptedApp.proposedBudget,
          dueDate: '',
          description: 'Complete project delivery'
        }
      ]
    }));
  };

  const handleSelectProject = (project: ClientProject) => {
    setSelectedProject(project);
    if (project.acceptedApplication) {
      setAcceptedApplication(project.acceptedApplication);
      prefillContractData(project, project.acceptedApplication);
      setActiveStep(2); // Move to contract details
    } else {
      // Navigate to applications page to accept a team first
      router.push(`/projects/${project.id}/applications`);
    }
  };

  const handleBackToProjectSelection = () => {
    setSelectedProject(null);
    setAcceptedApplication(null);
    setApplications([]);
    setActiveStep(1);
  };

  const handleNextStep = () => {
    if (activeStep < 5) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 1) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleTemplateSelect = (template: any) => {
    setContractData(prev => ({
      ...prev,
      type: template.type,
      title: `${selectedProject?.title || 'Project'} - ${template.name}`,
      description: template.description
    }));
    setShowTemplateModal(false);
    toast({
      title: dict.templateApplied,
      description: `${template.name} template has been applied`,
    });
  };

  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: `milestone-${Date.now()}`,
      title: '',
      amount: 0,
      dueDate: '',
      description: ''
    };
    setContractData(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone]
    }));
  };

  const updateMilestone = (id: string, field: string, value: any) => {
    setContractData(prev => ({
      ...prev,
      milestones: prev.milestones.map(milestone =>
        milestone.id === id ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const removeMilestone = (id: string) => {
    setContractData(prev => ({
      ...prev,
      milestones: prev.milestones.filter(milestone => milestone.id !== id)
    }));
  };

  const addDeliverable = () => {
    const newDeliverable: Deliverable = {
      id: `deliverable-${Date.now()}`,
      title: '',
      description: ''
    };
    setContractData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, newDeliverable]
    }));
  };

  const updateDeliverable = (id: string, field: string, value: string) => {
    setContractData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map(deliverable =>
        deliverable.id === id ? { ...deliverable, [field]: value } : deliverable
      )
    }));
  };

  const removeDeliverable = (id: string) => {
    setContractData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter(deliverable => deliverable.id !== id)
    }));
  };

const handleSubmit = async () => {
  setLoading(true);
  try {
    // Validate dates before processing
    const validateDate = (dateStr: string | undefined) => {
      if (!dateStr || dateStr.trim() === "") return undefined;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? undefined : date.toISOString();
    };

    // Prepare data for the API
    const contractPayload = {
      title: contractData.title,
      description: contractData.description,
      teamId: contractData.teamId,
      clientId: contractData.clientId,
      type: contractData.type,
      value: parseFloat(contractData.value),
      currency: contractData.currency,
      startDate: validateDate(contractData.startDate) || new Date().toISOString(),
      endDate: validateDate(contractData.endDate) || new Date().toISOString(),
      scopeOfWork: contractData.scopeOfWork,
      deliverables: contractData.deliverables.map(d => ({
        title: d.title,
        description: d.description,
        dueDate: validateDate(d.dueDate)
      })),
      milestones: contractData.milestones.map(m => ({
        title: m.title,
        amount: m.amount,
        dueDate: validateDate(m.dueDate) || new Date().toISOString(), // Provide default date
        description: m.description
      })),
      paymentTerms: contractData.paymentTerms,
      specialTerms: contractData.specialTerms,
      requiresAllSignatures: contractData.requiresAllSignatures,
      isRecurring: contractData.isRecurring,
      autoRenew: contractData.autoRenew
    };
    
    console.log("Contract payload:", contractPayload);
    
    const response = await fetch('/api/team/contracts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contractPayload),
    });

    const data = await response.json();

    if (data.success) {
      toast({
        title: dict.contractCreated,
        description: "Your team contract has been created successfully",
        className: "bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0",
      });
      
      if (acceptedApplication && contractData.applicationId) {
        try {
          await fetch(`/api/team-applications/${contractData.applicationId}/link-contract`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contractId: data.contractId })
          });
        } catch (error) {
          console.error("Failed to link contract to application:", error);
        }
      }
      
      router.push(`/team/contracts/${data.contractId}`);
    } else {
      throw new Error(data.error || "Failed to create contract");
    }
  } catch (error) {
    console.error("Submit error:", error);
    toast({
      title: dict.errorCreate,
      description: error instanceof Error ? error.message : "Please try again",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
  // Step 1: Project Selection
  const renderProjectSelectionStep = () => (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-blue-500" />
          {dict.selectProjectStep}
        </CardTitle>
        <CardDescription>
          {dict.chooseProject} {dict.createFromAcceptedTeam}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadingData.projects ? (
          <div className="py-12 text-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">{dict.loadingProjects}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-12 text-center">
            <FolderOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{dict.noProjectsWithAcceptedTeams}</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              You need to accept a team for a project before creating a contract.
            </p>
            <Button 
              onClick={() => router.push('/dashboard/client/projects')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              View Your Projects
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={dict.searchProjects}
                className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <Card 
                  key={project.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                  onClick={() => handleSelectProject(project)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg mb-2">{project.title}</h3>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="capitalize">
                            {project.status}
                          </Badge>
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                            Team Accepted
                          </Badge>
                        </div>
                      </div>
                      <Briefcase className="h-8 w-8 text-blue-500" />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{dict.projectBudget}</span>
                        <span className="font-bold">${project.budget.min} - ${project.budget.max} {project.budget.currency}</span>
                      </div>
                      
                      {project.acceptedApplication && (
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                {project.acceptedApplication.teamName.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{project.acceptedApplication.teamName}</p>
                              <p className="text-xs text-slate-500">
                                {project.acceptedApplication.teamSummary.memberCount} members
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Proposed:</span>
                            <span className="font-bold">${project.acceptedApplication.proposedBudget.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/projects/${project.id}/applications`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {dict.viewProjectDetails}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <div className="text-sm text-slate-500">
          {projects.length} {dict.projectsWithAcceptedTeams.toLowerCase()}
        </div>
      </CardFooter>
    </Card>
  );

  if (loadingData.applications) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">{dict.loadingData}</p>
        </div>
      </div>
    );
  }

  if (!selectedProject && !projectId) {
    // Show project selection
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950/20">
        {/* Header */}
        <div className="border-b border-slate-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-1">
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="mb-6 group transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back
                </Button>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {dict.createContract}
                      </h1>
                      <p className="text-slate-600 dark:text-slate-400">
                        {dict.chooseProject} {dict.createFromAcceptedTeam}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[100px] bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">EN</SelectItem>
                    <SelectItem value="fr">FR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {renderProjectSelectionStep()}
          </div>
        </div>
      </div>
    );
  }

  if (!acceptedApplication) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950/20 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-2xl">
          <CardContent className="pt-12 pb-12 text-center">
            <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{dict.noAcceptedTeam}</h3>
            <p className="text-slate-600 mb-6">
              {dict.noAcceptedTeamMessage}
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={handleBackToProjectSelection}
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Choose Different Project
              </Button>
              <Button 
                onClick={() => router.push(`/projects/${selectedProject?.id}/applications`)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                View Applications
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedTeam = acceptedApplication;
  const selectedTeamSkills = processSkills(selectedTeam.teamSummary.skills);

  // Steps when project is selected
  const steps = [
    { number: 1, title: dict.selectProjectStep, active: activeStep === 1 },
    { number: 2, title: dict.contractBasics, active: activeStep === 2 },
    { number: 3, title: dict.scopeOfWork, active: activeStep === 3 },
    { number: 4, title: dict.paymentTerms, active: activeStep === 4 },
    { number: 5, title: dict.reviewCreate, active: activeStep === 5 },
  ];

  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return renderProjectSelectionStep();
      case 2:
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                {dict.contractBasics}
              </CardTitle>
              <CardDescription>
                {dict.startDate} {dict.and} {dict.endDate} {dict.contractDetails}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title" className="mb-2">
                  {dict.contractTitle} *
                </Label>
                <Input
                  id="title"
                  value={contractData.title}
                  onChange={(e) => setContractData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={dict.enterContractTitle}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="mb-2">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={contractData.description}
                  onChange={(e) => setContractData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={dict.briefDescription}
                  rows={4}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="mb-2">
                    {dict.startDate} *
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={contractData.startDate}
                    onChange={(e) => setContractData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  />
                </div>
                
                <div>
                  <Label htmlFor="endDate" className="mb-2">
                    {dict.endDate} *
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={contractData.endDate}
                    onChange={(e) => setContractData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{dict.useTemplate}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {dict.startWithPreMadeTemplate}
                    </p>
                  </div>
                  <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        {dict.browseTemplates}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>{dict.selectTemplate}</DialogTitle>
                        <DialogDescription>
                          {dict.chooseFromProfessionallyDesignedContractTemplates}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                        {contractTemplates.map(template => (
                          <Card 
                            key={template.id}
                            className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                            onClick={() => handleTemplateSelect(template)}
                          >
                            <CardContent className="p-6">
                              <div className={`${template.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                                <div className="text-white">
                                  {template.icon}
                                </div>
                              </div>
                              <h3 className="font-semibold mb-2">{template.name}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                {template.description}
                              </p>
                              <Badge variant="outline" className="capitalize">
                                {template.type.replace('Based', ' Based')}
                              </Badge>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
                          {dict.cancel}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {contractTemplates.slice(0, 3).map(template => (
                    <Badge 
                      key={template.id}
                      className="cursor-pointer hover:opacity-80"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      {template.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBackToProjectSelection}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                {dict.previousStep}
              </Button>
              <Button 
                onClick={handleNextStep}
                disabled={!contractData.title || !contractData.startDate || !contractData.endDate}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
              >
                {dict.nextStep}: {dict.scopeOfWork}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        );
      case 3:
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-500" />
                {dict.scopeOfWork} & {dict.deliverables}
              </CardTitle>
              <CardDescription>
                {dict.defineWhatNeedsToBeDeliveredAndWhen}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="scopeOfWork" className="mb-2">
                  {dict.scopeOfWork} *
                </Label>
                <Textarea
                  id="scopeOfWork"
                  value={contractData.scopeOfWork}
                  onChange={(e) => setContractData(prev => ({ ...prev, scopeOfWork: e.target.value }))}
                  placeholder={dict.describeScopeOfWork}
                  rows={6}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Based on application: "{selectedTeam.coverLetter.substring(0, 100)}..."
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label className="text-base font-medium">{dict.deliverables}</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {dict.listAllDeliverablesForThisContract}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={addDeliverable}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {dict.addDeliverable}
                  </Button>
                </div>
                
                {contractData.deliverables.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center">
                    <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                      {dict.noDeliverablesAddedYet}
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={addDeliverable}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {dict.addFirstDeliverable}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contractData.deliverables.map((deliverable, index) => (
                      <div key={deliverable.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold">Deliverable {index + 1}</h4>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDeliverable(deliverable.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm">Title *</Label>
                            <Input
                              value={deliverable.title}
                              onChange={(e) => updateDeliverable(deliverable.id, 'title', e.target.value)}
                              placeholder="e.g., Homepage Design Mockups"
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-sm">Description</Label>
                            <Textarea
                              value={deliverable.description}
                              onChange={(e) => updateDeliverable(deliverable.id, 'description', e.target.value)}
                              placeholder="Detailed description of this deliverable..."
                              rows={2}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="specialTerms" className="mb-2">
                  {dict.specialTerms}
                </Label>
                <Textarea
                  id="specialTerms"
                  value={contractData.specialTerms}
                  onChange={(e) => setContractData(prev => ({ ...prev, specialTerms: e.target.value }))}
                  placeholder="Any special terms, conditions, or requirements..."
                  rows={4}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {dict.previousStep}
              </Button>
              <Button 
                onClick={handleNextStep}
                disabled={!contractData.scopeOfWork || contractData.deliverables.length === 0}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
              >
                {dict.nextStep}: {dict.paymentTerms}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        );
      case 4:
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                {dict.paymentTerms}
              </CardTitle>
              <CardDescription>
                {dict.setUpPaymentStructureAndTerms}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="type" className="mb-2">
                    {dict.contractType} *
                  </Label>
                  <Select 
                    value={contractData.type} 
                    onValueChange={(value: any) => setContractData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixedPrice">{dict.fixedPrice}</SelectItem>
                      <SelectItem value="hourlyRate">{dict.hourlyRate}</SelectItem>
                      <SelectItem value="milestoneBased">{dict.milestoneBased}</SelectItem>
                      <SelectItem value="retainer">{dict.retainer}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="currency" className="mb-2">
                    {dict.currency}
                  </Label>
                  <Select 
                    value={contractData.currency} 
                    onValueChange={(value) => setContractData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="value" className="mb-2">
                  {contractData.type === 'retainer' ? dict.monthlyRate : dict.contractValue} *
                </Label>
                <Input
                  id="value"
                  type="number"
                  value={contractData.value}
                  onChange={(e) => setContractData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder={contractData.type === 'retainer' ? "e.g., 5000" : "e.g., 25000"}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Based on accepted proposal: ${selectedTeam.proposedBudget.toLocaleString()}
                </p>
              </div>
              
              {contractData.type === 'milestoneBased' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label className="text-base font-medium">{dict.milestones}</Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {dict.definePaymentMilestones}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={addMilestone}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {dict.addMilestone}
                    </Button>
                  </div>
                  
                  {contractData.milestones.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center">
                      <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">
                        {dict.noMilestonesAddedYet}
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={addMilestone}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        {dict.addFirstMilestone}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contractData.milestones.map((milestone, index) => (
                        <div key={milestone.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold">Milestone {index + 1}</h4>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMilestone(milestone.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">Title *</Label>
                              <Input
                                value={milestone.title}
                                onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                                placeholder="e.g., Design Phase Completion"
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-sm">Due Date *</Label>
                              <Input
                                type="date"
                                value={milestone.dueDate}
                                onChange={(e) => updateMilestone(milestone.id, 'dueDate', e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-sm">Amount *</Label>
                              <Input
                                type="number"
                                value={milestone.amount}
                                onChange={(e) => updateMilestone(milestone.id, 'amount', parseFloat(e.target.value))}
                                placeholder="e.g., 5000"
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-sm">Description</Label>
                              <Input
                                value={milestone.description}
                                onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                                placeholder="Brief description..."
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <Label htmlFor="paymentTerms" className="mb-2">
                  {dict.paymentTerms}
                </Label>
                <Textarea
                  id="paymentTerms"
                  value={contractData.paymentTerms}
                  onChange={(e) => setContractData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  placeholder="e.g., 50% upfront, 50% upon completion..."
                  rows={3}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isRecurring" className="text-base font-medium">
                      {dict.recurringContract}
                    </Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {dict.thisContractAutomaticallyRenews}
                    </p>
                  </div>
                  <Switch
                    id="isRecurring"
                    checked={contractData.isRecurring}
                    onCheckedChange={(checked) => setContractData(prev => ({ ...prev, isRecurring: checked }))}
                  />
                </div>
                
                {contractData.isRecurring && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoRenew" className="text-base font-medium">
                        {dict.autoRenewal}
                      </Label>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {dict.automaticallyRenewAtContractEnd}
                      </p>
                    </div>
                    <Switch
                      id="autoRenew"
                      checked={contractData.autoRenew}
                      onCheckedChange={(checked) => setContractData(prev => ({ ...prev, autoRenew: checked }))}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requiresAllSignatures" className="text-base font-medium">
                      {dict.allMembersMustSign}
                    </Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {dict.requireSignaturesFromAllTeamMembers}
                    </p>
                  </div>
                  <Switch
                    id="requiresAllSignatures"
                    checked={contractData.requiresAllSignatures}
                    onCheckedChange={(checked) => setContractData(prev => ({ ...prev, requiresAllSignatures: checked }))}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveStep(3)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {dict.previousStep}
              </Button>
              {/**/}
<Button 
  onClick={handleNextStep}
  disabled={!contractData.value || parseFloat(contractData.value) <= 0}
  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
>
                {dict.nextStep}: {dict.reviewCreate}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        );
      case 5:
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                {dict.reviewCreate}
              </CardTitle>
              <CardDescription>
                {dict.reviewAllDetailsBeforeCreatingTheContract}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {contractData.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mt-1">
                        {contractData.description}
                      </p>
                    </div>
                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-lg px-4 py-2">
                      {contractData.type === 'retainer' 
                        ? `${contractData.value} ${contractData.currency}/month`
                        : `${contractData.value} ${contractData.currency}`
                      }
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Project</p>
                      <p className="font-semibold">{selectedProject?.title}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Team</p>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                            {selectedTeam.teamName.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-semibold">{selectedTeam.teamName}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Duration</p>
                      <p className="font-semibold">
                        {contractData.startDate} to {contractData.endDate}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Type</p>
                      <Badge variant="outline" className="capitalize">
                        {getTypeText(contractData.type)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Sections Review */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">{dict.scopeOfWork}</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setActiveStep(3)}
                    >
                      Edit
                    </Button>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
                    {contractData.scopeOfWork || 'Not specified'}
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">{dict.deliverables}</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setActiveStep(3)}
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {contractData.deliverables.map((deliverable, index) => (
                      <div key={deliverable.id} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{deliverable.title}</p>
                          {deliverable.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {deliverable.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {contractData.milestones.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">{dict.milestones}</h4>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setActiveStep(4)}
                        >
                          Edit
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {contractData.milestones.map((milestone, index) => (
                          <div key={milestone.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center">
                                <span className="text-white text-sm">${milestone.amount}</span>
                              </div>
                              <div>
                                <p className="font-medium">{milestone.title}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  Due: {milestone.dueDate}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">{dict.contractSettings}</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setActiveStep(4)}
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{dict.allMembersMustSign}</p>
                      <Badge variant={contractData.requiresAllSignatures ? "default" : "outline"}>
                        {contractData.requiresAllSignatures ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{dict.recurringContract}</p>
                      <Badge variant={contractData.isRecurring ? "default" : "outline"}>
                        {contractData.isRecurring ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{dict.autoRenewal}</p>
                      <Badge variant={contractData.autoRenew ? "default" : "outline"}>
                        {contractData.autoRenew ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{dict.currency}</p>
                      <Badge variant="outline">{contractData.currency}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveStep(4)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {dict.previousStep}
              </Button>
              <div className="flex gap-3">
                <Button variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  {dict.saveDraft}
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:opacity-90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {dict.creating}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {dict.createContractButton}
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950/20">
      {/* Header */}
      <div className="border-b border-slate-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <Button
                variant="ghost"
                onClick={() => {
                  if (activeStep > 1) {
                    handlePrevStep();
                  } else if (selectedProject) {
                    handleBackToProjectSelection();
                  } else {
                    router.back();
                  }
                }}
                className="mb-6 group transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                {activeStep > 1 || selectedProject ? dict.previousStep : 'Back'}
              </Button>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {dict.createContract}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                      {selectedProject 
                        ? `Creating contract for: ${selectedProject.title}`
                        : dict.chooseProject
                      }
                    </p>
                  </div>
                </div>
                
                {/* Project and Team Info */}
                {selectedProject && (
                  <div className="flex flex-wrap items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-700">
                      <Briefcase className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">{selectedProject.title}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-700">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">{selectedTeam.teamName}</span>
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs">
                        Accepted
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-700">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium">${selectedTeam.proposedBudget.toLocaleString()}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToProjectSelection}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    >
                      <FolderOpen className="h-3 w-3 mr-1" />
                      Change Project
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[100px] bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="fr">FR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Steps - Only show if project is selected */}
        {selectedProject && (
          <div className="mb-8">
            <div className="grid grid-cols-5 gap-4 mb-4">
              {steps.map((step) => (
                <div key={step.number} className="text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    step.active
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                      : step.number < activeStep
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {step.number < activeStep ? <CheckCircle className="h-5 w-5" /> : step.number}
                  </div>
                  <p className={`text-sm ${step.active ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                    {step.title}
                  </p>
                </div>
              ))}
            </div>
            <Progress value={((activeStep - 1) / 4) * 100} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form */}
          <div className="lg:col-span-2 space-y-6">
            {renderStepContent()}
          </div>
          
          {/* Right Column: Preview & Info */}
          {selectedProject && activeStep > 1 && (
            <div className="space-y-6">
              {/* Project Details */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 dark:from-blue-500/5 dark:via-gray-800 dark:to-blue-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-500" />
                    {dict.projectDetails}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-lg">{selectedProject.title}</h4>
                      {selectedProject.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {selectedProject.description.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">{dict.projectBudget}</span>
                        <span className="font-medium">
                          ${selectedProject.budget.min} - ${selectedProject.budget.max} {selectedProject.budget.currency || 'USD'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">{dict.projectStatus}</span>
                        <Badge variant="outline" className="capitalize">
                          {selectedProject.status}
                        </Badge>
                      </div>
                      {selectedProject.category && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Category</span>
                          <Badge variant="secondary">{selectedProject.category}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Team Info */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 dark:from-emerald-500/5 dark:via-gray-800 dark:to-emerald-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-500" />
                    {dict.selectedTeam}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {selectedTeam.teamName.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">{selectedTeam.teamName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {selectedTeam.teamSummary.memberCount} {dict.teamMembers.toLowerCase()}
                          </Badge>
                          {selectedTeam.teamSummary.rating && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              {selectedTeam.teamSummary.rating}/5.0
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">{dict.keySkills}:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTeamSkills.slice(0, 5).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {typeof skill === 'string' ? skill : skill.name}
                          </Badge>
                        ))}
                        {selectedTeamSkills.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{selectedTeamSkills.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">{dict.proposedBudget}</span>
                        <span className="font-bold">${selectedTeam.proposedBudget.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">{dict.estimatedTimeline}</span>
                        <span className="font-medium">{selectedTeam.estimatedTimeline}</span>
                      </div>
                      {selectedTeam.teamSummary.completedProjects && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 dark:text-slate-400">{dict.completedProjects}</span>
                          <span className="font-medium">{selectedTeam.teamSummary.completedProjects}</span>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push(`/teams/${selectedTeam.teamId}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {dict.viewTeam}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Contract Preview */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 dark:from-purple-500/5 dark:via-gray-800 dark:to-purple-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-500" />
                    {dict.contractPreview}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                        <p className="font-semibold">{contractData.title || 'Untitled Contract'}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {contractData.type ? getTypeText(contractData.type) : 'No type selected'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">{dict.projectStatus}</span>
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                          {dict.draft}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">{dict.teamSize}</span>
                        <span className="font-medium">{selectedTeam.teamSummary.memberCount} {dict.teamMembers.toLowerCase()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">{dict.timeline}</span>
                        <span className="font-medium">
                          {contractData.startDate && contractData.endDate 
                            ? `${Math.round((new Date(contractData.endDate).getTime() - new Date(contractData.startDate).getTime()) / (1000 * 60 * 60 * 24))} ${dict.daysRemaining}`
                            : 'Not set'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Tips & Best Practices */}
              {activeStep === 2 && (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 dark:from-amber-500/5 dark:via-gray-800 dark:to-amber-500/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      {dict.tipsBestPractices}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                          <Shield className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{dict.beSpecific}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {dict.clearlyDefine}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{dict.includeMilestones}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {dict.breakDownProjects}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg">
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{dict.clearExpectations}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {dict.defineCommunication}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg">
                          <Lock className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{dict.protectRights}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {dict.includeIP}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}