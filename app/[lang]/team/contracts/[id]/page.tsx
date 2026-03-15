// app/team/contracts/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  XCircle,
  AlertCircle,
  Download,
  MessageSquare,
  Edit,
  MoreVertical,
  Share2,
  Printer,
  Eye,
  Lock,
  Shield,
  Zap,
  TrendingUp,
  BarChart3,
  ChevronRight,
  Check,
  X,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Globe,
  Award,
  Star,
  Sparkles,
  RefreshCw,
  Trash2,
  History,
  FileSignature,
  PenTool,
  Loader2,
  CreditCard,
  CalendarDays,
  Package,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { teamContractDictionary, type Language } from '@/lib/dictionaries/team-contract-dictionary';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Types from your API
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
      ipAddress?: string;
      userAgent?: string;
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
      ipAddress?: string;
      userAgent?: string;
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
    paidAt?: string;
  }>;
  paymentTerms?: string;
  specialTerms?: string;
  requiresAllSignatures: boolean;
  isRecurring: boolean;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
  activity: Array<{
    type: string;
    userId: string;
    description: string;
    timestamp: string;
    changes?: string[];
  }>;
  team?: {
    id: string;
    name: string;
    avatar?: string;
    members: number;
    lead?: {
      id: string;
      name: string;
      avatar?: string;
      role: string;
    };
  };
  client?: {
    id: string;
    name: string;
    avatar?: string;
    email: string;
    phone?: string;
  };
  currentUser?: {
    isClient: boolean;
    isTeamMember: boolean;
    isTeamLead: boolean;
    hasSigned: boolean;
  };
}

interface ExtendedTeamContract extends TeamContract {
  _calculated?: {
    expiresIn: number;
    durationDays: number;
    totalPaid: number;
    remainingAmount: number;
  };
}

export default function TeamContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [language, setLanguage] = useState<Language>('en');
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<ExtendedTeamContract | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signatureComment, setSignatureComment] = useState('');
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const dict = teamContractDictionary[language];
  const contractId = params.id as string;

  useEffect(() => {
    if (status === 'authenticated') {
      fetchContract();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [contractId, status]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/team/contracts/${contractId}`);
      const data = await response.json();

      if (data.success) {
        const contractData = data.contract;
        // Calculate additional fields
        const today = new Date();
        const endDate = new Date(contractData.endDate);
        const expiresIn = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const startDate = new Date(contractData.startDate);
        const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const totalPaid = contractData.milestones
          .filter((m: any) => m.status === 'paid')
          .reduce((sum: number, m: any) => sum + m.amount, 0);
        
        const remainingAmount = contractData.milestones
          .filter((m: any) => m.status !== 'paid')
          .reduce((sum: number, m: any) => sum + m.amount, 0);

        setContract({
          ...contractData,
          _calculated: {
            expiresIn,
            durationDays,
            totalPaid,
            remainingAmount
          }
        });
      } else {
        throw new Error(data.error || 'Failed to fetch contract');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load contract details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeliverableStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-gradient-to-r from-emerald-500 to-green-600';
      case 'in-progress': return 'bg-gradient-to-r from-amber-500 to-orange-600';
      default: return 'bg-gradient-to-r from-slate-500 to-gray-600';
    }
  };

  const getMilestoneStatusColor = (status?: string) => {
    switch (status) {
      case 'paid': return 'bg-gradient-to-r from-emerald-500 to-green-600';
      default: return 'bg-gradient-to-r from-amber-500 to-orange-600';
    }
  };

// In your contract detail page component
const handleSignContract = async () => {
  try {
    setIsSigning(true);
    
    // Determine if user is client or team member
    const endpoint = isClient 
      ? `/api/team/contracts/${contractId}/sign/client`
      : `/api/team/contracts/${contractId}/sign/team`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: signatureComment
      }),
    });

    const data = await response.json();

    if (data.success) {
      toast({
        title: dict.contractSigned,
        description: "You have successfully signed the contract",
        className: "bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0",
      });
      
      setShowSignDialog(false);
      setSignatureComment('');
      fetchContract(); // Refresh contract data
      
      // If all signatures are complete, show success message
      if (data.allSigned) {
        setTimeout(() => {
          toast({
            title: "Contract Activated!",
            description: "All signatures received. The contract is now active.",
            className: "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0",
          });
        }, 1000);
      }
    } else {
      throw new Error(data.error || 'Failed to sign contract');
    }
  } catch (error) {
    toast({
      title: dict.errorSign,
      description: error instanceof Error ? error.message : "Please try again",
      variant: "destructive",
    });
  } finally {
    setIsSigning(false);
  }
};

  const handleTerminateContract = async () => {
    try {
      setIsTerminating(true);
      const response = await fetch(`/api/team/contracts/${contractId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled',
          terminationReason: terminationReason
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Contract Terminated",
          description: "The contract has been terminated successfully",
          className: "bg-gradient-to-r from-red-500 to-rose-600 text-white border-0",
        });
        
        setShowTerminateDialog(false);
        setTerminationReason('');
        router.push('/team/contracts');
      } else {
        throw new Error(data.error || 'Failed to terminate contract');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to terminate contract",
        variant: "destructive",
      });
    } finally {
      setIsTerminating(false);
    }
  };

  const handleDeleteContract = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/team/contracts/${contractId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Contract Deleted",
          description: "The contract has been deleted successfully",
          className: "bg-gradient-to-r from-red-500 to-rose-600 text-white border-0",
        });
        
        setShowDeleteDialog(false);
        router.push('/team/contracts');
      } else {
        throw new Error(data.error || 'Failed to delete contract');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete contract",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      toast({
        title: "Generating PDF",
        description: "Your contract PDF is being generated...",
      });
      
      // In a real app, this would generate and download a PDF
      // For now, simulate download
      setTimeout(() => {
        toast({
          title: "Download Complete",
          description: "Your contract PDF has been downloaded",
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const handleMarkMilestonePaid = async (milestoneId: string) => {
    try {
      const response = await fetch(`/api/team/contracts/${contractId}/milestones/${milestoneId}/paid`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Milestone Marked as Paid",
          description: "The milestone has been marked as paid",
          className: "bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0",
        });
        
        fetchContract(); // Refresh contract data
      } else {
        throw new Error(data.error || 'Failed to mark milestone as paid');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update milestone",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDeliverableStatus = async (deliverableIndex: number, status: string) => {
    try {
      const updatedDeliverables = [...(contract?.deliverables || [])];
      updatedDeliverables[deliverableIndex] = {
        ...updatedDeliverables[deliverableIndex],
        status: status as any
      };

      const response = await fetch(`/api/team/contracts/${contractId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deliverables: updatedDeliverables
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Deliverable Updated",
          description: "Deliverable status has been updated",
          className: "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0",
        });
        
        fetchContract(); // Refresh contract data
      } else {
        throw new Error(data.error || 'Failed to update deliverable');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update deliverable",
        variant: "destructive",
      });
    }
  };

  const handleRenewContract = async () => {
    try {
      const response = await fetch(`/api/team/contracts/${contractId}/renew`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Contract Renewed",
          description: "The contract has been renewed successfully",
          className: "bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0",
        });
        
        fetchContract(); // Refresh contract data
      } else {
        throw new Error(data.error || 'Failed to renew contract');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to renew contract",
        variant: "destructive",
      });
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950/20">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 rounded-xl mb-6" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
            <div>
              <Skeleton className="h-96 rounded-xl mb-6" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950/20 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-2xl">
          <CardContent className="pt-12 pb-12 text-center">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Contract Not Found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              The contract you're looking for doesn't exist or you don't have access.
            </p>
            <Button 
              onClick={() => router.push('/team/contracts')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contracts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isClient = contract.currentUser?.isClient || false;
  const isTeamMember = contract.currentUser?.isTeamMember || false;
  const isTeamLead = contract.currentUser?.isTeamLead || false;
  const hasUserSigned = contract.currentUser?.hasSigned || false;

  const canSign = contract.status === 'pending' && !hasUserSigned && (isClient || isTeamMember);
  const canTerminate = (isClient || isTeamLead) && contract.status === 'active';
  const canDelete = contract.status === 'draft' && isClient;
  const canRenew = contract.status === 'active' && contract._calculated && contract._calculated.expiresIn < 30;
  const canMarkPaid = isClient && contract.type === 'milestoneBased';
  const canUpdateProgress = isTeamLead && contract.status === 'active';

  const totalMembers = contract.signatures?.members?.length || 0;
  const completedSignatures = contract.signatures?.members?.filter(m => m.signed).length || 0;
  const clientSigned = contract.signatures?.client?.signed || false;

  const totalSignatures = totalMembers + 1; // +1 for client
  const totalCompletedSignatures = completedSignatures + (clientSigned ? 1 : 0);

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
              
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {contract.title}
                      </h1>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`${getStatusColor(contract.status)} text-white border-0`}>
                          {getStatusText(contract.status)}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {getTypeText(contract.type)}
                        </Badge>
                        {contract.isRecurring && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Recurring
                          </Badge>
                        )}
                        {contract.autoRenew && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Auto-Renew
                          </Badge>
                        )}
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          #{contract.id.substring(0, 8)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {contract.description && (
                    <p className="text-slate-600 dark:text-slate-400 max-w-3xl">
                      {contract.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-[100px] bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">EN</SelectItem>
                      <SelectItem value="fr">FR</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={handleDownloadPDF}>
                        <Download className="h-4 w-4 mr-2" />
                        {dict.downloadPDF}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Contract
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Contract
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {(isClient || isTeamLead) && contract.status === 'draft' && (
                        <DropdownMenuItem onClick={() => router.push(`/team/contracts/${contract.id}/edit`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {dict.editContract}
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => setShowDeleteDialog(true)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Draft
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{dict.contractValue}</p>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                        {formatCurrency(contract.value, contract.currency)}
                        {contract.type === 'retainer' && '/month'}
                      </h3>
                      {contract._calculated && contract._calculated.totalPaid > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {formatCurrency(contract._calculated.totalPaid, contract.currency)} paid
                        </p>
                      )}
                    </div>
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Duration</p>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                        {contract._calculated?.durationDays || 0} days
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Progress</p>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                        {contract.progress}%
                      </h3>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <Progress value={contract.progress} className="mt-3 h-2" />
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="deliverables" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white">
                  Deliverables
                </TabsTrigger>
                <TabsTrigger value="milestones" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
                  Milestones
                </TabsTrigger>
                <TabsTrigger value="team" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                  Team & Signatures
                </TabsTrigger>
                <TabsTrigger value="activity" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-gray-500 data-[state=active]:text-white">
                  Activity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-3">{dict.scopeOfWork}</h3>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
                          {contract.scopeOfWork}
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {contract.paymentTerms && (
                      <>
                        <div>
                          <h3 className="font-semibold text-lg mb-3">Payment Terms</h3>
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                            <p className="text-slate-700 dark:text-slate-300">
                              {contract.paymentTerms}
                            </p>
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}
                    
                    {contract.specialTerms && (
                      <div>
                        <h3 className="font-semibold text-lg mb-3">Special Terms & Conditions</h3>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
                            {contract.specialTerms}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="deliverables" className="mt-6">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {contract.deliverables && contract.deliverables.length > 0 ? (
                        contract.deliverables.map((deliverable, index) => (
                          <div key={index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getDeliverableStatusColor(deliverable.status)}`}>
                                  <Target className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-semibold">{deliverable.title}</h4>
                                  {deliverable.description && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                      {deliverable.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  deliverable.status === 'completed' ? 'default' : 
                                  deliverable.status === 'in-progress' ? 'secondary' : 'outline'
                                } className="capitalize">
                                  {deliverable.status || 'pending'}
                                </Badge>
                                {canUpdateProgress && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleUpdateDeliverableStatus(index, 'pending')}>
                                        Mark as Pending
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdateDeliverableStatus(index, 'in-progress')}>
                                        Mark as In Progress
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleUpdateDeliverableStatus(index, 'completed')}>
                                        Mark as Completed
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-600 dark:text-slate-400">
                                  {deliverable.dueDate ? `Due: ${formatDate(deliverable.dueDate)}` : 'No due date'}
                                </span>
                              </div>
                              {deliverable.status === 'completed' && deliverable.dueDate && (
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Completed</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-600 dark:text-slate-400">No deliverables defined</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="milestones" className="mt-6">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {contract.milestones && contract.milestones.length > 0 ? (
                        contract.milestones.map((milestone, index) => (
                          <div key={index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getMilestoneStatusColor(milestone.status)}`}>
                                  <DollarSign className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-semibold">{milestone.title}</h4>
                                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {formatCurrency(milestone.amount, contract.currency)}
                                  </p>
                                  {milestone.description && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                      {milestone.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={milestone.status === 'paid' ? 'default' : 'secondary'} className="capitalize">
                                  {milestone.status || 'pending'}
                                </Badge>
                                {canMarkPaid && milestone.status !== 'paid' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkMilestonePaid(milestone.title)}
                                  >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Mark as Paid
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-600 dark:text-slate-400">
                                  Due: {formatDate(milestone.dueDate)}
                                </span>
                              </div>
                              {milestone.status === 'paid' && milestone.paidAt && (
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Paid on {formatDate(milestone.paidAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <CalendarDays className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-600 dark:text-slate-400">No milestones defined</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team" className="mt-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-500" />
                      Team Members & Signatures
                    </CardTitle>
                    <CardDescription>
                      {totalCompletedSignatures}/{totalSignatures} signatures complete
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Client Signature */}
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            {contract.client?.avatar ? (
                              <AvatarImage src={contract.client.avatar} />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                                {contract.client?.name?.substring(0, 2) || 'CL'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{contract.client?.name || 'Client'}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Client</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {clientSigned ? (
                            <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Signed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 dark:text-amber-400">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {clientSigned && contract.signatures.client.signedAt && (
                        <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                            <CheckCircle className="h-4 w-4" />
                            <span>Signed on {formatDate(contract.signatures.client.signedAt)}</span>
                          </div>
                          {contract.signatures.client.ipAddress && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              IP: {contract.signatures.client.ipAddress}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Team Members */}
                    <div>
                      <h4 className="font-semibold mb-4">Team Members ({totalMembers})</h4>
                      <div className="space-y-3">
                        {contract.signatures.members.map((member, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                {member.userInfo?.avatar ? (
                                  <AvatarImage src={member.userInfo.avatar} />
                                ) : (
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                    {member.userInfo?.name?.substring(0, 2) || 'TM'}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.userInfo?.name || 'Team Member'}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-slate-600 dark:text-slate-400">{member.role}</span>
                                  {member.isLead && (
                                    <Badge variant="outline" className="text-xs">
                                      Team Lead
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              {member.signed ? (
                                <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Signed
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-600 dark:text-amber-400">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                              {member.signed && member.signedAt && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  {formatDate(member.signedAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Signature Progress */}
                    <div className="p-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">Signature Progress</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {totalCompletedSignatures} of {totalSignatures} signatures received
                          </p>
                        </div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {Math.round((totalCompletedSignatures / totalSignatures) * 100)}%
                        </div>
                      </div>
                      <Progress value={(totalCompletedSignatures / totalSignatures) * 100} className="h-2" />
                      
                      {totalCompletedSignatures === totalSignatures ? (
                        <div className="mt-4 p-3 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                            <p className="text-emerald-700 dark:text-emerald-400">
                              All signatures complete! Contract is fully executed.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-200 dark:border-amber-800">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                            <p className="text-amber-700 dark:text-amber-400">
                              Waiting for {totalSignatures - totalCompletedSignatures} more signatures
                            </p>
                          </div>
                          {!clientSigned && isClient && contract.status === 'pending' && (
                            <Button
                              onClick={() => setShowSignDialog(true)}
                              className="w-full mt-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Sign as Client
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {contract.activity && contract.activity.length > 0 ? (
                        contract.activity
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map((item, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                                item.type.includes('signed') ? 'bg-gradient-to-r from-emerald-500 to-green-600' :
                                item.type.includes('paid') ? 'bg-gradient-to-r from-blue-500 to-purple-600' :
                                item.type.includes('created') ? 'bg-gradient-to-r from-purple-500 to-indigo-600' :
                                'bg-gradient-to-r from-slate-500 to-gray-600'
                              }`}>
                                {item.type.includes('signed') ? (
                                  <FileSignature className="h-4 w-4 text-white" />
                                ) : item.type.includes('paid') ? (
                                  <DollarSign className="h-4 w-4 text-white" />
                                ) : item.type.includes('created') ? (
                                  <FileText className="h-4 w-4 text-white" />
                                ) : (
                                  <History className="h-4 w-4 text-white" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium">{item.description}</p>
                                  <span className="text-sm text-slate-500 dark:text-slate-400">
                                    {formatDateTime(item.timestamp)}
                                  </span>
                                </div>
                                {item.userId && (
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    User ID: {item.userId.substring(0, 8)}...
                                  </p>
                                )}
                                {item.changes && item.changes.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {item.changes.map((change, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {change}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-8">
                          <History className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-600 dark:text-slate-400">No activity recorded</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Column: Actions & Info */}
          <div className="space-y-6">
            {/* Contract Actions */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 dark:from-blue-500/5 dark:via-gray-800 dark:to-blue-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Contract Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {canSign && (
                  <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:opacity-90">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {dict.signContract}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
                          {dict.signContract}
                        </DialogTitle>
                        <DialogDescription>
                          By signing this contract, you agree to all terms and conditions.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="signature-comment" className="mb-2">
                          Optional Comment
                        </Label>
                        <Textarea
                          id="signature-comment"
                          placeholder="Add any comments or notes..."
                          value={signatureComment}
                          onChange={(e) => setSignatureComment(e.target.value)}
                          rows={3}
                        />
                        <div className="mt-4 p-3 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-lg">
                          <p className="text-sm text-emerald-700 dark:text-emerald-400">
                            Your signature will be recorded with your IP address and timestamp.
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSignDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSignContract}
                          disabled={isSigning}
                          className="bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                        >
                          {isSigning ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Signing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Sign Contract
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
                
                {canRenew && (
                  <Button 
                    onClick={handleRenewContract}
                    variant="outline" 
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {dict.renewContract}
                  </Button>
                )}
                
                <Button 
                  onClick={handleDownloadPDF}
                  variant="outline" 
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {dict.downloadPDF}
                </Button>
                
                <Button variant="outline" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {dict.sendMessage}
                </Button>
                
                {canTerminate && (
                  <Dialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30">
                        <XCircle className="h-4 w-4 mr-2" />
                        {dict.terminateContract}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent">
                          {dict.terminateContract}
                        </DialogTitle>
                        <DialogDescription>
                          Terminating a contract is permanent and may have legal implications.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="termination-reason" className="mb-2">
                          Reason for Termination *
                        </Label>
                        <Textarea
                          id="termination-reason"
                          placeholder="Please explain why you're terminating this contract..."
                          value={terminationReason}
                          onChange={(e) => setTerminationReason(e.target.value)}
                          rows={4}
                          required
                        />
                        <div className="mt-4 p-3 bg-gradient-to-r from-red-500/10 to-rose-500/10 rounded-lg">
                          <p className="text-sm text-red-700 dark:text-red-400">
                            This action cannot be undone. All parties will be notified immediately.
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTerminateDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleTerminateContract}
                          disabled={!terminationReason || isTerminating}
                          className="bg-gradient-to-r from-red-500 to-rose-600 text-white"
                        >
                          {isTerminating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Terminating...
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Terminate Contract
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
            
            {/* Contract Info */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-500/10 via-white to-slate-500/5 dark:from-slate-500/5 dark:via-gray-800 dark:to-slate-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-500" />
                  Contract Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Contract ID</span>
                    <code className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {contract.id.substring(0, 8)}...
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Created</span>
                    <span className="font-medium">{formatDate(contract.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Last Updated</span>
                    <span className="font-medium">{formatDate(contract.updatedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Start Date</span>
                    <span className="font-medium">{formatDate(contract.startDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">End Date</span>
                    <span className="font-medium">{formatDate(contract.endDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Type</span>
                    <Badge variant="outline" className="capitalize">
                      {getTypeText(contract.type)}
                    </Badge>
                  </div>
                  {contract._calculated && contract._calculated.expiresIn > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{dict.expiresIn}</span>
                      <Badge variant="outline" className="text-amber-600 dark:text-amber-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {contract._calculated.expiresIn} {dict.daysRemaining}
                      </Badge>
                    </div>
                  )}
                  {contract.requiresAllSignatures && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Signature Policy</span>
                      <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                        <Users className="h-3 w-3 mr-1" />
                        All Members Required
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Team Info */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 dark:from-purple-500/5 dark:via-gray-800 dark:to-purple-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Team Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {contract.team?.avatar ? (
                      <AvatarImage src={contract.team.avatar} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {contract.team?.name?.substring(0, 2) || 'TM'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{contract.team?.name || 'Team'}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {totalMembers} members
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Team Lead</p>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                        TL
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {contract.signatures.members.find(m => m.isLead)?.userInfo?.name || 'Team Lead'}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {contract.signatures.members.find(m => m.isLead)?.role || 'Lead'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/teams/${contract.teamId}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Team Details
                </Button>
              </CardContent>
            </Card>
            
            {/* Client Info */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 dark:from-emerald-500/5 dark:via-gray-800 dark:to-emerald-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-500" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {contract.client?.avatar ? (
                      <AvatarImage src={contract.client.avatar} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                        {contract.client?.name?.substring(0, 2) || 'CL'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{contract.client?.name || 'Client'}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Client</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span>{contract.client?.email || 'No email provided'}</span>
                  </div>
                  {contract.client?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{contract.client.phone}</span>
                    </div>
                  )}
                </div>
                
                <Button variant="outline" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Client
                </Button>
              </CardContent>
            </Card>

            {/* Delete Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent">
                    Delete Contract
                  </DialogTitle>
                  <DialogDescription>
                    {dict.confirmDelete} This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="p-3 bg-gradient-to-r from-red-500/10 to-rose-500/10 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      This will permanently delete this draft contract. All data will be lost.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleDeleteContract}
                    disabled={isDeleting}
                    className="bg-gradient-to-r from-red-500 to-rose-600 text-white"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Contract
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}