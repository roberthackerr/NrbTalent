import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Zap } from 'lucide-react';

interface TeamPerformanceCardProps {
  stats: {
    totalEarnings: number;
    avgRating: number;
    onTimeDelivery: number;
    activeProjects: number;
    avgResponseTime: number;
  };
  availability: string;
}

export function TeamPerformanceCard({ stats, availability }: TeamPerformanceCardProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Dashboard
        </CardTitle>
        <CardDescription>
          Team metrics and statistics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ${(stats.totalEarnings / 1000).toFixed(0)}K+
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Earnings</div>
            <div className="flex items-center justify-center mt-1">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-xs text-green-600">+12%</span>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {stats.onTimeDelivery}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">On-Time Delivery</div>
            <Progress value={stats.onTimeDelivery} className="mt-2 h-2" />
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {stats.avgResponseTime}h
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Avg Response Time</div>
            <div className="flex items-center justify-center mt-1">
              <Zap className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-xs text-blue-600">Fast response</span>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {stats.activeProjects}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Active Projects</div>
            <Badge variant="outline" className="mt-1">
              {availability}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}