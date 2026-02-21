import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { InviteMembersModal } from '@/components/teams/invite-members-modal';
import { ManageTeamModal } from '@/components/teams/manage-team-modal';
import { JoinRequestsModal } from '@/components/teams/join-requests-modal';

interface TeamModalsProps {
  team: any;
  showInviteModal: boolean;
  showManageModal: boolean;
  showJoinRequestsModal: boolean;
  showJoinConfirmation: boolean;
  joinMessage: string;
  onCloseInviteModal: () => void;
  onCloseManageModal: () => void;
  onCloseJoinRequestsModal: () => void;
  onCloseJoinConfirmation: () => void;
  onJoinMessageChange: (message: string) => void;
  onSendJoinRequest: () => void;
  onUpdateTeam: (updates: any) => void;
  onInviteSent: () => void;
}

export function TeamModals({
  team,
  showInviteModal,
  showManageModal,
  showJoinRequestsModal,
  showJoinConfirmation,
  joinMessage,
  onCloseInviteModal,
  onCloseManageModal,
  onCloseJoinRequestsModal,
  onCloseJoinConfirmation,
  onJoinMessageChange,
  onSendJoinRequest,
  onUpdateTeam,
  onInviteSent
}: TeamModalsProps) {
  return (
    <>
      <InviteMembersModal
        isOpen={showInviteModal}
        onClose={onCloseInviteModal}
        teamId={team.id}
        onInviteSent={onInviteSent}
        availableSpots={team.maxMembers - team.memberCount}
      />

      <ManageTeamModal
        isOpen={showManageModal}
        onClose={onCloseManageModal}
        team={team}
        onUpdate={onUpdateTeam}
      />

      <JoinRequestsModal
        isOpen={showJoinRequestsModal}
        onClose={onCloseJoinRequestsModal}
        teamId={team.id}
        teamName={team.name}
        onRequestProcessed={() => window.location.reload()}
      />

      <Dialog open={showJoinConfirmation} onOpenChange={onCloseJoinConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to Join Team</DialogTitle>
            <DialogDescription>
              Send a request to join "{team?.name}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                This team requires approval from the team lead. Your request will be reviewed before you can join.
              </p>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Message (optional)</label>
                <Textarea
                  placeholder="Tell the team lead why you'd like to join..."
                  value={joinMessage}
                  onChange={(e) => onJoinMessageChange(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  This will help the team lead understand your interest
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onCloseJoinConfirmation}>
              Cancel
            </Button>
            <Button onClick={onSendJoinRequest}>
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}