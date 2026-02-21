import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TeamSkillsTabProps {
  team: any;
}

export function TeamSkillsTab({ team }: TeamSkillsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Skills Matrix</CardTitle>
        <CardDescription>
          Combined expertise and proficiency levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {team.skills
            .sort((a: any, b: any) => b.memberCount - a.memberCount)
            .map((skill: any, index: number) => (
              <div key={index} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {skill.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {skill.category}
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {skill.averageLevel || 'Mixed'} proficiency
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {skill.memberCount}
                    </div>
                    <div className="text-xs text-gray-500">
                      team members
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Combined experience
                    </span>
                    <span className="font-medium">
                      {skill.totalYears} years
                    </span>
                  </div>
                  <Progress 
                    value={(skill.memberCount / team.memberCount) * 100} 
                    className="h-2"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {skill.levels.map((level: string, levelIndex: number) => (
                      <Badge key={levelIndex} variant="secondary" className="text-xs capitalize">
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}