'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Users, Globe, Lock, Eye, EyeOff, Check, Sparkles, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: (team: any) => void;
}

const TEAM_SIZES = [
  { value: 2, label: '2 members' },
  { value: 3, label: '3 members' },
  { value: 4, label: '4 members' },
  { value: 5, label: '5 members (Recommended)' },
  { value: 6, label: '6 members' },
  { value: 8, label: '8 members' },
  { value: 10, label: '10 members' },
];

const TEAM_TYPES = [
  { value: 'agency', label: 'Agency Team', description: 'Professional service agency' },
  { value: 'startup', label: 'Startup Team', description: 'Innovation-focused group' },
  { value: 'freelance', label: 'Freelance Collective', description: 'Independent professionals' },
  { value: 'specialized', label: 'Specialized Team', description: 'Niche expertise group' },
  { value: 'hybrid', label: 'Hybrid Team', description: 'Mixed roles and skills' },
];

export function CreateTeamModal({ isOpen, onClose, onTeamCreated }: CreateTeamModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    maxMembers: 5,
    teamType: 'freelance',
    visibility: 'public',
    requireApproval: true,
    hourlyRate: 50,
    currency: 'USD',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Team name is required';
      } else if (formData.name.length < 3) {
        newErrors.name = 'Team name must be at least 3 characters';
      } else if (formData.name.length > 50) {
        newErrors.name = 'Team name must be less than 50 characters';
      }

      if (!formData.tagline.trim()) {
        newErrors.tagline = 'Tagline is required';
      } else if (formData.tagline.length < 10) {
        newErrors.tagline = 'Tagline should be at least 10 characters';
      }
    }

    if (stepNumber === 2) {
      if (!formData.description.trim()) {
        newErrors.description = 'Description is required';
      } else if (formData.description.length < 50) {
        newErrors.description = 'Description should be at least 50 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const response = await fetch('/api/teams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create team');
      }

      toast({
        title: '🎉 Team Created Successfully!',
        description: `"${formData.name}" is now ready for members`,
        duration: 5000,
      });

      onTeamCreated(data.team);
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create team',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      tagline: '',
      description: '',
      maxMembers: 5,
      teamType: 'freelance',
      visibility: 'public',
      requireApproval: true,
      hourlyRate: 50,
      currency: 'USD',
    });
    setErrors({});
    setStep(1);
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            Create New Team
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Build your dream team in {3 - step} simple steps
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex justify-between items-center mb-8 relative">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex flex-col items-center relative z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  stepNumber <= step
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 dark:border-gray-700 bg-transparent'
                }`}
              >
                {stepNumber < step ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="font-semibold">{stepNumber}</span>
                )}
              </div>
              <span className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                {stepNumber === 1 && 'Basic Info'}
                {stepNumber === 2 && 'Description'}
                {stepNumber === 3 && 'Settings'}
              </span>
            </div>
          ))}
          <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-200 dark:bg-gray-800 -z-10">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-5">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                  Team Name *
                  {formData.name && (
                    <Badge variant="outline" className="text-xs">
                      {formData.name.length}/50
                    </Badge>
                  )}
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Pixel Pioneers, Code Wizards, Design Collective"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? 'border-red-500' : ''}
                  maxLength={50}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Choose a memorable name that represents your team's identity
                </p>
              </div>

              <div>
                <Label htmlFor="tagline" className="flex items-center gap-2 mb-2">
                  Tagline *
                  {formData.tagline && (
                    <Badge variant="outline" className="text-xs">
                      {formData.tagline.length}/100
                    </Badge>
                  )}
                </Label>
                <Input
                  id="tagline"
                  placeholder="e.g., 'Building digital experiences that matter'"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className={errors.tagline ? 'border-red-500' : ''}
                  maxLength={100}
                />
                {errors.tagline && <p className="text-red-500 text-sm mt-1">{errors.tagline}</p>}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  A short, catchy phrase that describes your team
                </p>
              </div>

              <div>
                <Label htmlFor="teamType" className="mb-2">
                  Team Type
                </Label>
                <Select
                  value={formData.teamType}
                  onValueChange={(value) => setFormData({ ...formData, teamType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{type.label}</span>
                          <span className="text-xs text-gray-500">{type.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Description */}
        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-5">
            <div>
              <Label htmlFor="description" className="flex items-center gap-2 mb-2">
                Team Description *
                {formData.description && (
                  <Badge variant="outline" className="text-xs">
                    {formData.description.length}/500
                  </Badge>
                )}
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your team's mission, expertise, and what makes you unique..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`min-h-[150px] resize-none ${errors.description ? 'border-red-500' : ''}`}
                maxLength={500}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Include your specialties, working style, and project experience
                </p>
                <span className="text-xs text-gray-500">
                  {formData.description.length}/500
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="maxMembers" className="mb-4 block">
                Team Size: <span className="font-semibold">{formData.maxMembers} members</span>
              </Label>
              <div className="space-y-4">
                <Slider
                  value={[formData.maxMembers]}
                  min={2}
                  max={10}
                  step={1}
                  onValueChange={([value]) => setFormData({ ...formData, maxMembers: value })}
                  className="w-full"
                />
                <div className="grid grid-cols-4 gap-2">
                  {TEAM_SIZES.slice(0, 4).map((size) => (
                    <Button
                      key={size.value}
                      type="button"
                      variant={formData.maxMembers === size.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, maxMembers: size.value })}
                      className="text-xs"
                    >
                      {size.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Settings */}
        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="visibility" className="mb-2">
                  Team Visibility
                </Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value) => setFormData({ ...formData, visibility: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>Public</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <span>Private</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="unlisted">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4" />
                        <span>Unlisted</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {formData.visibility === 'public' && 'Anyone can find and request to join'}
                  {formData.visibility === 'private' && 'Only invited members can join'}
                  {formData.visibility === 'unlisted' && 'Hidden from search, join by link only'}
                </p>
              </div>

              <div>
                <Label htmlFor="hourlyRate" className="mb-2">
                  Team Rate (Optional)
                </Label>
                <div className="flex">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                      className="pl-8"
                      min={10}
                      max={500}
                    />
                  </div>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger className="w-24 ml-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Average hourly rate for team projects
                </p>
              </div>
            </div>

            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requireApproval" className="font-medium">
                    Require Approval to Join
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Review and approve new member requests
                  </p>
                </div>
                <Switch
                  id="requireApproval"
                  checked={formData.requireApproval}
                  onCheckedChange={(checked) => setFormData({ ...formData, requireApproval: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoAccept" className="font-medium">
                    Show in Recommendations
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Feature team in search results
                  </p>
                </div>
                <Switch id="autoAccept" defaultChecked />
              </div>
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Team Preview</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Name:</span>
                  <span className="font-medium">{formData.name || 'Your Team Name'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Type:</span>
                  <Badge variant="outline">
                    {TEAM_TYPES.find(t => t.value === formData.teamType)?.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Size:</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {formData.maxMembers} members max
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between sm:justify-between pt-6 border-t">
          <div>
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handlePrevious} disabled={loading}>
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            
            {step < 3 ? (
              <Button onClick={handleNext} disabled={loading}>
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="min-w-[120px]">
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Team
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}