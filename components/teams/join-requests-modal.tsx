// components/teams/join-requests-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Clock, 
  Star, 
  Briefcase, 
  Check, 
  X, 
  MessageSquare,
  Calendar,
  ExternalLink,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface JoinRequest {
  _id: string;
  userId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  skills: Array<{
    name: string;
    level: string;
    yearsOfExperience: number;
  }>;
  experience?: string;
  createdAt: string;
  userInfo?: {
    name: string;
    avatar?: string;
    title?: string;
    rating?: number;
    statistics?: {
      projectsCompleted: number;
      onTimeDelivery: number;
    };
    location?: string;
  };
}

interface JoinRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  onRequestProcessed?: () => void;
}

export function JoinRequestsModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  onRequestProcessed
}: JoinRequestsModalProps) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'accepted' | 'rejected' | 'all'>('pending');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && teamId) {
      fetchJoinRequests();
    }
  }, [isOpen, teamId, selectedStatus]);

  const fetchJoinRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teams/${teamId}/requests?status=${selectedStatus}`);
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data.requests || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load join requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string, userName: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/requests/${requestId}/accept`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Request Accepted',
          description: `${userName} has been added to the team`,
        });
        
        // Refresh the list
        fetchJoinRequests();
        if (onRequestProcessed) {
          onRequestProcessed();
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to accept request',
        variant: 'destructive',
      });
    }
  };

  const handleRejectRequest = async (requestId: string, userName: string) => {
    if (!rejectReason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Request Rejected',
          description: `${userName}'s request has been declined`,
        });
        
        // Reset and refresh
        setRejectReason('');
        setRejectingRequestId(null);
        fetchJoinRequests();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject request',
        variant: 'destructive',
      });
    }
  };

  const handleSendJoinRequest = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `I'd like to join ${teamName}`,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Request Sent',
          description: `Your join request has been sent to ${teamName} team lead`,
        });
        onClose();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send request',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Join Requests</DialogTitle>
          <DialogDescription>
            Manage requests to join "{teamName}"
          </DialogDescription>
        </DialogHeader>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={selectedStatus === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('pending')}
          >
            Pending ({requests.filter(r => r.status === 'pending').length})
          </Button>
          <Button
            variant={selectedStatus === 'accepted' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('accepted')}
          >
            Accepted
          </Button>
          <Button
            variant={selectedStatus === 'rejected' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('rejected')}
          >
            Rejected
          </Button>
          <Button
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('all')}
          >
            All
          </Button>
        </div>

        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No {selectedStatus === 'all' ? '' : selectedStatus} requests
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedStatus === 'pending' 
                  ? "No pending requests to join this team"
                  : "No requests found"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request._id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.userInfo?.avatar} />
                        <AvatarFallback>
                          {request.userInfo?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {request.userInfo?.name || 'Unknown User'}
                          </h4>
                          <Badge variant={request.status === 'pending' ? 'secondary' : 
                                     request.status === 'accepted' ? 'default' : 'destructive'}>
                            {request.status}
                          </Badge>
                        </div>
                        
                        {request.message && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            "{request.message}"
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          {request.userInfo?.title && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {request.userInfo.title}
                            </div>
                          )}
                          
                          {request.userInfo?.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4" />
                              {request.userInfo.rating.toFixed(1)}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                        
                        {/* Skills */}
                        {request.skills && request.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {request.skills.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill.name}
                              </Badge>
                            ))}
                            {request.skills.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{request.skills.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    {request.status === 'pending' && (
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleAcceptRequest(request._id, request.userInfo?.name || 'User')}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        
                        {rejectingRequestId === request._id ? (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Reason for rejection..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="text-sm"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRejectingRequestId(null);
                                  setRejectReason('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectRequest(request._id, request.userInfo?.name || 'User')}
                              >
                                Confirm Reject
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setRejectingRequestId(request._id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            {requests.filter(r => r.status === 'pending').length} pending requests
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}