// components/apply-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Send, Users, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface ApplyButtonProps {
  projectId: string;
  projectTitle: string;
  projectBudget: number;
  teamId?: string;
  teamName?: string;
  onSuccess?: () => void;
}

export function ApplyButton({ 
  projectId, 
  projectTitle, 
  projectBudget,
  teamId,
  teamName,
  onSuccess 
}: ApplyButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleApply = async () => {
    if (!teamId) {
      // Redirect to team selection
      router.push(`/teams?applyToProject=${projectId}`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/team-mode/${projectId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          coverLetter: `${teamName} is excited to work on "${projectTitle}"! We have the perfect skills and experience to deliver excellent results.`,
          proposedBudget: projectBudget * 0.9, // 10% less than project budget
          estimatedTimeline: '1 month'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success!',
          description: 'Application submitted successfully',
        });
        setOpen(false);
        onSuccess?.();
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
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
          <Send className="h-4 w-4 mr-2" />
          Apply as Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-green-500" />
            Apply to Project
          </DialogTitle>
          <DialogDescription>
            Submit your team's proposal for "{projectTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick Apply Summary */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Project</span>
              <span className="font-medium">{projectTitle}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Budget</span>
              <span className="font-bold">${projectBudget.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Team</span>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{teamName || 'Select Team'}</span>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Quick Apply Tips
            </h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• You can customize your proposal after applying</li>
              <li>• Client will review your team profile</li>
              <li>• You can message the client before applying</li>
              <li>• Only team leads can submit applications</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
            onClick={handleApply}
            disabled={loading || !teamId}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Applying...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Application
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}