// app/team/contracts/[id]/edit/page.tsx
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
  ChevronLeft,
  AlertCircle,
  Download,
  Trash2,
  Edit,
  RefreshCw,
  Settings
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

// Types
interface Milestone {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  description: string;
  status?: 'pending' | 'paid';
}

interface Deliverable {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  status?: 'pending' | 'in-progress' | 'completed';
}

interface ContractData {
  id: string;
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
  status: string;
  progress: number;
}

interface Team {
  id: string;
  name: string;
  avatar?: string;
  members: any[];
}

interface Client {
  id: string;
  name: string;
  avatar?: string;
  email: string;
}

interface EnrichedContract {
  contract: ContractData;
  team: Team;
  client: Client;
  currentUser: {
    isClient: boolean;
    isTeamMember: boolean;
    isTeamLead: boolean;
    hasSigned: boolean;
  };
}

// Contract templates (same as create page)
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

export default function EditTeamContractPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  const [language, setLanguage] = useState<Language>('en');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('basics');
  
  // Contract data state
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [originalData, setOriginalData] = useState<ContractData | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<{
    isClient: boolean;
    isTeamMember: boolean;
    isTeamLead: boolean;
    hasSigned: boolean;
  } | null>(null);
  
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteComment, setDeleteComment] = useState('');
  
  const dict = teamContractDictionary[language];
  const contractId = params.id as string;

  // Fetch contract data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchContractData();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, contractId]);

  const fetchContractData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/team/contracts/${contractId}`);
      const data = await response.json();
      
      if (data.success) {
        const contract = data.contract;
        
        // Format dates for input fields
        const formattedContract = {
          ...contract,
          id: contract.id,
          value: contract.value.toString(),
          startDate: contract.startDate ? contract.startDate.split('T')[0] : '',
          endDate: contract.endDate ? contract.endDate.split('T')[0] : '',
          milestones: contract.milestones?.map((m: any) => ({
            ...m,
            dueDate: m.dueDate ? m.dueDate.split('T')[0] : '',
            id: m.id || `milestone-${Date.now()}-${Math.random()}`
          })) || [],
          deliverables: contract.deliverables?.map((d: any, index: number) => ({
            ...d,
            id: d.id || `deliverable-${Date.now()}-${index}`,
            dueDate: d.dueDate ? d.dueDate.split('T')[0] : ''
          })) || [],
          progress: contract.progress || 0,
          status: contract.status || 'draft'
        };
        
        setContractData(formattedContract);
        setOriginalData(JSON.parse(JSON.stringify(formattedContract))); // Deep clone
        setTeam(contract.team);
        setClient(contract.client);
        setCurrentUserRole(contract.currentUser);
      } else {
        throw new Error(data.error || "Failed to load contract");
      }
    } catch (error) {
      toast({
        title: dict.errorLoadingContract,
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      router.push('/team/contracts');
    } finally {
      setLoading(false);
    }
  };

  // Check if user can edit
  const canEdit = () => {
    if (!currentUserRole) return false;
    
    // Only allow editing for draft contracts
    if (contractData?.status !== 'draft') return false;
    
    // Client can always edit their draft contracts
    if (currentUserRole.isClient) return true;
    
    // Team lead can edit if they haven't signed yet
    if (currentUserRole.isTeamLead && !currentUserRole.hasSigned) return true;
    
    return false;
  };

  // Check for changes
  const hasChanges = () => {
    if (!contractData || !originalData) return false;
    return JSON.stringify(contractData) !== JSON.stringify(originalData);
  };

  // Handle form updates
  const updateField = (field: string, value: any) => {
    if (!contractData) return;
    
    setContractData(prev => ({
      ...prev!,
      [field]: value
    }));
  };

  const updateMilestone = (id: string, field: string, value: any) => {
    if (!contractData) return;
    
    setContractData(prev => ({
      ...prev!,
      milestones: prev!.milestones.map(milestone =>
        milestone.id === id ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const addMilestone = () => {
    if (!contractData) return;
    
    const newMilestone: Milestone = {
      id: `milestone-${Date.now()}`,
      title: '',
      amount: 0,
      dueDate: '',
      description: '',
      status: 'pending'
    };
    
    setContractData(prev => ({
      ...prev!,
      milestones: [...prev!.milestones, newMilestone]
    }));
  };

  const removeMilestone = (id: string) => {
    if (!contractData) return;
    
    setContractData(prev => ({
      ...prev!,
      milestones: prev!.milestones.filter(milestone => milestone.id !== id)
    }));
  };

  const updateDeliverable = (id: string, field: string, value: string) => {
    if (!contractData) return;
    
    setContractData(prev => ({
      ...prev!,
      deliverables: prev!.deliverables.map(deliverable =>
        deliverable.id === id ? { ...deliverable, [field]: value } : deliverable
      )
    }));
  };

  const addDeliverable = () => {
    if (!contractData) return;
    
    const newDeliverable: Deliverable = {
      id: `deliverable-${Date.now()}`,
      title: '',
      description: '',
      dueDate: '',
      status: 'pending'
    };
    
    setContractData(prev => ({
      ...prev!,
      deliverables: [...prev!.deliverables, newDeliverable]
    }));
  };

  const removeDeliverable = (id: string) => {
    if (!contractData) return;
    
    setContractData(prev => ({
      ...prev!,
      deliverables: prev!.deliverables.filter(deliverable => deliverable.id !== id)
    }));
  };

  const handleTemplateSelect = (template: any) => {
    if (!contractData) return;
    
    setContractData(prev => ({
      ...prev!,
      type: template.type,
      title: `${prev!.title.split('-')[0]} - ${template.name}`,
      description: template.description
    }));
    
    setShowTemplateModal(false);
    
    toast({
      title: dict.templateApplied,
      description: `${template.name} template has been applied`,
    });
  };

  // Save changes
  const handleSave = async () => {
    if (!contractData || !hasChanges()) return;
    
    setUpdating(true);
    try {
      // Prepare data for API
      const updateData = {
        title: contractData.title,
        description: contractData.description,
        scopeOfWork: contractData.scopeOfWork,
        deliverables: contractData.deliverables.map(d => ({
          title: d.title,
          description: d.description,
          dueDate: d.dueDate,
          status: d.status || 'pending'
        })),
        milestones: contractData.milestones.map(m => ({
          title: m.title,
          amount: m.amount,
          dueDate: m.dueDate,
          description: m.description,
          status: m.status || 'pending'
        })),
        specialTerms: contractData.specialTerms,
        progress: contractData.progress
      };
      
      const response = await fetch(`/api/team/contracts/${contractId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: dict.successUpdate,
          description: "Contract has been updated successfully",
          className: "bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0",
        });
        
        // Update original data
        setOriginalData(JSON.parse(JSON.stringify(contractData)));
      } else {
        throw new Error(data.error || "Failed to update contract");
      }
    } catch (error) {
      toast({
        title: dict.errorUpdate,
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Save as draft
  const handleSaveDraft = async () => {
    if (!contractData) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/team/contracts/${contractId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: contractData.title,
          description: contractData.description,
          scopeOfWork: contractData.scopeOfWork,
          status: 'draft'
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: dict.saveDraft,
          description: "Contract has been saved as draft",
          className: "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0",
        });
        
        setOriginalData(JSON.parse(JSON.stringify(contractData)));
        router.refresh();
      } else {
        throw new Error(data.error || "Failed to save draft");
      }
    } catch (error) {
      toast({
        title: dict.errorUpdate,
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Delete contract
  const handleDelete = async () => {
    if (!contractData) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/team/contracts/${contractId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment: deleteComment }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: dict.contractDeleted,
          description: "Contract has been deleted successfully",
          className: "bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0",
        });
        
        router.push('/team/contracts');
      } else {
        throw new Error(data.error || "Failed to delete contract");
      }
    } catch (error) {
      toast({
        title: dict.errorDelete,
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
      setShowDeleteDialog(false);
      setDeleteComment('');
    }
  };

  // Reset changes
  const handleReset = () => {
    if (originalData) {
      setContractData(JSON.parse(JSON.stringify(originalData)));
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">{dict.loading}</p>
        </div>
      </div>
    );
  }

  if (!contractData || !team || !client || !currentUserRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950/20 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-2xl">
          <CardContent className="pt-12 pb-12 text-center">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Contract Not Found</h3>
            <p className="text-slate-600 mb-6">
              The contract you're looking for doesn't exist or you don't have access.
            </p>
            <Button 
              onClick={() => router.push('/team/contracts')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              View All Contracts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user can edit
  const userCanEdit = canEdit();
  
  // Tabs configuration
  const tabs = [
    { id: 'basics', label: dict.contractBasics, icon: <FileText className="h-4 w-4" /> },
    { id: 'scope', label: dict.scopeOfWork, icon: <Target className="h-4 w-4" /> },
    { id: 'deliverables', label: dict.deliverables, icon: <CheckCircle className="h-4 w-4" /> },
    { id: 'payments', label: dict.paymentTerms, icon: <DollarSign className="h-4 w-4" /> },
    { id: 'settings', label: dict.contractSettings, icon: <Settings className="h-4 w-4" /> },
  ];

  // Render tab content
  const renderTabContent = () => {
    if (!contractData) return null;

    switch (activeTab) {
      case 'basics':
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
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder={dict.enterContractTitle}
                  disabled={!userCanEdit}
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
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder={dict.briefDescription}
                  rows={4}
                  disabled={!userCanEdit}
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
                    onChange={(e) => updateField('startDate', e.target.value)}
                    disabled={!userCanEdit}
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
                    onChange={(e) => updateField('endDate', e.target.value)}
                    disabled={!userCanEdit}
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
              
              {userCanEdit && (
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
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'scope':
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-500" />
                {dict.scopeOfWork}
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
                  onChange={(e) => updateField('scopeOfWork', e.target.value)}
                  placeholder={dict.describeScopeOfWork}
                  rows={6}
                  disabled={!userCanEdit}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>
              
              <div>
                <Label htmlFor="specialTerms" className="mb-2">
                  {dict.specialTerms}
                </Label>
                <Textarea
                  id="specialTerms"
                  value={contractData.specialTerms}
                  onChange={(e) => updateField('specialTerms', e.target.value)}
                  placeholder="Any special terms, conditions, or requirements..."
                  rows={4}
                  disabled={!userCanEdit}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'deliverables':
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                {dict.deliverables}
              </CardTitle>
              <CardDescription>
                {dict.listAllDeliverablesForThisContract}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label className="text-base font-medium">{dict.deliverables}</Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {dict.listAllDeliverablesForThisContract}
                  </p>
                </div>
                {userCanEdit && (
                  <Button variant="outline" size="sm" onClick={addDeliverable}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {dict.addDeliverable}
                  </Button>
                )}
              </div>
              
              {contractData.deliverables.length === 0 ? (
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center">
                  <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">
                    {dict.noDeliverablesAddedYet}
                  </p>
                  {userCanEdit && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={addDeliverable}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {dict.addFirstDeliverable}
                    </Button>
                  )}
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
                            {deliverable.status && (
                              <Badge 
                                variant={
                                  deliverable.status === 'completed' ? 'default' :
                                  deliverable.status === 'in-progress' ? 'secondary' : 'outline'
                                }
                                className="ml-2"
                              >
                                {deliverable.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {userCanEdit && (
                          <div className="flex items-center gap-2">
                            <Select 
                              value={deliverable.status} 
                              onValueChange={(value) => updateDeliverable(deliverable.id, 'status', value)}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in-progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDeliverable(deliverable.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm">Title *</Label>
                          <Input
                            value={deliverable.title}
                            onChange={(e) => updateDeliverable(deliverable.id, 'title', e.target.value)}
                            placeholder="e.g., Homepage Design Mockups"
                            className="mt-1"
                            disabled={!userCanEdit}
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
                            disabled={!userCanEdit}
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm">Due Date</Label>
                          <Input
                            type="date"
                            value={deliverable.dueDate || ''}
                            onChange={(e) => updateDeliverable(deliverable.id, 'dueDate', e.target.value)}
                            className="mt-1"
                            disabled={!userCanEdit}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'payments':
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
                    onValueChange={(value: any) => updateField('type', value)}
                    disabled={!userCanEdit}
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
                    onValueChange={(value) => updateField('currency', value)}
                    disabled={!userCanEdit}
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
                  onChange={(e) => updateField('value', e.target.value)}
                  placeholder={contractData.type === 'retainer' ? "e.g., 5000" : "e.g., 25000"}
                  disabled={!userCanEdit}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
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
                    {userCanEdit && (
                      <Button variant="outline" size="sm" onClick={addMilestone}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        {dict.addMilestone}
                      </Button>
                    )}
                  </div>
                  
                  {contractData.milestones.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center">
                      <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">
                        {dict.noMilestonesAddedYet}
                      </p>
                      {userCanEdit && (
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={addMilestone}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          {dict.addFirstMilestone}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contractData.milestones.map((milestone, index) => (
                        <div key={milestone.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  ${milestone.amount}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold">Milestone {index + 1}</h4>
                                {milestone.status && (
                                  <Badge 
                                    variant={milestone.status === 'paid' ? 'default' : 'outline'}
                                    className="ml-2"
                                  >
                                    {milestone.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {userCanEdit && (
                              <div className="flex items-center gap-2">
                                <Select 
                                  value={milestone.status} 
                                  onValueChange={(value) => updateMilestone(milestone.id, 'status', value)}
                                >
                                  <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeMilestone(milestone.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">Title *</Label>
                              <Input
                                value={milestone.title}
                                onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                                placeholder="e.g., Design Phase Completion"
                                className="mt-1"
                                disabled={!userCanEdit}
                              />
                            </div>
                            
                            <div>
                              <Label className="text-sm">Due Date *</Label>
                              <Input
                                type="date"
                                value={milestone.dueDate}
                                onChange={(e) => updateMilestone(milestone.id, 'dueDate', e.target.value)}
                                className="mt-1"
                                disabled={!userCanEdit}
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
                                disabled={!userCanEdit}
                              />
                            </div>
                            
                            <div>
                              <Label className="text-sm">Description</Label>
                              <Input
                                value={milestone.description}
                                onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                                placeholder="Brief description..."
                                className="mt-1"
                                disabled={!userCanEdit}
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
                  onChange={(e) => updateField('paymentTerms', e.target.value)}
                  placeholder="e.g., 50% upfront, 50% upon completion..."
                  rows={3}
                  disabled={!userCanEdit}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'settings':
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-500" />
                {dict.contractSettings}
              </CardTitle>
              <CardDescription>
                Configure contract behavior and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    onCheckedChange={(checked) => updateField('isRecurring', checked)}
                    disabled={!userCanEdit}
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
                      onCheckedChange={(checked) => updateField('autoRenew', checked)}
                      disabled={!userCanEdit}
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
                    onCheckedChange={(checked) => updateField('requiresAllSignatures', checked)}
                    disabled={!userCanEdit}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-base font-medium mb-4">Notification Settings</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailNotifications" className="text-sm">
                      Email Notifications
                    </Label>
                    <Switch
                      id="emailNotifications"
                      checked={contractData.notificationSettings.email}
                      onCheckedChange={(checked) => updateField('notificationSettings', {
                        ...contractData.notificationSettings,
                        email: checked
                      })}
                      disabled={!userCanEdit}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inAppNotifications" className="text-sm">
                      In-App Notifications
                    </Label>
                    <Switch
                      id="inAppNotifications"
                      checked={contractData.notificationSettings.inApp}
                      onCheckedChange={(checked) => updateField('notificationSettings', {
                        ...contractData.notificationSettings,
                        inApp: checked
                      })}
                      disabled={!userCanEdit}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reminderNotifications" className="text-sm">
                      Reminder Notifications
                    </Label>
                    <Switch
                      id="reminderNotifications"
                      checked={contractData.notificationSettings.reminders}
                      onCheckedChange={(checked) => updateField('notificationSettings', {
                        ...contractData.notificationSettings,
                        reminders: checked
                      })}
                      disabled={!userCanEdit}
                    />
                  </div>
                </div>
              </div>
              
              {contractData.status === 'draft' && currentUserRole.isClient && (
                <>
                  <Separator />
                  <div className="pt-4">
                    <Label className="text-base font-medium mb-4 text-red-600 dark:text-red-400">
                      Danger Zone
                    </Label>
                    <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-red-800 dark:text-red-300">
                            {dict.deleteContract}
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {dict.deleteWarning}
                          </p>
                        </div>
                        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                          <DialogTrigger asChild>
                            <Button variant="destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              {dict.deleteContract}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="text-red-600">{dict.confirmDelete}</DialogTitle>
                              <DialogDescription>
                                {dict.deleteWarning}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Label htmlFor="deleteComment" className="mb-2">
                                {dict.optionalComment}
                              </Label>
                              <Textarea
                                id="deleteComment"
                                value={deleteComment}
                                onChange={(e) => setDeleteComment(e.target.value)}
                                placeholder="Reason for deleting this contract..."
                                rows={3}
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setShowDeleteDialog(false)}
                              >
                                {dict.cancel}
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={updating}
                              >
                                {updating ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 mr-2" />
                                )}
                                {dict.proceed}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
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
                onClick={() => router.back()}
                className="mb-6 group transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                {dict.backToProjects}
              </Button>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                    <Edit className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {dict.editContract}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                      Editing contract: {contractData.title}
                    </p>
                  </div>
                </div>
                
                {/* Status and Info */}
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-700">
                    <Badge 
                      variant={
                        contractData.status === 'active' ? 'default' :
                        contractData.status === 'completed' ? 'secondary' :
                        contractData.status === 'draft' ? 'outline' : 'destructive'
                      }
                      className="capitalize"
                    >
                      {contractData.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-700">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">{team.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-700">
                    <Building2 className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{client.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-700">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium">
                      ${parseInt(contractData.value).toLocaleString()} {contractData.currency}
                    </span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/team/contracts/${contractId}`)}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Contract
                  </Button>
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
              
              {!userCanEdit && (
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  <Lock className="h-3 w-3 mr-1" />
                  Read Only
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                  >
                    <span className="flex items-center gap-2">
                      {tab.icon}
                      {tab.label}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-6">
                {renderTabContent()}
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Column: Preview & Actions */}
          <div className="space-y-6">
            {/* Contract Status */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 dark:from-blue-500/5 dark:via-gray-800 dark:to-blue-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Contract Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Status</span>
                  <Badge 
                    variant={
                      contractData.status === 'active' ? 'default' :
                      contractData.status === 'completed' ? 'secondary' :
                      contractData.status === 'draft' ? 'outline' : 'destructive'
                    }
                    className="capitalize"
                  >
                    {contractData.status}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Progress</span>
                    <span className="font-medium">{contractData.progress}%</span>
                  </div>
                  <Progress value={contractData.progress} className="h-2" />
                </div>
                
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Your Role</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={
                        currentUserRole.isClient 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                          : 'bg-gradient-to-br from-emerald-500 to-green-600 text-white'
                      }>
                        {currentUserRole.isClient ? 'C' : 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {currentUserRole.isClient ? 'Client' : 'Team Member'}
                        {currentUserRole.isTeamLead && ' (Team Lead)'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {currentUserRole.hasSigned ? 'Signed' : 'Not signed'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Team & Client Info */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 dark:from-emerald-500/5 dark:via-gray-800 dark:to-emerald-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-500" />
                  {dict.teamClientSelection}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Team</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      {team.avatar ? (
                        <AvatarImage src={team.avatar} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {team.name.substring(0, 2)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {team.members.length} members
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Client</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      {client.avatar ? (
                        <AvatarImage src={client.avatar} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                          {client.name.substring(0, 2)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{client.email}</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/teams/${team.id}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {dict.viewTeam}
                </Button>
              </CardContent>
            </Card>
            
            {/* Action Buttons */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 dark:from-purple-500/5 dark:via-gray-800 dark:to-purple-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-500" />
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {hasChanges() && (
                  <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        You have unsaved changes
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  {userCanEdit && (
                    <>
                      <Button
                        onClick={handleSave}
                        disabled={!hasChanges() || updating}
                        className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                      >
                        {updating ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {hasChanges() ? dict.saveDraft : dict.noChanges}
                      </Button>
                      
                      {hasChanges() && (
                        <Button
                          onClick={handleReset}
                          variant="outline"
                          className="w-full"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reset Changes
                        </Button>
                      )}
                    </>
                  )}
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/team/contracts/${contractId}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {dict.viewDetails}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.print()}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {dict.downloadPDF}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Tips & Best Practices */}
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}