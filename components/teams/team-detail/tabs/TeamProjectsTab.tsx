// components/teams/team-detail/tabs/TeamProjectsTab.tsx
import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  Target, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  ArrowRight,
  Briefcase,
  Building2,
  Eye,
  MoreVertical,
  MessageSquare,
  Download,
  X,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

interface TeamProjectsTabProps {
  projects: any[];
  loading: boolean;
  statistics: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalRevenue: number;
    completionRate: number;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    case 'completed':
      return 'bg-gradient-to-r from-emerald-500 to-green-500';
    case 'pending':
    case 'draft':
      return 'bg-gradient-to-r from-amber-500 to-orange-500';
    case 'overdue':
      return 'bg-gradient-to-r from-red-500 to-rose-500';
    case 'cancelled':
      return 'bg-gradient-to-r from-gray-500 to-slate-500';
    default:
      return 'bg-gradient-to-r from-slate-500 to-gray-500';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return 'Active';
    case 'completed': return 'Completed';
    case 'pending': return 'Pending';
    case 'draft': return 'Draft';
    case 'overdue': return 'Overdue';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
};

const getTypeText = (type: string) => {
  switch (type) {
    case 'fixedPrice': return 'Fixed Price';
    case 'hourlyRate': return 'Hourly Rate';
    case 'milestoneBased': return 'Milestone Based';
    case 'retainer': return 'Retainer';
    default: return type;
  }
};

const formatCurrency = (value: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export function TeamProjectsTab({ projects, loading, statistics }: TeamProjectsTabProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Projects</p>
                <h3 className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-2">
                  {statistics.totalProjects}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Active</p>
                <h3 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mt-2">
                  {statistics.activeProjects}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Revenue</p>
                <h3 className="text-3xl font-bold text-amber-700 dark:text-amber-300 mt-2">
                  {formatCurrency(statistics.totalRevenue)}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <DollarSign className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Completion Rate</p>
                <h3 className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-2">
                  {Math.round(statistics.completionRate)}%
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Projects & Contracts</CardTitle>
              <CardDescription>
                Active and completed projects for this team
              </CardDescription>
            </div>
            <Button 
              variant="outline"
              onClick={() => router.push('/team/contracts')}
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              View All Contracts
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
                <FileText className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Projects Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                This team hasn't worked on any projects yet. Once you start working with clients, 
                your contracts and projects will appear here.
              </p>
              <Button 
                onClick={() => router.push('/projects')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                Browse Projects
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const tags = [
                  getTypeText(project.type),
                  project.isRecurring && 'Recurring',
                  project.project?.category
                ].filter(Boolean);

                return (
                  <Card 
                    key={project.id}
                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 bg-gradient-to-r from-white to-slate-50 dark:from-gray-800 dark:to-gray-900"
                    onClick={() => router.push(`/team/contracts/${project.contractId}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Side: Project Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                                {project.title}
                              </h3>
                              {project.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                                  {project.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mb-3">
                                <Badge className={`${getStatusColor(project.status)} text-white border-0`}>
                                  {getStatusText(project.status)}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {getTypeText(project.type)}
                                </Badge>
                                {project.isRecurring && (
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Recurring
                                  </Badge>
                                )}
                                {project.daysRemaining < 0 && project.status === 'active' && (
                                  <Badge variant="outline" className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-200">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {formatCurrency(project.value, project.currency)}
                                {project.type === 'retainer' && '/month'}
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Contract Value
                              </p>
                            </div>
                          </div>
                          
                          {/* Client & Project Info */}
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                {project.client?.avatar ? (
                                  <AvatarImage src={project.client.avatar} />
                                ) : (
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                    {project.client?.name?.substring(0, 2) || 'CL'}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                  {project.client?.name || 'Client'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Client</p>
                              </div>
                            </div>
                            
                            {project.project && (
                              <>
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                                <div className="flex items-center gap-2">
                                  <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600">
                                    <Target className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                      {project.project.title}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Project</p>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                          
                          {/* Timeline & Progress */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-600 dark:text-slate-400">
                                  {formatDate(project.startDate)} - {formatDate(project.endDate)}
                                </span>
                              </div>
                              {project.daysRemaining > 0 && project.status === 'active' && (
                                <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-200">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {project.daysRemaining} days remaining
                                </Badge>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Progress</span>
                                <span className="font-medium">{project.progress}%</span>
                              </div>
                              <Progress value={project.progress} className="h-2" />
                            </div>
                            
                            {/* Milestones */}
                            {project.milestones && project.milestones.length > 0 && (
                              <div className="flex items-center gap-2 text-sm">
                                <Target className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-600 dark:text-slate-400">
                                  {project.milestones.filter((m: any) => m.completed).length}
                                  /{project.milestones.length} milestones completed
                                </span>
                              </div>
                            )}
                            
                            {/* Signatures */}
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-600 dark:text-slate-400">
                                  {project.signatures.completed}/{project.signatures.total} signatures
                                </span>
                              </div>
                              {project.signatures.completed === project.signatures.total ? (
                                <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  All signatures complete
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-200">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Waiting for {project.signatures.total - project.signatures.completed} signatures
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Right Side: Actions */}
                        <div className="flex flex-col justify-between min-w-[200px]">
                          <div className="flex flex-wrap gap-2">
                            {tags.map((tag, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                className="text-xs bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-gray-900"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/team/contracts/${project.contractId}`);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {project.status === 'pending' && (
                                  <DropdownMenuItem className="text-emerald-600">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Sign Contract
                                  </DropdownMenuItem>
                                )}
                                {project.status === 'active' && project.daysRemaining < 30 && (
                                  <DropdownMenuItem>
                                    <Target className="h-4 w-4 mr-2" />
                                    Renew Contract
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(`${window.location.origin}/team/contracts/${project.contractId}`);
                                    // You might want to add a toast notification here
                                  }}
                                >
                                  Copy Link
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
        
        {projects.length > 0 && (
          <CardFooter className="border-t border-slate-200 dark:border-gray-800 pt-6">
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              </p>
              <Button 
                variant="outline"
                onClick={() => router.push('/team/contracts')}
              >
                View All Team Contracts
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}