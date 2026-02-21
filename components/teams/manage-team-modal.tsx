'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Settings, Save, Eye, EyeOff, Lock, Unlock, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamDetails {
  id: string;
  name: string;
  tagline: string;
  description: string;
  maxMembers: number;
  availability: 'available' | 'busy' | 'full';
  isPublic: boolean;
  hourlyRate?: number;
  preferences?: {
    minBudget?: number;
    workStyle?: string;
    communicationTools?: string[];
  };
}

interface ManageTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamDetails;
  onUpdate: (updates: Partial<TeamDetails>) => void;
}

export function ManageTeamModal({ isOpen, onClose, team, onUpdate }: ManageTeamModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: team.name,
    tagline: team.tagline,
    description: team.description,
    maxMembers: team.maxMembers,
    availability: team.availability,
    isPublic: team.isPublic,
    hourlyRate: team.hourlyRate || 50,
    minBudget: team.preferences?.minBudget || 1000,
    workStyle: team.preferences?.workStyle || 'flexible',
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const updates = {
        name: formData.name,
        tagline: formData.tagline,
        description: formData.description,
        maxMembers: formData.maxMembers,
        availability: formData.availability,
        isPublic: formData.isPublic,
        hourlyRate: formData.hourlyRate,
        preferences: {
          minBudget: formData.minBudget,
          workStyle: formData.workStyle,
        },
      };

      await onUpdate(updates);
      onClose();
    } catch (error) {
      console.error('Error updating team:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-600" />
            Manage Team Settings
          </DialogTitle>
          <DialogDescription>
            Update your team's information, visibility, and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <Separator />

          {/* Team Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Team Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Team Size Limit</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Slider
                        value={[formData.maxMembers]}
                        min={2}
                        max={20}
                        step={1}
                        onValueChange={([value]) => setFormData({ ...formData, maxMembers: value })}
                      />
                    </div>
                    <span className="text-lg font-semibold min-w-[60px]">
                      {formData.maxMembers} members
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Availability</Label>
                  <Select
                    value={formData.availability}
                    onValueChange={(value: 'available' | 'busy' | 'full') => 
                      setFormData({ ...formData, availability: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available for new projects</SelectItem>
                      <SelectItem value="busy">Busy with current projects</SelectItem>
                      <SelectItem value="full">Full (not accepting new projects)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Hourly Rate (Optional)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                      className="pl-8"
                      min={10}
                      max={500}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Minimum Project Budget</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      type="number"
                      value={formData.minBudget}
                      onChange={(e) => setFormData({ ...formData, minBudget: Number(e.target.value) })}
                      className="pl-8"
                      min={100}
                      max={100000}
                      step={100}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Privacy & Visibility */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Privacy & Visibility</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  {formData.isPublic ? (
                    <Eye className="h-5 w-5 text-green-600" />
                  ) : (
                    <Lock className="h-5 w-5 text-gray-600" />
                  )}
                  <div>
                    <div className="font-medium">
                      {formData.isPublic ? 'Public Team' : 'Private Team'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formData.isPublic 
                        ? 'Anyone can find and request to join' 
                        : 'Only invited members can join'}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Work Style</Label>
                <Select
                  value={formData.workStyle}
                  onValueChange={(value) => setFormData({ ...formData, workStyle: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="async">Async (Flexible hours)</SelectItem>
                    <SelectItem value="sync">Sync (Real-time collaboration)</SelectItem>
                    <SelectItem value="flexible">Flexible (Mixed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between pt-6 border-t">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="min-w-[120px]">
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}