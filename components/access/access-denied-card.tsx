// components/access/access-denied-card.tsx
import React from 'react';
import { 
  AlertTriangle, 
  Lock, 
  Shield, 
  UserX, 
  Building2, 
  Users,
  Briefcase,
  FileText,
  ArrowRight,
  Home,
  LogIn,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export type AccessType = 
  | 'client-only'
  | 'freelancer-only'
  | 'team-only'
  | 'admin-only'
  | 'authenticated-only'
  | 'unauthenticated'
  | 'subscription-required'
  | 'permission-denied'
  | 'not-found'
  | 'maintenance';

export type UserRole = 'client' | 'freelancer' | 'team' | 'admin' | 'guest';

interface AccessDeniedCardProps {
  // Required
  accessType: AccessType;
  currentRole: UserRole;
  
  // Optional customizations
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  showLoginButton?: boolean;
  showHomeButton?: boolean;
  showUpgradeButton?: boolean;
  customActions?: React.ReactNode;
  severity?: 'info' | 'warning' | 'error' | 'success';
  redirectPath?: string;
  className?: string;
}

const defaultConfig = {
  client: { 
    label: 'Client', 
    icon: <Building2 className="h-5 w-5" />, 
    color: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    bgColor: 'from-blue-500/10 to-cyan-500/10',
    borderColor: 'border-blue-200 dark:border-blue-800/50',
    textColor: 'text-blue-600 dark:text-blue-400'
  },
  freelancer: { 
    label: 'Freelancer', 
    icon: <Users className="h-5 w-5" />, 
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    bgColor: 'from-purple-500/10 to-pink-500/10',
    borderColor: 'border-purple-200 dark:border-purple-800/50',
    textColor: 'text-purple-600 dark:text-purple-400'
  },
  team: { 
    label: 'Team', 
    icon: <Briefcase className="h-5 w-5" />, 
    color: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    bgColor: 'from-emerald-500/10 to-teal-500/10',
    borderColor: 'border-emerald-200 dark:border-emerald-800/50',
    textColor: 'text-emerald-600 dark:text-emerald-400'
  },
  admin: { 
    label: 'Admin', 
    icon: <Shield className="h-5 w-5" />, 
    color: 'bg-gradient-to-br from-amber-500 to-orange-500',
    bgColor: 'from-amber-500/10 to-orange-500/10',
    borderColor: 'border-amber-200 dark:border-amber-800/50',
    textColor: 'text-amber-600 dark:text-amber-400'
  },
  guest: { 
    label: 'Guest', 
    icon: <UserX className="h-5 w-5" />, 
    color: 'bg-gradient-to-br from-slate-500 to-gray-500',
    bgColor: 'from-slate-500/10 to-gray-500/10',
    borderColor: 'border-slate-200 dark:border-slate-800/50',
    textColor: 'text-slate-600 dark:text-slate-400'
  },
};

const accessTypeConfig = {
  'client-only': {
    title: 'Clients Only',
    description: 'This feature is exclusively available for clients on our platform.',
    icon: <Building2 className="h-6 w-6" />,
    severity: 'warning',
    requiredRole: 'client'
  },
  'freelancer-only': {
    title: 'Freelancers Only',
    description: 'This feature is exclusively available for freelancers.',
    icon: <Users className="h-6 w-6" />,
    severity: 'warning',
    requiredRole: 'freelancer'
  },
  'team-only': {
    title: 'Teams Only',
    description: 'This feature is exclusively available for registered teams.',
    icon: <Briefcase className="h-6 w-6" />,
    severity: 'warning',
    requiredRole: 'team'
  },
  'admin-only': {
    title: 'Administrators Only',
    description: 'This feature requires administrative privileges.',
    icon: <Shield className="h-6 w-6" />,
    severity: 'error',
    requiredRole: 'admin'
  },
  'authenticated-only': {
    title: 'Authentication Required',
    description: 'Please sign in to access this feature.',
    icon: <LogIn className="h-6 w-6" />,
    severity: 'info',
  },
  'unauthenticated': {
    title: 'Already Signed In',
    description: 'This page is only accessible to guests.',
    icon: <UserX className="h-6 w-6" />,
    severity: 'info',
  },
  'subscription-required': {
    title: 'Upgrade Required',
    description: 'This feature requires a premium subscription.',
    icon: <Sparkles className="h-6 w-6" />,
    severity: 'warning',
  },
  'permission-denied': {
    title: 'Permission Denied',
    description: 'You do not have permission to access this resource.',
    icon: <Lock className="h-6 w-6" />,
    severity: 'error',
  },
  'not-found': {
    title: 'Not Found',
    description: 'The requested resource could not be found.',
    icon: <AlertTriangle className="h-6 w-6" />,
    severity: 'error',
  },
  'maintenance': {
    title: 'Under Maintenance',
    description: 'This feature is currently undergoing maintenance. Please check back later.',
    icon: <Info className="h-6 w-6" />,
    severity: 'info',
  },
} as const;

const severityColors = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/10',
    border: 'border-blue-200 dark:border-blue-800/30',
    icon: 'text-blue-500 dark:text-blue-400',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/10',
    border: 'border-amber-200 dark:border-amber-800/30',
    icon: 'text-amber-500 dark:text-amber-400',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/10',
    border: 'border-red-200 dark:border-red-800/30',
    icon: 'text-red-500 dark:text-red-400',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/10',
    border: 'border-emerald-200 dark:border-emerald-800/30',
    icon: 'text-emerald-500 dark:text-emerald-400',
  },
};

export function AccessDeniedCard({
  accessType,
  currentRole,
  title,
  description,
  icon,
  showLoginButton = false,
  showHomeButton = true,
  showUpgradeButton = false,
  customActions,
  severity,
  redirectPath = '/',
  className = '',
}: AccessDeniedCardProps) {
  const router = useRouter();
  const config = accessTypeConfig[accessType];
  const roleConfig = defaultConfig[currentRole] || defaultConfig.guest;
  const requiredRoleConfig = config.requiredRole ? defaultConfig[config.requiredRole as UserRole] : null;
  const finalSeverity = severity || config.severity;
  const severityColor = severityColors[finalSeverity];
  
  const getSuggestedAction = () => {
    switch (accessType) {
      case 'client-only':
        return 'Switch to a client account or create one to access client-only features.';
      case 'freelancer-only':
        return 'Switch to a freelancer account or create one to apply for projects.';
      case 'authenticated-only':
        return 'Sign in to your account to continue.';
      case 'subscription-required':
        return 'Upgrade your plan to unlock premium features.';
      default:
        return '';
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleHome = () => {
    router.push(redirectPath);
  };

  const handleUpgrade = () => {
    router.push('/subscription');
  };

  return (
    <Card className={cn(
      "border shadow-xl max-w-lg mx-auto backdrop-blur-sm",
      severityColor.bg,
      severityColor.border,
      className
    )}>
      <CardHeader className="text-center pb-4 space-y-4">
        <div className="flex justify-center mb-2">
          <div className={cn(
            "p-4 rounded-2xl",
            severityColor.bg,
            severityColor.border,
            "border"
          )}>
            <div className={cn("p-3 rounded-xl", severityColor.icon)}>
              {icon || config.icon}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold">
            {title || config.title}
          </CardTitle>
          <CardDescription className="text-base text-slate-600 dark:text-slate-300">
            {description || config.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Role Information */}
        <div className={cn(
          "rounded-xl p-4 border backdrop-blur-sm",
          "bg-white/80 dark:bg-gray-900/50",
          "border-slate-200 dark:border-gray-800"
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg text-white shadow-md",
                roleConfig.color
              )}>
                {roleConfig.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Your Current Role</p>
                <p className={cn("font-bold text-lg", roleConfig.textColor)}>
                  {roleConfig.label}
                </p>
              </div>
            </div>
            
            {requiredRoleConfig && (
              <>
                <ArrowRight className="h-5 w-5 text-slate-400 dark:text-slate-600 mx-2" />
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md">
                    {requiredRoleConfig.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Required Role</p>
                    <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                      {requiredRoleConfig.label}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <Separator className="my-4 bg-slate-200 dark:bg-gray-800" />
          
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg mt-0.5", severityColor.bg, severityColor.border, "border")}>
              <Info className={cn("h-4 w-4", severityColor.icon)} />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {getSuggestedAction()}
            </p>
          </div>
        </div>

        {/* Feature Examples - Only show for role-specific access */}
        {accessType === 'client-only' && (
          <div className={cn(
            "rounded-xl p-4 border backdrop-blur-sm",
            "bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/10",
            "border-blue-200 dark:border-blue-800/50"
          )}>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <FileText className="h-4 w-4" />
              What Clients Can Do:
            </h4>
            <ul className="space-y-2">
              {[
                "Create and manage projects",
                "Review and accept team applications",
                "Create and manage contracts",
                "Make payments and manage budgets",
                "Track project progress",
                "Rate and review freelancers"
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 flex-shrink-0"></div>
                  <span className="text-blue-600 dark:text-blue-300">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              onClick={() => router.push('/become-client')}
            >
              Learn about becoming a client
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}

        {accessType === 'freelancer-only' && (
          <div className={cn(
            "rounded-xl p-4 border backdrop-blur-sm",
            "bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/10",
            "border-purple-200 dark:border-purple-800/50"
          )}>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Briefcase className="h-4 w-4" />
              What Freelancers Can Do:
            </h4>
            <ul className="space-y-2">
              {[
                "Apply to client projects",
                "Build your portfolio and profile",
                "View and accept contracts",
                "Submit work and track payments",
                "Receive client reviews",
                "Join or create teams"
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400 flex-shrink-0"></div>
                  <span className="text-purple-600 dark:text-purple-300">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              onClick={() => router.push('/become-freelancer')}
            >
              Learn about freelancing
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}

        {accessType === 'subscription-required' && (
          <div className={cn(
            "rounded-xl p-4 border backdrop-blur-sm",
            "bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10",
            "border-amber-200 dark:border-amber-800/50"
          )}>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <Sparkles className="h-4 w-4" />
              Premium Features:
            </h4>
            <ul className="space-y-2">
              {[
                "Unlimited project postings",
                "Advanced analytics dashboard",
                "Priority support",
                "Custom contract templates",
                "Team collaboration tools",
                "Early access to new features"
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 flex-shrink-0"></div>
                  <span className="text-amber-600 dark:text-amber-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4 pt-4">
        {customActions ? (
          customActions
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {showHomeButton && (
              <Button
                variant="outline"
                onClick={handleHome}
                className="flex-1 border-slate-300 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            )}
            
            {showLoginButton && (
              <Button
                onClick={handleLogin}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
            
            {showUpgradeButton && (
              <Button
                onClick={handleUpgrade}
                className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:opacity-90"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            )}
            
            {/* Special action buttons */}
            {accessType === 'client-only' && currentRole === 'freelancer' && (
              <Button
                onClick={() => router.push('/become-client')}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Become a Client
              </Button>
            )}
            
            {accessType === 'freelancer-only' && currentRole === 'client' && (
              <Button
                onClick={() => router.push('/become-freelancer')}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
              >
                <Users className="h-4 w-4 mr-2" />
                Become a Freelancer
              </Button>
            )}
          </div>
        )}
        
        {/* Help Section */}
        <div className="w-full pt-4 border-t border-slate-200 dark:border-gray-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">
              Need help?
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/contact')}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Contact Support
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

// Compact version for inline use
export function CompactAccessDeniedCard({
  accessType,
  currentRole,
  className = '',
}: Pick<AccessDeniedCardProps, 'accessType' | 'currentRole' | 'className'>) {
  const config = accessTypeConfig[accessType];
  const roleConfig = defaultConfig[currentRole] || defaultConfig.guest;
  const severityColor = severityColors[config.severity];

  return (
    <div className={cn(
      "rounded-lg p-4 border backdrop-blur-sm",
      severityColor.bg,
      severityColor.border,
      className
    )}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", severityColor.icon)}>
          {config.icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{config.title}</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {roleConfig.label} accounts cannot access this feature.
          </p>
        </div>
      </div>
    </div>
  );
}