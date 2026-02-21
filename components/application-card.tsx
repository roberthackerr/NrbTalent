// components/application-card.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  Clock, 
  Eye,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ApplicationCardProps {
  application: {
    id: string;
    teamId?: string;
    teamName: string;
    projectId: string;
    projectTitle: string;
    coverLetter: string;
    proposedBudget: number;
    estimatedTimeline: string;
    status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
    clientViewed?: boolean;
    createdAt: string;
    teamSummary?: {
      memberCount: number;
      roles: string[];
      skills: string[];
    };
  };
  view: 'client' | 'team';
  onStatusUpdate?: (applicationId: string, status: 'accepted' | 'rejected') => void;
  onViewDetails?: (applicationId: string) => void;
}

export function ApplicationCard({ 
  application, 
  view, 
  onStatusUpdate,
  onViewDetails 
}: ApplicationCardProps) {
  const router = useRouter();
  
  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'outline' as const, className: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      accepted: { variant: 'success' as const },
      rejected: { variant: 'destructive' as const },
      withdrawn: { variant: 'secondary' as const }
    };
    
    return (
      <Badge 
        variant={variants[status as keyof typeof variants]?.variant || 'outline'}
        className="capitalize"
      >
        {status}
      </Badge>
    );
  };

  const getClientActions = () => {
    if (application.status !== 'pending') return null;
    
    return (
      <div className="flex gap-2 mt-4">
        <Button
          size="sm"
          className="flex-1 bg-green-600 hover:bg-green-700"
          onClick={() => onStatusUpdate?.(application.id, 'accepted')}
        >
          Accept
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onStatusUpdate?.(application.id, 'rejected')}
        >
          Reject
        </Button>
      </div>
    );
  };

  const getTeamActions = () => {
    return (
      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => router.push(`/projects/${application.projectId}`)}
        >
          <Eye className="h-3 w-3 mr-1" />
          View Project
        </Button>
        
        {application.status === 'accepted' && (
          <Button
            size="sm"
            className="flex-1"
            onClick={() => router.push(`/messages?project=${application.projectId}`)}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Message Client
          </Button>
        )}
      </div>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-all cursor-pointer">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                {application.teamName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {view === 'client' ? application.teamName : application.projectTitle}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Applied {new Date(application.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {getStatusBadge(application.status)}
        </div>

        {/* Summary */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {application.coverLetter}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Proposed</p>
              <p className="font-semibold">
                ${application.proposedBudget.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Timeline</p>
              <p className="font-medium">{application.estimatedTimeline}</p>
            </div>
          </div>
          
          {view === 'client' && application.teamSummary && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Members</p>
                <p className="font-medium">{application.teamSummary.memberCount}</p>
              </div>
            </div>
          )}
          
          {view === 'team' && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <p className="font-medium capitalize">{application.status}</p>
              </div>
            </div>
          )}
        </div>

        {/* Team Skills (Client View) */}
        {view === 'client' && application.teamSummary && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {application.teamSummary.skills.slice(0, 5).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {application.teamSummary.skills.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{application.teamSummary.skills.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <Separator className="my-4" />
        
        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails?.(application.id)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
          
          {view === 'client' ? getClientActions() : getTeamActions()}
        </div>
      </CardContent>
    </Card>
  );
}