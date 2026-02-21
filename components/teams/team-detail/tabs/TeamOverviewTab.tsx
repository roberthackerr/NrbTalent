import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Target, Briefcase } from 'lucide-react';

interface TeamOverviewTabProps {
  team: any;
}

export function TeamOverviewTab({ team }: TeamOverviewTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About This Team</CardTitle>
        <CardDescription>{team.tagline}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
            {team.description}
          </p>
        </div>
        
        <Separator className="my-8" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Key Strengths
            </h3>
            <div className="space-y-4">
              {team.skills
                .sort((a: any, b: any) => b.memberCount - a.memberCount)
                .slice(0, 6)
                .map((skill: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {skill.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {skill.averageLevel || 'Advanced'} level
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {skill.memberCount} member{skill.memberCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-600" />
              Team Preferences
            </h3>
            <div className="space-y-4">
              {team.preferences && (
                <>
                  {team.preferences.minBudget && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          Minimum Budget
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Preferred project size
                        </div>
                      </div>
                      <div className="font-semibold text-blue-600">
                        ${team.preferences.minBudget.toLocaleString()}+
                      </div>
                    </div>
                  )}
                  
                  {team.preferences.workStyle && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          Work Style
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Collaboration preference
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {team.preferences.workStyle}
                      </Badge>
                    </div>
                  )}
                  
                  {team.preferences.communicationTools && (
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="font-medium text-gray-900 dark:text-white mb-2">
                        Communication Tools
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {team.preferences.communicationTools.map((tool: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}