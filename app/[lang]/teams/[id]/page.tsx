'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { TeamDetailSkeleton } from '@/components/teams/team-detail/TeamDetailSkeleton';
import { TeamNotFound } from '@/components/teams/team-detail/TeamNotFound';
import { TeamHeader } from '@/components/teams/team-detail/TeamHeader';
import { TeamPerformanceCard } from '@/components/teams/team-detail/TeamPerformanceCard';
import { TeamSidebar } from '@/components/teams/team-detail/TeamSidebar';
import { TeamTabs } from '@/components/teams/team-detail/TeamTabs';
import { TeamModals } from '@/components/teams/team-detail/TeamModals';

interface TeamDetails {
  id: string;
  name: string;
  tagline: string;
  description: string;
  members: any[];
  memberCount: number;
  maxMembers: number;
  skills: any[];
  availability: 'available' | 'busy' | 'full';
  completedProjects: number;
  rating?: number;
  totalEarnings: number;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  joinCode?: string;
  preferences?: any;
  statistics?: any;
  currentUser?: {
    isMember: boolean;
    isLead: boolean;
    canJoin: boolean;
    hasPendingRequest?: boolean;
    hasApprovedRequest?: boolean;
    canInvite: boolean;
    permissions: string[];
  };
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [teamStats, setTeamStats] = useState({
    totalEarnings: 0,
    avgRating: 0,
    onTimeDelivery: 0,
    activeProjects: 0,
    avgResponseTime: 24,
  });
  
  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showJoinRequestsModal, setShowJoinRequestsModal] = useState(false);
  const [showJoinConfirmation, setShowJoinConfirmation] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch team details with request status
  const fetchTeamDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teams/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        const teamData = data.team;
        
        // Check request status
        let requestStatus = {
          hasPendingRequest: false,
          hasApprovedRequest: false,
          canJoin: false
        };
        
        try {
          const statusResponse = await fetch(`/api/teams/${params.id}/requests/check`);
          const statusData = await statusResponse.json();
          
          if (statusData.success) {
            requestStatus = {
              hasPendingRequest: statusData.hasPendingRequest || false,
              hasApprovedRequest: statusData.hasApprovedRequest || false,
              canJoin: statusData.canJoin || false
            };
          }
        } catch (error) {
          console.log('No request status endpoint or error:', error);
        }

        // Update team with all statuses
        const updatedTeam = {
          ...teamData,
          currentUser: teamData.currentUser ? {
            ...teamData.currentUser,
            ...requestStatus,
            canJoin: requestStatus.canJoin || teamData.currentUser.canJoin
          } : null
        };

        setTeam(updatedTeam);
        calculateTeamStats(updatedTeam);
        
        if (data.currentUser) {
          setCurrentUserId(data.currentUser.id);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load team details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchTeamDetails();
    }
  }, [params.id]);

  const calculateTeamStats = (teamData: TeamDetails) => {
    const stats = {
      totalEarnings: teamData.totalEarnings || 0,
      avgRating: teamData.rating || 0,
      onTimeDelivery: teamData.statistics?.completionRate || 0,
      activeProjects: teamData.statistics?.activeProjects || 0,
      avgResponseTime: teamData.statistics?.responseTime || 24,
    };
    setTeamStats(stats);
  };

  // Handle join team with proper state management
  const handleJoinTeam = async () => {
    if (!team || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // First try to join directly
      const response = await fetch(`/api/teams/${team.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success!',
          description: `You've successfully joined ${team.name}`,
        });
        fetchTeamDetails();
      } else if (data.code === "AUTHORIZATION_REQUIRED") {
        // Show join confirmation modal for approval required
        setShowJoinConfirmation(true);
      } else {
        throw new Error(data.error || 'Failed to join team');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to join team',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle sending join request with message
  const handleSendJoinRequest = async () => {
    if (!team || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const response = await fetch(`/api/teams/${team.id}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: joinMessage || `I would like to join ${team.name} as I believe my skills align well with the team's objectives.`,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Request Submitted',
          description: `Your request to join ${team.name} has been sent for review.`,
        });
        setShowJoinConfirmation(false);
        setJoinMessage('');
        fetchTeamDetails();
      } else {
        throw new Error(data.error || 'Failed to send join request');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send join request',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle copying join link
  const handleCopyJoinLink = () => {
    if (!team || !team.joinCode) return;
    
    const joinLink = `${window.location.origin}/teams/join/${team.joinCode}`;
    navigator.clipboard.writeText(joinLink);
    
    toast({
      title: 'Link Copied',
      description: 'Team join link has been copied to clipboard.',
    });
  };

  // Handle team updates
  const handleUpdateTeam = async (updates: Partial<TeamDetails>) => {
    if (!team) return;
    
    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Team Updated',
          description: 'Team information has been successfully updated.',
        });
        fetchTeamDetails();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update team',
        variant: 'destructive',
      });
    }
  };

  // Handle leaving team
  const handleLeaveTeam = async () => {
    if (!team) return;
    
    const confirmLeave = window.confirm(
      `Are you sure you want to leave "${team.name}"? You will need to request to join again if you change your mind.`
    );
    
    if (!confirmLeave) return;

    try {
      const response = await fetch(`/api/teams/${team.id}/leave`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Team Left',
          description: `You have left ${team.name}`,
        });
        router.push('/teams');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to leave team',
        variant: 'destructive',
      });
    }
  };

  // Handle removing a team member
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!team || !team.currentUser?.isLead) return;
    
    const confirmRemove = window.confirm(
      `Are you sure you want to remove ${memberName} from "${team.name}"? This action cannot be undone.`
    );
    
    if (!confirmRemove) return;

    try {
      const response = await fetch(`/api/teams/${team.id}/members/${memberId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Member Removed',
          description: `${memberName} has been removed from the team.`,
        });
        fetchTeamDetails();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

  // Handle transferring leadership
  const handleTransferLeadership = async (memberId: string) => {
    if (!team || !team.currentUser?.isLead) return;
    
    const confirmTransfer = window.confirm(
      'Are you sure you want to transfer team leadership? You will lose admin privileges.'
    );
    
    if (!confirmTransfer) return;

    try {
      const response = await fetch(`/api/teams/${team.id}/transfer-leadership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newLeadId: memberId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Leadership Transferred',
          description: 'Team leadership has been successfully transferred.',
        });
        fetchTeamDetails();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to transfer leadership',
        variant: 'destructive',
      });
    }
  };

  // Handle invite sent callback
  const handleInviteSent = () => {
    toast({
      title: 'Invitations Sent',
      description: 'Team invitations have been sent successfully.',
    });
    fetchTeamDetails();
  };

  if (loading) {
    return <TeamDetailSkeleton />;
  }

  if (!team) {
    return <TeamNotFound onBrowseTeams={() => router.push('/teams')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Team Header */}
      <TeamHeader
        team={team}
        onJoinTeam={handleJoinTeam}
        onLeaveTeam={handleLeaveTeam}
        onCopyJoinLink={handleCopyJoinLink}
        onOpenJoinRequests={() => setShowJoinRequestsModal(true)}
        onOpenManageTeam={() => setShowManageModal(true)}
        onOpenInviteModal={() => setShowInviteModal(true)}
        isProcessing={isProcessing}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <TeamPerformanceCard stats={teamStats} availability={team.availability} />
            
            <TeamTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              team={team}
              currentUserId={currentUserId}
              onRemoveMember={handleRemoveMember}
              onTransferLeadership={handleTransferLeadership}
              onOpenInviteModal={() => setShowInviteModal(true)}
            />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <TeamSidebar
              team={team}
              currentUserId={currentUserId}
              onJoinTeam={handleJoinTeam}
              onLeaveTeam={handleLeaveTeam}
              onCopyJoinLink={handleCopyJoinLink}
              onOpenManageTeam={() => setShowManageModal(true)}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <TeamModals
        team={team}
        showInviteModal={showInviteModal}
        showManageModal={showManageModal}
        showJoinRequestsModal={showJoinRequestsModal}
        showJoinConfirmation={showJoinConfirmation}
        joinMessage={joinMessage}
        isProcessing={isProcessing}
        onCloseInviteModal={() => setShowInviteModal(false)}
        onCloseManageModal={() => setShowManageModal(false)}
        onCloseJoinRequestsModal={() => setShowJoinRequestsModal(false)}
        onCloseJoinConfirmation={() => {
          setShowJoinConfirmation(false);
          setJoinMessage('');
        }}
        onJoinMessageChange={setJoinMessage}
        onSendJoinRequest={handleSendJoinRequest}
        onUpdateTeam={handleUpdateTeam}
        onInviteSent={handleInviteSent}
      />
    </div>
  );
}