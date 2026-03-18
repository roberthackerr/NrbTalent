// components/ui/team-access-button.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Users, Eye, ArrowRight, Sparkles, Zap, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface TeamAccessButtonProps {
  teamId: string;
  teamName?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  iconPosition?: 'left' | 'right';
  iconType?: 'users' | 'eye' | 'arrow' | 'sparkles' | 'zap' | 'rocket';
  className?: string;
  fullWidth?: boolean;
  children?: React.ReactNode;
  dict: {
    viewTeam: string;
    viewDetails: string;
    openTeam: string;
    loading?: string;
  };
  lang: string;
}

export function TeamAccessButton({
  teamId,
  teamName,
  variant = 'gradient',
  size = 'default',
  showIcon = true,
  iconPosition = 'left',
  iconType = 'users',
  className,
  fullWidth = false,
  children,
  dict,
  lang,
}: TeamAccessButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const getIcon = () => {
    switch (iconType) {
      case 'eye':
        return <Eye className={cn(
          size === 'sm' ? 'h-3.5 w-3.5' : 
          size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
        )} />;
      case 'arrow':
        return <ArrowRight className={cn(
          size === 'sm' ? 'h-3.5 w-3.5' : 
          size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
        )} />;
      case 'sparkles':
        return <Sparkles className={cn(
          size === 'sm' ? 'h-3.5 w-3.5' : 
          size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
        )} />;
      case 'zap':
        return <Zap className={cn(
          size === 'sm' ? 'h-3.5 w-3.5' : 
          size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
        )} />;
      case 'rocket':
        return <Rocket className={cn(
          size === 'sm' ? 'h-3.5 w-3.5' : 
          size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
        )} />;
      case 'users':
      default:
        return <Users className={cn(
          size === 'sm' ? 'h-3.5 w-3.5' : 
          size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
        )} />;
    }
  };

  const handleClick = async () => {
    setIsLoading(true);
    
    // Simulate a small delay for better UX
    setTimeout(() => {
      router.push(`/${lang}/teams/${teamId}`);
    }, 150);
  };

  // Variant styles
  const variantStyles = {
    default: 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300',
    outline: 'border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300',
    ghost: 'text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-800 dark:hover:text-purple-200 transition-all duration-300',
    gradient: 'bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 bg-[length:200%_200%] hover:bg-[100%_100%] animate-gradient-shift',
  };

  // Size styles
  const sizeStyles = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8 px-3 text-xs rounded-md',
    lg: 'h-12 px-8 text-base rounded-lg',
    icon: 'h-10 w-10 p-0',
  };

  const iconElement = showIcon && getIcon();

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        isLoading && 'opacity-80 cursor-not-allowed',
        'relative overflow-hidden group',
        className
      )}
    >
      {/* Animated background effect for gradient variant */}
      {variant === 'gradient' && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
      )}

      {/* Loading spinner */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>{dict.loading || 'Loading...'}</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          {iconPosition === 'left' && iconElement}
          <span className="font-medium">
            {children || (teamName ? `${dict.viewTeam} ${teamName}` : dict.viewDetails)}
          </span>
          {iconPosition === 'right' && iconElement}
        </div>
      )}

      {/* Ripple effect on click */}
      <span className="absolute inset-0 overflow-hidden rounded-md">
        <span className="absolute inset-0 scale-0 rounded-md bg-white/30 group-active:scale-100 group-active:animate-ripple" />
      </span>
    </Button>
  );
}

// Alternative compact version for cards and listings
export function CompactTeamButton({ 
  teamId, 
  dict, 
  lang,
  className 
}: { 
  teamId: string; 
  dict: { viewTeam: string };
  lang: string;
  className?: string;
}) {
  return (
    <TeamAccessButton
      teamId={teamId}
      variant="gradient"
      size="sm"
      iconType="eye"
      dict={dict}
      lang={lang}
      className={className}
    >
      {dict.viewTeam}
    </TeamAccessButton>
  );
}

// Large CTA version for hero sections
export function HeroTeamButton({ 
  teamId, 
  teamName, 
  dict, 
  lang 
}: { 
  teamId: string; 
  teamName?: string; 
  dict: { openTeam: string };
  lang: string;
}) {
  return (
    <TeamAccessButton
      teamId={teamId}
      teamName={teamName}
      variant="gradient"
      size="lg"
      iconType="rocket"
      iconPosition="right"
      dict={dict}
      lang={lang}
      className="shadow-2xl hover:scale-105 transition-transform duration-300"
    >
      {dict.openTeam}
    </TeamAccessButton>
  );
  
}
// In your teams page component, the style jsx is already at the bottom
// Just add the gradient-shift and ripple animations to it:

<style jsx global>{`
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes gradient-xy {
    0%, 100% { background-position: 0% 0%; }
    50% { background-position: 100% 100%; }
  }
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes ripple {
    from { transform: scale(0); opacity: 1; }
    to { transform: scale(4); opacity: 0; }
  }
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  .animate-gradient-xy {
    background-size: 200% 200%;
    animation: gradient-xy 15s ease infinite;
  }
  .animate-gradient-shift {
    background-size: 200% 200%;
    animation: gradient-shift 3s ease infinite;
  }
  .animate-ripple {
    animation: ripple 0.6s ease-out;
  }
`}</style>