'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Skeleton } from '@/components/ui/skeleton';
import { X, Filter, Star, Users, TrendingUp, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterState {
  availability: string[];
  skills: string[];
  minRating: number;
  minMembers: number;
  maxMembers: number;
  industries: string[];
  sortBy: 'newest' | 'rating' | 'members' | 'projects' | 'earnings';
}

interface TeamFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onClear: () => void;
}

interface PopularSkill {
  skill: string;
  count: number;
  avgBudget: number;
}

interface Category {
  _id: string;
  name: string;
  count: number;
  subcategories: string[];
}

interface ApiResponse {
  categories: Category[];
  popularSkills: PopularSkill[];
  meta: {
    totalCategories: number;
    totalpopularSkills: number;
  };
}

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available', color: 'bg-green-100 text-green-800' },
  { value: 'busy', label: 'Busy', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'full', label: 'Full', color: 'bg-red-100 text-red-800' },
];

export function TeamFilters({ filters, onChange, onClear }: TeamFiltersProps) {
  const [skills, setSkills] = useState<PopularSkill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasActiveFilters = 
    filters.availability.length > 0 ||
    filters.skills.length > 0 ||
    filters.minRating > 0 ||
    filters.minMembers > 1 ||
    filters.maxMembers < 20 ||
    filters.industries.length > 0;

  useEffect(() => {
    fetchFiltersData();
  }, []);

  const fetchFiltersData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/projects/categories');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      // Sort skills by count (most popular first)
      const sortedSkills = [...data.popularSkills].sort((a, b) => b.count - a.count);
      setSkills(sortedSkills);
      
      // Sort categories by count (most popular first)
      const sortedCategories = [...data.categories].sort((a, b) => b.count - a.count);
      setCategories(sortedCategories);
      
    } catch (err) {
      console.error('Error fetching filter data:', err);
      setError('Failed to load filter options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillToggle = (skill: string) => {
    const newSkills = filters.skills.includes(skill)
      ? filters.skills.filter(s => s !== skill)
      : [...filters.skills, skill];
    onChange({ ...filters, skills: newSkills });
  };

  const handleAvailabilityToggle = (availability: string) => {
    const newAvailability = filters.availability.includes(availability)
      ? filters.availability.filter(a => a !== availability)
      : [...filters.availability, availability];
    onChange({ ...filters, availability: newAvailability });
  };

  const handleIndustryToggle = (industry: string) => {
    const newIndustries = filters.industries.includes(industry)
      ? filters.industries.filter(i => i !== industry)
      : [...filters.industries, industry];
    onChange({ ...filters, industries: newIndustries });
  };

  const removeSkill = (skill: string) => {
    onChange({ ...filters, skills: filters.skills.filter(s => s !== skill) });
  };

  const removeIndustry = (industry: string) => {
    onChange({ ...filters, industries: filters.industries.filter(i => i !== industry) });
  };

  const removeAvailability = (availability: string) => {
    onChange({ ...filters, availability: filters.availability.filter(a => a !== availability) });
  };

  const getTopSkills = (count: number = 20) => {
    return skills.slice(0, count);
  };

  const getTopCategories = (count: number = 15) => {
    return categories.slice(0, count);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFiltersData}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Active Filters</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-xs h-7 px-2"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.availability.map(avail => (
              <Badge
                key={avail}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {AVAILABILITY_OPTIONS.find(a => a.value === avail)?.label}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
                  onClick={() => removeAvailability(avail)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {filters.skills.map(skill => (
              <Badge
                key={skill}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {skill}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
                  onClick={() => removeSkill(skill)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {filters.industries.map(industry => (
              <Badge
                key={industry}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {industry}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
                  onClick={() => removeIndustry(industry)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {filters.minRating > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {filters.minRating}+ Rating
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
                  onClick={() => onChange({ ...filters, minRating: 0 })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {(filters.minMembers > 1 || filters.maxMembers < 20) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {filters.minMembers}-{filters.maxMembers} Members
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
                  onClick={() => onChange({ ...filters, minMembers: 1, maxMembers: 20 })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Availability Filter */}
        <div className="space-y-3">
          <Label className="font-medium">Availability</Label>
          <div className="space-y-2">
            {AVAILABILITY_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`availability-${option.value}`}
                  checked={filters.availability.includes(option.value)}
                  onCheckedChange={() => handleAvailabilityToggle(option.value)}
                />
                <Label
                  htmlFor={`availability-${option.value}`}
                  className="text-sm font-normal cursor-pointer flex items-center gap-2"
                >
                  <div className={cn("w-2 h-2 rounded-full", option.color.split(' ')[0])} />
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Skills Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Skills</Label>
            <span className="text-xs text-gray-500">
              {skills.length} total
            </span>
            {filters.skills.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ ...filters, skills: [] })}
                className="text-xs h-6"
              >
                Clear
              </Button>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                <span className="truncate">
                  {filters.skills.length > 0 
                    ? `${filters.skills.length} selected` 
                    : "Select skills"}
                </span>
                <div className="flex items-center">
                  {filters.skills.length > 0 && (
                    <Badge className="mr-2 h-5">{filters.skills.length}</Badge>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0 max-h-[400px] overflow-hidden">
              <Command>
                <CommandInput placeholder="Search skills..." />
                <CommandList className="max-h-[350px]">
                  <CommandEmpty>No skills found.</CommandEmpty>
                  <CommandGroup>
                    {skills.map((skillItem) => (
                      <CommandItem
                        key={skillItem.skill}
                        onSelect={() => handleSkillToggle(skillItem.skill)}
                        className="cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-4 w-4 flex items-center justify-center border rounded",
                            filters.skills.includes(skillItem.skill)
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "opacity-50"
                          )}>
                            {filters.skills.includes(skillItem.skill) && (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                          <span>{skillItem.skill}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {skillItem.count} projects
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {filters.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.skills.slice(0, 3).map(skill => {
                const skillData = skills.find(s => s.skill === skill);
                return (
                  <Badge key={skill} variant="outline" className="text-xs flex items-center gap-1">
                    {skill}
                    {skillData && (
                      <span className="text-[10px] text-gray-500">
                        ({skillData.count})
                      </span>
                    )}
                  </Badge>
                );
              })}
              {filters.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{filters.skills.length - 3} more
                </Badge>
              )}
            </div>
          )}
          {filters.skills.length === 0 && (
            <div className="text-xs text-gray-500 mt-2">
              Top skills: {getTopSkills(3).map(s => s.skill).join(', ')}
            </div>
          )}
        </div>

        {/* Industries/Categories Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Industries</Label>
            <span className="text-xs text-gray-500">
              {categories.length} total
            </span>
            {filters.industries.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ ...filters, industries: [] })}
                className="text-xs h-6"
              >
                Clear
              </Button>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                <span className="truncate">
                  {filters.industries.length > 0 
                    ? `${filters.industries.length} selected` 
                    : "Select industries"}
                </span>
                <div className="flex items-center">
                  {filters.industries.length > 0 && (
                    <Badge className="mr-2 h-5">{filters.industries.length}</Badge>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0 max-h-[400px] overflow-hidden">
              <Command>
                <CommandInput placeholder="Search industries..." />
                <CommandList className="max-h-[350px]">
                  <CommandEmpty>No industries found.</CommandEmpty>
                  <CommandGroup>
                    {categories.map((category) => (
                      <CommandItem
                        key={category._id}
                        onSelect={() => handleIndustryToggle(category.name)}
                        className="cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-4 w-4 flex items-center justify-center border rounded",
                            filters.industries.includes(category.name)
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "opacity-50"
                          )}>
                            {filters.industries.includes(category.name) && (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                          <span>{category.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {category.count} projects
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {filters.industries.length === 0 && (
            <div className="text-xs text-gray-500 mt-2">
              Top categories: {getTopCategories(3).map(c => c.name).join(', ')}
            </div>
          )}
        </div>

        {/* Rating Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Minimum Rating</Label>
            <Badge variant="outline" className="font-normal">
              {filters.minRating}+
            </Badge>
          </div>
          <div className="space-y-4">
            <Slider
              value={[filters.minRating]}
              min={0}
              max={5}
              step={0.5}
              onValueChange={([value]) => onChange({ ...filters, minRating: value })}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>0</span>
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                <span>Rating</span>
              </div>
              <span>5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Size Filter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-medium">Team Size</Label>
          <Badge variant="outline" className="font-normal">
            {filters.minMembers}-{filters.maxMembers} members
          </Badge>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-500">Min Members</Label>
              <Select
                value={filters.minMembers.toString()}
                onValueChange={(value) => onChange({ ...filters, minMembers: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 8, 10].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'member' : 'members'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-500">Max Members</Label>
              <Select
                value={filters.maxMembers.toString()}
                onValueChange={(value) => onChange({ ...filters, maxMembers: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 6, 8, 10, 12, 15, 20].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} members
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Sort Options */}
      <div className="space-y-3">
        <Label className="font-medium">Sort By</Label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Button
            variant={filters.sortBy === 'newest' ? 'default' : 'outline'}
            size="sm"
            className="justify-start"
            onClick={() => onChange({ ...filters, sortBy: 'newest' })}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Newest
          </Button>
          <Button
            variant={filters.sortBy === 'rating' ? 'default' : 'outline'}
            size="sm"
            className="justify-start"
            onClick={() => onChange({ ...filters, sortBy: 'rating' })}
          >
            <Star className="h-4 w-4 mr-2" />
            Rating
          </Button>
          <Button
            variant={filters.sortBy === 'members' ? 'default' : 'outline'}
            size="sm"
            className="justify-start"
            onClick={() => onChange({ ...filters, sortBy: 'members' })}
          >
            <Users className="h-4 w-4 mr-2" />
            Members
          </Button>
          <Button
            variant={filters.sortBy === 'projects' ? 'default' : 'outline'}
            size="sm"
            className="justify-start"
            onClick={() => onChange({ ...filters, sortBy: 'projects' })}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Projects
          </Button>
          <Button
            variant={filters.sortBy === 'earnings' ? 'default' : 'outline'}
            size="sm"
            className="justify-start"
            onClick={() => onChange({ ...filters, sortBy: 'earnings' })}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Earnings
          </Button>
        </div>
      </div>

      {/* Data Source Info */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            Data sourced from {skills.length} skills and {categories.length} categories
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchFiltersData}
            disabled={loading}
            className="text-xs h-6"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Refresh Data
          </Button>
        </div>
      </div>
    </div>
  );
}

// Icon components
const ChevronDown = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const Check = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const RefreshCw = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);