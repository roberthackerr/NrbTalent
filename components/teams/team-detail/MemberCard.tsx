import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  MoreVertical, 
  MessageSquare, 
  ExternalLink, 
  Calendar, 
  MapPin,
  Shield,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MemberCardProps {
  member: any;
  isLead?: boolean;
  onRemove: () => void;
  onTransferLeadership: () => void;
  currentUserId?: string | null;
}

export function MemberCard({ 
  member, 
  isLead,
  onRemove,
  onTransferLeadership,
  currentUserId 
}: MemberCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-4 border-white dark:border-gray-800 shadow-lg">
            <AvatarImage src={member.userInfo?.avatar} />
            <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {member.userInfo?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                  {member.userInfo?.name || 'Unknown Member'}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={member.isLead ? 'default' : 'outline'}
                    className={member.isLead ? 'bg-blue-600 text-white' : ''}
                  >
                    {member.isLead ? 'Team Lead' : member.role || 'Member'}
                  </Badge>
                  
                  {member.userInfo?.title && (
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {member.userInfo.title}
                    </span>
                  )}
                </div>
              </div>
              
              {isLead && member.userId !== currentUserId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onTransferLeadership}>
                      <Shield className="h-4 w-4 mr-2" />
                      Make Team Lead
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={onRemove}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove from Team
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {/* Member Stats */}
            {member.userInfo?.statistics && (
              <div className="grid grid-cols-3 gap-4 my-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {member.userInfo.statistics.projectsCompleted || 0}
                  </div>
                  <div className="text-xs text-gray-500">Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {member.userInfo.statistics.onTimeDelivery || 0}%
                  </div>
                  <div className="text-xs text-gray-500">On Time</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {member.userInfo.rating?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">Rating</div>
                </div>
              </div>
            )}
            
            {/* Top Skills */}
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {member.skills.slice(0, 4).map((skill: any, index: number) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="text-xs cursor-help">
                          {skill.name}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{skill.level} level • {skill.yearsOfExperience} years</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {member.skills.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{member.skills.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Additional Info */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Joined {formatDistanceToNow(new Date(member.joinDate), { addSuffix: true })}
              </div>
              {member.userInfo?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {member.userInfo.location}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-6 flex gap-2">
          <Button size="sm" variant="outline" className="flex-1">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}