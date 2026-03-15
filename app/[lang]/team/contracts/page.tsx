// app/team/contracts/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  FileText, 
  Users, 
  PlusCircle, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Sparkles,
  Shield,
  Zap,
  Crown,
  Briefcase,
  Eye,
  MessageSquare,
  Download,
  MoreVertical,
  ChevronRight,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Target,
  Award,
  Star,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { teamContractDictionary, type Language } from '@/lib/dictionaries/team-contract-dictionary';

// Real data types from your API
interface TeamContract {
  id: string;
  title: string;
  description?: string;
  teamId: string;
  clientId: string;
  type: 'fixedPrice' | 'hourlyRate' | 'milestoneBased' | 'retainer';
  value: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'pending' | 'active' | 'completed' | 'cancelled';
  progress: number;
  signatures: {
    total: number;
    completed: number;
    members: Array<{
      userId: string;
      role: string;
      isLead: boolean;
      signed: boolean;
      signedAt?: string;
      userInfo?: {
        name: string;
        avatar?: string;
        email: string;
        title?: string;
      }
    }>;
    client: {
      userId: string;
      signed: boolean;
      signedAt?: string;
      userInfo?: {
        name: string;
        avatar?: string;
        email: string;
        phone?: string;
      }
    }
  };
  scopeOfWork: string;
  deliverables: Array<{
    title: string;
    description?: string;
    dueDate?: string;
    status?: 'pending' | 'in-progress' | 'completed';
  }>;
  milestones: Array<{
    title: string;
    amount: number;
    dueDate: string;
    description?: string;
    status?: 'pending' | 'paid';
  }>;
  paymentTerms?: string;
  specialTerms?: string;
  requiresAllSignatures: boolean;
  isRecurring: boolean;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
  expiresIn?: number;
  team?: {
    id: string;
    name: string;
    avatar?: string;
    members: number;
  };
  client?: {
    id: string;
    name: string;
    avatar?: string;
    email: string;
  };
}

interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  pendingSignatures: number;
  totalValue: number;
  averageDuration: number;
  completionRate: number;
  renewalRate: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function TeamContractsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [language, setLanguage] = useState<Language>('en');
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<TeamContract[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [activeTab, setActiveTab] = useState('all');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  const dict = teamContractDictionary[language];

  // Fetch contracts and stats
  useEffect(() => {
    fetchContracts();
    fetchStats();
  }, [status, statusFilter, typeFilter, sortBy, activeTab, pagination.page]);

  const fetchContracts = async () => {
    if (status !== 'authenticated') return;

    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(activeTab !== 'all' && { status: activeTab }),
        sort: sortBy
      });

      const response = await fetch(`/api/team/contracts?${params}`);
      const data = await response.json();

      if (data.success) {
        setContracts(data.contracts);
        setPagination(data.pagination || pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch contracts');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load contracts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (status !== 'authenticated') return;

    try {
      const response = await fetch('/api/team/contracts/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('Failed to fetch contract stats:', error);
      // Use mock stats as fallback
      setStats({
        totalContracts: contracts.length,
        activeContracts: contracts.filter(c => c.status === 'active').length,
        pendingSignatures: contracts.reduce((acc, contract) => {
          return acc + (contract.signatures.total - contract.signatures.completed);
        }, 0),
        totalValue: contracts.reduce((acc, contract) => acc + contract.value, 0),
        averageDuration: 120,
        completionRate: 85,
        renewalRate: 70
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-gradient-to-r from-emerald-500 to-green-600';
      case 'pending': return 'bg-gradient-to-r from-amber-500 to-orange-600';
      case 'draft': return 'bg-gradient-to-r from-slate-500 to-gray-600';
      case 'completed': return 'bg-gradient-to-r from-purple-500 to-indigo-600';
      case 'cancelled': return 'bg-gradient-to-r from-red-500 to-rose-600';
      default: return 'bg-gradient-to-r from-blue-500 to-cyan-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return dict.active;
      case 'pending': return dict.pending;
      case 'draft': return dict.draft;
      case 'completed': return dict.completed;
      case 'cancelled': return dict.cancelled;
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'fixedPrice': return dict.fixedPrice;
      case 'hourlyRate': return dict.hourlyRate;
      case 'milestoneBased': return dict.milestoneBased;
      case 'retainer': return dict.retainer;
      default: return type;
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateExpiresIn = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getContractTags = (contract: TeamContract) => {
    const tags = [];
    if (contract.deliverables.length > 0) {
      const deliverableTypes = contract.deliverables.map(d => d.title.split(' ')[0]);
      tags.push(...new Set(deliverableTypes));
    }
    tags.push(getTypeText(contract.type));
    if (contract.isRecurring) tags.push('Recurring');
    return tags.slice(0, 3);
  };

  // Filter contracts based on search query
  const filteredContracts = contracts.filter(contract => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const matchesTitle = contract.title.toLowerCase().includes(query);
    const matchesTeam = contract.team?.name.toLowerCase().includes(query) || false;
    const matchesClient = contract.client?.name.toLowerCase().includes(query) || false;
    const matchesDescription = contract.description?.toLowerCase().includes(query) || false;
    
    return matchesTitle || matchesTeam || matchesClient || matchesDescription;
  });

  if (loading && contracts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950/20">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950/20">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-slate-200/50 dark:border-gray-800/50 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-emerald-500/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {dict.contracts}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Manage all your team contracts in one place
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/team/contracts/create')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {dict.createNew}
              </Button>
              
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 dark:from-blue-500/5 dark:via-gray-800 dark:to-blue-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{dict.totalContracts}</p>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                    {stats?.totalContracts || 0}
                  </h3>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-emerald-600 dark:text-emerald-400">
                      {contracts.length > 0 ? `+${Math.floor(contracts.length / 10)}% this month` : 'No contracts yet'}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 dark:from-emerald-500/5 dark:via-gray-800 dark:to-emerald-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{dict.activeContracts}</p>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                    {stats?.activeContracts || 0}
                  </h3>
                  <div className="flex items-center gap-1 mt-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-600 dark:text-amber-400">
                      {stats?.completionRate || 0}% completion rate
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 dark:from-amber-500/5 dark:via-gray-800 dark:to-amber-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{dict.pendingSignatures}</p>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                    {stats?.pendingSignatures || 0}
                  </h3>
                  <div className="flex items-center gap-1 mt-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-600 dark:text-amber-400">
                      {contracts.filter(c => c.signatures.completed < c.signatures.total).length} contracts need attention
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 dark:from-purple-500/5 dark:via-gray-800 dark:to-purple-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{dict.totalValue}</p>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                    {formatCurrency(stats?.totalValue || 0, 'USD')}
                  </h3>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-emerald-600 dark:text-emerald-400">
                      {contracts.length > 5 ? '+18% from last quarter' : 'Start creating contracts'}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Contracts List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search contracts, teams, clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder={dict.filterByStatus} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[160px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder={dict.filterByType} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="fixedPrice">Fixed Price</SelectItem>
                        <SelectItem value="hourlyRate">Hourly Rate</SelectItem>
                        <SelectItem value="milestoneBased">Milestone Based</SelectItem>
                        <SelectItem value="retainer">Retainer</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[160px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder={dict.sortBy} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">{dict.newest}</SelectItem>
                        <SelectItem value="oldest">{dict.oldest}</SelectItem>
                        <SelectItem value="valueHigh">{dict.valueHigh}</SelectItem>
                        <SelectItem value="valueLow">{dict.valueLow}</SelectItem>
                        <SelectItem value="expiringSoon">Expiring Soon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full">
                <TabsTrigger value="all" className="flex-1 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                  All ({contracts.length})
                </TabsTrigger>
                <TabsTrigger value="active" className="flex-1 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white">
                  Active ({contracts.filter(c => c.status === 'active').length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex-1 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
                  Pending ({contracts.filter(c => c.status === 'pending').length})
                </TabsTrigger>
                <TabsTrigger value="draft" className="flex-1 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-gray-500 data-[state=active]:text-white">
                  Draft ({contracts.filter(c => c.status === 'draft').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {filteredContracts.length === 0 ? (
                  <Card className="border-dashed border-2 border-slate-300 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-gray-900">
                    <CardContent className="pt-16 pb-16 text-center">
                      <div className="relative inline-block mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-20 animate-pulse rounded-full"></div>
                        <FileText className="h-16 w-16 text-slate-400 dark:text-slate-600 relative z-10" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        {searchQuery ? "No matching contracts found" : dict.noContracts}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                        {searchQuery 
                          ? "Try adjusting your search terms or filters"
                          : dict.noContractsDescription
                        }
                      </p>
                      {!searchQuery && (
                        <Button
                          onClick={() => router.push('/team/contracts/create')}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          {dict.createFirstContract}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredContracts.map((contract) => {
                      const tags = getContractTags(contract);
                      const expiresIn = calculateExpiresIn(contract.endDate);
                      
                      return (
                        <Card 
                          key={contract.id}
                          className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 bg-gradient-to-r from-white to-slate-50 dark:from-gray-800 dark:to-gray-900"
                          onClick={() => router.push(`/team/contracts/${contract.id}`)}
                        >
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                              {/* Left Side: Contract Info */}
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                                      {contract.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-3">
                                      <Badge className={`${getStatusColor(contract.status)} text-white border-0`}>
                                        {getStatusText(contract.status)}
                                      </Badge>
                                      <Badge variant="outline" className="capitalize">
                                        {getTypeText(contract.type)}
                                      </Badge>
                                      {contract.isRecurring && (
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200">
                                          <Clock className="h-3 w-3 mr-1" />
                                          Recurring
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="text-right">
                                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                      {formatCurrency(contract.value, contract.currency)}
                                      {contract.type === 'retainer' && '/month'}
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                      {dict.contractValue}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Teams & Clients */}
                                <div className="flex items-center gap-4 mb-4">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      {contract.team?.avatar ? (
                                        <AvatarImage src={contract.team.avatar} />
                                      ) : (
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                          {contract.team?.name?.substring(0, 2) || 'TM'}
                                        </AvatarFallback>
                                      )}
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                                        {contract.team?.name || 'Team'}
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {contract.team?.members || 0} members
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <ChevronRight className="h-4 w-4 text-slate-400" />
                                  
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      {contract.client?.avatar ? (
                                        <AvatarImage src={contract.client.avatar} />
                                      ) : (
                                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white text-xs">
                                          {contract.client?.name?.substring(0, 2) || 'CL'}
                                        </AvatarFallback>
                                      )}
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                                        {contract.client?.name || 'Client'}
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Client</p>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Timeline & Progress */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-slate-400" />
                                      <span className="text-slate-600 dark:text-slate-400">
                                        {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                                      </span>
                                    </div>
                                    {expiresIn > 0 && contract.status === 'active' && (
                                      <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-200">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {expiresIn} {dict.daysRemaining}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-slate-600 dark:text-slate-400">Progress</span>
                                      <span className="font-medium">{contract.progress}%</span>
                                    </div>
                                    <Progress value={contract.progress} className="h-2" />
                                  </div>
                                  
                                  {/* Signatures */}
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4 text-slate-400" />
                                      <span className="text-slate-600 dark:text-slate-400">
                                        {contract.signatures.completed}/{contract.signatures.total} signatures
                                      </span>
                                    </div>
                                    {contract.signatures.completed === contract.signatures.total ? (
                                      <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs">
                                        <Check className="h-3 w-3 mr-1" />
                                        {dict.allSignaturesComplete}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-200">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        {dict.waitingForSignatures} {contract.signatures.total - contract.signatures.completed} members
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Right Side: Actions */}
                              <div className="flex flex-col justify-between">
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
                                      router.push(`/team/contracts/${contract.id}`);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    {dict.viewDetails}
                                  </Button>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="sm" variant="ghost">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuItem>
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        {dict.sendMessage}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Download className="h-4 w-4 mr-2" />
                                        {dict.downloadPDF}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      {contract.status === 'pending' && (
                                        <DropdownMenuItem className="text-emerald-600">
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          {dict.signContract}
                                        </DropdownMenuItem>
                                      )}
                                      {contract.status === 'active' && expiresIn < 30 && (
                                        <DropdownMenuItem>
                                          <Target className="h-4 w-4 mr-2" />
                                          {dict.renewContract}
                                        </DropdownMenuItem>
                                      )}
                                      {contract.status === 'draft' && (
                                        <DropdownMenuItem className="text-red-600">
                                          <X className="h-4 w-4 mr-2" />
                                          Delete Draft
                                        </DropdownMenuItem>
                                      )}
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
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Column: Quick Stats & Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 dark:from-purple-500/5 dark:via-gray-800 dark:to-purple-500/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90"
                  onClick={() => router.push('/team/contracts/create')}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  {dict.createContract}
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    {dict.downloadPDF}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setStatusFilter('pending')}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {dict.filterByStatus}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Pending Signatures */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 dark:from-amber-500/5 dark:via-gray-800 dark:to-amber-500/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Pending Signatures
                </CardTitle>
                <CardDescription>
                  {dict.waitingForSignatures} your attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contracts
                    .filter(c => c.signatures.completed < c.signatures.total)
                    .slice(0, 3)
                    .map(contract => (
                      <div key={contract.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{contract.team?.name || 'Team'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {contract.signatures.total - contract.signatures.completed} signatures remaining
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/team/contracts/${contract.id}`);
                          }}
                        >
                          {dict.signNow}
                        </Button>
                      </div>
                    ))}
                  
                  {contracts.filter(c => c.signatures.completed < c.signatures.total).length === 0 && (
                    <div className="text-center py-4">
                      <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        All signatures complete! 🎉
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Upcoming Deadlines */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 dark:from-emerald-500/5 dark:via-gray-800 dark:to-emerald-500/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-500" />
                  Upcoming Deadlines
                </CardTitle>
                <CardDescription>
                  Contracts ending soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contracts
                    .filter(c => {
                      const expiresIn = calculateExpiresIn(c.endDate);
                      return expiresIn < 30 && expiresIn > 0 && c.status === 'active';
                    })
                    .slice(0, 3)
                    .map(contract => {
                      const expiresIn = calculateExpiresIn(contract.endDate);
                      return (
                        <div key={contract.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{contract.title}</p>
                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                              <Clock className="h-3 w-3" />
                              Expires in {expiresIn} days
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/team/contracts/${contract.id}`);
                            }}
                          >
                            {dict.renewContract}
                          </Button>
                        </div>
                      );
                    })}
                  
                  {contracts.filter(c => {
                    const expiresIn = calculateExpiresIn(c.endDate);
                    return expiresIn < 30 && expiresIn > 0;
                  }).length === 0 && (
                    <div className="text-center py-4">
                      <Shield className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        No urgent deadlines
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Performance Insights */}
            {stats && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 dark:from-blue-500/5 dark:via-gray-800 dark:to-blue-500/10">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Performance Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Completion Rate</span>
                      <span className="font-bold text-lg text-slate-900 dark:text-white">
                        {stats.completionRate}%
                      </span>
                    </div>
                    <Progress value={stats.completionRate} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Average Duration</span>
                      <span className="font-bold text-lg text-slate-900 dark:text-white">
                        {stats.averageDuration} days
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Renewal Rate</span>
                      <span className="font-bold text-lg text-slate-900 dark:text-white">
                        {stats.renewalRate}%
                      </span>
                    </div>
                    
                    <Button variant="outline" className="w-full mt-4">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Detailed Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-slate-600 dark:text-slate-400">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}