import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  MessageSquare, 
  FileText, 
  Settings, 
  X,
  Users,
  Briefcase,
  Calendar,
  Share2,
  Copy,
  Zap,
  CheckCircle,
  Clock,
  Lock,
  Loader2,
  Video
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TeamSidebarProps {
  team: any;
  currentUserId: string | null;
  onJoinTeam: () => void;
  onLeaveTeam: () => void;
  onCopyJoinLink: () => void;
  onOpenManageTeam: () => void;
  isProcessing?: boolean;
}

export function TeamSidebar({
  team,
  currentUserId,
  onJoinTeam,
  onLeaveTeam,
  onCopyJoinLink,
  onOpenManageTeam,
  isProcessing = false
}: TeamSidebarProps) {
  
  const renderJoinSection = () => {
    // User is already a member
    if (team.currentUser?.isMember) {
      return (
        <>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div>
              <div className="font-semibold text-green-800 dark:text-green-300">
                Team Member
              </div>
              <div className="text-sm text-green-700 dark:text-green-400">
                Active participant
              </div>
            </div>
          </div>
          
          {team.currentUser.isLead && (
            <Badge className="w-full justify-center py-2.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
              <Shield className="h-4 w-4 mr-2" />
              Team Lead (Administrator)
            </Badge>
          )}
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button 
              variant="outline" 
              className="w-full border-gray-200 hover:bg-gray-50"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>
            <Button 
              variant="outline" 
              className="w-full border-gray-200 hover:bg-gray-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              Docs
            </Button>
          </div>
          
          {team.currentUser.isLead && (
            <Button 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white mt-2"
              onClick={onOpenManageTeam}
            >
              <Settings className="h-4 w-4 mr-2" />
              Team Settings
            </Button>
          )}
          
          {!team.currentUser.isLead && (
            <Button 
              variant="outline" 
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 mt-2"
              onClick={onLeaveTeam}
            >
              <X className="h-4 w-4 mr-2" />
              Leave Team
            </Button>
          )}
        </>
      );
    }

    // User has an APPROVED request (can join now!)
    if (team.currentUser?.hasApprovedRequest) {
      return (
        <div className="text-center py-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            Request Approved!
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Your request has been approved. You can now join the team.
          </p>
          <div className="space-y-3">
            <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded">
              <CheckCircle className="h-3 w-3 inline mr-1" />
              Approved by team lead
            </div>
            <Button 
              onClick={onJoinTeam}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Joining Team...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Join Team Now
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Click to become an official team member
            </p>
          </div>
        </div>
      );
    }

    // User has pending request
    if (team.currentUser?.hasPendingRequest) {
      return (
        <div className="text-center py-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
            <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            Request Submitted
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Your join request is under review by the team lead.
          </p>
          <div className="space-y-3">
            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
              <Clock className="h-3 w-3 inline mr-1" />
              Typically reviewed within 24-48 hours
            </div>
            <Button 
              disabled
              variant="outline"
              className="w-full border-amber-300 text-amber-700 bg-amber-50"
            >
              <Clock className="h-4 w-4 mr-2" />
              Awaiting Approval
            </Button>
          </div>
        </div>
      );
    }

    // User can join
    if (team.currentUser?.canJoin) {
      const spotsLeft = team.maxMembers - team.memberCount;
      const availabilityPercentage = (team.memberCount / team.maxMembers) * 100;

      return (
        <div className="text-center py-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
            <Users className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            Join This Team
          </h4>
          
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>Team Capacity</span>
              <span className="font-medium">{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} available</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" 
                style={{ width: `${availabilityPercentage}%` }}
              />
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            This team is currently accepting new members.
          </p>
          
          <Button 
            onClick={onJoinTeam}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Users className="h-5 w-5 mr-2" />
                Request to Join
              </>
            )}
          </Button>
          
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Requires team lead approval</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Response within 24-48 hours</span>
            </div>
          </div>
        </div>
      );
    }

    // User cannot join
    return (
      <div className="text-center py-6">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800 dark:to-slate-800 flex items-center justify-center">
          <Lock className="h-10 w-10 text-gray-400 dark:text-gray-500" />
        </div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          {team.availability === 'full' ? 'Team Full' : 'Not Accepting Members'}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {team.availability === 'full' 
            ? 'This team has reached its maximum capacity.'
            : 'This team is not currently looking for new members.'}
        </p>
        <Button 
          disabled
          variant="outline"
          className="w-full border-gray-300 text-gray-500"
        >
          <Lock className="h-4 w-4 mr-2" />
          Join Unavailable
        </Button>
      </div>
    );
  };

  return (
    <>
      {/* Team Status Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Team Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {renderJoinSection()}
          </div>
        </CardContent>
      </Card>

      {/* Team Details Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-purple-600" />
            Team Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-500">Team Size</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{team.memberCount}/{team.maxMembers}</span>
                <Badge variant="outline" className="text-xs">
                  {team.maxMembers - team.memberCount} spots
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-500">Projects Completed</span>
              <span className="font-semibold">{team.completedProjects}</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-500">Total Revenue</span>
              <span className="font-semibold text-green-600">
                ${(team.totalEarnings / 1000).toFixed(1)}K
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-500">Status</span>
              <Badge variant={team.availability === 'available' ? 'default' : 'secondary'} className="capitalize">
                {team.availability}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-500">Visibility</span>
              <Badge variant="outline" className="capitalize">
                {team.isPublic ? 'Public' : 'Private'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">Created</span>
              <span className="font-medium text-sm">
                {formatDistanceToNow(new Date(team.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 border-gray-200 hover:bg-gray-50">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {team.currentUser?.isLead && team.joinCode && (
              <Button 
                variant="outline" 
                className="flex-1 border-gray-200 hover:bg-gray-50"
                onClick={onCopyJoinLink}
              >
                <Copy className="h-4 w-4 mr-2" />
                Invite Link
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start border-gray-200 hover:bg-gray-50">
            <MessageSquare className="h-4 w-4 mr-2" />
            Start Team Chat
          </Button>
          <Button variant="outline" className="w-full justify-start border-gray-200 hover:bg-gray-50">
            <Video className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
          <Button variant="outline" className="w-full justify-start border-gray-200 hover:bg-gray-50">
            <FileText className="h-4 w-4 mr-2" />
            Team Documents
          </Button>
          <Button variant="outline" className="w-full justify-start border-gray-200 hover:bg-gray-50">
            <Briefcase className="h-4 w-4 mr-2" />
            Browse Projects
          </Button>
        </CardContent>
      </Card>
    </>
  );
}