// app/teams/[id]/applications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Users, 
  DollarSign, 
  Calendar, 
  Clock, 
  TrendingUp,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  BarChart3,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

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
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  clientViewed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Team {
  id: string;
  name: string;
  memberCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Statistics {
  totalApplications: number;
  pending: number;
  accepted: number;
  successRate: number;
}

export default function TeamApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [applications, setApplications] = useState<TeamApplication[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const teamId = params.id as string;
  const limit = 10;

  useEffect(() => {
    fetchApplications();
  }, [teamId, activeTab, currentPage]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      const url = new URL(`/api/teams/${teamId}/applications`, window.location.origin);
      url.searchParams.append('status', activeTab === 'all' ? '' : activeTab);
      url.searchParams.append('page', currentPage.toString());
      url.searchParams.append('limit', limit.toString());
      
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.success) {
        setTeam(data.team);
        setApplications(data.applications);
        setStatistics(data.statistics);
        setPagination(data.pagination);
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

  const filteredApplications = applications.filter(app => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      app.projectTitle.toLowerCase().includes(query) ||
      app.projectCategory.toLowerCase().includes(query) ||
      app.status.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'outline' as const, className: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      accepted: { variant: 'success' as const },
      rejected: { variant: 'destructive' as const },
      withdrawn: { variant: 'secondary' as const }
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants]?.variant || 'outline'} className="capitalize">
        {status}
      </Badge>
    );
  };

  const handleWithdrawApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/team-applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'withdrawn' }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Application Withdrawn',
          description: 'Your application has been withdrawn successfully',
        });
        
        fetchApplications();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to withdraw application',
        variant: 'destructive',
      });
    }
  };

  if (loading && !applications.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <Skeleton className="h-96 rounded-xl lg:col-span-3" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Team Applications
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {team ? `Track all applications for "${team.name}"` : 'Loading team applications...'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/teams/${teamId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Team
              </Button>
              <Button
                onClick={() => router.push('/projects?filter=team-mode')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Find Projects
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats & Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: Stats & Filters */}
          <div className="space-y-6">
            {/* Team Stats */}
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {statistics ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Applications</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {statistics.totalApplications}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                        <span className="font-medium text-yellow-600 dark:text-yellow-400">
                          {statistics.pending}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Accepted</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {statistics.accepted}
                        </span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Success Rate</span>
                        <span className="font-bold text-primary">
                          {statistics.successRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                          style={{ width: `${Math.min(statistics.successRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/projects?filter=team-mode')}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Find Projects
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={fetchApplications}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/teams/${teamId}/edit`)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team
                </Button>
              </CardContent>
            </Card>

            {/* Filter Tips */}
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  <Filter className="h-4 w-4 inline mr-2" />
                  Filter Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Pending applications need client review</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Accepted applications become active projects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>You can withdraw applications anytime</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Applications List */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search & Tabs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by project title, category, or status..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="accepted">Accepted</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Applications Grid */}
            {filteredApplications.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300 dark:border-gray-700">
                <CardContent className="pt-12 pb-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No applications found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {activeTab === 'pending' 
                      ? 'No pending applications. Start applying to projects!' 
                      : 'No applications match your filters.'}
                  </p>
                  <Button onClick={() => router.push('/projects?filter=team-mode')}>
                    Browse Projects
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredApplications.map((application) => (
                  <Card key={application.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                            {application.projectTitle}
                          </h3>
                          <Badge variant="outline" className="mt-1">
                            {application.projectCategory}
                          </Badge>
                        </div>
                        {getStatusBadge(application.status)}
                      </div>

                      {/* Project Info */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Project Budget</p>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-gray-400" />
                            <span className="font-medium">
                              ${application.projectBudget?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Your Proposal</p>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-green-500" />
                            <span className="font-bold text-green-600 dark:text-green-400">
                              ${application.proposedBudget?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline & Dates */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Estimated Time</p>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-blue-500" />
                            <span>{application.estimatedTimeline}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Applied</p>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span>
                              {new Date(application.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Cover Letter Preview */}
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Your Proposal Preview
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {application.coverLetter}
                        </p>
                      </div>

                      {/* Client Status */}
                      {!application.clientViewed && application.status === 'pending' && (
                        <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                          <p className="text-xs text-yellow-700 dark:text-yellow-400 text-center">
                            <Clock className="h-3 w-3 inline mr-1" />
                            Client hasn't viewed yet
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => router.push(`/projects/${application.projectId}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Project
                        </Button>
                        
                        {application.status === 'pending' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleWithdrawApplication(application.id)}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Withdraw
                          </Button>
                        )}
                        
                        {application.status === 'accepted' && (
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() => router.push(`/projects/${application.projectId}`)}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Start Work
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                  disabled={currentPage === pagination.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}