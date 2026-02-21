'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Users, 
  X, 
  Send, 
  UserPlus, 
  Star,
  MapPin,
  Briefcase,
  Loader2,
  Clock,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';

interface Freelancer {
  _id: string;
  id: string;
  name: string;
  email: string;
  avatar?: string;
  title: string;
  description: string;
  bio: string;
  skills: Array<{
    name: string;
    level?: string;
    yearsOfExperience?: number;
  }>;
  location: string;
  hourlyRate: number;
  statistics: {
    rating: number;
    completedProjects: number;
    responseRate: number;
    clientSatisfaction: number;
  };
  verified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onInviteSent: () => void;
  availableSpots: number;
}

export function InviteMembersModal({ 
  isOpen, 
  onClose, 
  teamId, 
  onInviteSent, 
  availableSpots 
}: InviteMembersModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [selectedFreelancers, setSelectedFreelancers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [suggestedFreelancers, setSuggestedFreelancers] = useState<Freelancer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [minRating, setMinRating] = useState<string>('0');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1
  });

  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (isOpen) {
      fetchFreelancers();
      fetchSuggestedFreelancers();
    }
  }, [isOpen, debouncedSearch, skillFilter, locationFilter, minRating, pagination.page]);

  const fetchFreelancers = async () => {
    try {
      setIsSearching(true);
      
      const params = new URLSearchParams({
        q: debouncedSearch,
        role: 'freelance',
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (skillFilter !== 'all') params.append('skills', skillFilter);
      if (locationFilter !== 'all') params.append('location', locationFilter);
      if (minRating !== '0') params.append('minRating', minRating);

      const response = await fetch(`/api/users/search?${params}`);
      const data = await response.json();
      
      if (data.users) {
        const normalizedFreelancers = data.users.map((user: any) => ({
          ...user,
          id: user._id || user.id,
          name: user.name || 'Unknown Freelancer',
          title: user.title || 'Freelancer',
          skills: user.skills || [],
          statistics: user.statistics || {
            rating: 0,
            completedProjects: 0,
            responseRate: 0,
            clientSatisfaction: 0
          }
        }));
        
        setFreelancers(normalizedFreelancers);
        setPagination(data.pagination || {
          page: pagination.page,
          limit: pagination.limit,
          total: normalizedFreelancers.length,
          pages: 1
        });
      }
    } catch (error) {
      console.error('Error fetching freelancers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load freelancers',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const fetchSuggestedFreelancers = async () => {
    try {
      const response = await fetch('/api/users/search?role=freelance&limit=6&sort=rating');
      const data = await response.json();
      
      if (data.users) {
        const normalized = data.users.map((user: any) => ({
          ...user,
          id: user._id || user.id,
          name: user.name || 'Unknown Freelancer',
          title: user.title || 'Freelancer',
          skills: user.skills || [],
          statistics: user.statistics || {
            rating: 0,
            completedProjects: 0,
            responseRate: 0,
            clientSatisfaction: 0
          }
        }));
        setSuggestedFreelancers(normalized);
      }
    } catch (error) {
      console.error('Error fetching suggested freelancers:', error);
    }
  };

  const handleInvite = async () => {
    if (selectedFreelancers.length === 0) {
      toast({
        title: 'No Freelancers Selected',
        description: 'Please select at least one freelancer to invite',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFreelancers.length > availableSpots) {
      toast({
        title: 'Not Enough Spots',
        description: `Only ${availableSpots} spot(s) available in the team`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/teams/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          freelancerIds: selectedFreelancers,
          message: message.trim() || `You've been invited to join our team!`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '🎉 Invitations Sent!',
          description: `Successfully invited ${selectedFreelancers.length} freelancer(s) to your team`,
        });
        onInviteSent();
        onClose();
        resetForm();
      } else {
        throw new Error(data.error || 'Failed to send invitations');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invitations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFreelancer = useCallback((freelancerId: string) => {
    setSelectedFreelancers(prev => {
      if (prev.includes(freelancerId)) {
        return prev.filter(id => id !== freelancerId);
      } else if (prev.length < availableSpots) {
        return [...prev, freelancerId];
      } else {
        toast({
          title: 'Limit Reached',
          description: `Maximum ${availableSpots} freelancers can be invited`,
          variant: 'destructive',
        });
        return prev;
      }
    });
  }, [availableSpots, toast]);

  const resetForm = () => {
    setSelectedFreelancers([]);
    setMessage('');
    setSearchQuery('');
    setSkillFilter('all');
    setLocationFilter('all');
    setMinRating('0');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSkillFilter('all');
    setLocationFilter('all');
    setMinRating('0');
  };

  const hasFilters = searchQuery || skillFilter !== 'all' || locationFilter !== 'all' || minRating !== '0';

  const getUniqueSkills = () => {
    const skillSet = new Set<string>();
    freelancers.forEach(freelancer => {
      freelancer.skills?.forEach(skill => {
        if (skill.name) skillSet.add(skill.name);
      });
    });
    return Array.from(skillSet).sort();
  };

  const getUniqueLocations = () => {
    const locationSet = new Set<string>();
    freelancers.forEach(freelancer => {
      if (freelancer.location) locationSet.add(freelancer.location);
    });
    return Array.from(locationSet).sort();
  };

  const FreelancerCard = ({ freelancer }: { freelancer: Freelancer }) => {
    const isSelected = selectedFreelancers.includes(freelancer.id);
    
    return (
      <div
        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
        }`}
        onClick={() => toggleFreelancer(freelancer.id)}
      >
        <div className="flex items-start gap-3">
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={() => toggleFreelancer(freelancer.id)}
            className="mt-1 flex-shrink-0"
          />
          
          <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-800 shadow-sm flex-shrink-0">
            <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {freelancer.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                    {freelancer.name}
                  </h4>
                  {freelancer.verified && (
                    <Badge variant="outline" className="text-xs border-green-500 text-green-700 dark:text-green-400">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {freelancer.title}
                </p>
              </div>
              
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 mb-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {freelancer.statistics.rating}
                  </span>
                </div>
                {freelancer.hourlyRate > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <DollarSign className="h-3 w-3" />
                    <span>${freelancer.hourlyRate}/hr</span>
                  </div>
                )}
              </div>
            </div>
            
            {freelancer.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                {freelancer.description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-3 mb-3">
              {freelancer.location && (
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-3 w-3" />
                  <span>{freelancer.location}</span>
                </div>
              )}
              {freelancer.statistics.completedProjects > 0 && (
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <Briefcase className="h-3 w-3" />
                  <span>{freelancer.statistics.completedProjects} projects</span>
                </div>
              )}
              {freelancer.statistics.responseRate > 0 && (
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>{freelancer.statistics.responseRate}% response</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {freelancer.skills?.slice(0, 4).map((skill, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs px-2 py-0.5"
                >
                  {skill.name}
                  {skill.level && (
                    <span className="ml-1 text-[10px] text-gray-500">
                      {skill.level.charAt(0).toUpperCase()}
                    </span>
                  )}
                </Badge>
              ))}
              {freelancer.skills?.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{freelancer.skills.length - 4}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const FreelancerSkeleton = () => (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1200px] w-[90vw] h-[90vh] p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-blue-600" />
                Invite Team Members
              </DialogTitle>
              <DialogDescription className="mt-1">
                Search and invite freelancers to join your team. {availableSpots} spot(s) available.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          {/* Left Column - Search and Results */}
          <div className="flex-1 flex flex-col border-r min-h-0">
            {/* Search and Filters */}
            <div className="p-4 border-b flex-shrink-0">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search by name, skills, or location..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Select value={skillFilter} onValueChange={setSkillFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Skills" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Skills</SelectItem>
                    {getUniqueSkills().map((skill) => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {getUniqueLocations().map((location) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any Rating</SelectItem>
                    <SelectItem value="4">⭐ 4.0+</SelectItem>
                    <SelectItem value="4.5">⭐ 4.5+</SelectItem>
                    <SelectItem value="5">⭐ 5.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasFilters && (
                <div className="flex items-center justify-between mt-3">
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <Badge variant="secondary" className="gap-1">
                        Search: {searchQuery}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                      </Badge>
                    )}
                    {skillFilter !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        {skillFilter}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setSkillFilter('all')} />
                      </Badge>
                    )}
                    {locationFilter !== 'all' && (
                      <Badge variant="secondary" className="gap-1">
                        {locationFilter}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setLocationFilter('all')} />
                      </Badge>
                    )}
                    {minRating !== '0' && (
                      <Badge variant="secondary" className="gap-1">
                        {minRating}+ ⭐
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setMinRating('0')} />
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                </div>
              )}
            </div>

            {/* Results - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              {isSearching ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <FreelancerSkeleton key={i} />
                  ))}
                </div>
              ) : freelancers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 h-full">
                  <Users className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No freelancers found</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                    {hasFilters ? 'Try adjusting your filters' : 'No freelancers available'}
                  </p>
                  {hasFilters && (
                    <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {freelancers.map((freelancer) => (
                      <FreelancerCard key={freelancer.id} freelancer={freelancer} />
                    ))}
                  </div>
                  
                  {pagination.pages > pagination.page && (
                    <div className="text-center pt-6">
                      <Button
                        variant="outline"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={isSearching}
                      >
                        {isSearching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Column - Selection Panel */}
          <div className="w-[380px] flex-shrink-0 flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Message Input */}
            <div className="p-4 border-b flex-shrink-0">
              <Label className="font-medium mb-2 block">Custom Message</Label>
              <Textarea
                placeholder="Add a personal message to your invitation..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Optional: Personalize your invitation
              </p>
            </div>

            {/* Selected Members - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              <div className="flex items-center justify-between mb-3">
                <Label className="font-medium">
                  Selected ({selectedFreelancers.length}/{availableSpots})
                </Label>
                {selectedFreelancers.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFreelancers([])}
                    className="h-7 text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
              
              {selectedFreelancers.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <UserPlus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No freelancers selected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {freelancers
                    .filter(f => selectedFreelancers.includes(f.id))
                    .map((freelancer) => (
                      <div key={freelancer.id} className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={freelancer.avatar} />
                          <AvatarFallback>{freelancer.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{freelancer.name}</p>
                          <p className="text-xs text-gray-500 truncate">{freelancer.title}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => toggleFreelancer(freelancer.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}

              {/* Suggestions */}
              {selectedFreelancers.length === 0 && suggestedFreelancers.length > 0 && (
                <div className="mt-6">
                  <Label className="text-sm font-medium mb-3 block">Suggested</Label>
                  <div className="space-y-2">
                    {suggestedFreelancers.slice(0, 3).map((freelancer) => (
                      <div
                        key={freelancer.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        onClick={() => toggleFreelancer(freelancer.id)}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={freelancer.avatar} />
                          <AvatarFallback className="text-xs">{freelancer.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{freelancer.name}</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-xs">{freelancer.statistics.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <UserPlus className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Footer - Fixed */}
            <div className="p-4 border-t bg-white dark:bg-gray-900 flex-shrink-0">
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium">Team Capacity</span>
                  <span className="font-semibold">{availableSpots - selectedFreelancers.length} remaining</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${Math.min((selectedFreelancers.length / availableSpots) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <Button
                onClick={handleInvite}
                disabled={loading || selectedFreelancers.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Send {selectedFreelancers.length} Invitation{selectedFreelancers.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
              
              <p className="text-xs text-center text-gray-500 mt-3">
                Invitations expire in 7 days
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex-shrink-0 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {isSearching ? 'Searching...' : `${freelancers.length} of ${pagination.total} freelancers`}
          </p>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}