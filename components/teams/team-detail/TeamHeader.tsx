import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  Star, 
  Settings,
  MessageSquare,
  X,
  Edit,
  UserPlus,
  Copy,
  Trash2,
  Clock,
  Lock,
  Loader2,
  CheckCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeamHeaderProps {
  team: any;
  onJoinTeam: () => void;
  onLeaveTeam: () => void;
  onCopyJoinLink: () => void;
  onOpenJoinRequests: () => void;
  onOpenManageTeam: () => void;
  onOpenInviteModal: () => void;
  isProcessing?: boolean;
}

export function TeamHeader({
  team,
  onJoinTeam,
  onLeaveTeam,
  onCopyJoinLink,
  onOpenJoinRequests,
  onOpenManageTeam,
  onOpenInviteModal,
  isProcessing = false
}: TeamHeaderProps) {
  
  // Function to render join button based on state
  const renderJoinButton = () => {
    // User is already a member
    if (team.currentUser?.isMember) {
      if (team.currentUser.isLead) {
        return (
          <Button 
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
            size="lg"
          >
            <Users className="h-4 w-4 mr-2" />
            Team Lead
          </Button>
        );
      }
      return (
        <Button 
          className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg"
          size="lg"
        >
          <Users className="h-4 w-4 mr-2" />
          Team Member
        </Button>
      );
    }

    // User has an APPROVED request (can join now!)
    if (team.currentUser?.hasApprovedRequest) {
      return (
        <Button 
          onClick={onJoinTeam}
          disabled={isProcessing}
          className="bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg hover:from-emerald-700 hover:to-green-700"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Join Now (Approved!)
            </>
          )}
        </Button>
      );
    }

    // User has a pending request
    if (team.currentUser?.hasPendingRequest) {
      return (
        <Button 
          disabled
          variant="outline"
          className="border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-50"
          size="lg"
        >
          <Clock className="h-4 w-4 mr-2" />
          Request Pending
        </Button>
      );
    }

    // User can join (no request yet)
    if (team.currentUser?.canJoin) {
      return (
        <Button 
          onClick={onJoinTeam}
          disabled={isProcessing}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:from-blue-700 hover:to-purple-700"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Users className="h-4 w-4 mr-2" />
              Join Team
            </>
          )}
        </Button>
      );
    }

    // User cannot join (team full or not available)
    return (
      <Button 
        disabled
        variant="outline"
        className="border-gray-300 text-gray-500 bg-gray-50"
        size="lg"
      >
        <Lock className="h-4 w-4 mr-2" />
        {team.availability === 'full' ? 'Team Full' : 'Not Available'}
      </Button>
    );
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 dark:from-blue-900 dark:via-blue-800 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Team Info */}
          <div className="text-white">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold">{team.name}</h1>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={team.availability === 'available' ? 'default' : 'secondary'}
                  className="capitalize bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                >
                  {team.availability}
                </Badge>
                {!team.isPublic && (
                  <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                    <Lock className="h-3 w-3 mr-1" />
                    Private
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-lg text-blue-100 mb-4">{team.tagline}</p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-blue-200">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{team.memberCount} members</span>
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                <span>{team.completedProjects} projects</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Active since {new Date(team.createdAt).getFullYear()}</span>
              </div>
              {team.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{team.rating.toFixed(1)} rating</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Team Lead Management Menu */}
            {team.currentUser?.isLead && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Team
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 backdrop-blur-sm">
                  <DropdownMenuItem onClick={onOpenJoinRequests} className="cursor-pointer">
                    <Users className="h-4 w-4 mr-2" />
                    View Join Requests
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenManageTeam} className="cursor-pointer">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Team Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenInviteModal} className="cursor-pointer">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Members
                  </DropdownMenuItem>
                  {team.joinCode && (
                    <DropdownMenuItem onClick={onCopyJoinLink} className="cursor-pointer">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Join Link
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={onLeaveTeam}
                    className="text-red-600 dark:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Team
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Leave Team Button (for non-lead members) */}
            {team.currentUser?.isMember && !team.currentUser?.isLead && (
              <Button 
                variant="outline" 
                className="border-white/30 text-white hover:bg-red-500/20 hover:text-red-100 backdrop-blur-sm"
                onClick={onLeaveTeam}
              >
                <X className="h-4 w-4 mr-2" />
                Leave Team
              </Button>
            )}
            
            {/* Dynamic Join Button */}
            {renderJoinButton()}
            
            {/* Chat Button (for members only) */}
            {team.currentUser?.isMember && (
              <Button 
                className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-white/30"
                size="lg"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Team Chat
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}