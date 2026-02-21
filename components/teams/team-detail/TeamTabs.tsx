// components/teams/team-detail/TeamTabs.tsx (updated)
'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Target, Briefcase, Users, UserPlus, BarChart3 } from 'lucide-react';
import { MemberCard } from './MemberCard';
import { TeamOverviewTab } from './tabs/TeamOverviewTab';
import { TeamSkillsTab } from './tabs/TeamSkillsTab';
import { TeamProjectsTab } from './tabs/TeamProjectsTab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@radix-ui/react-dropdown-menu';

interface TeamTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  team: any;
  currentUserId: string | null;
  onRemoveMember: (memberId: string, memberName: string) => void;
  onTransferLeadership: (memberId: string) => void;
  onOpenInviteModal: () => void;
}

export function TeamTabs({
  activeTab,
  onTabChange,
  team,
  currentUserId,
  onRemoveMember,
  onTransferLeadership,
  onOpenInviteModal
}: TeamTabsProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsStatistics, setProjectsStatistics] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalRevenue: 0,
    completionRate: 0
  });

  // Fetch team projects when projects tab is active
  useEffect(() => {
    if (activeTab === 'projects' && team?.id && projects.length === 0) {
      fetchTeamProjects();
    }
  }, [activeTab, team?.id]);

  const fetchTeamProjects = async () => {
    try {
      setProjectsLoading(true);
      const response = await fetch(`/api/teams/${team.id}/projects`);
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects || []);
        setProjectsStatistics(data.statistics || {
          totalProjects: 0,
          activeProjects: 0,
          completedProjects: 0,
          totalRevenue: 0,
          completionRate: 0
        });
      }
    } catch (error) {
      console.error('Error fetching team projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="w-full justify-start bg-transparent border-b rounded-none p-0 h-12">
        <TabsTrigger value="overview" className="px-6 data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
          Overview
        </TabsTrigger>
        <TabsTrigger value="members" className="px-6 data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
          Members ({team.memberCount})
        </TabsTrigger>
        <TabsTrigger value="skills" className="px-6 data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
          Skills & Expertise
        </TabsTrigger>
        <TabsTrigger value="projects" className="px-6 data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
          Projects ({projectsStatistics.totalProjects || 0})
        </TabsTrigger>
        {team.currentUser?.isLead && (
          <TabsTrigger value="settings" className="px-6 data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        )}
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="mt-6 space-y-6">
        <TeamOverviewTab team={team} />
      </TabsContent>

      {/* Members Tab */}
      <TabsContent value="members" className="mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  {team.memberCount} professionals working together
                </CardDescription>
              </div>
              {team.currentUser?.canInvite && team.memberCount < team.maxMembers && (
                <Button onClick={onOpenInviteModal}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Members
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {team.members.map((member: any, index: number) => (
                <MemberCard
                  key={index}
                  member={member}
                  isLead={team.currentUser?.isLead}
                  onRemove={() => onRemoveMember(member.userId, member.userInfo?.name || 'Unknown')}
                  onTransferLeadership={() => onTransferLeadership(member.userId)}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
            
            {team.memberCount < team.maxMembers && (
              <div className="mt-8 p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <UserPlus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {team.maxMembers - team.memberCount} Spots Available
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Grow your team by inviting talented professionals
                  </p>
                  {team.currentUser?.canInvite ? (
                    <Button onClick={onOpenInviteModal} size="lg">
                      <UserPlus className="h-5 w-5 mr-2" />
                      Invite Team Members
                    </Button>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Only team leads can invite new members
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Skills Tab */}
      <TabsContent value="skills" className="mt-6">
        <TeamSkillsTab team={team} />
      </TabsContent>

      {/* Projects Tab */}
      <TabsContent value="projects" className="mt-6">
        <TeamProjectsTab 
          projects={projects} 
          loading={projectsLoading}
          statistics={projectsStatistics}
        />
      </TabsContent>

      {/* Settings Tab */}
      {team.currentUser?.isLead && (
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
              <CardDescription>
                Manage team configuration and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Team Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-500 mb-2">Total Projects</p>
                      <p className="text-2xl font-bold">{projectsStatistics.totalProjects}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-500 mb-2">Active Projects</p>
                      <p className="text-2xl font-bold">{projectsStatistics.activeProjects}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-500 mb-2">Completion Rate</p>
                      <p className="text-2xl font-bold">{Math.round(projectsStatistics.completionRate)}%</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Team Management</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Use the "Manage Team" button in the header to edit team settings.
                  </p>
                  <Button onClick={() => window.location.href = '#team-header'}>
                    Go to Manage Team
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
}