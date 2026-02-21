import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

interface TeamNotFoundProps {
  onBrowseTeams: () => void;
}

export function TeamNotFound({ onBrowseTeams }: TeamNotFoundProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
      <Card className="max-w-md border-0 shadow-lg">
        <CardContent className="pt-12 pb-12 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Team Not Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The team you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={onBrowseTeams} size="lg">
            Browse All Teams
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}