// app/projects/team-mode/[id]/apply/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Send, 
  Users, 
  DollarSign, 
  Calendar, 
  CheckCircle,
  FileText,
  Shield,
  TrendingUp,
  Clock,
  Briefcase,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  skills: string[];
  deadline: string;
  teamMode: {
    requiredRoles: Array<{
      role: string;
      level: string;
    }>;
    preferredTeamSize: number;
  };
}

interface Team {
  id: string;
  name: string;
  tagline: string;
  memberCount: number;
  maxMembers: number;
  skills: Array<{ name: string; category: string; }>;
  members: Array<{
    userId: string;
    name: string;
    role: string;
    skills: string[];
  }>;
}

export default function ApplyToProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [formData, setFormData] = useState({
    coverLetter: '',
    proposedBudget: '',
    estimatedTimeline: '2 weeks'
  });

  const projectId = params.id as string;

  useEffect(() => {
    fetchProjectAndTeams();
  }, [projectId]);

  const fetchProjectAndTeams = async () => {
    try {
      setLoading(true);
      
      // Fetch project details
      const projectRes = await fetch(`/api/projects/${projectId}`);
      const projectData = await projectRes.json();
      
      if (projectData.success) {
        setProject(projectData.project);
      } else {
        throw new Error(projectData.error);
      }

      // Fetch user's teams
      const teamsRes = await fetch('/api/teams/discover?limit=20');
      const teamsData = await teamsRes.json();
      
      if (teamsData.success) {
        // Filter teams where user is team lead
        const userTeams = teamsData.teams.filter((team: any) => 
          team.currentUser?.isLead
        );
        setTeams(userTeams);
        
        if (userTeams.length > 0) {
          setSelectedTeamId(userTeams[0].id);
        }
      }

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load project details',
        variant: 'destructive',
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeamId) {
      toast({
        title: 'Error',
        description: 'Please select a team to apply with',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.coverLetter.trim()) {
      toast({
        title: 'Error',
        description: 'Please write a cover letter',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.proposedBudget) {
      toast({
        title: 'Error',
        description: 'Please enter a proposed budget',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch(`/api/projects/team-mode/${projectId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeamId,
          coverLetter: formData.coverLetter,
          proposedBudget: parseFloat(formData.proposedBudget),
          estimatedTimeline: formData.estimatedTimeline
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success!',
          description: 'Application submitted successfully',
        });
        
        // Redirect to team applications page
        setTimeout(() => {
          const selectedTeam = teams.find(t => t.id === selectedTeamId);
          router.push(`/teams/${selectedTeamId}/applications`);
        }, 1500);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Project Not Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This project doesn't exist or is no longer available.
            </p>
            <Button onClick={() => router.push('/projects')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Apply to Project
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Submit your team's proposal for "{project.title}"
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Project Details */}
          <div className="space-y-6">
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-500" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {project.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {project.description}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Budget</p>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${project.budget?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                    <Badge variant="outline">
                      {project.category}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Deadline</p>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {new Date(project.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Team Size</p>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {project.teamMode?.preferredTeamSize || 3} members
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Required Roles
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.teamMode?.requiredRoles?.map((role, index) => (
                      <Badge 
                        key={index}
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        {role.role} ({role.level})
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Required Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.skills?.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Zap className="h-5 w-5" />
                  Application Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Highlight how your team's skills match the project requirements
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Be clear about your proposed timeline and budget
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Mention similar projects your team has completed
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Application Form */}
          <div className="space-y-6">
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-green-500" />
                  Submit Proposal
                </CardTitle>
                <CardDescription>
                  Fill in your team's proposal details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Team Selection */}
                  <div className="space-y-3">
                    <Label htmlFor="team">Select Team *</Label>
                    <Select 
                      value={selectedTeamId} 
                      onValueChange={setSelectedTeamId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                                  {team.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-medium">{team.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                  {team.memberCount} members
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedTeam && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                                {selectedTeam.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {selectedTeam.name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedTeam.tagline}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {selectedTeam.memberCount}/{selectedTeam.maxMembers} members
                          </Badge>
                        </div>
                        
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Team Skills:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedTeam.skills.slice(0, 5).map((skill, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary"
                                className="text-xs"
                              >
                                {skill.name}
                              </Badge>
                            ))}
                            {selectedTeam.skills.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{selectedTeam.skills.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cover Letter */}
                  <div className="space-y-3">
                    <Label htmlFor="coverLetter">Cover Letter *</Label>
                    <Textarea
                      id="coverLetter"
                      placeholder="Introduce your team, explain why you're the best fit for this project, and describe your approach..."
                      value={formData.coverLetter}
                      onChange={(e) => setFormData({...formData, coverLetter: e.target.value})}
                      className="min-h-[200px] resize-none"
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.coverLetter.length}/2000 characters
                    </p>
                  </div>

                  {/* Budget & Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="budget">Proposed Budget ($) *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input
                          id="budget"
                          type="number"
                          min="1"
                          step="100"
                          placeholder="Enter your proposed budget"
                          className="pl-10"
                          value={formData.proposedBudget}
                          onChange={(e) => setFormData({...formData, proposedBudget: e.target.value})}
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Project budget: ${project.budget?.toLocaleString()}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="timeline">Estimated Timeline *</Label>
                      <Select 
                        value={formData.estimatedTimeline} 
                        onValueChange={(value) => setFormData({...formData, estimatedTimeline: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1 week">1 week</SelectItem>
                          <SelectItem value="2 weeks">2 weeks</SelectItem>
                          <SelectItem value="3 weeks">3 weeks</SelectItem>
                          <SelectItem value="1 month">1 month</SelectItem>
                          <SelectItem value="2 months">2 months</SelectItem>
                          <SelectItem value="3 months">3 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Team Fit Analysis */}
                  {selectedTeam && project.skills && (
                    <Card className="border-gray-200 dark:border-gray-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                          Team Fit Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700 dark:text-gray-300">
                                Skills Match
                              </span>
                              <span className="font-medium">
                                {Math.round(
                                  (selectedTeam.skills.filter(teamSkill => 
                                    project.skills.some(projectSkill => 
                                      projectSkill.toLowerCase().includes(teamSkill.name.toLowerCase()) ||
                                      teamSkill.name.toLowerCase().includes(projectSkill.toLowerCase())
                                    )
                                  ).length / project.skills.length) * 100
                                )}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full"
                                style={{ 
                                  width: `${Math.min(
                                    (selectedTeam.skills.filter(teamSkill => 
                                      project.skills.some(projectSkill => 
                                        projectSkill.toLowerCase().includes(teamSkill.name.toLowerCase()) ||
                                        teamSkill.name.toLowerCase().includes(projectSkill.toLowerCase())
                                      )
                                    ).length / project.skills.length) * 100, 
                                    100
                                  )}%` 
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700 dark:text-gray-300">
                                Team Size Match
                              </span>
                              <span className="font-medium">
                                {selectedTeam.memberCount >= (project.teamMode?.preferredTeamSize || 3) 
                                  ? 'Good' 
                                  : 'Small'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Users className="h-4 w-4" />
                              <span>
                                Your team: {selectedTeam.memberCount} members • 
                                Project wants: {project.teamMode?.preferredTeamSize || 3} members
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <CardFooter className="px-0 pb-0 pt-6">
                    <div className="flex gap-3 w-full">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        className="flex-1"
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting || !selectedTeamId || !formData.coverLetter.trim() || !formData.proposedBudget}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        {submitting ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Application
                          </>
                        )}
                      </Button>
                    </div>
                  </CardFooter>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}